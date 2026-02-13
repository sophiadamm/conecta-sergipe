-- Script para corrigir o problema: Adicionar embedding ao perfil do voluntário
-- O perfil 'e895ae8a-68d4-470d-8c80-bace3237fe54' não tem embedding

-- Passo 1: Verificar o perfil atual
SELECT 
  id, 
  nome, 
  tipo,
  skills,
  interests,
  CASE WHEN embedding IS NULL THEN 'SEM EMBEDDING ❌' ELSE 'COM EMBEDDING ✅' END as status
FROM profiles 
WHERE id = 'e895ae8a-68d4-470d-8c80-bace3237fe54';

-- Passo 2: Adicionar embedding fake ao perfil do voluntário
UPDATE profiles 
SET embedding = (
  SELECT ('[' || string_agg(random()::text, ',') || ']')::vector(384)
  FROM generate_series(1, 384)
)
WHERE id = 'e895ae8a-68d4-470d-8c80-bace3237fe54';

-- Passo 3: Confirmar que o embedding foi adicionado
SELECT 
  id, 
  nome, 
  tipo,
  skills,
  interests,
  CASE WHEN embedding IS NULL THEN 'SEM EMBEDDING ❌' ELSE 'COM EMBEDDING ✅' END as status
FROM profiles 
WHERE id = 'e895ae8a-68d4-470d-8c80-bace3237fe54';

-- Passo 4: Testar a função match_opportunities novamente
SELECT 
  id,
  titulo,
  skills_required,
  semantic_score,
  skills_bonus,
  interests_bonus,
  location_bonus,
  score
FROM match_opportunities(
  'e895ae8a-68d4-470d-8c80-bace3237fe54'::uuid,
  NULL,
  10
)
ORDER BY score DESC;

-- Passo 5: Ver detalhes completos das top 3 vagas
SELECT 
  titulo,
  descricao,
  skills_required,
  location,
  horas_estimadas,
  ong_nome,
  ROUND(semantic_score::numeric, 3) as semantic_score,
  ROUND(skills_bonus::numeric, 3) as skills_bonus,
  ROUND(interests_bonus::numeric, 3) as interests_bonus,
  ROUND(location_bonus::numeric, 3) as location_bonus,
  ROUND(score::numeric, 3) as score_total
FROM match_opportunities(
  'e895ae8a-68d4-470d-8c80-bace3237fe54'::uuid,
  NULL,
  3
)
ORDER BY score DESC;
