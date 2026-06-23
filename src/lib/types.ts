// Domain types for Rent a Pro. These mirror the Supabase schema (supabase/schema.sql).

export type ExpertStatus = "pending" | "approved" | "rejected";
export type ServiceChannel = "phone" | "zoom" | "facetime" | "email" | "video_chat";
export type BookingStatus =
  | "requested"
  | "accepted"
  | "declined"
  | "scheduled"
  | "completed"
  | "cancelled";
export type PaymentStatus = "unpaid" | "paid" | "refunded";

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  photo_url: string | null;
  is_admin: boolean;
  created_at: string;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  icon: string | null;
  sort_order: number;
}

export interface ExpertProfile {
  id: string;
  user_id: string;
  display_name: string;
  headline: string | null;
  bio: string | null;
  years_experience: number | null;
  specialties: string[];
  category_slugs: string[];
  photo_url: string | null;
  intro_video_url: string | null;
  available_now: boolean;
  status: ExpertStatus;
  rating_avg: number;
  rating_count: number;
  stripe_account_id: string | null;
  charges_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface Service {
  id: string;
  expert_id: string;
  title: string;
  description: string | null;
  duration_minutes: number | null;
  channel: ServiceChannel;
  price_cents: number;
  active: boolean;
  created_at: string;
}

export interface Availability {
  id: string;
  expert_id: string;
  day_of_week: number; // 0 = Sunday
  start_time: string; // "HH:MM:SS"
  end_time: string;
}

export interface Booking {
  id: string;
  customer_id: string;
  customer_name: string | null;
  expert_id: string;
  service_id: string | null;
  problem_text: string | null;
  problem_media_url: string | null;
  customer_contact_channel: string | null;
  customer_contact_value: string | null;
  status: BookingStatus;
  scheduled_at: string | null;
  connect_channel: string | null;
  connect_details: string | null;
  amount_cents: number;
  service_price_cents: number;
  customer_fee_cents: number;
  expert_fee_cents: number;
  expert_payout_cents: number;
  stripe_payment_intent_id: string | null;
  payment_status: PaymentStatus;
  created_at: string;
  responded_at: string | null;
  updated_at: string;
}

export interface Review {
  id: string;
  booking_id: string;
  customer_id: string;
  expert_id: string;
  rating: number | null;
  did_answer: boolean | null;
  comment: string | null;
  created_at: string;
}

export interface SearchRequest {
  id: string;
  query: string | null;
  category_slug: string | null;
  requested_by: string | null;
  notified: boolean;
  is_specific_request: boolean;
  specific_description: string | null;
  created_at: string;
}

/** Auto-compiled "unclaimed" listing in the directory layer. */
export interface DirectoryExpert {
  id: string;
  display_name: string;
  headline: string | null;
  blurb: string | null;
  category_slugs: string[];
  specialties: string[];
  location: string | null;
  website_url: string | null;
  booking_url: string | null;
  public_email: string | null;
  public_phone: string | null;
  photo_url: string | null;
  source: string;
  source_url: string;
  fetched_at: string;
  status: "listed" | "hidden" | "removed";
  claimed: boolean;
  claimed_expert_id: string | null;
  created_at: string;
  updated_at: string;
}

export type LeadStatus = "new" | "contacted" | "brokered" | "won" | "lost";

export interface Lead {
  id: string;
  directory_expert_id: string | null;
  expert_id: string | null;
  requester_id: string | null;
  requester_contact: string | null;
  need_text: string | null;
  status: LeadStatus;
  created_at: string;
}
