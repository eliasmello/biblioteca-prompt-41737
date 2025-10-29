-- Create prompt_versions table to store version history
CREATE TABLE public.prompt_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  prompt_id UUID NOT NULL REFERENCES public.prompts(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT,
  content TEXT NOT NULL,
  description TEXT,
  tags TEXT[] DEFAULT '{}'::TEXT[],
  keywords TEXT[] DEFAULT '{}'::TEXT[],
  style_tags TEXT[] DEFAULT '{}'::TEXT[],
  subject_tags TEXT[] DEFAULT '{}'::TEXT[],
  preview_image TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  change_summary TEXT,
  UNIQUE(prompt_id, version_number)
);

-- Enable RLS
ALTER TABLE public.prompt_versions ENABLE ROW LEVEL SECURITY;

-- Users can view versions of prompts they own or public prompts
CREATE POLICY "Users can view versions of their prompts"
ON public.prompt_versions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.prompts
    WHERE prompts.id = prompt_versions.prompt_id
    AND (prompts.created_by = auth.uid() OR prompts.is_public = true)
  )
);

-- Users can create versions when updating their own prompts
CREATE POLICY "Users can create versions of their prompts"
ON public.prompt_versions
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.prompts
    WHERE prompts.id = prompt_versions.prompt_id
    AND prompts.created_by = auth.uid()
  )
  AND created_by = auth.uid()
);

-- Index for better performance
CREATE INDEX idx_prompt_versions_prompt_id ON public.prompt_versions(prompt_id);
CREATE INDEX idx_prompt_versions_created_at ON public.prompt_versions(created_at DESC);

-- Function to automatically create version on prompt update
CREATE OR REPLACE FUNCTION public.create_prompt_version()
RETURNS TRIGGER AS $$
DECLARE
  next_version INTEGER;
BEGIN
  -- Get next version number
  SELECT COALESCE(MAX(version_number), 0) + 1
  INTO next_version
  FROM public.prompt_versions
  WHERE prompt_id = OLD.id;

  -- Insert version with old data
  INSERT INTO public.prompt_versions (
    prompt_id,
    version_number,
    title,
    category,
    subcategory,
    content,
    description,
    tags,
    keywords,
    style_tags,
    subject_tags,
    preview_image,
    created_by,
    change_summary
  ) VALUES (
    OLD.id,
    next_version,
    OLD.title,
    OLD.category,
    OLD.subcategory,
    OLD.content,
    OLD.description,
    OLD.tags,
    OLD.keywords,
    OLD.style_tags,
    OLD.subject_tags,
    OLD.preview_image,
    OLD.updated_by,
    'Versão anterior salva automaticamente'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to create version before update
CREATE TRIGGER create_version_before_update
  BEFORE UPDATE ON public.prompts
  FOR EACH ROW
  WHEN (
    OLD.title IS DISTINCT FROM NEW.title OR
    OLD.content IS DISTINCT FROM NEW.content OR
    OLD.category IS DISTINCT FROM NEW.category OR
    OLD.subcategory IS DISTINCT FROM NEW.subcategory OR
    OLD.description IS DISTINCT FROM NEW.description
  )
  EXECUTE FUNCTION public.create_prompt_version();