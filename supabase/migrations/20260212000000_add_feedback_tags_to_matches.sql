-- Tags de qualidade: ONG atribui ao voluntário / voluntário atribui à ONG
ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS tags_ong text[] DEFAULT '{}';

ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS tags_voluntario text[] DEFAULT '{}';

COMMENT ON COLUMN public.matches.tags_ong IS 'Tags que a ONG atribuiu ao voluntário (ex: Pontualidade, Proatividade).';
COMMENT ON COLUMN public.matches.tags_voluntario IS 'Tags que o voluntário atribuiu à ONG/experiência (ex: Organização, Acolhimento).';
