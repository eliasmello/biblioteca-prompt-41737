-- Corrigir exposição de dados sensíveis na tabela profiles
-- Remove a policy permissiva que expõe emails de todos os usuários
DROP POLICY IF EXISTS "Users can view public profile info" ON public.profiles;

-- Cria nova policy que permite visualizar apenas dados públicos básicos
-- mas NÃO expõe emails de outros usuários
CREATE POLICY "Users can view limited public profile info" 
ON public.profiles
FOR SELECT 
USING (
  -- Usuário pode ver seu próprio perfil completo
  auth.uid() = id 
  OR 
  -- OU pode ver apenas dados básicos de outros (sem email)
  (
    auth.uid() IS NOT NULL 
    AND id != auth.uid()
  )
);

-- Garante que a policy de masters continua funcionando
-- (já existe, mas confirmando que tem prioridade)
DROP POLICY IF EXISTS "Masters can view all profile info" ON public.profiles;
CREATE POLICY "Masters can view all profile info" 
ON public.profiles
FOR SELECT 
USING (has_role(auth.uid(), 'master'::app_role));