-- Renumerar todos os prompts sequencialmente a partir de 1
-- Ordenado por created_at (mais antigo = número menor)
WITH renumbered AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (ORDER BY created_at ASC) as new_number
  FROM prompts
)
UPDATE prompts
SET number = renumbered.new_number
FROM renumbered
WHERE prompts.id = renumbered.id;