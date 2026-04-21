-- Add profile_id to scheduled_classes
ALTER TABLE scheduled_classes ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES profiles(id);

-- Update existing records with a default profile (first profile found)
UPDATE scheduled_classes
SET profile_id = (SELECT id FROM profiles LIMIT 1)
WHERE profile_id IS NULL;

-- Make it required (NOT NULL) after populating existing records
ALTER TABLE scheduled_classes ALTER COLUMN profile_id SET NOT NULL;