-- Remove contact columns from coaches (now using profile relationship like athletes)
ALTER TABLE coaches DROP COLUMN IF EXISTS full_name;
ALTER TABLE coaches DROP COLUMN IF EXISTS email;
ALTER TABLE coaches DROP COLUMN IF EXISTS phone;