-- Migration: 001_valoraciones
-- Creates the valoraciones table for community ratings with RLS policies

CREATE TABLE valoraciones (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comunidad_id integer NOT NULL REFERENCES comunidades(id) ON DELETE CASCADE,
  user_id      uuid NOT NULL,
  stars        smallint NOT NULL CHECK (stars BETWEEN 1 AND 5),
  review       text CHECK (char_length(review) <= 1000),
  status       text NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (comunidad_id, user_id)
);

-- Partial index for fast summary queries on approved ratings
CREATE INDEX idx_valoraciones_comunidad_approved
  ON valoraciones (comunidad_id, status)
  WHERE status = 'approved';

-- Trigger function to auto-update updated_at on row changes
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER valoraciones_updated_at
  BEFORE UPDATE ON valoraciones
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Enable Row Level Security
ALTER TABLE valoraciones ENABLE ROW LEVEL SECURITY;

-- Authenticated users can insert their own ratings
CREATE POLICY "usuarios can insert own ratings"
  ON valoraciones FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Authenticated users can update their own ratings
CREATE POLICY "usuarios can update own ratings"
  ON valoraciones FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Anyone (anon + authenticated) can read approved ratings
CREATE POLICY "public can read approved ratings"
  ON valoraciones FOR SELECT
  TO anon, authenticated
  USING (status = 'approved');

-- Authenticated users can read their own ratings (to pre-fill the widget)
CREATE POLICY "usuarios can read own ratings"
  ON valoraciones FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
