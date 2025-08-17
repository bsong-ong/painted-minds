-- Add enhanced image fields to drawings table
ALTER TABLE public.drawings 
ADD COLUMN enhanced_image_url TEXT,
ADD COLUMN enhanced_storage_path TEXT,
ADD COLUMN enhancement_prompt TEXT,
ADD COLUMN is_enhanced BOOLEAN DEFAULT FALSE;