-- Add observacao column to existing tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS observacao TEXT NOT NULL DEFAULT '';

-- Update existing tasks to have empty observacao
UPDATE tasks SET observacao = '' WHERE observacao IS NULL;

