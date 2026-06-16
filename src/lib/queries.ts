// Server-side read helpers. Safe to call from Server Components / Route Handlers.
// When Supabase isn't configured yet they return empty results so the UI still renders.

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import type {
  Availability,
  Booking,
  Category,
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
}

export async function searchExperts({
  q,
  category,
}: ExpertSearchParams = {}): Promise<ExpertProfile[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  let query = supabase
    .from("expert_profiles")
    .select("*")
    .eq("status", "approved")
    .order("rating_avg", { ascending: false });

  if (category) query = query.contains("category_slugs", [category]);
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
