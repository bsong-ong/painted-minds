-- Ensure enhanced_image_url exists and bucket is public
ALTER TABLE public.drawings 
  ADD COLUMN IF NOT EXISTS enhanced_image_url TEXT;

UPDATE storage.buckets SET public = true WHERE id = 'drawings';