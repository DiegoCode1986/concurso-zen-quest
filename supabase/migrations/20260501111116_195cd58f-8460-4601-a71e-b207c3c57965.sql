-- Create revisions table for spaced repetition (3-7-14-21 days)
CREATE TABLE public.revisions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  subject TEXT NOT NULL,
  topic TEXT NOT NULL,
  study_date DATE NOT NULL,
  review_1_date DATE NOT NULL,
  review_2_date DATE NOT NULL,
  review_3_date DATE NOT NULL,
  review_4_date DATE NOT NULL,
  review_1_done BOOLEAN NOT NULL DEFAULT false,
  review_2_done BOOLEAN NOT NULL DEFAULT false,
  review_3_done BOOLEAN NOT NULL DEFAULT false,
  review_4_done BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.revisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own revisions"
ON public.revisions FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own revisions"
ON public.revisions FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own revisions"
ON public.revisions FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own revisions"
ON public.revisions FOR DELETE TO authenticated
USING (auth.uid() = user_id);

CREATE TRIGGER update_revisions_updated_at
BEFORE UPDATE ON public.revisions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_revisions_user_dates ON public.revisions(user_id, review_1_date, review_2_date, review_3_date, review_4_date);