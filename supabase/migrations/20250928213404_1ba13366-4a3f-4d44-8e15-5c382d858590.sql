-- Drop the constraint first
ALTER TABLE public.questions 
DROP CONSTRAINT IF EXISTS questions_type_check;

-- Update the existing data to match the new values
UPDATE public.questions 
SET type = 'true_false' 
WHERE type = 'boolean';

UPDATE public.questions 
SET type = 'multiple_choice' 
WHERE type = 'multiple';

-- Add the new constraint with correct values
ALTER TABLE public.questions 
ADD CONSTRAINT questions_type_check 
CHECK (type IN ('multiple_choice', 'true_false'));