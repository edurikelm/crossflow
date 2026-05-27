-- Remove orphan columns from athletes table
-- These were added in 20240421000001 alongside coaches, but only removed from coaches in 20240422000000.
-- Contact info is always read from profiles via JOIN.
ALTER TABLE athletes DROP COLUMN IF EXISTS full_name;
ALTER TABLE athletes DROP COLUMN IF EXISTS email;
ALTER TABLE athletes DROP COLUMN IF EXISTS phone;
