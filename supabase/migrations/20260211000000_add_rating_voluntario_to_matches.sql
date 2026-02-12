-- Adiciona coluna para nota que o voluntário dá à ONG/experiência (avaliação reversa).
-- Par completo: (rating_voluntario + feedback_voluntario) vs (rating + feedback_ong).
ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS rating_voluntario INTEGER CHECK (rating_voluntario >= 1 AND rating_voluntario <= 5);

COMMENT ON COLUMN public.matches.rating_voluntario IS 'Nota de 1 a 5 que o voluntário dá à ONG/experiência.';
