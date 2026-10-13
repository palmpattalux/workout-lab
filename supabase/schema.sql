-- Workout Lab database. In Supabase: SQL Editor > New query > paste all of this > Run.
-- Each row is one record kept whole in `data`, so new app fields need no table changes.
-- Row-level security means every account only ever sees its own rows.

create table if not exists public.workouts (
  id          uuid primary key,
  user_id     uuid not null default auth.uid() references auth.users on delete cascade,
  data        jsonb not null,
  updated_at  timestamptz not null default now()
);

create table if not exists public.sessions (
  id          uuid primary key,
  user_id     uuid not null default auth.uid() references auth.users on delete cascade,
  data        jsonb not null,
  updated_at  timestamptz not null default now()
);

create index if not exists workouts_user_idx on public.workouts (user_id);
create index if not exists sessions_user_idx on public.sessions (user_id);

alter table public.workouts enable row level security;
alter table public.sessions enable row level security;

drop policy if exists "own rows" on public.workouts;
create policy "own rows" on public.workouts for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "own rows" on public.sessions;
create policy "own rows" on public.sessions for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
