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


