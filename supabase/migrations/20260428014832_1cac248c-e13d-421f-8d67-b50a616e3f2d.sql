-- Add sequential code column to questions
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS code TEXT;

-- Create a per-user sequence table to track the next number
CREATE TABLE IF NOT EXISTS public.question_code_counters (
  user_id UUID PRIMARY KEY,
  next_value INTEGER NOT NULL DEFAULT 1
);

ALTER TABLE public.question_code_counters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own counter"
ON public.question_code_counters FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Backfill codes for existing questions in created_at order, per user
DO $$
DECLARE
  r RECORD;
  prev_user UUID := NULL;
  counter INT := 0;
BEGIN
  FOR r IN
    SELECT id, user_id FROM public.questions
    ORDER BY user_id, created_at ASC, id ASC
  LOOP
    IF prev_user IS DISTINCT FROM r.user_id THEN
      counter := 1;
      prev_user := r.user_id;
    ELSE
      counter := counter + 1;
    END IF;
    UPDATE public.questions
    SET code = 'Q' || LPAD(counter::text, 4, '0')
    WHERE id = r.id;
  END LOOP;

  -- Initialize counters for each user
  INSERT INTO public.question_code_counters (user_id, next_value)
  SELECT user_id, COUNT(*) + 1
  FROM public.questions
  GROUP BY user_id
  ON CONFLICT (user_id) DO UPDATE SET next_value = EXCLUDED.next_value;
END $$;

-- Trigger function to assign code on insert
CREATE OR REPLACE FUNCTION public.assign_question_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_num INT;
BEGIN
  IF NEW.code IS NOT NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.question_code_counters (user_id, next_value)
  VALUES (NEW.user_id, 2)
  ON CONFLICT (user_id) DO UPDATE
    SET next_value = public.question_code_counters.next_value + 1
  RETURNING next_value - 1 INTO next_num;

  NEW.code := 'Q' || LPAD(next_num::text, 4, '0');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS questions_assign_code ON public.questions;
CREATE TRIGGER questions_assign_code
BEFORE INSERT ON public.questions
FOR EACH ROW
EXECUTE FUNCTION public.assign_question_code();