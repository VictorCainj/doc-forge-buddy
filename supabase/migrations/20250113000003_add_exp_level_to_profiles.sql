-- Add exp and level columns to profiles table
ALTER TABLE profiles
ADD COLUMN exp INTEGER NOT NULL DEFAULT 0,
ADD COLUMN level INTEGER NOT NULL DEFAULT 1;

-- Create function to automatically update level based on exp
CREATE OR REPLACE FUNCTION update_user_level()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate level based on exp (100 exp per level)
  NEW.level = GREATEST(1, (NEW.exp / 100) + 1);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update level when exp changes
CREATE TRIGGER update_level_on_exp_change
  BEFORE UPDATE OF exp ON profiles
  FOR EACH ROW
  WHEN (OLD.exp IS DISTINCT FROM NEW.exp)
  EXECUTE FUNCTION update_user_level();

-- Create index for faster level queries
CREATE INDEX idx_profiles_level ON profiles(level);
CREATE INDEX idx_profiles_exp ON profiles(exp);

