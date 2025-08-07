-- Add preview_image column to prompts table
ALTER TABLE public.prompts 
ADD COLUMN preview_image TEXT;