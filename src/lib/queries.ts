// Server-side read helpers. Safe to call from Server Components / Route Handlers.
// When Supabase isn't configured yet they return empty results so the UI still renders.

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import type {
  Availability,
  Booking,
  Category,
  DirectoryExpert,
  ExpertProfile,
  Review,
  Service,
} from "@/lib/types";

export type BookingWithService = Booking & {
  services: Pick<Service, "title" | "channel" | "price_cents"> | null;
};

export type BookingWithExpert = BookingWithService & {
  expert_profiles: Pick<ExpertProfile, "display_name" | "photo_url"> | null;
};

export async function getCategories(): Promise<Category[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order");
  return (data as Category[]) ?? [];
}

export interface ExpertSearchParams {
  q?: string;
  category?: string;
  availableNow?: boolean;
  sort?: "rating" | "reviews";
}

export async function searchExperts({
  q,
  category,
  availableNow,
  sort = "rating",
}: ExpertSearchParams = {}): Promise<ExpertProfile[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const orderColumn = sort === "reviews" ? "rating_count" : "rating_avg";
  let query = supabase
    .from("expert_profiles")
    .select("*")
    .eq("status", "approved")
    .order(orderColumn, { ascending: false });

  if (category) query = query.contains("category_slugs", [category]);
  if (availableNow) query = query.eq("available_now", true);
  if (q && q.trim()) {
    const term = `%${q.trim()}%`;
    // Match against name, headline, or any specialty.
    query = query.or(
      `display_name.ilike.${term},headline.ilike.${term},specialties.cs.{${q.trim()}}`,
    );
  }

  const { data } = await query;
  return (data as ExpertProfile[]) ?? [];
}

/**
 * Fallback suggestions when a search has no exact match: top-rated approved
 * experts in the same category, or top-rated overall if that's also empty.
 */
export async function getClosestExperts(
  category?: string,
  limit = 3,
): Promise<ExpertProfile[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();

  if (category) {
    const { data } = await supabase
      .from("expert_profiles")
      .select("*")
      .eq("status", "approved")
      .contains("category_slugs", [category])
      .order("rating_avg", { ascending: false })
      .limit(limit);
    if (data && data.length > 0) return data as ExpertProfile[];
  }

  const { data: fallback } = await supabase
    .from("expert_profiles")
    .select("*")
    .eq("status", "approved")
    .order("rating_avg", { ascending: false })
    .limit(limit);
  return (fallback as ExpertProfile[]) ?? [];
}

/**
 * Auto-compiled "unclaimed" directory listings matching a search. Only live
 * (`status='listed'`), not-yet-claimed listings are returned (RLS also enforces
 * the status filter). Used to seed the marketplace with pros who haven't signed
 * up yet; a broker lead is captured when a customer wants one.
 */
export async function searchDirectoryExperts({
  q,
  category,
  limit = 20,
}: ExpertSearchParams & { limit?: number } = {}): Promise<DirectoryExpert[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  let query = supabase
    .from("directory_experts")
    .select("*")
    .eq("status", "listed")
    .eq("claimed", false)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (category) query = query.contains("category_slugs", [category]);
  if (q && q.trim()) {
    const term = `%${q.trim()}%`;
    query = query.or(
      `display_name.ilike.${term},headline.ilike.${term},blurb.ilike.${term},specialties.cs.{${q.trim()}}`,
    );
  }

  const { data } = await query;
  return (data as DirectoryExpert[]) ?? [];
}

export async function getDirectoryExpert(
  id: string,
): Promise<DirectoryExpert | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("directory_experts")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return (data as DirectoryExpert) ?? null;
}

export interface ExpertDetail {
  expert: ExpertProfile;
  services: Service[];
  availability: Availability[];
  reviews: Review[];
}

export async function getExpertDetail(
  id: string,
): Promise<ExpertDetail | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();

  const { data: expert } = await supabase
    .from("expert_profiles")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!expert) return null;

  const [{ data: services }, { data: availability }, { data: reviews }] =
    await Promise.all([
      supabase
        .from("services")
        .select("*")
        .eq("expert_id", id)
        .eq("active", true)
        .order("price_cents"),
      supabase
        .from("availability")
        .select("*")
        .eq("expert_id", id)
        .order("day_of_week"),
      supabase
        .from("reviews")
        .select("*")
        .eq("expert_id", id)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

  return {
    expert: expert as ExpertProfile,
    services: (services as Service[]) ?? [],
    availability: (availability as Availability[]) ?? [],
    reviews: (reviews as Review[]) ?? [],
  };
}

export async function getServiceById(id: string): Promise<Service | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("services")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return (data as Service) ?? null;
}

const BOOKING_SERVICE_SELECT = "*, services(title, channel, price_cents)";

/** Bookings addressed to an expert (their incoming requests). */
export async function getExpertBookings(
  expertId: string,
): Promise<BookingWithService[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("bookings")
    .select(BOOKING_SERVICE_SELECT)
    .eq("expert_id", expertId)
    .order("created_at", { ascending: false });
  return (data as BookingWithService[]) ?? [];
}

/** Bookings the current customer has placed. */
export async function getCustomerBookings(
  customerId: string,
): Promise<BookingWithExpert[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("bookings")
    .select(
      "*, services(title, channel, price_cents), expert_profiles(display_name, photo_url)",
    )
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });
  return (data as BookingWithExpert[]) ?? [];
}

/** A single booking, visible only to its customer or owning expert (RLS-enforced). */
export async function getBookingDetail(
  id: string,
): Promise<BookingWithExpert | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("bookings")
    .select(
      "*, services(title, channel, price_cents), expert_profiles(display_name, photo_url)",
    )
    .eq("id", id)
    .maybeSingle();
  return (data as BookingWithExpert) ?? null;
}
