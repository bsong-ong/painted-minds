-- Add column to store the full Flux Dev prompt for debugging
ALTER TABLE public.drawings 
ADD COLUMN flux_prompt text;