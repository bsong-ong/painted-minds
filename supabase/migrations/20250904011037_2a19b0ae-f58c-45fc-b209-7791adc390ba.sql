-- Add admin controls for art sharing and story creation features
ALTER TABLE public.admin_settings 
ADD COLUMN art_sharing_enabled boolean NOT NULL DEFAULT true,
ADD COLUMN story_creation_enabled boolean NOT NULL DEFAULT true;