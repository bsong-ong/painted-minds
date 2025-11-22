-- Create table for storing temporary LINE link tokens
CREATE TABLE IF NOT EXISTS public.line_link_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL UNIQUE,
  user_id uuid,
  line_user_id text,
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.line_link_tokens ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own tokens
CREATE POLICY "Users can view their own link tokens"
  ON public.line_link_tokens
  FOR SELECT
  USING (auth.uid() = user_id);

-- Allow anyone to validate tokens (needed for linking process)
CREATE POLICY "Anyone can validate tokens"
  ON public.line_link_tokens
  FOR SELECT
  USING (expires_at > now());

-- Allow authenticated users to create tokens
CREATE POLICY "Authenticated users can create tokens"
  ON public.line_link_tokens
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow system to delete expired tokens
CREATE POLICY "System can delete expired tokens"
  ON public.line_link_tokens
  FOR DELETE
  USING (expires_at < now());

-- Create index for faster token lookups
CREATE INDEX idx_line_link_tokens_token ON public.line_link_tokens(token);
CREATE INDEX idx_line_link_tokens_expires_at ON public.line_link_tokens(expires_at);