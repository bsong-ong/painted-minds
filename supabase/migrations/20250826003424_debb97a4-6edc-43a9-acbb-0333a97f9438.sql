-- Add sharing and star functionality to drawings table
ALTER TABLE public.drawings 
ADD COLUMN is_public boolean DEFAULT false,
ADD COLUMN star_count integer DEFAULT 0;

-- Create table for tracking individual stars/likes
CREATE TABLE public.drawing_stars (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  drawing_id uuid NOT NULL REFERENCES public.drawings(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, drawing_id)
);

-- Enable RLS on drawing_stars table
ALTER TABLE public.drawing_stars ENABLE ROW LEVEL SECURITY;

-- RLS policies for drawing_stars
CREATE POLICY "Users can create their own stars" 
ON public.drawing_stars 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own stars" 
ON public.drawing_stars 
FOR DELETE 
USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view stars" 
ON public.drawing_stars 
FOR SELECT 
USING (true);

-- Add policy for viewing public drawings
CREATE POLICY "Anyone can view public drawings" 
ON public.drawings 
FOR SELECT 
USING (is_public = true);

-- Create function to update star count when stars are added/removed
CREATE OR REPLACE FUNCTION public.update_drawing_star_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.drawings 
    SET star_count = star_count + 1 
    WHERE id = NEW.drawing_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.drawings 
    SET star_count = star_count - 1 
    WHERE id = OLD.drawing_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update star counts
CREATE TRIGGER update_star_count_on_insert
  AFTER INSERT ON public.drawing_stars
  FOR EACH ROW
  EXECUTE FUNCTION public.update_drawing_star_count();

CREATE TRIGGER update_star_count_on_delete
  AFTER DELETE ON public.drawing_stars
  FOR EACH ROW
  EXECUTE FUNCTION public.update_drawing_star_count();