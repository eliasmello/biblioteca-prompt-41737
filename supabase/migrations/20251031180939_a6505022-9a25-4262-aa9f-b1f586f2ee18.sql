-- Add indexes to optimize prompts queries and prevent timeouts
CREATE INDEX IF NOT EXISTS idx_prompts_created_by ON public.prompts(created_by);
CREATE INDEX IF NOT EXISTS idx_prompts_is_public ON public.prompts(is_public);
CREATE INDEX IF NOT EXISTS idx_prompts_created_at ON public.prompts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prompts_category ON public.prompts(category);

-- Composite index for common query pattern (public prompts ordered by date)
CREATE INDEX IF NOT EXISTS idx_prompts_public_created_at ON public.prompts(is_public, created_at DESC);

-- Composite index for user's prompts ordered by date
CREATE INDEX IF NOT EXISTS idx_prompts_user_created_at ON public.prompts(created_by, created_at DESC);