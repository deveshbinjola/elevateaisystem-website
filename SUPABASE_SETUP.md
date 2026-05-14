# Supabase Database Setup for ElevateAI

## Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up / log in
2. Click **New Project**
3. Name it `elevateai` (or whatever you prefer)
4. Set a database password (save this somewhere safe)
5. Choose a region close to your users (e.g., US West)
6. Click **Create new project** and wait for it to spin up

## Step 2: Create the `leads` Table

Go to **SQL Editor** in the Supabase dashboard and run this:

```sql
CREATE TABLE leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT,
  email TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'unknown',
  quiz_score INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast email lookups and deduplication
CREATE INDEX idx_leads_email ON leads (email);
CREATE INDEX idx_leads_source ON leads (source);
CREATE INDEX idx_leads_created ON leads (created_at DESC);

-- Enable Row Level Security
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (for the frontend forms)
CREATE POLICY "Allow anonymous inserts" ON leads
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Only authenticated users can read (you'll view data in Supabase dashboard)
CREATE POLICY "Allow authenticated reads" ON leads
  FOR SELECT
  TO authenticated
  USING (true);
```

## Step 3: Get Your API Keys

1. Go to **Settings > API** in Supabase dashboard
2. Copy these two values:
   - **Project URL** — looks like `https://xxxxx.supabase.co`
   - **anon (public) key** — a long JWT string

## Step 4: Update Your Website Files

In these files, find and replace the placeholder values:

- `lead-os.html`
- `seo-audit-landing-page.html`
- `lead-clarity-score.html`

Replace:
```js
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
```

With your actual values:
```js
const SUPABASE_URL = 'https://xxxxx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOi...your-key-here';
```

## Step 5: View Your Leads

- Go to **Table Editor > leads** in Supabase dashboard to see all captured emails
- You can export to CSV anytime
- The `source` column tells you which page/form the lead came from:
  - `lead-os-quiz` — Lead OS quiz on the Lead OS page
  - `lead-clarity-quiz` — Standalone Lead Clarity Score page
  - `seo-audit` — SEO Audit landing page form

## Sources Being Tracked

| Page | Source Value | Data Captured |
|------|-------------|---------------|
| Lead OS (quiz) | `lead-os-quiz` | name, email, quiz_score |
| Lead Clarity Score | `lead-clarity-quiz` | name, email, quiz_score |
| SEO Audit Landing | `seo-audit` | name, email |
