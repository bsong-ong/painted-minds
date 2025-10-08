-- Set username for the known user so username login works
UPDATE public.profiles
SET username = 'joedy'
WHERE email = 'joedy@gmail.com' AND (username IS NULL OR username = '');