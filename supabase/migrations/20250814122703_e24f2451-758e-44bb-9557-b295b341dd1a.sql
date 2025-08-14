-- Corrigir as políticas RLS para separar prompts públicos (sistema) dos prompts pessoais

-- Remover as políticas atuais
DROP POLICY IF EXISTS "Users can view public prompts or own prompts" ON public.prompts;
DROP POLICY IF EXISTS "Users can create prompts" ON public.prompts;
DROP POLICY IF EXISTS "Users can update own prompts or master can update public" ON public.prompts;
DROP POLICY IF EXISTS "Users can delete own prompts or master can delete public" ON public.prompts;

-- Criar novas políticas com regras claras:

-- 1. VISUALIZAÇÃO: Todos podem ver prompts públicos OU seus próprios prompts privados
CREATE POLICY "Users can view public prompts or own private prompts" 
ON public.prompts 
FOR SELECT 
USING (
  (is_public = true) OR 
  (is_public = false AND auth.uid() = created_by)
);

-- 2. CRIAÇÃO: Qualquer usuário autenticado pode criar prompts
-- Por padrão, prompts criados por usuários normais são privados (is_public = false)
-- Apenas Master pode criar prompts públicos
CREATE POLICY "Users can create prompts" 
ON public.prompts 
FOR INSERT 
WITH CHECK (
  auth.uid() = created_by AND
  (
    -- Usuários normais só podem criar prompts privados
    (is_public = false) OR
    -- Apenas Master pode criar prompts públicos
    (is_public = true AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'master'
    ))
  )
);

-- 3. ATUALIZAÇÃO: 
-- - Usuários podem editar apenas seus próprios prompts privados
-- - Master pode editar qualquer prompt público
CREATE POLICY "Users can update own private prompts or master can update public" 
ON public.prompts 
FOR UPDATE 
USING (
  -- Próprios prompts privados
  (auth.uid() = created_by AND is_public = false) OR
  -- Master pode editar prompts públicos
  (is_public = true AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'master'
  ))
);

-- 4. EXCLUSÃO:
-- - Usuários podem deletar apenas seus próprios prompts privados  
-- - Master pode deletar qualquer prompt público
CREATE POLICY "Users can delete own private prompts or master can delete public" 
ON public.prompts 
FOR DELETE 
USING (
  -- Próprios prompts privados
  (auth.uid() = created_by AND is_public = false) OR
  -- Master pode deletar prompts públicos
  (is_public = true AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'master'
  ))
);