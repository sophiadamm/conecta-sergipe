-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding columns to profiles and opportunities
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS embedding vector(384);

ALTER TABLE public.opportunities
ADD COLUMN IF NOT EXISTS embedding vector(384);

-- Create vector indexes optimized for cosine similarity
-- Note: IVFFLAT requires ANALYZE after loading data for best performance.
CREATE INDEX IF NOT EXISTS profiles_embedding_ivfflat_idx
ON public.profiles
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

CREATE INDEX IF NOT EXISTS opportunities_embedding_ivfflat_idx
ON public.opportunities
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- RPC: match_opportunities
--  - p_user_id: ID do perfil do voluntário (profiles.id)
--  - p_user_embedding: embedding opcional passado pelo cliente; se NULL, usa profiles.embedding
--  - p_limit: número máximo de resultados
--
-- Score final:
--   semantic_similarity = 1 - (o.embedding <=> query_embedding)      -- cosine similarity
--   location_bonus = 0.3 se location da vaga estiver em profiles.locations, senão 0
--   score = 0.7 * semantic_similarity + location_bonus
CREATE OR REPLACE FUNCTION public.match_opportunities(
  p_user_id uuid,
  p_user_embedding vector(384) DEFAULT NULL,
  p_limit int DEFAULT 20
)
RETURNS TABLE (
  id uuid,
  titulo text,
  descricao text,
  skills_required text,
  horas_estimadas integer,
  location text,
  ong_id uuid,
  ong_nome text,
  semantic_score double precision,
  location_bonus double precision,
  score double precision
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_locations text[];
  v_stored_embedding vector(384);
  v_query_embedding vector(384);
BEGIN
  -- Carrega locations e embedding armazenado do perfil
  SELECT
    COALESCE(prof.locations, ARRAY[]::text[]),
    prof.embedding
  INTO
    v_locations,
    v_stored_embedding
  FROM public.profiles AS prof
  WHERE prof.id = p_user_id;

  -- Define o embedding de consulta:
  --  - se p_user_embedding foi passado, usa-o
  --  - caso contrário, usa o embedding armazenado no perfil
  v_query_embedding := COALESCE(p_user_embedding, v_stored_embedding);

  -- Se não houver embedding, retorna vazio (não quebra)
  IF v_query_embedding IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    opp.id,
    opp.titulo,
    opp.descricao,
    opp.skills_required,
    opp.horas_estimadas,
    opp.location,
    opp.ong_id,
    ong.nome AS ong_nome,
    -- Similaridade semântica (0..1, quanto maior melhor)
    (1 - (opp.embedding <=> v_query_embedding)) AS semantic_score,
    -- Bônus de localização (0.3 se location da vaga estiver em profiles.locations)
    CASE
      WHEN opp.location IS NOT NULL
           AND v_locations IS NOT NULL
           AND EXISTS (
             SELECT 1
             FROM unnest(v_locations) AS loc
             WHERE lower(loc) = lower(opp.location)
           )
      THEN 0.3
      ELSE 0.0
    END AS location_bonus,
    -- Score final: 70% semântica + 30% localização
    ((1 - (opp.embedding <=> v_query_embedding)) * 0.7)
      +
    CASE
      WHEN opp.location IS NOT NULL
           AND v_locations IS NOT NULL
           AND EXISTS (
             SELECT 1
             FROM unnest(v_locations) AS loc
             WHERE lower(loc) = lower(opp.location)
           )
      THEN 0.3
      ELSE 0.0
    END AS score
  FROM public.opportunities AS opp
  JOIN public.profiles AS ong ON ong.id = opp.ong_id
  WHERE
    opp.ativa = true
    AND opp.embedding IS NOT NULL
  ORDER BY score DESC
  LIMIT p_limit;
END;
$$;

