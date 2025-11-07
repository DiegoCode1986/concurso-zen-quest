-- Create table for time tracking (bater ponto)
CREATE TABLE public.timeclock (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  clock_in TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  clock_out TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.timeclock ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own timeclock records" 
ON public.timeclock 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own timeclock records" 
ON public.timeclock 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own timeclock records" 
ON public.timeclock 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own timeclock records" 
ON public.timeclock 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_timeclock_updated_at
BEFORE UPDATE ON public.timeclock
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();