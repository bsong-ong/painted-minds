-- Ensure profiles and permissions are created on user signup and capture username from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Create or update profile, capturing username from auth metadata (lowercased)
  INSERT INTO public.profiles (id, email, username)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NULLIF(LOWER(NEW.raw_user_meta_data ->> 'username'), ''), NULL)
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    username = COALESCE(public.profiles.username, EXCLUDED.username);

  -- Create user permissions with defaults
  INSERT INTO public.user_permissions (
    user_id,
    gratitude_journaling_enabled,
    talk_buddy_enabled,
    thought_buddy_enabled
  )
  VALUES (
    NEW.id,
    true,
    true,
    true
  )
  ON CONFLICT (user_id) DO NOTHING;

  -- Create user points
  INSERT INTO public.user_points (user_id, total_points)
  VALUES (NEW.id, 0)
  ON CONFLICT (user_id) DO NOTHING;

  -- Create user streaks
  INSERT INTO public.user_streaks (
    user_id,
    current_streak,
    longest_streak
  )
  VALUES (NEW.id, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Create the trigger to invoke the function when a new auth user is created
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_signup();
  END IF;
END $$;

-- Enforce case-insensitive uniqueness for usernames (allow NULLs)
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_ci_unique
ON public.profiles (LOWER(username))
WHERE username IS NOT NULL;