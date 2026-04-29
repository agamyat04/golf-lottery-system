-- ============================================================
-- GolfDraw FIXED Schema v2
-- Drop everything and recreate cleanly
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- DROP EXISTING POLICIES (clean slate)
-- ============================================================
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view own subscription" ON subscriptions;
DROP POLICY IF EXISTS "Service role can upsert subs" ON subscriptions;
DROP POLICY IF EXISTS "Anyone can view active charities" ON charities;
DROP POLICY IF EXISTS "Admins can manage charities" ON charities;
DROP POLICY IF EXISTS "Users can view own contribution" ON contributions;
DROP POLICY IF EXISTS "Users can manage own contribution" ON contributions;
DROP POLICY IF EXISTS "Users can view own scores" ON scores;
DROP POLICY IF EXISTS "Users can manage own scores" ON scores;
DROP POLICY IF EXISTS "Anyone authenticated can view draws" ON draws;
DROP POLICY IF EXISTS "Admins can manage draws" ON draws;
DROP POLICY IF EXISTS "Users can view own entries" ON draw_entries;
DROP POLICY IF EXISTS "Service role can manage entries" ON draw_entries;
DROP POLICY IF EXISTS "Users can view own winnings" ON winnings;
DROP POLICY IF EXISTS "Users can update own winnings" ON winnings;
DROP POLICY IF EXISTS "Service role can manage winnings" ON winnings;

-- ============================================================
-- TABLES
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  full_name   TEXT,
  role        TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                 UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan                    TEXT NOT NULL CHECK (plan IN ('monthly', 'yearly')),
  status                  TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'trialing')),
  stripe_subscription_id  TEXT,
  stripe_customer_id      TEXT,
  current_period_start    TIMESTAMPTZ,
  current_period_end      TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS charities (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  description TEXT,
  logo_url    TEXT,
  website     TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contributions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  charity_id  UUID NOT NULL REFERENCES charities(id) ON DELETE CASCADE,
  percentage  NUMERIC(5,2) NOT NULL DEFAULT 10.00 CHECK (percentage >= 10 AND percentage <= 100),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS scores (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  score       INTEGER NOT NULL CHECK (score > 0 AND score <= 200),
  score_date  DATE NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, score_date)
);

CREATE INDEX IF NOT EXISTS idx_scores_user_date ON scores(user_id, score_date DESC);

CREATE TABLE IF NOT EXISTS draws (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  draw_date           DATE NOT NULL UNIQUE,
  drawn_numbers       INTEGER[] NOT NULL DEFAULT '{}',
  prize_pool          NUMERIC(12,2) NOT NULL DEFAULT 0,
  jackpot_amount      NUMERIC(12,2) NOT NULL DEFAULT 0,
  four_match_amount   NUMERIC(12,2) NOT NULL DEFAULT 0,
  three_match_amount  NUMERIC(12,2) NOT NULL DEFAULT 0,
  rollover_amount     NUMERIC(12,2) NOT NULL DEFAULT 0,
  status              TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed')),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS draw_entries (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  draw_id     UUID NOT NULL REFERENCES draws(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  numbers     INTEGER[] NOT NULL,
  matches     INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(draw_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_draw_entries_draw ON draw_entries(draw_id);
CREATE INDEX IF NOT EXISTS idx_draw_entries_user ON draw_entries(user_id);

CREATE TABLE IF NOT EXISTS winnings (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  draw_id         UUID NOT NULL REFERENCES draws(id) ON DELETE CASCADE,
  draw_entry_id   UUID NOT NULL REFERENCES draw_entries(id) ON DELETE CASCADE,
  amount          NUMERIC(12,2) NOT NULL,
  match_type      TEXT NOT NULL CHECK (match_type IN ('5_match', '4_match', '3_match')),
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'proof_uploaded', 'verified', 'paid', 'rejected')),
  proof_url       TEXT,
  admin_notes     TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_winnings_user ON winnings(user_id);
CREATE INDEX IF NOT EXISTS idx_winnings_draw ON winnings(draw_id);
CREATE INDEX IF NOT EXISTS idx_winnings_status ON winnings(status);

-- ============================================================
-- TRIGGERS
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    CASE
      WHEN NEW.email = 'admin@golfdraw.com' THEN 'admin'
      ELSE 'user'
    END
  )
  ON CONFLICT (id) DO UPDATE
    SET email     = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, profiles.full_name);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS subscriptions_updated_at ON subscriptions;
