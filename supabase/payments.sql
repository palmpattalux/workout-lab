-- Dotset payments. In Supabase: SQL Editor > New query > paste all of this > Run.
-- Only the server (with the service role key) writes here; each account can read its own plan.

create table if not exists public.subscriptions (
  user_id         uuid primary key references auth.users on delete cascade,
  tier            text not null,
  paid_until      timestamptz not null,
  method          text not null,               -- card | promptpay | truemoney
  renews          boolean not null default false,
  omise_customer  text,
  omise_schedule  text,
  updated_at      timestamptz not null default now()
);

create table if not exists public.payments (
  charge_id   text primary key,
  user_id     uuid not null references auth.users on delete cascade,
  tier        text not null,
  amount      integer not null,                -- satang
  method      text not null,
  created_at  timestamptz not null default now()
);

create index if not exists subscriptions_customer_idx on public.subscriptions (omise_customer);

alter table public.subscriptions enable row level security;
alter table public.payments enable row level security;

drop policy if exists "read own" on public.subscriptions;
create policy "read own" on public.subscriptions for select to authenticated using (user_id = auth.uid());
drop policy if exists "read own" on public.payments;
create policy "read own" on public.payments for select to authenticated using (user_id = auth.uid());


-- Themes bought one at a time (฿149 each, kept for good). Safe to run again.
create table if not exists public.owned_themes (
  user_id     uuid not null references auth.users on delete cascade,
  theme       text not null,
  charge_id   text,
  created_at  timestamptz not null default now(),
  primary key (user_id, theme)
);
alter table public.owned_themes enable row level security;
drop policy if exists "read own" on public.owned_themes;
create policy "read own" on public.owned_themes for select to authenticated using (user_id = auth.uid());
