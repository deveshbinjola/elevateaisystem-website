-- ============================================================
-- ElevateAI System — Newsletter Subscribers Table
-- Run this ONCE in Supabase → SQL Editor → New Query
-- ============================================================

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id             uuid          DEFAULT gen_random_uuid() PRIMARY KEY,
  email          text          UNIQUE NOT NULL,
  source         text          DEFAULT 'blog-popup',
  page_url       text,
  subscribed_at  timestamptz   DEFAULT now()
);

-- Index for fast email lookups / deduplication
CREATE INDEX IF NOT EXISTS idx_newsletter_email ON newsletter_subscribers (email);

-- Enable Row Level Security
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (so the website popup can write rows)
CREATE POLICY "Allow anon inserts"
  ON newsletter_subscribers
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Only your service role (you, logged in) can read/export the list
CREATE POLICY "Allow authenticated reads"
  ON newsletter_subscribers
  FOR SELECT
  TO authenticated
  USING (true);
