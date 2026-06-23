-- Rent a Pro - Supabase schema
-- Run in the Supabase SQL Editor (Project → SQL Editor → New query).
-- Idempotent: safe to re-run.

-- =========================================================================
-- PROFILES  (one row per auth user; stays private to its owner)
-- =========================================================================
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  email      text,
  full_name  text,
  photo_url  text,
  is_admin   boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Profiles are self-access" on public.profiles;
create policy "Profiles are self-access" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

-- Auto-create a profile row whenever an auth user is created.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Shared updated_at touch trigger.
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =========================================================================
-- CATEGORIES  (seeded browse buckets - Cars, Fireplace, ...)
-- =========================================================================
create table if not exists public.categories (
  id         uuid primary key default gen_random_uuid(),
  slug       text not null unique,
  name       text not null,
  icon       text,                       -- lucide icon name
  sort_order int not null default 0
);

alter table public.categories enable row level security;

drop policy if exists "Categories are public-read" on public.categories;
create policy "Categories are public-read" on public.categories
  for select using (true);

insert into public.categories (slug, name, icon, sort_order) values
  ('tutoring',        'Tutoring',         'GraduationCap', 1),
  ('career-coaching', 'Career Coaching',  'Briefcase',     2),
  ('fitness',         'Fitness',          'Dumbbell',      3),
  ('nutrition',       'Nutrition',        'Salad',         4),
  ('cars',        'Cars',          'Car',        5),
  ('fireplace',   'Fireplace',     'Flame',      6),
  ('electronics', 'Electronics',   'Cpu',        7),
  ('home',        'Home Repair',   'Hammer',     8),
  ('plumbing',    'Plumbing',      'Wrench',     9),
  ('tech',        'Tech Support',  'Laptop',     10)
on conflict (slug) do nothing;

