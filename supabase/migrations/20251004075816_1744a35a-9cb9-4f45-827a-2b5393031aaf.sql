-- Add missing columns to drawings table
ALTER TABLE public.drawings 
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS storage_path TEXT,
  ADD COLUMN IF NOT EXISTS gratitude_prompt TEXT;

-- Remove drawing_data column if it exists (replaced by image_url)
ALTER TABLE public.drawings DROP COLUMN IF EXISTS drawing_data;