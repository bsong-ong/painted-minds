-- Add the new column for OpenRouter image generation preference
ALTER TABLE public.admin_settings 
ADD COLUMN use_openrouter_for_images BOOLEAN DEFAULT false;