"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Mic, X, Send } from "lucide-react";
import { pushRecentSearch } from "@/lib/recents";
import { logExperimentEvent } from "@/lib/actions/experiment";

// Minimal Web Speech API typings (not in the standard DOM lib).
interface SpeechRecognitionResultLike {
  0: { transcript: string };
  isFinal: boolean;
}
interface SpeechRecognitionEventLike {
  results: ArrayLike<SpeechRecognitionResultLike>;
}
interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

type Turn = { role: "user" | "assistant"; content: string };
type OrbState = "idle" | "listening" | "thinking" | "speaking";

function getRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function VoiceOrb({ variant }: { variant: string }) {
  const router = useRouter();
  const [active, setActive] = useState(false);
  const [state, setState] = useState<OrbState>("idle");
  const [caption, setCaption] = useState("");
  const [transcript, setTranscript] = useState("");
  const [typed, setTyped] = useState("");
  const [voiceMode, setVoiceMode] = useState(true);

  const messagesRef = useRef<Turn[]>([]);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const stoppedRef = useRef(false);
  const voiceModeRef = useRef(true);

  useEffect(() => {
    return () => {
      stoppedRef.current = true;
      recognitionRef.current?.abort();
      if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    };
  }, []);

  function routeToSearch(query: string, category?: string | null) {
    const q = query.trim();
    stoppedRef.current = true;
    recognitionRef.current?.abort();
    window.speechSynthesis?.cancel();
    if (!q) {
      setActive(false);
      return;
    }
    pushRecentSearch(q);
    logExperimentEvent(variant, "convert").catch(() => {});
    const params = new URLSearchParams({ q });
    if (category) params.set("category", category);
    router.push(`/search?${params.toString()}`);
  }

  function startListening() {
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      setVoiceMode(false);
      voiceModeRef.current = false;
      setState("idle");
      return;
    }
    const recognition = new Ctor();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = true;
    recognitionRef.current = recognition;
    setState("listening");
    setTranscript("");

    let finalText = "";
    recognition.onresult = (e) => {
      let interim = "";
      for (let i = 0; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalText += r[0].transcript;
        else interim += r[0].transcript;
      }
      setTranscript(finalText || interim);
    };
    recognition.onerror = () => {};
    recognition.onend = () => {
      if (stoppedRef.current) return;
      const text = finalText.trim();
      if (text) void handleUtterance(text);
      else setState("idle");
    };
    recognition.start();
  }

  function speak(text: string, onDone: () => void) {
    setState("speaking");
    setCaption(text);
    const synth = typeof window !== "undefined" ? window.speechSynthesis : null;
    if (!synth) {
      onDone();
      return;
    }
    const utter = new SpeechSynthesisUtterance(text);
    utter.onend = () => {
      if (!stoppedRef.current) onDone();
    };
    utter.onerror = () => {
      if (!stoppedRef.current) onDone();
    };
    synth.cancel();
    synth.speak(utter);
  }

  async function handleUtterance(text: string) {
    messagesRef.current = [...messagesRef.current, { role: "user", content: text }];
    setTranscript(text);
    setState("thinking");
    setCaption("");
    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: messagesRef.current }),
      });
      const data = await res.json();
      if (stoppedRef.current) return;

      if (data.type === "fallback") {
        routeToSearch(text);
        return;
      }
      if (data.type === "search") {
        routeToSearch(data.query, data.category);
        return;
      }
      const reply = String(data.text || "");
      messagesRef.current = [
        ...messagesRef.current,
        { role: "assistant", content: reply },
      ];
      speak(reply, () => {
        if (voiceModeRef.current) startListening();
        else setState("idle");
      });
    } catch {
      routeToSearch(text);
    }
  }

  function activate() {
    stoppedRef.current = false;
    messagesRef.current = [];
    setActive(true);
    setCaption("");
    setTranscript("");
    const hasVoice = Boolean(getRecognitionCtor());
    setVoiceMode(hasVoice);
    voiceModeRef.current = hasVoice;
    const greeting = "How can I help you?";
    if (hasVoice) {
      speak(greeting, startListening);
    } else {
      speak(greeting, () => setState("idle"));
    }
  }

  function close() {
    stoppedRef.current = true;
    recognitionRef.current?.abort();
    window.speechSynthesis?.cancel();
    setActive(false);
    setState("idle");
    setCaption("");
    setTranscript("");
  }

  function onTypedSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = typed.trim();
    if (!text) return;
    setTyped("");
    void handleUtterance(text);
  }

  const listening = state === "listening";
  const speaking = state === "speaking";
  const thinking = state === "thinking";
  const energized = listening || speaking;

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Orb */}
      <button
        type="button"
        onClick={active ? close : activate}
        aria-label={active ? "Stop voice assistant" : "Start voice assistant"}
        className="group relative flex size-64 items-center justify-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:size-72"
      >
        {energized ? (
          <>
            <span className="absolute size-56 rounded-full bg-primary/30 orb-ring sm:size-64" />
            <span
              className="absolute size-56 rounded-full bg-primary/20 orb-ring sm:size-64"
              style={{ animationDelay: "0.6s" }}
            />
          </>
        ) : null}

        <span
          className={`relative size-56 overflow-hidden rounded-full shadow-2xl shadow-primary/40 transition-transform sm:size-64 ${
            energized ? "orb-alive-fast" : "orb-alive"
          }`}
        >
          {/* The cosmic-sphere image, scaled up so the source's white margin clips outside the circle */}
          <span
            className={`absolute inset-0 scale-105 bg-[url('/orb.png')] bg-cover bg-center transition-opacity ${
              thinking ? "opacity-70" : "opacity-100"
            }`}
          />
          {/* Vignette so the circular rim blends into the dark background */}
          <span className="absolute inset-0 rounded-full shadow-[inset_0_0_40px_rgba(8,8,16,0.45)]" />
          {/* "Tap to talk" cue — hidden until hover so the orb stays clean at rest */}
          <span className="absolute inset-0 flex items-center justify-center text-white opacity-0 transition-opacity group-hover:opacity-80">
            <Mic className={`size-10 drop-shadow ${thinking ? "animate-pulse" : ""}`} />
          </span>
        </span>
      </button>

      {active ? (
        <div className="flex w-full max-w-md flex-col items-center gap-3">
          <p className="min-h-5 text-center text-sm">
            {thinking ? (
              <span className="text-muted-foreground">Thinking&hellip;</span>
            ) : caption ? (
              <span className="font-medium text-primary">{caption}</span>
            ) : transcript ? (
              <span className="text-muted-foreground">&ldquo;{transcript}&rdquo;</span>
            ) : listening ? (
              <span className="text-muted-foreground">Listening&hellip;</span>
            ) : null}
          </p>

          {!voiceMode ? (
            <form onSubmit={onTypedSubmit} className="flex w-full gap-2">
              <input
                autoFocus
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                placeholder="Tell me what you need..."
                className="h-11 flex-1 rounded-xl border border-border bg-input px-4 text-sm outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                type="submit"
                aria-label="Send"
                className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground"
              >
                <Send className="size-4" />
              </button>
            </form>
          ) : null}

          <button
            type="button"
            onClick={close}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <X className="size-3.5" /> Close
          </button>
        </div>
      ) : null}
    </div>
  );
}
