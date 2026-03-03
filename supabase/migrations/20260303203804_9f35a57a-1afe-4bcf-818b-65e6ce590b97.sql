
CREATE TABLE public.wrong_answers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  folder_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, question_id)
);

ALTER TABLE public.wrong_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own wrong answers"
  ON public.wrong_answers FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own wrong answers"
  ON public.wrong_answers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own wrong answers"
  ON public.wrong_answers FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
