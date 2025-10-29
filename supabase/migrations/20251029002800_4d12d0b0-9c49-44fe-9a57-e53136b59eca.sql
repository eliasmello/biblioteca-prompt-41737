-- Remover políticas permissivas atuais
DROP POLICY IF EXISTS "Masters can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Masters can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Masters can delete roles" ON public.user_roles;

-- Política INSERT: Masters podem criar roles para outros usuários (não para si mesmos)
CREATE POLICY "Masters can insert roles for other users" 
ON public.user_roles 
FOR INSERT 
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'master'::app_role) 
  AND user_id != auth.uid()  -- Não pode criar role para si mesmo
);

-- Política UPDATE: Masters podem atualizar roles de não-masters apenas
CREATE POLICY "Masters can update non-master roles" 
ON public.user_roles 
FOR UPDATE 
TO authenticated
USING (
  has_role(auth.uid(), 'master'::app_role) 
  AND user_id != auth.uid()  -- Não pode alterar própria role
)
WITH CHECK (
  has_role(auth.uid(), 'master'::app_role) 
  AND user_id != auth.uid()  -- Não pode alterar própria role
  AND role != 'master'::app_role  -- Não pode promover ninguém a master
);

-- Política DELETE: Masters podem remover roles de não-masters apenas
CREATE POLICY "Masters can delete non-master roles" 
ON public.user_roles 
FOR DELETE 
TO authenticated
USING (
  has_role(auth.uid(), 'master'::app_role) 
  AND user_id != auth.uid()  -- Não pode deletar própria role
  AND role != 'master'::app_role  -- Não pode remover role master de outros
);