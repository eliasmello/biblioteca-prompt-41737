-- Corrigir o perfil do eliasmello para master
UPDATE public.profiles 
SET role = 'master', name = 'Elias Mello'
WHERE id IN (
  SELECT id FROM auth.users 
  WHERE email = 'eliasmello@ateliedepropaganda.com.br'
);

-- Verificar se o trigger está funcionando corretamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.set_master_user();