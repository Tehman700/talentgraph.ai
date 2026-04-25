-- TalentGraph v2 Migration
-- Run this in Supabase SQL Editor → New Query

-- Talent profiles table (seed data + real user profiles)
CREATE TABLE IF NOT EXISTS talent_profiles (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  source          TEXT NOT NULL DEFAULT 'user' CHECK (source IN ('seed', 'user')),
  name            TEXT NOT NULL,
  role_type       TEXT NOT NULL DEFAULT 'tech' CHECK (role_type IN ('tech', 'non_tech')),
  niche           TEXT NOT NULL DEFAULT '',
  skills          TEXT[] DEFAULT '{}',
  experience_years INTEGER DEFAULT 0,
  city            TEXT DEFAULT '',
  country         TEXT DEFAULT '',
  country_code    TEXT DEFAULT '',
  lat             DOUBLE PRECISION,
  lng             DOUBLE PRECISION,
  bio             TEXT DEFAULT '',
  github_username TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE talent_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read talent profiles"
  ON talent_profiles FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Anyone insert talent profiles"
  ON talent_profiles FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Users update own profile"
  ON talent_profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users delete own profile"
  ON talent_profiles FOR DELETE TO authenticated USING (auth.uid() = user_id);


-- Job postings table
CREATE TABLE IF NOT EXISTS job_postings (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  org_name         TEXT DEFAULT '',
  title            TEXT NOT NULL,
  description      TEXT NOT NULL,
  required_skills  TEXT[] DEFAULT '{}',
  city             TEXT DEFAULT '',
  country          TEXT DEFAULT '',
  country_code     TEXT DEFAULT '',
  lat              DOUBLE PRECISION,
  lng              DOUBLE PRECISION,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE job_postings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read job postings"
  ON job_postings FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Anyone insert job postings"
  ON job_postings FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Users update own job postings"
  ON job_postings FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users delete own job postings"
  ON job_postings FOR DELETE TO authenticated USING (auth.uid() = user_id);
