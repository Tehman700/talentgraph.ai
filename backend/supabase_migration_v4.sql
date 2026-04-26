-- TalentGraph v4 Migration
-- Adds richer worker profile fields for browse + become-worker flow.

ALTER TABLE talent_profiles
  ADD COLUMN IF NOT EXISTS profession TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS experience_level TEXT DEFAULT 'mid',
  ADD COLUMN IF NOT EXISTS state TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS linkedin_url TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS photo_url TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS resume_url TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS verify_github BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS verify_linkedin BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_talent_profiles_country_code ON talent_profiles(country_code);
CREATE INDEX IF NOT EXISTS idx_talent_profiles_role_type ON talent_profiles(role_type);
CREATE INDEX IF NOT EXISTS idx_talent_profiles_niche ON talent_profiles(niche);
CREATE INDEX IF NOT EXISTS idx_talent_profiles_profession ON talent_profiles(profession);
CREATE INDEX IF NOT EXISTS idx_talent_profiles_experience_level ON talent_profiles(experience_level);
