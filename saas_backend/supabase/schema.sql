-- Enable pgcrypto for UUID generation
create extension if not exists pgcrypto;

-- 1. Organizations Table
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid not null references auth.users(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Organization Members Table
create table if not exists public.organization_members (
  org_id uuid references public.organizations(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'member')) default 'member',
  created_at timestamptz default now(),
  primary key (org_id, user_id)
);

-- 3. Profiles Table
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  default_org_id uuid references public.organizations(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 4. Conversations Table
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.organizations(id) on delete cascade, -- Nullable for personal conversations
  created_by uuid not null references auth.users(id) on delete set null,
  title text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 5. Messages Table
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid references auth.users(id) on delete set null,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  created_at timestamptz default now()
);

-- 6. Dashboard Metrics Table
create table if not exists public.dashboard_metrics (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  metric_key text not null,
  metric_value jsonb,
  ts timestamptz not null default now()
);

-- Comments for Realtime Setup
-- To enable Realtime for messages and dashboard_metrics, run the following in your SQL editor
-- or enable it via the Supabase Dashboard (Database > Replication).
-- alter publication supabase_realtime add table public.messages;
-- alter publication supabase_realtime add table public.dashboard_metrics;
