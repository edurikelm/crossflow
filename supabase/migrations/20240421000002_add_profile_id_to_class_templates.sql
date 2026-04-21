-- Add profile_id to class_templates
ALTER TABLE class_templates ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES profiles(id);

-- Update existing records with a default profile (first profile found)
UPDATE class_templates
SET profile_id = (SELECT id FROM profiles LIMIT 1)
WHERE profile_id IS NULL;

-- Make it required (NOT NULL) after populating existing records
ALTER TABLE class_templates ALTER COLUMN profile_id SET NOT NULL;