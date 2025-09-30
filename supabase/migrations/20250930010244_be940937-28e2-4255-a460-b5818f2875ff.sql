-- Add default language setting if it doesn't exist already (it should exist)
-- Add feature visibility controls for drawing/gratitude features and CBT features

-- Update admin_settings table to ensure we have the right columns
ALTER TABLE public.admin_settings 
ADD COLUMN IF NOT EXISTS gratitude_drawing_visible boolean NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS cbt_assistant_visible boolean NOT NULL DEFAULT true;

-- Update the settings to include comments for clarity
COMMENT ON COLUMN public.admin_settings.default_language IS 'Default language for the application (en, th, etc.)';
COMMENT ON COLUMN public.admin_settings.language_switcher_enabled IS 'Whether to show the language switcher in the UI';
COMMENT ON COLUMN public.admin_settings.gratitude_drawing_visible IS 'Whether gratitude drawing features are visible to users';
COMMENT ON COLUMN public.admin_settings.cbt_assistant_visible IS 'Whether CBT assistant is visible to users';
COMMENT ON COLUMN public.admin_settings.talk_buddy_visible IS 'Whether talk buddy is visible to users';