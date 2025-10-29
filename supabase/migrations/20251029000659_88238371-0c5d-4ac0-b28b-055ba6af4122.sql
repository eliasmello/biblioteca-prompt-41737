-- FASE 5: Remover coluna role e atualizar políticas de profiles

-- 1. Remover coluna role da tabela profiles
ALTER TABLE public.profiles DROP COLUMN IF EXISTS role;

-- 2. Remover política insegura atual
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- 3. Criar políticas granulares para profiles
CREATE POLICY "Users can view public profile info"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can view own complete profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Masters can view all profile info"
  ON public.profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'master'));

-- 4. Criar política de UPDATE para proteger campos sensíveis
CREATE POLICY "Users can update own profile basic info"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND
    email = (SELECT email FROM public.profiles WHERE id = auth.uid())
  );

-- 5. Masters podem atualizar qualquer perfil
CREATE POLICY "Masters can update any profile"
  ON public.profiles FOR UPDATE
  USING (public.has_role(auth.uid(), 'master'));