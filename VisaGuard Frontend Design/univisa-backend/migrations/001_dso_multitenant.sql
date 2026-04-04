-- DSO multi-tenant: institutions, members, profile extensions.
-- Run in Supabase SQL Editor (or psql) against your project.

create table if not exists public.institutions (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  allowed_domains text[] not null default '{}',
  verification_status text not null default 'catalog',
  created_at timestamptz not null default now(),
  constraint institutions_display_name_unique unique (display_name)
);

create table if not exists public.institution_members (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions (id) on delete cascade,
  clerk_user_id text not null,
  role text not null default 'admin',
  created_at timestamptz not null default now(),
  constraint institution_members_institution_clerk_unique unique (institution_id, clerk_user_id)
);

create index if not exists idx_institution_members_clerk_user_id
  on public.institution_members (clerk_user_id);

create index if not exists idx_institution_members_institution_id
  on public.institution_members (institution_id);

alter table public.profiles
  add column if not exists institution_id uuid references public.institutions (id);

alter table public.profiles
  add column if not exists share_with_institution boolean not null default true;

alter table public.profiles
  add column if not exists last_seen_at timestamptz;

create index if not exists idx_profiles_institution_id on public.profiles (institution_id);

comment on column public.profiles.share_with_institution is 'When false, student is hidden from DSO cohort APIs.';
comment on column public.institutions.verification_status is 'catalog | pending | active';
comment on column public.institutions.allowed_domains is 'Email domains allowed to claim DSO access (e.g. mit.edu). Empty until first claim.';
