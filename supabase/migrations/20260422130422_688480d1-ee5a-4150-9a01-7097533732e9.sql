-- Create table for tracking folder question attempts (correct/wrong)
CREATE TABLE public.folder_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  folder_id UUID NOT NULL,
  question_id UUID NOT NULL,
  is_correct BOOLEAN NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for faster queries
CREATE INDEX idx_folder_attempts_user_folder ON public.folder_attempts(user_id, folder_id);

-- Enable RLS
ALTER TABLE public.folder_attempts ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own folder attempts"
ON public.folder_attempts FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own folder attempts"
ON public.folder_attempts FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own folder attempts"
ON public.folder_attempts FOR DELETE
TO authenticated
USING (auth.uid() = user_id);