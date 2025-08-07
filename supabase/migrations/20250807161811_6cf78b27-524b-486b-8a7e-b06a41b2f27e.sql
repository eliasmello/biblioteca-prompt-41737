-- Configurar usuário master específico
UPDATE public.profiles 
SET role = 'master', name = 'Elias Mello'
WHERE id IN (
  SELECT id FROM auth.users 
  WHERE email = 'eliasmello@ateliedepropaganda.com.br'
);

-- Se o usuário não existir ainda, criar um trigger para quando ele se cadastrar
CREATE OR REPLACE FUNCTION public.set_master_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  -- Verificar se é o email do master
  IF NEW.email = 'eliasmello@ateliedepropaganda.com.br' THEN
    -- Atualizar o perfil para master
    UPDATE public.profiles 
    SET role = 'master', name = 'Elias Mello'
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger para verificar novos usuários master
DROP TRIGGER IF EXISTS check_master_user ON auth.users;
CREATE TRIGGER check_master_user
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.set_master_user();