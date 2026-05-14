-- =========================================================================
-- cohort_members — paywall + portal access control
-- =========================================================================
-- Created:  2026-04-18
-- Purpose:  Stores paid cohort members. Written to by the Stripe webhook
--           Edge Function (handle-payment). Read by the portal to verify
--           that a signed-in auth.user is actually on the paid roster.
--
-- Flow:  Stripe checkout → webhook → Edge Function inserts row here →
--        Edge Function sends Supabase magic-link email → member logs in →
--        dashboard.html reads this table by auth.user.email.
--
-- Run once in Supabase Studio → SQL Editor.
-- =========================================================================

-- 1. TABLE -----------------------------------------------------------------

create table if not exists public.cohort_members (
  id                uuid primary key default gen_random_uuid(),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  -- identity
  email             text not null unique,          -- login key (matches auth.users.email)
  full_name         text,

  -- cohort assignment
  cohort_batch      text not null default '2026-05-batch-1',
  seat_slug         text,                          -- matches /cohort/<batch>/<slug>/
  joined_at         timestamptz,                   -- when they became paid

  -- payment
  status            text not null default 'pending' check (status in ('pending','paid','refunded','cancelled')),
  stripe_customer_id text,
  stripe_session_id  text unique,                  -- so webhook retries don't double-create
  amount_cents       integer,                      -- 199700 for $1,997 founding
  payment_plan       text default 'full' check (payment_plan in ('full','two_payments')),

  -- lifecycle
  drop_delivered_at   timestamptz,
  graduated_at        timestamptz,
  refunded_at         timestamptz,
  refund_reason       text,

  -- notes
  notes             text,

  -- link back to the application
  application_id    uuid references public.cohort_applications(id) on delete set null
);

comment on table public.cohort_members is 'Paid cohort members. Source of truth for portal access.';
comment on column public.cohort_members.status is 'pending = webhook received but not confirmed; paid = access granted; refunded = before Day 5 guarantee; cancelled = dropped before start';
comment on column public.cohort_members.stripe_session_id is 'Idempotency key for the Stripe webhook. Unique.';

-- 2. INDEXES ---------------------------------------------------------------

create index if not exists cohort_members_email_status_idx
  on public.cohort_members(email, status);
create index if not exists cohort_members_batch_idx
  on public.cohort_members(cohort_batch);

-- 3. UPDATED_AT TRIGGER ---------------------------------------------------

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists cohort_members_updated_at on public.cohort_members;
create trigger cohort_members_updated_at
  before update on public.cohort_members
  for each row execute function public.set_updated_at();

-- 4. ROW-LEVEL SECURITY ---------------------------------------------------

alter table public.cohort_members enable row level security;

-- DROP existing policies so re-running is idempotent
drop policy if exists "members can read own row"        on public.cohort_members;
drop policy if exists "service role full access"         on public.cohort_members;

-- An authenticated user can read ONLY their own paid row
-- (auth.jwt()->>'email' is the email from the magic-link JWT)
create policy "members can read own row"
  on public.cohort_members
  for select
  to authenticated
  using (
    email = (auth.jwt() ->> 'email')
    and status = 'paid'
  );

-- NO anon insert/select/update. The Stripe webhook Edge Function runs
-- as service_role and bypasses RLS entirely. Do NOT add an anon insert
-- policy — that would let anyone grant themselves cohort access.

-- 5. PAYMENT-WEBHOOK HELPER -----------------------------------------------
-- Call this from the handle-payment Edge Function (with service_role).
-- Idempotent: safe to call multiple times with the same stripe_session_id.

create or replace function public.upsert_paid_member(
  p_email text,
  p_full_name text,
  p_stripe_session_id text,
  p_stripe_customer_id text,
  p_amount_cents integer,
  p_payment_plan text,
  p_cohort_batch text default '2026-05-batch-1'
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  insert into public.cohort_members
    (email, full_name, stripe_session_id, stripe_customer_id,
     amount_cents, payment_plan, cohort_batch,
     status, joined_at)
  values
    (lower(p_email), p_full_name, p_stripe_session_id, p_stripe_customer_id,
     p_amount_cents, coalesce(p_payment_plan,'full'), p_cohort_batch,
     'paid', now())
  on conflict (stripe_session_id) do update
    set status = 'paid',
        updated_at = now()
  returning id into v_id;

  return v_id;
end;
$$;

-- Expose it to service_role only (Edge Functions will call it).
revoke all on function public.upsert_paid_member(text, text, text, text, integer, text, text) from public;
grant execute on function public.upsert_paid_member(text, text, text, text, integer, text, text) to service_role;

-- =========================================================================
-- MANUAL ROSTER WRITE (for early-bird founding seats paid before webhook exists)
-- =========================================================================
-- Run in Supabase Studio when Taylor/Steve/Speed pay manually:
--
--   insert into public.cohort_members (email, full_name, status, amount_cents, joined_at, cohort_batch, notes)
--   values ('taylor@example.com', 'Taylor', 'paid', 199700, now(), '2026-05-batch-1', 'Founding — first case study');
-- =========================================================================

-- =========================================================================
-- VERIFICATION QUERY (run after setup to confirm RLS is protecting the table)
-- =========================================================================
-- As anon key: select count(*) from public.cohort_members;  -- should return 0
-- As authenticated (logged-in member): select * from public.cohort_members;  -- returns own row only
-- As service_role (Edge Function): select count(*) from public.cohort_members;  -- returns all
-- =========================================================================
