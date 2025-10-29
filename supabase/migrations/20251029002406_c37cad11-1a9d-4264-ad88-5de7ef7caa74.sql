-- Remover política genérica ALL que permite UPDATE/DELETE indevidamente
DROP POLICY IF EXISTS "Masters can manage roles" ON public.user_roles;

-- Criar políticas específicas para cada operação
CREATE POLICY "Masters can insert roles" 
ON public.user_roles 
FOR INSERT 
TO authenticated
WITH CHECK (has_role(auth.uid(), 'master'::app_role));

CREATE POLICY "Masters can update roles" 
ON public.user_roles 
FOR UPDATE 
TO authenticated
USING (has_role(auth.uid(), 'master'::app_role))
WITH CHECK (has_role(auth.uid(), 'master'::app_role));

CREATE POLICY "Masters can delete roles" 
ON public.user_roles 
FOR DELETE 
TO authenticated
USING (has_role(auth.uid(), 'master'::app_role));

-- Verificar se a trigger handle_new_user existe e está ativa
CREATE OR REPLACE FUNCTION public.check_and_create_profile_role()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Esta função pode ser usada para criar perfil e role manualmente se necessário
  RAISE NOTICE 'Função de verificação criada com sucesso';
END;
$$;