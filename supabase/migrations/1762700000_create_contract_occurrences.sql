-- Migration: create_contract_occurrences
-- Generated on: 2025-11-09

CREATE TABLE IF NOT EXISTS contract_occurrences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES saved_terms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  ai_corrected BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contract_occurrences_contract_id
  ON contract_occurrences(contract_id);

CREATE INDEX IF NOT EXISTS idx_contract_occurrences_created_at
  ON contract_occurrences(created_at DESC);

CREATE TRIGGER update_contract_occurrences_updated_at
  BEFORE UPDATE ON contract_occurrences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE contract_occurrences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own contract occurrences"
  ON contract_occurrences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own contract occurrences"
  ON contract_occurrences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own contract occurrences"
  ON contract_occurrences FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own contract occurrences"
  ON contract_occurrences FOR DELETE
  USING (auth.uid() = user_id);
