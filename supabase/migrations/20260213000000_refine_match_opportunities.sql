-- ============================================
-- REFINAMENTO DA FUNÇÃO match_opportunities
-- ============================================
-- Mudanças:
-- 1. Localização como filtro obrigatório (WHERE) ao invés de bônus
-- 2. Bônus de 0.1 por skill exata (interseção entre skills do perfil e skills requeridas)
-- 3. Score final = 100% similaridade semântica + bônus de skill (máximo 1.0)

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
  -- Carrega locations, skills e embedding armazenado do perfil
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
    -- Location bonus mantido como 0.0 para compatibilidade (não usado mais no score)
    0.0::double precision AS location_bonus,
    -- Bônus de skill exata: 0.1 se houver interseção entre skills do perfil e skills requeridas
    CASE
      WHEN v_skills IS NOT NULL
           AND opp.skills_required IS NOT NULL
           AND (
             -- Converte strings separadas por vírgula em arrays e verifica sobreposição
             string_to_array(lower(trim(v_skills)), ',') && 
             string_to_array(lower(trim(opp.skills_required)), ',')
           )
      THEN 0.1::double precision
      ELSE 0.0::double precision
    END AS skill_bonus,
    -- Score final: 100% similaridade semântica + bônus de skill (máximo 1.0)
    LEAST(
      (1 - (opp.embedding <=> v_query_embedding))
      +
      CASE
        WHEN v_skills IS NOT NULL
             AND opp.skills_required IS NOT NULL
             AND (
               string_to_array(lower(trim(v_skills)), ',') && 
               string_to_array(lower(trim(opp.skills_required)), ',')
             )
        THEN 0.1::double precision
        ELSE 0.0::double precision
      END,
      1.0::double precision
    ) AS score
  FROM public.opportunities AS opp
  JOIN public.profiles AS ong ON ong.id = opp.ong_id
  WHERE
    opp.ativa = true
    AND opp.embedding IS NOT NULL
    -- FILTRO OBRIGATÓRIO: Localização da oportunidade deve estar na lista de cidades do voluntário
    -- Aplica o filtro apenas se ambos (voluntário e oportunidade) têm localização definida
    AND (
      -- Se o voluntário não tem locations definidas OU a oportunidade não tem location,
      -- permite passar (para não excluir resultados válidos quando dados estão incompletos)
      (v_locations IS NULL OR array_length(v_locations, 1) IS NULL OR opp.location IS NULL)
      OR
      -- Caso contrário, a location da oportunidade DEVE estar no array de locations do voluntário (case-insensitive)
      EXISTS (
        SELECT 1
        FROM unnest(v_locations) AS loc
        WHERE lower(trim(loc)) = lower(trim(opp.location))
      )
    )
  ORDER BY score DESC
  LIMIT p_limit;
END;
$$;

-- ============================================
-- COMENTÁRIOS SOBRE A FUNÇÃO
-- ============================================
-- Score Final:
--   semantic_score = 1 - (opp.embedding <=> query_embedding)  -- similaridade cosseno (0..1)
--   skill_bonus = 0.1 se houver interseção exata de skills, senão 0.0
--   score = LEAST(semantic_score + skill_bonus, 1.0)
--
-- Filtros:
--   - Oportunidade deve estar ativa (ativa = true)
--   - Oportunidade deve ter embedding
--   - Localização da oportunidade DEVE estar na lista de cidades do voluntário (filtro obrigatório)
--
-- Nota: Se o voluntário não tem locations definidas OU a oportunidade não tem location,
--       o filtro de localização é ignorado para não excluir resultados válidos.