CREATE TRIGGER subscriptions_updated_at BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS contributions_updated_at ON contributions;
CREATE TRIGGER contributions_updated_at BEFORE UPDATE ON contributions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS winnings_updated_at ON winnings;
CREATE TRIGGER winnings_updated_at BEFORE UPDATE ON winnings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- BACKFILL: Insert profiles for any existing auth users
-- (Fixes admin user who signed up before trigger existed)
-- ============================================================
INSERT INTO public.profiles (id, email, full_name, role)
SELECT
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)),
  CASE WHEN u.email = 'admin@golfdraw.com' THEN 'admin' ELSE 'user' END
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id);

-- ============================================================
-- ADMIN ROLE: Force-set admin@golfdraw.com
-- ============================================================
UPDATE profiles SET role = 'admin' WHERE email = 'admin@golfdraw.com';

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE charities     ENABLE ROW LEVEL SECURITY;
ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores        ENABLE ROW LEVEL SECURITY;
ALTER TABLE draws         ENABLE ROW LEVEL SECURITY;
ALTER TABLE draw_entries  ENABLE ROW LEVEL SECURITY;
ALTER TABLE winnings      ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- ADMIN HELPER — SECURITY DEFINER bypasses RLS (no circular dep)
-- ============================================================
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- PROFILES RLS
-- FIXED: split into separate non-overlapping policies
-- No circular dep because is_admin() is SECURITY DEFINER
-- ============================================================
CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "profiles_select_admin"
  ON profiles FOR SELECT
  USING (is_admin());

CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (id = auth.uid());

-- Allow service role to insert (for trigger backfill)
CREATE POLICY "profiles_insert_service"
  ON profiles FOR INSERT
  WITH CHECK (true);

-- SUBSCRIPTIONS
CREATE POLICY "subs_select_own"
  ON subscriptions FOR SELECT
  USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "subs_all"
  ON subscriptions FOR ALL
  USING (true);

-- CHARITIES
CREATE POLICY "charities_select"
  ON charities FOR SELECT
  USING (is_active = true OR is_admin());

CREATE POLICY "charities_admin_all"
  ON charities FOR ALL
  USING (is_admin());

-- CONTRIBUTIONS
CREATE POLICY "contributions_select"
  ON contributions FOR SELECT
  USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "contributions_user_all"
  ON contributions FOR ALL
  USING (user_id = auth.uid());

-- SCORES
CREATE POLICY "scores_select"
  ON scores FOR SELECT
  USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "scores_user_all"
  ON scores FOR ALL
  USING (user_id = auth.uid());

-- DRAWS
CREATE POLICY "draws_select"
  ON draws FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "draws_admin_all"
  ON draws FOR ALL
  USING (is_admin());

-- DRAW ENTRIES
CREATE POLICY "entries_select"
  ON draw_entries FOR SELECT
  USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "entries_all"
  ON draw_entries FOR ALL
  USING (true);

-- WINNINGS
CREATE POLICY "winnings_select"
  ON winnings FOR SELECT
  USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "winnings_user_update"
  ON winnings FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "winnings_all"
  ON winnings FOR ALL
  USING (true);

-- ============================================================
-- STORAGE
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('proofs', 'proofs', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Authenticated users can upload proofs" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view proofs" ON storage.objects;

CREATE POLICY "proofs_upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'proofs');

CREATE POLICY "proofs_select"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'proofs');

-- ============================================================
-- SEED CHARITIES
-- ============================================================
INSERT INTO charities (name, description, website, is_active) VALUES
  ('Cancer Research UK', 'The UK''s leading cancer research charity, working to beat cancer sooner.', 'https://www.cancerresearchuk.org', true),
  ('British Heart Foundation', 'Fighting heart disease and stroke, the UK''s biggest killers.', 'https://www.bhf.org.uk', true),
  ('Age UK', 'The UK''s leading charity helping older people to love later life.', 'https://www.ageuk.org.uk', true),
  ('Save the Children UK', 'Helping the world''s most vulnerable children survive, learn and be protected.', 'https://www.savethechildren.org.uk', true),
  ('RSPCA', 'Preventing cruelty, promoting kindness to animals in England and Wales.', 'https://www.rspca.org.uk', true)
ON CONFLICT DO NOTHING;