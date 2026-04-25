-- Run this in your Supabase project → SQL Editor

-- 1. Profiles (auto-created when a user signs up)
create table if not exists public.profiles (
  id   uuid references auth.users primary key,
  email text,
  name  text,
  created_at timestamptz default now()
);
alter table public.profiles enable row level security;
create policy "Users read own profile"   on public.profiles for select using (auth.uid() = id);
create policy "Users update own profile" on public.profiles for update using (auth.uid() = id);

-- Trigger: auto-insert profile row on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email);
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. Skill profiles (Module 01 results)
create table if not exists public.skill_profiles (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid references public.profiles(id) on delete cascade not null,
  country_code     text not null,
  occupation_title text,
  isco_code        text,
  occupation_summary text,
  skills           jsonb,
  strengths        text[],
  skill_gaps       text[],
  profile_summary  text,
  education_level  text,
  experience_years integer,
  work_description text,
  created_at       timestamptz default now()
);
alter table public.skill_profiles enable row level security;
create policy "Users manage own skill profiles" on public.skill_profiles
  for all using (auth.uid() = user_id);

-- 3. Opportunity matches (Module 03 results)
create table if not exists public.opportunity_matches (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid references public.profiles(id) on delete cascade not null,
  skill_profile_id  uuid references public.skill_profiles(id) on delete set null,
  country_code      text not null,
  opportunities     jsonb,
  econometric_signals jsonb,
  recommendations   text[],
  created_at        timestamptz default now()
);
alter table public.opportunity_matches enable row level security;
create policy "Users manage own opportunity matches" on public.opportunity_matches
  for all using (auth.uid() = user_id);