-- =========================================================================
-- EXPERT PROFILES  (an optional add-on any user can create)
-- =========================================================================
create table if not exists public.expert_profiles (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null unique references auth.users (id) on delete cascade,
  display_name     text not null,
  headline         text,                          -- "Certified BMW Mechanic"
  bio              text,
  years_experience int,
  specialties      text[] not null default '{}',  -- free-text tags
  category_slugs   text[] not null default '{}',  -- references categories.slug
  photo_url        text,
  intro_video_url  text,
  available_now    boolean not null default false,
  status           text not null default 'pending', -- pending | approved | rejected
  rating_avg       numeric not null default 0,
  rating_count     int not null default 0,
  stripe_account_id text,
  charges_enabled  boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists expert_profiles_status_idx   on public.expert_profiles (status);
create index if not exists expert_profiles_category_idx on public.expert_profiles using gin (category_slugs);

alter table public.expert_profiles enable row level security;

-- Public can read only approved experts; owner can always read/write their own.
drop policy if exists "Experts are public-read when approved" on public.expert_profiles;
create policy "Experts are public-read when approved" on public.expert_profiles
  for select using (status = 'approved' or auth.uid() = user_id);

drop policy if exists "Experts are owner-write" on public.expert_profiles;
create policy "Experts are owner-write" on public.expert_profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop trigger if exists expert_profiles_touch on public.expert_profiles;
create trigger expert_profiles_touch before update on public.expert_profiles
  for each row execute function public.touch_updated_at();

-- helper: is the calling user the owner of this expert profile?
create or replace function public.owns_expert(expert uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.expert_profiles e where e.id = expert and e.user_id = auth.uid());
$$;

create or replace function public.expert_is_visible(expert uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.expert_profiles e
    where e.id = expert and (e.status = 'approved' or e.user_id = auth.uid())
  );
$$;

-- =========================================================================
-- SERVICES  (the price cards: "10m Video Chat $30", etc.)
-- =========================================================================
create table if not exists public.services (
  id               uuid primary key default gen_random_uuid(),
  expert_id        uuid not null references public.expert_profiles (id) on delete cascade,
  title            text not null,
  description      text,
  duration_minutes int,
  channel          text not null default 'video_chat', -- phone | zoom | facetime | email | video_chat
  price_cents      int not null,
  active           boolean not null default true,
  created_at       timestamptz not null default now()
);

create index if not exists services_expert_idx on public.services (expert_id);

alter table public.services enable row level security;

drop policy if exists "Services follow expert visibility" on public.services;
create policy "Services follow expert visibility" on public.services
  for select using (public.expert_is_visible(expert_id));

drop policy if exists "Services are owner-write" on public.services;
create policy "Services are owner-write" on public.services
  for all using (public.owns_expert(expert_id)) with check (public.owns_expert(expert_id));

-- =========================================================================
-- AVAILABILITY  (recurring weekly slots; plus expert_profiles.available_now)
-- =========================================================================
create table if not exists public.availability (
  id          uuid primary key default gen_random_uuid(),
  expert_id   uuid not null references public.expert_profiles (id) on delete cascade,
  day_of_week int not null check (day_of_week between 0 and 6), -- 0 = Sunday
  start_time  time not null,
  end_time    time not null
);

create index if not exists availability_expert_idx on public.availability (expert_id);

alter table public.availability enable row level security;

drop policy if exists "Availability follows expert visibility" on public.availability;
create policy "Availability follows expert visibility" on public.availability
  for select using (public.expert_is_visible(expert_id));

drop policy if exists "Availability is owner-write" on public.availability;
create policy "Availability is owner-write" on public.availability
  for all using (public.owns_expert(expert_id)) with check (public.owns_expert(expert_id));

-- =========================================================================
-- BOOKINGS  (a customer's paid request to an expert)
-- =========================================================================
create table if not exists public.bookings (
  id                       uuid primary key default gen_random_uuid(),
  customer_id              uuid not null references auth.users (id) on delete cascade,
  customer_name            text,
  expert_id                uuid not null references public.expert_profiles (id) on delete cascade,
  service_id               uuid references public.services (id) on delete set null,
  problem_text             text,
  problem_media_url        text,
  -- how the customer wants to be reached (off-platform connect, MVP)
  customer_contact_channel text,    -- phone | email | zoom | facetime
  customer_contact_value   text,
  status                   text not null default 'requested', -- requested | accepted | declined | scheduled | completed | cancelled
  scheduled_at             timestamptz,
  connect_channel          text,    -- expert's chosen channel
  connect_details          text,    -- revealed to customer on acceptance
  -- money (cents); platform takes a fee from both sides
  amount_cents             int not null default 0, -- what the customer paid (service + customer fee)
  service_price_cents      int not null default 0,
  customer_fee_cents       int not null default 0,
  expert_fee_cents         int not null default 0,
  expert_payout_cents      int not null default 0, -- service_price - expert_fee
  stripe_payment_intent_id text,
  payment_status           text not null default 'unpaid', -- unpaid | paid | refunded
  created_at               timestamptz not null default now(),
  responded_at             timestamptz,
  updated_at               timestamptz not null default now()
);

create index if not exists bookings_customer_idx on public.bookings (customer_id);
create index if not exists bookings_expert_idx   on public.bookings (expert_id);

alter table public.bookings enable row level security;

-- A booking is visible to its customer or to the expert who owns it.
drop policy if exists "Bookings are party-read" on public.bookings;
create policy "Bookings are party-read" on public.bookings
  for select using (auth.uid() = customer_id or public.owns_expert(expert_id));

-- The customer creates their own booking row.
drop policy if exists "Bookings insert by customer" on public.bookings;
create policy "Bookings insert by customer" on public.bookings
  for insert with check (auth.uid() = customer_id);

-- Either party may update (expert accepts/declines; customer cancels).
drop policy if exists "Bookings update by party" on public.bookings;
create policy "Bookings update by party" on public.bookings
  for update using (auth.uid() = customer_id or public.owns_expert(expert_id));

drop trigger if exists bookings_touch on public.bookings;
create trigger bookings_touch before update on public.bookings
  for each row execute function public.touch_updated_at();

-- =========================================================================
-- REVIEWS  ("did they answer your question?" + rating)
-- =========================================================================
create table if not exists public.reviews (
  id          uuid primary key default gen_random_uuid(),
  booking_id  uuid not null unique references public.bookings (id) on delete cascade,
  customer_id uuid not null references auth.users (id) on delete cascade,
  expert_id   uuid not null references public.expert_profiles (id) on delete cascade,
  rating      int check (rating between 1 and 5),
  did_answer  boolean,
  comment     text,
  created_at  timestamptz not null default now()
);

create index if not exists reviews_expert_idx on public.reviews (expert_id);

alter table public.reviews enable row level security;

drop policy if exists "Reviews are public-read" on public.reviews;
create policy "Reviews are public-read" on public.reviews
  for select using (true);

drop policy if exists "Reviews insert by customer" on public.reviews;
create policy "Reviews insert by customer" on public.reviews
  for insert with check (auth.uid() = customer_id);

-- Recompute the expert's rating aggregate after each review.
create or replace function public.recompute_expert_rating()
returns trigger language plpgsql security definer set search_path = public as $$
declare target uuid := coalesce(new.expert_id, old.expert_id);
begin
  update public.expert_profiles e set
    rating_avg = coalesce((select avg(rating) from public.reviews r where r.expert_id = target and r.rating is not null), 0),
    rating_count = (select count(*) from public.reviews r where r.expert_id = target and r.rating is not null)
  where e.id = target;
  return null;
end;
$$;

drop trigger if exists reviews_recompute on public.reviews;
create trigger reviews_recompute after insert or update or delete on public.reviews
  for each row execute function public.recompute_expert_rating();

-- =========================================================================
-- STORAGE BUCKETS  (avatars + intro videos public; problem uploads private)
-- All scoped to a <uid>/ path prefix for per-user isolation.
-- =========================================================================
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true)
  on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('expert-videos', 'expert-videos', true)
  on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('problem-uploads', 'problem-uploads', false)
  on conflict (id) do nothing;

drop policy if exists "Public read avatars/videos" on storage.objects;
create policy "Public read avatars/videos" on storage.objects
  for select using (bucket_id in ('avatars', 'expert-videos'));

drop policy if exists "Owner write own folder" on storage.objects;
create policy "Owner write own folder" on storage.objects
  for all
  using (
    bucket_id in ('avatars', 'expert-videos', 'problem-uploads')
    and auth.uid()::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id in ('avatars', 'expert-videos', 'problem-uploads')
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- =========================================================================
-- SEARCH REQUESTS  (demand signal: "notify me" clicks on unmatched searches)
-- =========================================================================
create table if not exists public.search_requests (
  id                   uuid primary key default gen_random_uuid(),
  query                text,
  category_slug        text,
  requested_by         uuid references auth.users (id) on delete set null,
  notified             boolean not null default false,
  is_specific_request  boolean not null default false,
  specific_description text,
  created_at           timestamptz not null default now()
);

-- Idempotent column additions for existing deployments.
alter table public.search_requests
  add column if not exists is_specific_request boolean not null default false,
  add column if not exists specific_description text;

create index if not exists search_requests_created_at_idx on public.search_requests (created_at desc);

alter table public.search_requests enable row level security;

-- Anyone (including anonymous browsers) can log a demand signal.
drop policy if exists "Search requests insertable by anyone" on public.search_requests;
create policy "Search requests insertable by anyone" on public.search_requests
  for insert with check (true);

-- Only admins can read the list.
drop policy if exists "Search requests readable by admin" on public.search_requests;
create policy "Search requests readable by admin" on public.search_requests
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
  );

-- =========================================================================
-- EXPERIMENT EVENTS  (A/B test impressions + conversions for home copy, etc.)
-- =========================================================================
create table if not exists public.experiment_events (
  id         uuid primary key default gen_random_uuid(),
  experiment text not null,
  variant    text not null,
  event      text not null,           -- 'impression' | 'convert'
  created_at timestamptz not null default now()
);

create index if not exists experiment_events_lookup_idx
  on public.experiment_events (experiment, variant, event);

alter table public.experiment_events enable row level security;

-- Anyone (including anonymous browsers) can log an experiment event.
drop policy if exists "Experiment events insertable by anyone" on public.experiment_events;
create policy "Experiment events insertable by anyone" on public.experiment_events
  for insert with check (true);

-- Only admins can read the results.
drop policy if exists "Experiment events readable by admin" on public.experiment_events;
create policy "Experiment events readable by admin" on public.experiment_events
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
  );

