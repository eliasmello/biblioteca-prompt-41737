-- Add is_public column to prompts table
ALTER TABLE public.prompts 
ADD COLUMN is_public boolean NOT NULL DEFAULT true;

-- Update existing prompts to be public
UPDATE public.prompts SET is_public = true;

-- Create index for better performance
CREATE INDEX idx_prompts_is_public ON public.prompts(is_public);
CREATE INDEX idx_prompts_created_by ON public.prompts(created_by);

-- Update RLS policies for prompts
DROP POLICY IF EXISTS "Users can view all prompts" ON public.prompts;

-- New policy: Users can view public prompts OR their own prompts
CREATE POLICY "Users can view public prompts or own prompts" 
ON public.prompts 
FOR SELECT 
USING (is_public = true OR auth.uid() = created_by);

-- Update create policy to allow personal prompts
DROP POLICY IF EXISTS "Users can create their own prompts" ON public.prompts;

CREATE POLICY "Users can create prompts" 
ON public.prompts 
FOR INSERT 
WITH CHECK (auth.uid() = created_by);

-- Update update policy - users can only update their own prompts
DROP POLICY IF EXISTS "Users can update their own prompts" ON public.prompts;

CREATE POLICY "Users can update own prompts or master can update public" 
ON public.prompts 
FOR UPDATE 
USING (
  auth.uid() = created_by OR 
  (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'master'
  ) AND is_public = true)
);

-- Update delete policy - users can only delete their own prompts
DROP POLICY IF EXISTS "Users can delete their own prompts" ON public.prompts;

CREATE POLICY "Users can delete own prompts or master can delete public" 
ON public.prompts 
FOR DELETE 
USING (
  auth.uid() = created_by OR 
  (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'master'
  ))
);

-- Add admin role to existing roles
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('user', 'admin', 'master');
  END IF;
END $$;

-- Update profiles table to use enum if not already using it
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'profiles' 
             AND column_name = 'role' 
             AND data_type = 'character varying') THEN
    ALTER TABLE public.profiles ALTER COLUMN role TYPE user_role USING role::user_role;
  END IF;
END $$;

-- Create function to check if user is master
CREATE OR REPLACE FUNCTION public.is_master_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'master'
  );
$$;

-- Create RLS policy for profiles - master can view all, users can view their own
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

CREATE POLICY "Users can view own profile or master can view all" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() = id OR 
  public.is_master_user()
);

-- Master can update any profile, users can update their own
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can update own profile or master can update any" 
ON public.profiles 
FOR UPDATE 
USING (
  auth.uid() = id OR 
  public.is_master_user()
);

-- Only master can insert new profiles (for user management)
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

CREATE POLICY "Master can insert profiles or auto-insert on signup" 
ON public.profiles 
FOR INSERT 
WITH CHECK (
  public.is_master_user() OR 
  auth.uid() = id
);