-- Oil selector recommendations table
-- This table stores flattened data derived from the large autok.txt dataset.
-- Run this in the Supabase SQL editor before running the ingestion script.

CREATE TABLE IF NOT EXISTS oil_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  type TEXT NOT NULL,
  hash TEXT NOT NULL,
  system_name TEXT NOT NULL,
  capacities JSONB,
  uses JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (make, model, type, hash, system_name)
);

CREATE INDEX IF NOT EXISTS idx_oil_recommendations_make ON oil_recommendations(make);
CREATE INDEX IF NOT EXISTS idx_oil_recommendations_make_model ON oil_recommendations(make, model);
CREATE INDEX IF NOT EXISTS idx_oil_recommendations_hash ON oil_recommendations(hash);

-- Helper function to normalize viscosity from system_name, falls back to text matches
CREATE OR REPLACE FUNCTION public.normalize_viscosity(raw text)
RETURNS text AS $$
DECLARE
  match text;
BEGIN
  SELECT regexp_matches(raw, '(\d+W-\d+)', 'i') INTO match;
  RETURN COALESCE(match, trim(raw));
END;
$$ LANGUAGE plpgsql;

-- Upsert normalized rows into vehicle_oil_recommendations
WITH resolved AS (
  SELECT v.id AS vehicle_id,
         orc.system_name,
         normalize_viscosity(orc.system_name) AS viscosity
  FROM oil_recommendations orc
  JOIN vehicles v ON v.specifications ->> 'hash' = orc.hash
)
INSERT INTO vehicle_oil_recommendations (vehicle_id, manufacturer_label, viscosity)
SELECT vehicle_id, system_name, viscosity
FROM resolved
ON CONFLICT (vehicle_id, viscosity, specification_code)
DO UPDATE SET manufacturer_label = EXCLUDED.manufacturer_label,
              updated_at = NOW();


