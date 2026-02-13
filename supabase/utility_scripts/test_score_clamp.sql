-- Script de Teste: Verificar Clamp do Score (0.0 - 1.0)

-- Teste 1: Verificar que scores não ultrapassam 1.0
SELECT 
  titulo,
  ROUND(semantic_score::numeric, 3) as semantic,
  ROUND(skills_bonus::numeric, 3) as skills,
  ROUND(interests_bonus::numeric, 3) as interests,
  ROUND(location_bonus::numeric, 3) as location,
  ROUND((semantic_score + skills_bonus + interests_bonus + location_bonus)::numeric, 3) as raw_score,
  ROUND(score::numeric, 3) as final_score,
  CASE 
    WHEN score > 1.0 THEN '❌ ERRO: Score > 1.0'
    WHEN score < 0.0 THEN '❌ ERRO: Score < 0.0'
    ELSE '✅ OK'
  END as validation
FROM match_opportunities(
  'e895ae8a-68d4-470d-8c80-bace3237fe54'::uuid,
  NULL,
  20
)
ORDER BY score DESC;

-- Teste 2: Estatísticas do score
SELECT 
  COUNT(*) as total_vagas,
  ROUND(MIN(score)::numeric, 3) as min_score,
  ROUND(MAX(score)::numeric, 3) as max_score,
  ROUND(AVG(score)::numeric, 3) as avg_score,
  COUNT(CASE WHEN score = 1.0 THEN 1 END) as perfect_matches,
  COUNT(CASE WHEN score >= 0.8 THEN 1 END) as high_matches,
  COUNT(CASE WHEN score >= 0.5 THEN 1 END) as medium_matches,
  COUNT(CASE WHEN score < 0.5 THEN 1 END) as low_matches
FROM match_opportunities(
  'e895ae8a-68d4-470d-8c80-bace3237fe54'::uuid,
  NULL,
  100
);

-- Teste 3: Verificar que o clamp está funcionando
-- (comparar score bruto vs score final)
WITH raw_calculations AS (
  SELECT 
    titulo,
    semantic_score,
    skills_bonus,
    interests_bonus,
    location_bonus,
    (semantic_score + skills_bonus + interests_bonus + location_bonus) as raw_score,
    score as final_score
  FROM match_opportunities(
    'e895ae8a-68d4-470d-8c80-bace3237fe54'::uuid,
    NULL,
    20
  )
)
SELECT 
  titulo,
  ROUND(raw_score::numeric, 3) as raw,
  ROUND(final_score::numeric, 3) as final,
  CASE 
    WHEN raw_score > 1.0 AND final_score = 1.0 THEN '✅ Clamped to 1.0'
    WHEN raw_score < 0.0 AND final_score = 0.0 THEN '✅ Clamped to 0.0'
    WHEN raw_score = final_score THEN '➖ No clamp needed'
    ELSE '❌ Unexpected'
  END as clamp_status
FROM raw_calculations
ORDER BY raw_score DESC;

-- Teste 4: Distribuição de scores
SELECT 
  CASE 
    WHEN score >= 0.9 THEN '90-100%'
    WHEN score >= 0.8 THEN '80-89%'
    WHEN score >= 0.7 THEN '70-79%'
    WHEN score >= 0.6 THEN '60-69%'
    WHEN score >= 0.5 THEN '50-59%'
    WHEN score >= 0.4 THEN '40-49%'
    WHEN score >= 0.3 THEN '30-39%'
    WHEN score >= 0.2 THEN '20-29%'
    WHEN score >= 0.1 THEN '10-19%'
    ELSE '0-9%'
  END as score_range,
  COUNT(*) as count,
  ROUND(AVG(score)::numeric, 3) as avg_in_range
FROM match_opportunities(
  'e895ae8a-68d4-470d-8c80-bace3237fe54'::uuid,
  NULL,
  100
)
GROUP BY score_range
ORDER BY score_range DESC;

-- Teste 5: Vagas que teriam ultrapassado 1.0 sem clamp
WITH raw_calculations AS (
  SELECT 
    titulo,
    ong_nome,
    (semantic_score + skills_bonus + interests_bonus + location_bonus) as raw_score,
    score as final_score,
    semantic_score,
    skills_bonus,
    interests_bonus,
    location_bonus
  FROM match_opportunities(
    'e895ae8a-68d4-470d-8c80-bace3237fe54'::uuid,
    NULL,
    100
  )
)
SELECT 
  titulo,
  ong_nome,
  ROUND(semantic_score::numeric, 2) as semantic,
  ROUND(skills_bonus::numeric, 2) as skills,
  ROUND(interests_bonus::numeric, 2) as interests,
  ROUND(location_bonus::numeric, 2) as location,
  ROUND(raw_score::numeric, 3) as would_be,
  ROUND(final_score::numeric, 3) as actual,
  '✅ Prevented overflow' as status
FROM raw_calculations
WHERE raw_score > 1.0
ORDER BY raw_score DESC;
