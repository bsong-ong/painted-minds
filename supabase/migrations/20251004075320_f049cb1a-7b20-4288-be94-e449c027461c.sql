-- Create admins table if not exists
CREATE TABLE IF NOT EXISTS public.admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view all admin records" ON public.admins;
CREATE POLICY "Admins can view all admin records"
  ON public.admins FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.admins WHERE user_id = auth.uid()
  ));

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admins WHERE user_id = auth.uid()
  );
END;
$$;

-- Create user_permissions table if not exists
CREATE TABLE IF NOT EXISTS public.user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  gratitude_journaling_enabled BOOLEAN DEFAULT true,
  talk_buddy_enabled BOOLEAN DEFAULT true,
  thought_buddy_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own permissions" ON public.user_permissions;
DROP POLICY IF EXISTS "Admins can view all permissions" ON public.user_permissions;
DROP POLICY IF EXISTS "Admins can update all permissions" ON public.user_permissions;
DROP POLICY IF EXISTS "Admins can insert permissions" ON public.user_permissions;

CREATE POLICY "Users can view their own permissions"
  ON public.user_permissions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all permissions"
  ON public.user_permissions FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can update all permissions"
  ON public.user_permissions FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins can insert permissions"
  ON public.user_permissions FOR INSERT
  WITH CHECK (public.is_admin());

-- Create user_points table if not exists
CREATE TABLE IF NOT EXISTS public.user_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_points INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

ALTER TABLE public.user_points ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own points" ON public.user_points;
DROP POLICY IF EXISTS "Users can update their own points" ON public.user_points;
DROP POLICY IF EXISTS "System can insert points" ON public.user_points;

CREATE POLICY "Users can view their own points"
  ON public.user_points FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own points"
  ON public.user_points FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert points"
  ON public.user_points FOR INSERT
  WITH CHECK (true);

-- Create user_streaks table if not exists
CREATE TABLE IF NOT EXISTS public.user_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_entry_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own streaks" ON public.user_streaks;
DROP POLICY IF EXISTS "Users can update their own streaks" ON public.user_streaks;
DROP POLICY IF EXISTS "System can insert streaks" ON public.user_streaks;

CREATE POLICY "Users can view their own streaks"
  ON public.user_streaks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own streaks"
  ON public.user_streaks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert streaks"
  ON public.user_streaks FOR INSERT
  WITH CHECK (true);

-- Create drawings table if not exists
CREATE TABLE IF NOT EXISTS public.drawings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  drawing_data TEXT,
  is_gratitude_entry BOOLEAN DEFAULT false,
  shared BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.drawings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own drawings" ON public.drawings;
DROP POLICY IF EXISTS "Users can view shared drawings" ON public.drawings;
DROP POLICY IF EXISTS "Users can insert their own drawings" ON public.drawings;
DROP POLICY IF EXISTS "Users can update their own drawings" ON public.drawings;
DROP POLICY IF EXISTS "Users can delete their own drawings" ON public.drawings;

CREATE POLICY "Users can view their own drawings"
  ON public.drawings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view shared drawings"
  ON public.drawings FOR SELECT
  USING (shared = true);

CREATE POLICY "Users can insert their own drawings"
  ON public.drawings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own drawings"
  ON public.drawings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own drawings"
  ON public.drawings FOR DELETE
  USING (auth.uid() = user_id);

-- Create admin_settings table if not exists
CREATE TABLE IF NOT EXISTS public.admin_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  art_sharing_enabled BOOLEAN DEFAULT true,
  story_creation_enabled BOOLEAN DEFAULT false,
  use_openrouter_for_images BOOLEAN DEFAULT false,
  enable_username_login BOOLEAN DEFAULT true,
  talk_buddy_visible BOOLEAN DEFAULT false,
  language_switcher_enabled BOOLEAN DEFAULT false,
  default_language TEXT DEFAULT 'en',
  gratitude_drawing_visible BOOLEAN DEFAULT true,
  cbt_assistant_visible BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default settings if not exists
INSERT INTO public.admin_settings (id) 
VALUES ('00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view settings" ON public.admin_settings;
DROP POLICY IF EXISTS "Admins can update settings" ON public.admin_settings;

CREATE POLICY "Anyone can view settings"
  ON public.admin_settings FOR SELECT
  USING (true);

CREATE POLICY "Admins can update settings"
  ON public.admin_settings FOR UPDATE
  USING (public.is_admin());

-- Add RLS policies to profiles table
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Create function to get email by username
CREATE OR REPLACE FUNCTION public.get_email_by_username(lookup_username TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_email TEXT;
BEGIN
  SELECT email INTO user_email
  FROM public.profiles
  WHERE username = lookup_username;
  
  RETURN user_email;
END;
$$;