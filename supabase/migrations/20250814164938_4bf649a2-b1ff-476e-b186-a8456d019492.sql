-- Remover perfil incorreto
DELETE FROM public.profiles WHERE id != '43b44b9e-af86-4c4d-9d96-c182d95fc6ff';

-- Inserir ou atualizar o perfil correto para o master user
INSERT INTO public.profiles (id, name, role, is_active)
VALUES ('43b44b9e-af86-4c4d-9d96-c182d95fc6ff', 'Elias Mello', 'master', true)
ON CONFLICT (id) 
DO UPDATE SET 
  name = 'Elias Mello',
  role = 'master',
  is_active = true;