-- Learner2Learner Supabase schema
-- Run this in the Supabase SQL editor after enabling Auth.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text not null,
  country text,
  native_language text,
  english_level text check (english_level in ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
  target_test text default 'IELTS' check (target_test in ('IELTS', 'TOEFL', 'PTE', 'Duolingo', 'General English')),
  target_score numeric(4, 1),
  current_band numeric(4, 1) not null default 5.0,
  total_sessions integer not null default 0,
  total_minutes integer not null default 0,
  streak integer not null default 0,
  topics jsonb not null default '["Daily Life", "IELTS Speaking"]'::jsonb,
  countries_connected jsonb not null default '[]'::jsonb,
  avatar_url text,
  bio text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists current_band numeric(4, 1) not null default 5.0;
alter table public.profiles add column if not exists total_sessions integer not null default 0;
alter table public.profiles add column if not exists total_minutes integer not null default 0;
alter table public.profiles add column if not exists streak integer not null default 0;
alter table public.profiles add column if not exists topics jsonb not null default '["Daily Life", "IELTS Speaking"]'::jsonb;
alter table public.profiles add column if not exists countries_connected jsonb not null default '[]'::jsonb;

create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  topic text not null,
  level text not null,
  max_participants integer not null default 8,
  host_user_id uuid references public.profiles(id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.rooms (id, name, topic, level, max_participants, is_active)
values ('00000000-0000-0000-0000-000000000001', 'Open English Practice', 'Daily Life', 'A2-B2', 8, true)
on conflict (id) do nothing;

create table if not exists public.practice_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  room_id uuid references public.rooms(id) on delete set null,
  room_name text not null,
  topic text not null,
  duration_seconds integer not null default 0,
  transcript jsonb not null default '[]'::jsonb,
  feedback jsonb not null default '{}'::jsonb,
  overall_band numeric(4, 1),
  created_at timestamptz not null default now()
);

create table if not exists public.english_test_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  test_type text not null check (test_type in ('IELTS', 'TOEFL', 'PTE', 'Duolingo', 'General English', 'Practice Session')),
  test_date date not null default current_date,
  overall_score numeric(4, 1),
  listening_score numeric(4, 1),
  reading_score numeric(4, 1),
  writing_score numeric(4, 1),
  speaking_score numeric(4, 1),
  fluency_score numeric(4, 1),
  grammar_score numeric(4, 1),
  vocabulary_score numeric(4, 1),
  pronunciation_score numeric(4, 1),
  transcript text,
  feedback jsonb,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists english_test_history_user_date_idx
  on public.english_test_history(user_id, test_date desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_english_test_history_updated_at on public.english_test_history;
create trigger set_english_test_history_updated_at
before update on public.english_test_history
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.rooms enable row level security;
alter table public.practice_sessions enable row level security;
alter table public.english_test_history enable row level security;

drop policy if exists "Profiles are readable by owner" on public.profiles;
create policy "Profiles are readable by owner"
on public.profiles for select
using (auth.uid() = id);

drop policy if exists "Profiles are insertable by owner" on public.profiles;
create policy "Profiles are insertable by owner"
on public.profiles for insert
with check (auth.uid() = id);

drop policy if exists "Profiles are updateable by owner" on public.profiles;
create policy "Profiles are updateable by owner"
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "Rooms are readable by everyone" on public.rooms;
create policy "Rooms are readable by everyone"
on public.rooms for select
using (is_active = true);

drop policy if exists "Signed-in users can create rooms" on public.rooms;
create policy "Signed-in users can create rooms"
on public.rooms for insert
with check (auth.uid() is not null and (host_user_id is null or auth.uid() = host_user_id));

drop policy if exists "Room hosts can update rooms" on public.rooms;
create policy "Room hosts can update rooms"
on public.rooms for update
using (host_user_id is null or auth.uid() = host_user_id)
with check (host_user_id is null or auth.uid() = host_user_id);

drop policy if exists "Practice sessions are readable by owner" on public.practice_sessions;
create policy "Practice sessions are readable by owner"
on public.practice_sessions for select
using (auth.uid() = user_id);

drop policy if exists "Practice sessions are insertable by owner" on public.practice_sessions;
create policy "Practice sessions are insertable by owner"
on public.practice_sessions for insert
with check (auth.uid() = user_id or user_id is null);

drop policy if exists "Practice sessions are updateable by owner" on public.practice_sessions;
create policy "Practice sessions are updateable by owner"
on public.practice_sessions for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Test history is readable by owner" on public.english_test_history;
create policy "Test history is readable by owner"
on public.english_test_history for select
using (auth.uid() = user_id);

drop policy if exists "Test history is insertable by owner" on public.english_test_history;
create policy "Test history is insertable by owner"
on public.english_test_history for insert
with check (auth.uid() = user_id);

drop policy if exists "Test history is updateable by owner" on public.english_test_history;
create policy "Test history is updateable by owner"
on public.english_test_history for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Test history is deleteable by owner" on public.english_test_history;
create policy "Test history is deleteable by owner"
on public.english_test_history for delete
using (auth.uid() = user_id);
