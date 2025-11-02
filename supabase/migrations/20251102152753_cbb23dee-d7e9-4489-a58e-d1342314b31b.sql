-- Passo 1: Extrair número do título e preencher coluna number
UPDATE prompts
SET number = (regexp_match(title, 'Prompt #(\d+)'))[1]::integer
WHERE number IS NULL 
  AND title ~ 'Prompt #\d+';

-- Passo 2: Para prompts sem número no título, gerar número sequencial baseado em created_at
WITH numbered_prompts AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (ORDER BY created_at DESC) as row_num
  FROM prompts
  WHERE number IS NULL
)
UPDATE prompts
SET number = np.row_num
FROM numbered_prompts np
WHERE prompts.id = np.id;

-- Passo 3: Tornar coluna number obrigatória (NOT NULL)
ALTER TABLE prompts 
ALTER COLUMN number SET NOT NULL;