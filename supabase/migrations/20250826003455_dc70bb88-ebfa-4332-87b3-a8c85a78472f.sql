-- Fix security warning by setting search_path for the function
CREATE OR REPLACE FUNCTION public.update_drawing_star_count()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
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
$$;