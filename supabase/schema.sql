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
  check (status in ('new', 'contacted', 'booked', 'declined'));

alter table public.training_requests enable row level security;

drop policy if exists "Public visitors can create training requests"
  on public.training_requests;

create index if not exists training_requests_created_at_idx
  on public.training_requests (created_at desc);

create index if not exists training_requests_status_idx
  on public.training_requests (status);

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
