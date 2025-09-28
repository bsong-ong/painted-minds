-- Add talk_buddy_visible setting to admin_settings table
ALTER TABLE public.admin_settings 
ADD COLUMN talk_buddy_visible boolean NOT NULL DEFAULT true;