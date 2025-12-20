-- Add parent_id column to folders table for hierarchical structure
ALTER TABLE public.folders 
ADD COLUMN parent_id uuid REFERENCES public.folders(id) ON DELETE CASCADE;

-- Create index for better performance on hierarchical queries
CREATE INDEX idx_folders_parent_id ON public.folders(parent_id);

-- Add RLS policy for parent_id column (inherits from existing policies)