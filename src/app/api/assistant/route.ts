import { NextResponse, type NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getCategories } from "@/lib/queries";

// Voice/chat concierge. Talks the customer through what they need, then signals
// the client to route to search. Falls back to plain voice-to-search when no
// ANTHROPIC_API_KEY is set (mirrors the Stripe/Resend graceful-degradation pattern).

interface Turn {
  role: "user" | "assistant";
  content: string;
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ type: "fallback" });
  }

  let messages: Turn[];
  try {
    const body = await request.json();
    messages = Array.isArray(body?.messages) ? body.messages : [];
  } catch {
    return NextResponse.json({ type: "say", text: "Sorry, I didn't catch that." });
  }
  if (messages.length === 0) {
    return NextResponse.json({ type: "say", text: "How can I help you?" });
  }

  const categories = await getCategories();
  const slugs = categories.map((c) => c.slug);
  const categoryList = categories
    .map((c) => `${c.name} (${c.slug})`)
    .join(", ");

  const system = [
    "You are the voice concierge for Rent a Pro, a marketplace of verified experts",
    "(mechanics, plumbers, electricians, fireplace techs, tech support, and more).",
    "A customer tells you, out loud, what they need help with.",
    "Your job: with AT MOST one or two short, natural, spoken-style questions,",
    "gather just enough to search for the right expert. Keep each question to a single",
    "sentence. Do NOT list options or explain yourself.",
    "As soon as the need is reasonably clear, call the search_experts tool with a concise",
    "search query. If the very first thing they say is already clear, search immediately",
    "without asking anything.",
    categoryList ? `Available categories: ${categoryList}.` : "",
    "Only set the category field when it's obvious which one fits.",
  ]
    .filter(Boolean)
    .join(" ");

  const client = new Anthropic({ apiKey });

  try {
    const response = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 512,
      system,
      tools: [
        {
          name: "search_experts",
          description:
            "Search the marketplace for experts once you understand what the customer needs.",
          input_schema: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "A concise search query describing the customer's problem.",
              },
              category: {
                type: "string",
                enum: slugs,
                description: "Category slug, only when clearly applicable.",
              },
            },
            required: ["query"],
          },
        },
      ],
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    });

    if (response.stop_reason === "tool_use") {
      const toolUse = response.content.find((b) => b.type === "tool_use");
      if (toolUse && toolUse.type === "tool_use") {
        const input = toolUse.input as { query?: string; category?: string };
        return NextResponse.json({
          type: "search",
          query: input.query ?? "",
          category: input.category ?? null,
        });
      }
    }

    const text = response.content
      .filter((b) => b.type === "text")
      .map((b) => (b.type === "text" ? b.text : ""))
      .join(" ")
      .trim();

    return NextResponse.json({
      type: "say",
      text: text || "Could you tell me a bit more about what you need?",
    });
  } catch (err) {
    console.error("assistant route error", err);
    return NextResponse.json({
      type: "say",
      text: "Sorry, I had trouble with that - try typing your search instead.",
    });
  }
}
