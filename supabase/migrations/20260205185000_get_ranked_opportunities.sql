-- Adicionar colunas necessárias se não existirem
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS municipio TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cause TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS disponibilidade TEXT;

ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS municipio TEXT;
ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS cause TEXT;
ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS disponibilidade TEXT;

-- Função principal de busca ranqueada
CREATE OR REPLACE FUNCTION get_ranked_opportunities(
  p_query TEXT DEFAULT '',
  p_category TEXT DEFAULT 'all'
)
RETURNS TABLE (
  id UUID,
  titulo TEXT,
  descricao TEXT,
  horas_estimadas INTEGER,
  skills_required TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  ong_id UUID,
  ong_nome TEXT,
  ong_avatar_url TEXT,
  compatibility_score NUMERIC,
  match_explanation TEXT
) AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_user_skills TEXT[];
  v_user_cause TEXT;
  v_user_disponibilidade TEXT;
  v_user_municipio TEXT;
BEGIN
  -- Buscar dados do perfil do voluntário logado
  IF v_user_id IS NOT NULL THEN
    SELECT 
      string_to_array(skills, ','), 
      cause, 
      disponibilidade, 
      municipio 
    INTO 
      v_user_skills, 
      v_user_cause, 
      v_user_disponibilidade, 
      v_user_municipio
    FROM public.profiles 
    WHERE user_id = v_user_id;
  END IF;

  RETURN QUERY
  WITH opportunity_scores AS (
    SELECT 
      o.id,
      o.titulo,
      o.descricao,
      o.horas_estimadas,
      o.skills_required,
      o.created_at,
      p.id AS ong_id,
      p.nome AS ong_nome,
      p.avatar_url AS ong_avatar_url,
      -- 1. Skill overlap (40%)
      COALESCE(
        (
          SELECT COUNT(*)::NUMERIC 
          FROM unnest(string_to_array(o.skills_required, ',')) AS s 
          WHERE trim(s) = ANY(v_user_skills)
        ) / 
        NULLIF(array_length(string_to_array(o.skills_required, ','), 1), 0), 
        0
      ) * 40 AS skill_score,
      -- 2. Cause/area match (25%)
      CASE 
        WHEN (o.cause = v_user_cause AND v_user_cause IS NOT NULL) THEN 25 
        WHEN (o.cause ILIKE ANY(v_user_skills) AND v_user_cause IS NULL) THEN 15
        ELSE 0 
      END AS cause_score,
      -- 3. Availability match (15%)
      CASE 
        WHEN (o.disponibilidade = v_user_disponibilidade AND v_user_disponibilidade IS NOT NULL) THEN 15 
        ELSE 0 
      END AS availability_score,
      -- 4. Proximity (10%)
      CASE 
        WHEN (o.municipio = v_user_municipio AND v_user_municipio IS NOT NULL) THEN 10 
        WHEN (o.municipio IS NOT NULL AND v_user_municipio IS NOT NULL AND o.municipio ILIKE v_user_municipio) THEN 10
        ELSE 0 
      END AS proximity_score,
      -- 5. Recency (10%) - Decaimento linear em 30 dias
      GREATEST(0, 10 * (1 - EXTRACT(DAY FROM (now() - o.created_at)) / 30.0)) AS recency_score
    FROM public.opportunities o
    JOIN public.profiles p ON o.ong_id = p.id
    WHERE o.ativa = true
      AND (
        p_query = '' 
        OR o.titulo ILIKE '%' || p_query || '%' 
        OR o.descricao ILIKE '%' || p_query || '%'
        OR o.skills_required ILIKE '%' || p_query || '%'
      )
      AND (
        p_category = 'all' 
        OR o.cause = p_category 
        OR o.skills_required ILIKE '%' || p_category || '%'
      )
  )
  SELECT 
    os.id,
    os.titulo,
    os.descricao,
    os.horas_estimadas,
    os.skills_required,
    os.created_at,
    os.ong_id,
    os.ong_nome,
    os.ong_avatar_url,
    ROUND(os.skill_score + os.cause_score + os.availability_score + os.proximity_score + os.recency_score) AS compatibility_score,
    -- Match explanation
    COALESCE(
      (
        SELECT string_agg(part, ' • ') 
        FROM (
          SELECT (v_count || ' habilidades em comum') AS part
          FROM (
            SELECT count(*) as v_count 
            FROM unnest(string_to_array(os.skills_required, ',')) AS s 
            WHERE trim(s) = ANY(v_user_skills)
          ) t
          WHERE v_count > 0
          UNION ALL
          SELECT 'perto de você' WHERE os.proximity_score > 0
          UNION ALL
          SELECT 'disponibilidade compatível' WHERE os.availability_score > 0
          UNION ALL
          SELECT 'área de interesse' WHERE os.cause_score > 0
          UNION ALL
          SELECT 'oportunidade recente' WHERE os.recency_score > 8
        ) sub
      ),
      'Oportunidade recomendada'
    ) AS match_explanation
  FROM opportunity_scores os
  ORDER BY compatibility_score DESC, os.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
