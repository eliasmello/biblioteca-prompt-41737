-- Add RLS policies for master role to view all prompts
CREATE POLICY "Masters can view all prompts"
ON public.prompts
FOR SELECT
USING (has_role(auth.uid(), 'master'::app_role));

CREATE POLICY "Masters can update all prompts"
ON public.prompts
FOR UPDATE
USING (has_role(auth.uid(), 'master'::app_role));

CREATE POLICY "Masters can delete all prompts"
ON public.prompts
FOR DELETE
USING (has_role(auth.uid(), 'master'::app_role));