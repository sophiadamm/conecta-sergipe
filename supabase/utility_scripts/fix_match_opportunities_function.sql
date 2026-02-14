-- ============================================
-- CORREÇÃO DA FUNÇÃO match_opportunities
-- ============================================
-- Execute este SQL no Supabase SQL Editor para corrigir a função
-- e permitir que ela retorne vazio quando não houver embeddings
-- (ao invés de quebrar com erro)

DROP FUNCTION IF EXISTS public.match_opportunities(uuid, vector, int);

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

-- ============================================
-- TESTE A FUNÇÃO
-- ============================================
-- Substitua 'SEU_PROFILE_ID_AQUI' pelo ID real de um perfil
-- SELECT * FROM match_opportunities('SEU_PROFILE_ID_AQUI'::uuid, NULL, 5);
