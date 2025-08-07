-- Limpar toda a base de dados
-- Remove todos os prompts
DELETE FROM public.prompts;

-- Remove todos os perfis (exceto o master user)
DELETE FROM public.profiles WHERE role != 'master';

-- Reset das sequências se existirem
-- Isso garante que os IDs começem do 1 novamente para campos auto-incrementais