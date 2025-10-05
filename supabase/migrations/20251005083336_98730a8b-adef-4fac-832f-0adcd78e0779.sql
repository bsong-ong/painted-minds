-- Make the title column nullable in thought_journal table
ALTER TABLE thought_journal 
ALTER COLUMN title DROP NOT NULL;