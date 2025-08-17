-- Add gratitude-specific fields to drawings table
ALTER TABLE public.drawings 
ADD COLUMN gratitude_prompt TEXT,
ADD COLUMN user_description TEXT,
ADD COLUMN is_gratitude_entry BOOLEAN DEFAULT true;

-- Create gratitude prompts table for AI-generated suggestions
CREATE TABLE public.gratitude_prompts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  prompt_text TEXT NOT NULL,
  category TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on gratitude prompts
ALTER TABLE public.gratitude_prompts ENABLE ROW LEVEL SECURITY;

-- Anyone can read gratitude prompts (they're general suggestions)
CREATE POLICY "Anyone can read gratitude prompts" 
ON public.gratitude_prompts 
FOR SELECT 
USING (true);

-- Create user streaks table for consistency tracking
CREATE TABLE public.user_streaks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_entry_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on user streaks
ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;

-- Users can manage their own streaks
CREATE POLICY "Users can manage their own streaks" 
ON public.user_streaks 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Add trigger for user streaks updated_at
CREATE TRIGGER update_user_streaks_updated_at
BEFORE UPDATE ON public.user_streaks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some default gratitude prompts
INSERT INTO public.gratitude_prompts (prompt_text, category) VALUES
('Draw something in nature that makes you feel peaceful', 'nature'),
('Illustrate a person who has positively impacted your life', 'relationships'),
('Sketch a moment from today that brought you joy', 'daily_moments'),
('Draw your favorite place to relax and unwind', 'places'),
('Illustrate something you accomplished recently that you''re proud of', 'achievements'),
('Draw a simple pleasure that always makes you smile', 'simple_pleasures'),
('Sketch something you''re looking forward to', 'future'),
('Illustrate a skill or talent you''re grateful to have', 'abilities'),
('Draw something that represents your home or family', 'home'),
('Sketch an act of kindness you witnessed or experienced', 'kindness');