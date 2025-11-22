-- Add language preference to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS language text DEFAULT 'en' CHECK (language IN ('en', 'th'));

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_language ON public.profiles(language);