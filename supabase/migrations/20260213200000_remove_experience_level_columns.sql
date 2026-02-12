-- Remove "Nível de Experiência" (experience level) from Conecta Sergipe.
-- Run this migration manually when ready. Frontend no longer references these columns.

-- profiles: remove experience_level
ALTER TABLE public.profiles
  DROP COLUMN IF EXISTS experience_level;

-- opportunities: remove nivel_experiencia
ALTER TABLE public.opportunities
  DROP COLUMN IF EXISTS nivel_experiencia;
