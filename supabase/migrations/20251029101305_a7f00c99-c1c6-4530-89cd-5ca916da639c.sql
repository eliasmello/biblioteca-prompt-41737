-- Adicionar role master ao primeiro usuário do sistema
-- Este é o bootstrap inicial para permitir gestão de usuários via interface

INSERT INTO public.user_roles (user_id, role)
VALUES ('f970195f-9a4f-456e-8d13-468ce2c31b63', 'master'::app_role)
ON CONFLICT (user_id, role) DO NOTHING;