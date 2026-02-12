
CREATE OR REPLACE FUNCTION public.match_opportunities(p_user_id uuid, p_user_embedding vector DEFAULT NULL::vector, p_limit integer DEFAULT 20)
 RETURNS TABLE(id uuid, titulo text, descricao text, skills_required text, horas_estimadas integer, location text, ong_id uuid, ong_nome text, semantic_score double precision, location_bonus double precision, score double precision)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
DECLARE
  v_locations text[];
  v_stored_embedding vector(384);
  v_query_embedding vector(384);
BEGIN
  SELECT
    COALESCE(prof.locations, ARRAY[]::text[]),
    prof.embedding
  INTO
    v_locations,
    v_stored_embedding
  FROM public.profiles AS prof
  WHERE prof.id = p_user_id;

  v_query_embedding := COALESCE(p_user_embedding, v_stored_embedding);

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
    (1 - (opp.embedding <=> v_query_embedding))::double precision AS semantic_score,
    (CASE
      WHEN opp.location IS NOT NULL
           AND v_locations IS NOT NULL
           AND EXISTS (
             SELECT 1
             FROM unnest(v_locations) AS loc
             WHERE lower(loc) = lower(opp.location)
           )
      THEN 0.3
      ELSE 0.0
    END)::double precision AS location_bonus,
    (((1 - (opp.embedding <=> v_query_embedding)) * 0.7)
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
    END)::double precision AS score
  FROM public.opportunities AS opp
  JOIN public.profiles AS ong ON ong.id = opp.ong_id
  WHERE
    opp.ativa = true
    AND opp.embedding IS NOT NULL
  ORDER BY score DESC
  LIMIT p_limit;
END;
$function$;