-- =========================================================================
-- DIRECTORY EXPERTS  (auto-compiled "unclaimed" listings - directory layer)
-- Writes happen via the service-role ingestion pipeline (bypasses RLS).
-- Public can only read listings that are still 'listed'.
-- =========================================================================
create table if not exists public.directory_experts (
  id                uuid primary key default gen_random_uuid(),
  display_name      text not null,
  headline          text,
  blurb             text,                          -- LLM-written, original (never copied)
  category_slugs    text[] not null default '{}',
  specialties       text[] not null default '{}',
  location          text,
  website_url       text,
  booking_url       text,
  public_email      text,
  public_phone      text,
  photo_url         text,                          -- link only; do not re-host copyrighted images
  source            text not null,                 -- e.g. 'google_places', 'icf_directory'
  source_url        text not null,                 -- provenance: where this came from
  fetched_at        timestamptz not null default now(),
  status            text not null default 'listed', -- listed | hidden | removed
  claimed           boolean not null default false,
  claimed_expert_id uuid references public.expert_profiles (id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists directory_experts_status_idx on public.directory_experts (status);
create index if not exists directory_experts_categories_idx on public.directory_experts using gin (category_slugs);

drop trigger if exists directory_experts_touch on public.directory_experts;
create trigger directory_experts_touch before update on public.directory_experts
  for each row execute function public.touch_updated_at();

alter table public.directory_experts enable row level security;

-- Public can read only live listings.
drop policy if exists "Directory experts public read" on public.directory_experts;
create policy "Directory experts public read" on public.directory_experts
  for select using (status = 'listed');

-- =========================================================================
-- LEADS  (concierge-broker pipeline: a customer wants a specific pro)
-- =========================================================================
create table if not exists public.leads (
  id                  uuid primary key default gen_random_uuid(),
  directory_expert_id uuid references public.directory_experts (id) on delete set null,
  expert_id           uuid references public.expert_profiles (id) on delete set null,
  requester_id        uuid references auth.users (id) on delete set null,
  requester_contact   text,
  need_text           text,
  status              text not null default 'new', -- new | contacted | brokered | won | lost
  created_at          timestamptz not null default now()
);

create index if not exists leads_status_idx on public.leads (status, created_at desc);

alter table public.leads enable row level security;

-- Anyone (including anonymous browsers) can submit a lead.
drop policy if exists "Leads insertable by anyone" on public.leads;
create policy "Leads insertable by anyone" on public.leads
  for insert with check (true);

-- Only admins can read the pipeline.
drop policy if exists "Leads readable by admin" on public.leads;
create policy "Leads readable by admin" on public.leads
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
  );
