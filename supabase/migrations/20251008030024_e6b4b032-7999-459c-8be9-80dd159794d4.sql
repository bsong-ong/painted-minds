-- Update the get_email_by_username function to handle case-insensitive lookups
CREATE OR REPLACE FUNCTION public.get_email_by_username(lookup_username text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_email TEXT;
BEGIN
  SELECT email INTO user_email
  FROM public.profiles
  WHERE LOWER(username) = LOWER(lookup_username);
  
  RETURN user_email;
END;
$$;