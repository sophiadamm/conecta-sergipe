-- Script to apply interests feature to the database
-- Run this script in your Supabase SQL Editor

-- Step 1: Add interests column to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS interests text;

COMMENT ON COLUMN public.profiles.interests IS 'Comma-separated list of interest areas/causes for volunteers (e.g., "Educação, Saúde, Meio Ambiente")';

-- Step 2: Drop existing function to allow signature change
DROP FUNCTION IF EXISTS public.match_opportunities(uuid, vector(384), integer);

-- Step 3: Create enhanced match_opportunities function with interests bonus
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
  skills_bonus double precision,
  interests_bonus double precision,
  score double precision
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_locations text[];
  v_skills text;
  v_interests text;
  v_stored_embedding vector(384);
  v_query_embedding vector(384);
BEGIN
  -- Load profile data: locations, skills, interests, and stored embedding
  SELECT
    COALESCE(prof.locations, ARRAY[]::text[]),
    prof.skills,
    prof.interests,
    prof.embedding
  INTO
    v_locations,
    v_skills,
    v_interests,
    v_stored_embedding
  FROM public.profiles AS prof
  WHERE prof.id = p_user_id;

  -- Determine query embedding: use provided embedding or stored one
  v_query_embedding := COALESCE(p_user_embedding, v_stored_embedding);

  -- If no embedding available, return empty
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
    
    -- Semantic similarity (0..1, higher is better)
    ((1.0 - (opp.embedding <=> v_query_embedding))::double precision) AS semantic_score,
    
    -- Skills bonus: +0.05 per matching skill
    -- Skills penalty: -0.05 if no skills match (skills are critical)
    (CASE
      WHEN v_skills IS NOT NULL AND opp.skills_required IS NOT NULL THEN
        -- Convert CSV strings to arrays and calculate intersection
        GREATEST(
          (
            SELECT COUNT(*)::double precision * 0.05
            FROM unnest(string_to_array(lower(v_skills), ',')) AS user_skill
            WHERE EXISTS (
              SELECT 1
              FROM unnest(string_to_array(lower(opp.skills_required), ',')) AS opp_skill
              WHERE trim(opp_skill) = trim(user_skill)
            )
          ),
          -- Apply penalty if no skills match
          CASE
            WHEN (
              SELECT COUNT(*)
              FROM unnest(string_to_array(lower(v_skills), ',')) AS user_skill
              WHERE EXISTS (
                SELECT 1
                FROM unnest(string_to_array(lower(opp.skills_required), ',')) AS opp_skill
                WHERE trim(opp_skill) = trim(user_skill)
              )
            ) = 0 THEN -0.05::double precision
            ELSE 0.0::double precision
          END
        )
      ELSE 0.0::double precision
    END) AS skills_bonus,
    
    -- Interests bonus: +0.05 per matching interest/cause (no penalty)
    (CASE
      WHEN v_interests IS NOT NULL AND opp.causas IS NOT NULL THEN
        -- Convert interests (CSV) and causas (array) and calculate intersection
        (
          SELECT COALESCE(COUNT(*)::double precision * 0.05, 0.0::double precision)
          FROM unnest(string_to_array(lower(v_interests), ',')) AS user_interest
          WHERE EXISTS (
            SELECT 1
            FROM unnest(opp.causas) AS opp_causa
            WHERE trim(lower(opp_causa)) = trim(user_interest)
          )
        )
      ELSE 0.0::double precision
    END) AS interests_bonus,
    
    -- Final score: semantic + skills + interests (clamped to 0.0-1.0)
    LEAST(1.0::double precision, GREATEST(0.0::double precision,
      (
        ((1.0 - (opp.embedding <=> v_query_embedding))::double precision)
        +
        -- Skills bonus/penalty
        (CASE
          WHEN v_skills IS NOT NULL AND opp.skills_required IS NOT NULL THEN
            GREATEST(
              (
                SELECT COUNT(*)::double precision * 0.05
                FROM unnest(string_to_array(lower(v_skills), ',')) AS user_skill
                WHERE EXISTS (
                  SELECT 1
                  FROM unnest(string_to_array(lower(opp.skills_required), ',')) AS opp_skill
                  WHERE trim(opp_skill) = trim(user_skill)
                )
              ),
              CASE
                WHEN (
                  SELECT COUNT(*)
                  FROM unnest(string_to_array(lower(v_skills), ',')) AS user_skill
                  WHERE EXISTS (
                    SELECT 1
                    FROM unnest(string_to_array(lower(opp.skills_required), ',')) AS opp_skill
                    WHERE trim(opp_skill) = trim(user_skill)
                  )
                ) = 0 THEN -0.10::double precision
                ELSE 0.0::double precision
              END
            )
          ELSE 0.0::double precision
        END)
        +
        -- Interests bonus
        (CASE
          WHEN v_interests IS NOT NULL AND opp.causas IS NOT NULL THEN
            (
              SELECT COALESCE(COUNT(*)::double precision * 0.05, 0.0::double precision)
              FROM unnest(string_to_array(lower(v_interests), ',')) AS user_interest
              WHERE EXISTS (
                SELECT 1
                FROM unnest(opp.causas) AS opp_causa
                WHERE trim(lower(opp_causa)) = trim(user_interest)
              )
            )
          ELSE 0.0::double precision
        END)
      )::double precision
    ))::double precision AS score
  FROM public.opportunities AS opp
  JOIN public.profiles AS ong ON ong.id = opp.ong_id
  WHERE
    opp.ativa = true
    AND opp.embedding IS NOT NULL
    -- Hard filter: location must match user's locations (if both are specified)
    AND (
      v_locations IS NULL 
      OR opp.location IS NULL 
      OR EXISTS (
        SELECT 1
        FROM unnest(v_locations) AS loc
        WHERE lower(loc) = lower(opp.location)
      )
    )
  ORDER BY score DESC
  LIMIT p_limit;
END;
$$;

COMMENT ON FUNCTION public.match_opportunities(uuid, vector(384), int) IS 
'Enhanced matching function that ranks opportunities based on:
- Semantic similarity (vector embedding) - base score 0-1
- Skills match (+0.05 per skill, -0.10 penalty if no match)
- Interests match (+0.05 per matching cause/interest)
- Hard location filter: only returns opportunities in user''s locations
- Final score clamped to 0.0-1.0 range';
