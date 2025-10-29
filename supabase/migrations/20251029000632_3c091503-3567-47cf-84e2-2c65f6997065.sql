-- FASE 1: Criar Sistema de Roles Seguro

-- 1. Criar enum para roles
CREATE TYPE public.app_role AS ENUM ('user', 'admin', 'master');

-- 2. Criar tabela de roles separada
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    UNIQUE (user_id, role)
);

-- 3. Habilitar RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. Criar função de segurança para checar roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 5. Criar função auxiliar para obter role primária do usuário
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  ORDER BY 
    CASE role
      WHEN 'master' THEN 1
      WHEN 'admin' THEN 2
      WHEN 'user' THEN 3
    END
  LIMIT 1
$$;

-- 6. Migrar roles existentes da tabela profiles
INSERT INTO public.user_roles (user_id, role, created_at)
SELECT id, role::app_role, created_at
FROM public.profiles
WHERE role IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- 7. Criar políticas RLS para user_roles
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Masters can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'master'));

CREATE POLICY "Masters can manage roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'master'));

-- 8. Atualizar trigger handle_new_user para criar role padrão
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Inserir perfil
  INSERT INTO public.profiles (id, name, display_name, email, is_active)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email,
    true
  )
  ON CONFLICT (id) DO NOTHING;
  
  -- Inserir role padrão (ou a role especificada no metadata)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'user'::app_role)
  )
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- FASE 2: Atualizar políticas de user_invitations para usar nova estrutura

-- Remover políticas antigas que dependem da coluna role em profiles
DROP POLICY IF EXISTS "Master users can create invitations" ON public.user_invitations;
DROP POLICY IF EXISTS "Master users can delete invitations" ON public.user_invitations;
DROP POLICY IF EXISTS "Master users can update invitations" ON public.user_invitations;
DROP POLICY IF EXISTS "Master users can view all invitations" ON public.user_invitations;
DROP POLICY IF EXISTS "Anyone can view invitation by token" ON public.user_invitations;

-- Criar políticas seguras usando has_role
CREATE POLICY "Masters can view all invitations"
  ON public.user_invitations FOR SELECT
  USING (public.has_role(auth.uid(), 'master'));

CREATE POLICY "Masters can manage invitations"
  ON public.user_invitations FOR ALL
  USING (public.has_role(auth.uid(), 'master'));

-- FASE 3: Atualizar políticas de user_registrations para usar nova estrutura

-- Remover políticas antigas que dependem da coluna role em profiles
DROP POLICY IF EXISTS "Master users can view all registrations" ON public.user_registrations;
DROP POLICY IF EXISTS "Master users can update registrations" ON public.user_registrations;

-- Criar políticas seguras usando has_role
CREATE POLICY "Masters can view all registrations"
  ON public.user_registrations FOR SELECT
  USING (public.has_role(auth.uid(), 'master'));

CREATE POLICY "Masters can update registrations"
  ON public.user_registrations FOR UPDATE
  USING (public.has_role(auth.uid(), 'master'));

-- FASE 4: Criar função para validar token de convite
CREATE OR REPLACE FUNCTION public.validate_invitation_token(_token TEXT)
RETURNS TABLE (
  id UUID,
  email TEXT,
  name TEXT,
  role TEXT,
  expires_at TIMESTAMPTZ,
  is_valid BOOLEAN
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    id,
    email,
    name,
    role,
    expires_at,
    (used_at IS NULL AND expires_at > NOW()) as is_valid
  FROM public.user_invitations
  WHERE token = _token
  LIMIT 1
$$;