-- ==============================================================================
-- AEROTOUCH SUPABASE DATABASE SCHEMA
-- Features: User Profiles, Gesture Mappings, Custom Gestures, Sessions,
--           Telemetry Events, Feedback, and Row Level Security (RLS)
-- ==============================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. PROFILES TABLE
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  display_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.profiles enable row level security;

create policy "Users can view own profile" 
  on public.profiles for select 
  using (auth.uid() = id);

create policy "Users can update own profile" 
  on public.profiles for update 
  using (auth.uid() = id);

create policy "Users can insert own profile" 
  on public.profiles for insert 
  with check (auth.uid() = id);

-- Auto-create profile trigger on new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)));
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. GESTURE PROFILES (Sensitivity, Timing, Accessibility)
create table if not exists public.gesture_profiles (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text default 'Default Profile',
  confidence_threshold numeric default 0.70,
  stability_duration_ms integer default 350,
  cooldown_duration_ms integer default 600,
  dwell_click boolean default false,
  dwell_duration_ms integer default 1500,
  accessibility_mode boolean default false,
  high_contrast boolean default false,
  large_text boolean default false,
  low_end_mode boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.gesture_profiles enable row level security;

create policy "Users can CRUD own gesture profiles"
  on public.gesture_profiles for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 3. GESTURE MAPPINGS (Semantic Actions)
create table if not exists public.gesture_mappings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  gesture text not null,
  action text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (user_id, gesture)
);

alter table public.gesture_mappings enable row level security;

create policy "Users can CRUD own gesture mappings"
  on public.gesture_mappings for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 4. CUSTOM GESTURES (Trained KNN Samples)
create table if not exists public.custom_gestures (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  action text not null,
  samples jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (user_id, name)
);

alter table public.custom_gestures enable row level security;

create policy "Users can CRUD own custom gestures"
  on public.custom_gestures for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 5. SESSIONS
create table if not exists public.sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  started_at timestamp with time zone not null,
  ended_at timestamp with time zone,
  active_hand_seconds integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.sessions enable row level security;

create policy "Users can CRUD own sessions"
  on public.sessions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 6. GESTURE EVENTS (Telemetry & Analytics)
create table if not exists public.gesture_events (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  gesture text not null,
  action text not null,
  confidence numeric not null,
  timestamp timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.gesture_events enable row level security;

create policy "Users can CRUD own gesture events"
  on public.gesture_events for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 7. FEEDBACK
create table if not exists public.feedback (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete set null,
  rating integer check (rating between 1 and 5),
  category text default 'General',
  comments text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.feedback enable row level security;

create policy "Users can insert own feedback"
  on public.feedback for insert
  with check (auth.uid() = user_id or auth.uid() is null);

create policy "Users can view own feedback"
  on public.feedback for select
  using (auth.uid() = user_id);

