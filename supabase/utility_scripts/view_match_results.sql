-- Query Completa: Match com Causas
-- Esta query faz JOIN para mostrar as causas das oportunidades

-- Versão 1: Simples (só os campos retornados pela função)
SELECT 
  titulo,
  skills_required,
  location,
  ROUND(semantic_score::numeric, 3) as semantic,
  ROUND(skills_bonus::numeric, 3) as skills,
  ROUND(interests_bonus::numeric, 3) as interests,
  ROUND(location_bonus::numeric, 3) as loc,
  ROUND(score::numeric, 3) as total
FROM match_opportunities(
  'e895ae8a-68d4-470d-8c80-bace3237fe54'::uuid,
  NULL,
  10
)
ORDER BY score DESC;

-- Versão 2: Completa (com JOIN para pegar as causas)
SELECT 
  m.titulo,
  m.skills_required,
  o.causas,  -- ← Agora vem da tabela opportunities
  m.location,
  m.horas_estimadas,
  m.ong_nome,
  ROUND(m.semantic_score::numeric, 3) as semantic,
  ROUND(m.skills_bonus::numeric, 3) as skills,
  ROUND(m.interests_bonus::numeric, 3) as interests,
  ROUND(m.location_bonus::numeric, 3) as loc,
  ROUND(m.score::numeric, 3) as total
FROM match_opportunities(
  'e895ae8a-68d4-470d-8c80-bace3237fe54'::uuid,
  NULL,
  10
) m
JOIN opportunities o ON o.id = m.id
ORDER BY m.score DESC;

-- Versão 3: Detalhada (mostra explicação do match)
SELECT 
  m.titulo,
  m.ong_nome,
  o.causas,
  m.skills_required,
  m.location,
  ROUND(m.score::numeric, 3) as score_total,
  CASE 
    WHEN m.skills_bonus > 0 THEN '✅ Skills Match'
    WHEN m.skills_bonus < 0 THEN '❌ No Skills Match'
    ELSE '➖ Sem Skills'
  END as skills_status,
  CASE 
    WHEN m.interests_bonus > 0 THEN '💚 Interesse Match (' || ROUND(m.interests_bonus::numeric, 1) || ')'
    ELSE '➖ Sem Match de Interesse'
  END as interests_status,
  CASE 
    WHEN m.location_bonus > 0 THEN '📍 Localização Match'
    ELSE '➖ Localização Diferente'
  END as location_status
FROM match_opportunities(
  'e895ae8a-68d4-470d-8c80-bace3237fe54'::uuid,
  NULL,
  10
) m
JOIN opportunities o ON o.id = m.id
ORDER BY m.score DESC;

-- Versão 4: Comparação (ver perfil do voluntário vs vagas)
WITH volunteer_profile AS (
  SELECT 
    nome,
    skills,
    interests,
    locations
  FROM profiles
  WHERE id = 'e895ae8a-68d4-470d-8c80-bace3237fe54'
)
SELECT 
  '🧑 VOLUNTÁRIO' as tipo,
  v.nome as titulo,
  v.skills as skills_required,
  ARRAY[v.interests]::text[] as causas,
  array_to_string(v.locations, ', ') as location,
  NULL::numeric as score
FROM volunteer_profile v
UNION ALL
SELECT 
  '💼 VAGA #' || ROW_NUMBER() OVER (ORDER BY m.score DESC) as tipo,
  m.titulo,
  m.skills_required,
  o.causas,
  m.location,
  ROUND(m.score::numeric, 2) as score
FROM match_opportunities(
  'e895ae8a-68d4-470d-8c80-bace3237fe54'::uuid,
  NULL,
  5
) m
JOIN opportunities o ON o.id = m.id
ORDER BY score DESC NULLS FIRST;
