-- Become Pro Supabase schema
-- Run this in Supabase Dashboard -> SQL Editor.

create table if not exists public.training_requests (
  id uuid primary key default gen_random_uuid(),
  request_type text not null default 'training' check (request_type in ('training', 'program')),
  selected_program text,
  who text not null check (who in ('Моето дете', 'Себе си')),
  name text not null check (char_length(name) between 2 and 120),
  email text,
  phone text not null check (char_length(phone) between 6 and 40),
  player_name text,
  player_age text,
  city text,
  position text,
  goal text,
  preferred_time text,
  page_url text,
  user_agent text,
  created_at timestamptz not null default now()
);

alter table public.training_requests add column if not exists email text;
alter table public.training_requests add column if not exists player_name text;
alter table public.training_requests add column if not exists player_age text;
alter table public.training_requests add column if not exists city text;
alter table public.training_requests add column if not exists position text;
alter table public.training_requests add column if not exists goal text;
alter table public.training_requests add column if not exists preferred_time text;
alter table public.training_requests add column if not exists applicant_type text;
alter table public.training_requests add column if not exists status text not null default 'new';
alter table public.training_requests add column if not exists landing_page_url text;
alter table public.training_requests add column if not exists page_variant text;
alter table public.training_requests add column if not exists utm_source text;
alter table public.training_requests add column if not exists utm_medium text;
alter table public.training_requests add column if not exists utm_campaign text;
alter table public.training_requests add column if not exists utm_content text;
alter table public.training_requests add column if not exists utm_term text;
alter table public.training_requests add column if not exists referrer text;
alter table public.training_requests add column if not exists device_type text;
alter table public.training_requests add column if not exists browser text;
alter table public.training_requests add column if not exists session_id text;
alter table public.training_requests add column if not exists notes text;
alter table public.training_requests add column if not exists last_contacted_at timestamptz;
alter table public.training_requests add column if not exists next_follow_up_date date;
alter table public.training_requests add column if not exists next_follow_up_note text;
alter table public.training_requests add column if not exists updated_at timestamptz default now();

update public.training_requests
set applicant_type = who
where applicant_type is null;

alter table public.training_requests
  alter column applicant_type set not null;

alter table public.training_requests
  drop constraint if exists training_requests_applicant_type_check;

alter table public.training_requests
  add constraint training_requests_applicant_type_check
  check (applicant_type in ('Моето дете', 'Себе си'));

alter table public.training_requests
  drop constraint if exists training_requests_status_check;

alter table public.training_requests
  add constraint training_requests_status_check
  check (status in ('new', 'contacted', 'conversation', 'follow_up', 'booked', 'declined'));

alter table public.training_requests enable row level security;

drop policy if exists "Public visitors can create training requests"
  on public.training_requests;

create index if not exists training_requests_created_at_idx
  on public.training_requests (created_at desc);

create index if not exists training_requests_status_idx
  on public.training_requests (status);

create index if not exists training_requests_page_variant_idx
  on public.training_requests (page_variant);

create index if not exists training_requests_utm_campaign_idx
  on public.training_requests (utm_campaign);

create index if not exists training_requests_session_id_idx
  on public.training_requests (session_id);

create index if not exists training_requests_next_follow_up_idx
  on public.training_requests (next_follow_up_date)
  where next_follow_up_date is not null;

create index if not exists training_requests_status_created_idx
  on public.training_requests (status, created_at desc);

create table if not exists public.training_request_events (
  id uuid primary key default gen_random_uuid(),
  training_request_id uuid not null references public.training_requests(id) on delete cascade,
  event_type text not null check (event_type in ('created', 'status_changed', 'note_added', 'follow_up_set', 'booked', 'declined')),
  previous_status text,
  new_status text,
  note text,
  follow_up_date date,
  follow_up_note text,
  created_at timestamptz not null default now()
);

alter table public.training_request_events add column if not exists training_request_id uuid;
alter table public.training_request_events add column if not exists event_type text;
alter table public.training_request_events add column if not exists previous_status text;
alter table public.training_request_events add column if not exists new_status text;
alter table public.training_request_events add column if not exists note text;
alter table public.training_request_events add column if not exists follow_up_date date;
alter table public.training_request_events add column if not exists follow_up_note text;
alter table public.training_request_events add column if not exists created_at timestamptz default now();

