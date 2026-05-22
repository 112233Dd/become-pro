-- Become Pro Supabase schema
-- Run this in Supabase Dashboard -> SQL Editor.

create table if not exists public.training_requests (
  id uuid primary key default gen_random_uuid(),
  request_type text not null default 'training' check (request_type in ('training', 'program')),
  selected_program text,
  who text not null check (who in ('Моето дете', 'Себе си')),
  name text not null check (char_length(name) between 2 and 120),
  phone text not null check (char_length(phone) between 6 and 40),
  page_url text,
  user_agent text,
  created_at timestamptz not null default now()
);

alter table public.training_requests enable row level security;

create policy "Public visitors can create training requests"
  on public.training_requests
  for insert
  to anon
  with check (true);

create index if not exists training_requests_created_at_idx
  on public.training_requests (created_at desc);
