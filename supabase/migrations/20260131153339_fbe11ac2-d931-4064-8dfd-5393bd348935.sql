-- Create enum for study status
CREATE TYPE public.study_status AS ENUM ('not_started', 'in_progress', 'completed', 'review');

-- Create enum for priority
CREATE TYPE public.study_priority AS ENUM ('low', 'medium', 'high');

-- Create study_progress table
CREATE TABLE public.study_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  folder_id UUID NOT NULL REFERENCES public.folders(id) ON DELETE CASCADE,
  status study_status NOT NULL DEFAULT 'not_started',
  priority study_priority NOT NULL DEFAULT 'medium',
  last_studied_at TIMESTAMP WITH TIME ZONE,
  study_sessions INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, folder_id)
);

-- Enable Row Level Security
ALTER TABLE public.study_progress ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own study progress"
ON public.study_progress
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own study progress"
ON public.study_progress
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own study progress"
ON public.study_progress
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own study progress"
ON public.study_progress
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_study_progress_updated_at
BEFORE UPDATE ON public.study_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();