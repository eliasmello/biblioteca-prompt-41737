-- Fix security vulnerability in user_registrations table
-- Remove the overly broad "ALL" policy and create specific restrictive policies

-- First, drop the existing broad policy
DROP POLICY IF EXISTS "Masters can manage all registration requests" ON public.user_registrations;

-- Create specific policies for each operation with explicit restrictions

-- 1. Allow anyone to INSERT registration requests (this is needed for public registration)
-- This policy already exists: "Anyone can submit registration requests"

-- 2. Only master users can SELECT (read) registration data
CREATE POLICY "Only masters can view registration requests" 
ON public.user_registrations 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'master'
  )
);

-- 3. Only master users can UPDATE registration status
CREATE POLICY "Only masters can update registration requests" 
ON public.user_registrations 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'master'
  )
);

-- 4. Only master users can DELETE registration requests (if needed)
CREATE POLICY "Only masters can delete registration requests" 
ON public.user_registrations 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'master'
  )
);