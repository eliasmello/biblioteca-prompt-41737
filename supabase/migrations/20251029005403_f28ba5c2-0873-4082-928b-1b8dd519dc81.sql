-- Remove duplicate prompts, keeping only the most recent one for each unique content
WITH duplicates AS (
  SELECT 
    id,
    content,
    created_at,
    ROW_NUMBER() OVER (PARTITION BY content ORDER BY created_at DESC) as rn
  FROM prompts
)
DELETE FROM prompts
WHERE id IN (
  SELECT id 
  FROM duplicates 
  WHERE rn > 1
);