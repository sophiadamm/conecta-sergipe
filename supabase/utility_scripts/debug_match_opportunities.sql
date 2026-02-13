-- Script de Diagnóstico para match_opportunities
-- Execute estas queries uma por uma para identificar o problema

-- 1. Verificar se o perfil existe e tem embedding
SELECT 
  id, 
  nome, 
  tipo,
  skills,
  interests,
  locations,
  CASE 
    WHEN embedding IS NULL THEN 'SEM EMBEDDING'
    ELSE 'COM EMBEDDING'
  END as embedding_status
FROM profiles 
WHERE id = 'e895ae8a-68d4-470d-8c80-bace3237fe54';

-- 2. Verificar quantas oportunidades ativas existem
SELECT 
  COUNT(*) as total_oportunidades,
  COUNT(CASE WHEN embedding IS NOT NULL THEN 1 END) as com_embedding,
  COUNT(CASE WHEN embedding IS NULL THEN 1 END) as sem_embedding
FROM opportunities 
WHERE ativa = true;

-- 3. Ver algumas oportunidades ativas (primeiras 5)
SELECT 
  id,
  titulo,
  skills_required,
  causas,
  location,
  CASE 
    WHEN embedding IS NULL THEN 'SEM EMBEDDING'
    ELSE 'COM EMBEDDING'
  END as embedding_status
FROM opportunities 
WHERE ativa = true
LIMIT 5;

-- 4. Testar a função sem filtro de embedding (para debug)
-- Esta query mostra o que está bloqueando os resultados
SELECT 
  opp.id,
  opp.titulo,
  opp.ativa,
  CASE WHEN opp.embedding IS NULL THEN 'SEM EMBEDDING' ELSE 'COM EMBEDDING' END as opp_embedding,
  prof.nome as voluntario,
  CASE WHEN prof.embedding IS NULL THEN 'SEM EMBEDDING' ELSE 'COM EMBEDDING' END as prof_embedding
FROM opportunities opp
CROSS JOIN profiles prof
WHERE prof.id = 'e895ae8a-68d4-470d-8c80-bace3237fe54'
  AND opp.ativa = true
LIMIT 5;

-- 5. Verificar se há algum problema com a função
-- Tente chamar a função com um embedding fake (só para testar)
SELECT * FROM match_opportunities(
  'e895ae8a-68d4-470d-8c80-bace3237fe54'::uuid,
  NULL,
  10
);

-- 6. Se o problema for falta de embeddings, aqui está como gerar um embedding de teste
-- ATENÇÃO: Isso é só para teste, não use em produção
-- UPDATE profiles 
-- SET embedding = (SELECT embedding FROM profiles WHERE embedding IS NOT NULL LIMIT 1)
-- WHERE id = 'e895ae8a-68d4-470d-8c80-bace3237fe54';

-- 7. Verificar se a coluna interests foi criada corretamente
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles' 
  AND column_name IN ('interests', 'skills', 'embedding', 'locations');
