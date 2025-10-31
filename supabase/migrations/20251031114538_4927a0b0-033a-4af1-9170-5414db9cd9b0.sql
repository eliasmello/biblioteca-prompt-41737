-- Criar função segura para validação de tokens de convite
-- Isso evita expor todos os tokens via queries diretas
CREATE OR REPLACE FUNCTION public.validate_invitation_token(_token text)
RETURNS TABLE(
  id uuid,
  email text,
  name text,
  role text,
  expires_at timestamp with time zone,
  is_valid boolean
)
LANGUAGE sql
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
  LIMIT 1;
$$;