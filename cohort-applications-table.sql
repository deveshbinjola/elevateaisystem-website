-- Supabase schema for Augmented Coach cohort applications
-- Run this in Supabase SQL editor before publishing /cohort-application

create table if not exists public.cohort_applications (
  id uuid primary key default gen_random_uuid(),
  submitted_at timestamptz not null default now(),
  source text,

  -- Contact
  name text not null,
  email text not null,

  -- 8 application questions
  revenue text not null,           -- pre_10k | 10_25k | 25_50k | 50_plus
  icp text not null,
  win text not null,                -- sharpest client win
  claim text not null,              -- claim they can't yet make
  voice_leak text not null,         -- where voice leaks hardest
  ladder text not null,             -- current offer ladder
  pay_timing text not null,         -- now | 2_weeks | exploring
  why text not null,

  -- Internal qualification (filled later by Sunny)
  status text default 'new',        -- new | reviewing | fit_call_booked | accepted | waitlist | pass
  notes text,
  reviewed_at timestamptz,
  accepted_at timestamptz,
  cohort_batch text                 -- e.g. '2026-05-batch-1'
);

create index if not exists cohort_applications_email_idx on public.cohort_applications (email);
create index if not exists cohort_applications_status_idx on public.cohort_applications (status);
create index if not exists cohort_applications_submitted_idx on public.cohort_applications (submitted_at desc);

-- RLS: anon can insert, only authenticated can read
alter table public.cohort_applications enable row level security;

drop policy if exists "anon can insert applications" on public.cohort_applications;
create policy "anon can insert applications"
  on public.cohort_applications for insert
  to anon
  with check (true);

drop policy if exists "authenticated can read applications" on public.cohort_applications;
create policy "authenticated can read applications"
  on public.cohort_applications for select
  to authenticated
  using (true);
