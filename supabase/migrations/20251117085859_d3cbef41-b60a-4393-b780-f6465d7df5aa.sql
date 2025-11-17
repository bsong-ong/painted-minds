-- Create table to store LINE account linkages
CREATE TABLE public.line_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  line_user_id TEXT NOT NULL UNIQUE,
  display_name TEXT,
  picture_url TEXT,
  linked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.line_accounts ENABLE ROW LEVEL SECURITY;

-- Users can view their own LINE account
CREATE POLICY "Users can view their own LINE account"
ON public.line_accounts
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own LINE account (for initial linking)
CREATE POLICY "Users can link their own LINE account"
ON public.line_accounts
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own LINE account
CREATE POLICY "Users can update their own LINE account"
ON public.line_accounts
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own LINE account (unlink)
CREATE POLICY "Users can unlink their own LINE account"
ON public.line_accounts
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_line_accounts_updated_at
BEFORE UPDATE ON public.line_accounts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();