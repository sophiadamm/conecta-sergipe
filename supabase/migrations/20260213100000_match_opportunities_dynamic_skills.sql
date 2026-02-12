-- ============================================
-- match_opportunities: bônus proporcional e penalidade por skills
-- ============================================
-- Regras:
-- 1. Bônus = 0.1 * (quantidade de skills em comum)
-- 2. Penalidade -0.1 quando interseção de skills for zero
-- 3. Score final = (Similaridade Semântica) + (Contagem_Skills * 0.1) - (0.1 se 0 skills, senão 0)
-- 4. Score limitado a [0, 1] com GREATEST(0, LEAST(1, score))
-- 5. Filtro obrigatório de localização mantido

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
  skill_bonus double precision,
  score double precision
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_locations text[];
  v_skills text;
  v_stored_embedding vector(384);
  v_query_embedding vector(384);
BEGIN
  SELECT
    COALESCE(prof.locations, ARRAY[]::text[]),
    prof.skills,
    prof.embedding
  INTO
    v_locations,
    v_skills,
    v_stored_embedding
  FROM public.profiles AS prof
  WHERE prof.id = p_user_id;

  v_query_embedding := COALESCE(p_user_embedding, v_stored_embedding);

  IF v_query_embedding IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  WITH opp_semantic AS (
    SELECT
      opp.id,
      opp.titulo,
      opp.descricao,
      opp.skills_required,
      opp.horas_estimadas,
      opp.location,
      opp.ong_id,
      ong.nome AS ong_nome,
      (1 - (opp.embedding <=> v_query_embedding)) AS semantic_score,
      -- Contagem de skills em comum (strings separadas por vírgula; trim e case-insensitive)
      (
        SELECT count(*)::int
        FROM (
          SELECT lower(trim(s)) AS skill
          FROM unnest(string_to_array(COALESCE(v_skills, ''), ',')) AS s
          INTERSECT
          SELECT lower(trim(s))
          FROM unnest(string_to_array(COALESCE(opp.skills_required, ''), ',')) AS s
        ) common_skills(skill)
        WHERE common_skills.skill <> ''
      ) AS common_skills_count
    FROM public.opportunities AS opp
    JOIN public.profiles AS ong ON ong.id = opp.ong_id
    WHERE
      opp.ativa = true
      AND opp.embedding IS NOT NULL
      AND (
        (v_locations IS NULL OR array_length(v_locations, 1) IS NULL OR opp.location IS NULL)
        OR
        EXISTS (
          SELECT 1
          FROM unnest(v_locations) AS loc
          WHERE lower(trim(loc)) = lower(trim(opp.location))
        )
      )
  )
  SELECT
    o.id,
    o.titulo,
    o.descricao,
    o.skills_required,
    o.horas_estimadas,
    o.location,
    o.ong_id,
    o.ong_nome,
    o.semantic_score,
    0.0::double precision AS location_bonus,
    -- Bônus proporcional: 0.1 por skill em comum
    (o.common_skills_count * 0.1)::double precision AS skill_bonus,
    -- Score final: semântica + (common_skills_count * 0.1) - (0.1 se 0 skills, senão 0); limitado [0, 1]
    GREATEST(
      0.0,
      LEAST(
        1.0,
        o.semantic_score
          + (o.common_skills_count * 0.1)
          - CASE WHEN o.common_skills_count = 0 THEN 0.1 ELSE 0.0 END
      )
    )::double precision AS score
  FROM opp_semantic o
  ORDER BY score DESC
  LIMIT p_limit;
END;
$$;

-- Comentários
COMMENT ON FUNCTION public.match_opportunities(uuid, vector, int) IS
'Recomenda oportunidades por similaridade semântica + bônus/penalidade por hard skills. '
'Bônus = 0.1 * nº de skills em comum. Penalidade -0.1 quando zero skills em comum. '
'Score final em [0,1]. Filtro obrigatório: location da vaga deve estar em profiles.locations.';
