-- Atualizar títulos que seguem o padrão "Prompt #X" para refletir a numeração do banco
UPDATE prompts
SET title = 'Prompt #' || number
WHERE title ~ '^Prompt #\d+$';