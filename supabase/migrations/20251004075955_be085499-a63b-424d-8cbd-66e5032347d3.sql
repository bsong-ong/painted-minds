-- Add missing columns needed for enhanced drawings
ALTER TABLE public.drawings
  ADD COLUMN IF NOT EXISTS enhanced_storage_path TEXT,
  ADD COLUMN IF NOT EXISTS enhancement_prompt TEXT,
  ADD COLUMN IF NOT EXISTS flux_prompt TEXT,
  ADD COLUMN IF NOT EXISTS is_enhanced BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS user_description TEXT;