-- Add missing columns for sharing and social features
ALTER TABLE public.drawings 
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS star_count INTEGER DEFAULT 0;

-- Create drawing_stars table for like/star functionality
CREATE TABLE IF NOT EXISTS public.drawing_stars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drawing_id UUID NOT NULL REFERENCES public.drawings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(drawing_id, user_id)
);

ALTER TABLE public.drawing_stars ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all stars" 
  ON public.drawing_stars FOR SELECT 
  USING (true);

CREATE POLICY "Users can star drawings" 
  ON public.drawing_stars FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unstar their own stars" 
  ON public.drawing_stars FOR DELETE 
  USING (auth.uid() = user_id);