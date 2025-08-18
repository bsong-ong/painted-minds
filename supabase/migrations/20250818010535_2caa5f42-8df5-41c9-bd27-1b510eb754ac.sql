-- Ensure RLS is properly enforced on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them with better security
DROP POLICY IF EXISTS "Users can read own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;

-- Create more secure policies with explicit role checking
CREATE POLICY "Users can read own data" 
ON public.users 
FOR SELECT 
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can update own data" 
ON public.users 
FOR UPDATE 
TO authenticated
USING (auth.uid() = id);

-- Ensure no anonymous access is possible
REVOKE ALL ON public.users FROM anon;
REVOKE ALL ON public.users FROM public;

-- Grant specific permissions only to authenticated users
GRANT SELECT, UPDATE ON public.users TO authenticated;