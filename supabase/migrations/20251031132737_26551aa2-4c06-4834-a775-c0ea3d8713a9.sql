-- Add thumbnail_url column to prompts table for optimized previews
ALTER TABLE public.prompts ADD COLUMN IF NOT EXISTS thumbnail_url text;