alter table public.training_request_events
  drop constraint if exists training_request_events_training_request_id_fkey;

alter table public.training_request_events
  add constraint training_request_events_training_request_id_fkey
  foreign key (training_request_id) references public.training_requests(id) on delete cascade;

alter table public.training_request_events
  drop constraint if exists training_request_events_event_type_check;

alter table public.training_request_events
  add constraint training_request_events_event_type_check
  check (event_type in ('created', 'status_changed', 'note_added', 'follow_up_set', 'booked', 'declined'));

alter table public.training_request_events enable row level security;

create index if not exists training_request_events_request_created_idx
  on public.training_request_events (training_request_id, created_at desc);

create index if not exists training_request_events_created_at_idx
  on public.training_request_events (created_at desc);

create table if not exists public.contact_inquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  phone text not null check (char_length(phone) between 6 and 40),
  email text not null check (char_length(email) between 5 and 160),
  message text not null check (char_length(message) between 5 and 2000),
  status text not null default 'new' check (status in ('new', 'answered', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.contact_inquiries add column if not exists name text;
alter table public.contact_inquiries add column if not exists phone text;
alter table public.contact_inquiries add column if not exists email text;
alter table public.contact_inquiries add column if not exists message text;
alter table public.contact_inquiries add column if not exists status text default 'new';
alter table public.contact_inquiries add column if not exists created_at timestamptz default now();
alter table public.contact_inquiries add column if not exists updated_at timestamptz default now();

alter table public.contact_inquiries
  drop constraint if exists contact_inquiries_status_check;

alter table public.contact_inquiries
  add constraint contact_inquiries_status_check
  check (status in ('new', 'answered', 'archived'));

alter table public.contact_inquiries enable row level security;

create index if not exists contact_inquiries_created_at_idx
  on public.contact_inquiries (created_at desc);

create index if not exists contact_inquiries_status_idx
  on public.contact_inquiries (status);

create table if not exists public.landing_analytics_events (
  id uuid primary key default gen_random_uuid(),
  session_id text not null check (char_length(session_id) between 12 and 100),
  landing_page_url text not null,
  page_variant text not null default 'general',
  event_name text not null check (
    event_name in (
      'page_view',
      'scroll_25',
      'scroll_50',
      'scroll_75',
      'scroll_90',
      'view_problem',
      'view_solution',
      'view_program_contents',
      'view_product_preview',
      'view_coach',
      'view_testimonials',
      'view_explainer_video',
      'view_training_videos',
      'play_explainer_video',
      'view_price',
      'click_primary_cta',
      'click_secondary_cta',
      'click_sticky_cta',
      'form_start',
      'form_submit_success',
      'form_submit_error',
      'checkout_started',
      'checkout_created',
      'checkout_error',
      'purchase_completed'
    )
  ),
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  referrer text,
  device_type text,
  stripe_checkout_session_id text,
  program_id text,
  event_time timestamptz not null default now()
);

alter table public.landing_analytics_events add column if not exists stripe_checkout_session_id text;
alter table public.landing_analytics_events add column if not exists program_id text;

alter table public.landing_analytics_events
  drop constraint if exists landing_analytics_events_event_name_check;

alter table public.landing_analytics_events
  add constraint landing_analytics_events_event_name_check
  check (
    event_name in (
      'page_view',
      'scroll_25',
      'scroll_50',
      'scroll_75',
      'scroll_90',
      'view_problem',
      'view_solution',
      'view_program_contents',
      'view_product_preview',
      'view_coach',
      'view_testimonials',
      'view_explainer_video',
      'view_training_videos',
      'play_explainer_video',
      'view_price',
      'click_primary_cta',
      'click_secondary_cta',
      'click_sticky_cta',
      'form_start',
      'form_submit_success',
      'form_submit_error',
      'checkout_started',
      'checkout_created',
      'checkout_error',
      'purchase_completed'
    )
  );

alter table public.landing_analytics_events enable row level security;

create index if not exists landing_analytics_event_time_idx
  on public.landing_analytics_events (event_time desc);

create index if not exists landing_analytics_variant_time_idx
  on public.landing_analytics_events (page_variant, event_time desc);

create index if not exists landing_analytics_campaign_time_idx
  on public.landing_analytics_events (utm_campaign, event_time desc);

create index if not exists landing_analytics_session_time_idx
  on public.landing_analytics_events (session_id, event_time desc);

create index if not exists landing_analytics_event_name_time_idx
  on public.landing_analytics_events (event_name, event_time desc);

create unique index if not exists landing_analytics_purchase_session_idx
  on public.landing_analytics_events (stripe_checkout_session_id, program_id, event_name);

create or replace function public.delete_expired_landing_analytics()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_count integer;
begin
  delete from public.landing_analytics_events
  where event_time < now() - interval '12 months';
  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    if not exists (select 1 from cron.job where jobname = 'delete-expired-landing-analytics') then
      perform cron.schedule(
        'delete-expired-landing-analytics',
        '17 3 * * *',
        'select public.delete_expired_landing_analytics();'
      );
    end if;
  end if;
exception
  when undefined_table or insufficient_privilege then
    raise notice 'pg_cron is unavailable; run select public.delete_expired_landing_analytics() manually.';
end;
$$;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  customer_email text not null,
  customer_phone text,
  player_name text,
  player_age text,
  program_id text not null,
  program_name text not null,
  program_price numeric(10, 2) not null,
  program_link text not null,
  payment_status text not null default 'pending' check (payment_status in ('pending', 'paid', 'failed', 'expired', 'delivery_failed')),
  payment_provider text not null default 'stripe',
  stripe_checkout_session_id text,
  stripe_payment_intent_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.orders add column if not exists customer_name text;
alter table public.orders add column if not exists customer_email text;
alter table public.orders add column if not exists customer_phone text;
alter table public.orders add column if not exists player_name text;
alter table public.orders add column if not exists player_age text;
alter table public.orders add column if not exists program_id text;
alter table public.orders add column if not exists program_name text;
alter table public.orders add column if not exists program_price numeric(10, 2);
alter table public.orders add column if not exists program_link text;
alter table public.orders add column if not exists payment_status text default 'pending';
alter table public.orders add column if not exists payment_provider text default 'stripe';
alter table public.orders add column if not exists stripe_checkout_session_id text;
alter table public.orders add column if not exists stripe_payment_intent_id text;
alter table public.orders add column if not exists landing_page_url text;
alter table public.orders add column if not exists page_variant text;
alter table public.orders add column if not exists utm_source text;
alter table public.orders add column if not exists utm_medium text;
alter table public.orders add column if not exists utm_campaign text;
alter table public.orders add column if not exists utm_content text;
alter table public.orders add column if not exists utm_term text;
alter table public.orders add column if not exists referrer text;
alter table public.orders add column if not exists device_type text;
alter table public.orders add column if not exists session_id text;
alter table public.orders add column if not exists created_at timestamptz default now();
alter table public.orders add column if not exists updated_at timestamptz default now();

update public.orders
set payment_status = 'expired'
where payment_status = 'cancelled';

alter table public.orders
  drop constraint if exists orders_payment_status_check;

alter table public.orders
  add constraint orders_payment_status_check
  check (payment_status in ('pending', 'paid', 'failed', 'expired', 'delivery_failed'));

create unique index if not exists orders_stripe_session_program_idx
  on public.orders (stripe_checkout_session_id, program_id);

create index if not exists orders_created_at_idx
  on public.orders (created_at desc);

create index if not exists orders_payment_status_idx
  on public.orders (payment_status);

create index if not exists orders_page_variant_idx
  on public.orders (page_variant);

create index if not exists orders_utm_campaign_idx
  on public.orders (utm_campaign);

alter table public.orders enable row level security;

create table if not exists public.admin_logs (
  id uuid primary key default gen_random_uuid(),
  level text not null default 'error' check (level in ('debug', 'info', 'warn', 'error')),
  event text not null,
  message text not null,
  stripe_checkout_session_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.admin_logs add column if not exists level text default 'error';
alter table public.admin_logs add column if not exists event text;
alter table public.admin_logs add column if not exists message text;
alter table public.admin_logs add column if not exists stripe_checkout_session_id text;
alter table public.admin_logs add column if not exists metadata jsonb default '{}'::jsonb;
alter table public.admin_logs add column if not exists created_at timestamptz default now();

alter table public.admin_logs enable row level security;

create index if not exists admin_logs_created_at_idx
  on public.admin_logs (created_at desc);

create index if not exists admin_logs_event_idx
  on public.admin_logs (event);
