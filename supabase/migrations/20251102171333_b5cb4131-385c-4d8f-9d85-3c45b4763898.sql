-- Tornar todos os prompts do administrador públicos
UPDATE prompts 
SET is_public = true 
WHERE created_by = 'f970195f-9a4f-456e-8d13-468ce2c31b63';