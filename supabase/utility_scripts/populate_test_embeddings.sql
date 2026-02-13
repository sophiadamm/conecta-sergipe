-- Script para Popular Dados de Teste com Embeddings
-- Use este script se o diagnóstico mostrar que faltam embeddings

-- IMPORTANTE: Este script cria embeddings FAKE apenas para teste
-- Em produção, os embeddings devem ser gerados pelo frontend usando a IA

-- 1. Criar um embedding de teste (vetor de 384 dimensões com valores aleatórios)
-- Este é um vetor fake, mas serve para testar a função
DO $$
DECLARE
  fake_embedding vector(384);
  test_profile_id uuid := 'e895ae8a-68d4-470d-8c80-bace3237fe54';
BEGIN
  -- Gera um vetor fake com valores entre 0 e 1
  fake_embedding := (
    SELECT ('[' || string_agg(random()::text, ',') || ']')::vector(384)
    FROM generate_series(1, 384)
  );
  
  -- Atualiza o perfil de teste com o embedding fake
  UPDATE profiles 
  SET embedding = fake_embedding
  WHERE id = test_profile_id;
  
  RAISE NOTICE 'Embedding fake adicionado ao perfil %', test_profile_id;
END $$;

-- 2. Adicionar embeddings fake às oportunidades ativas (se necessário)
DO $$
DECLARE
  fake_embedding vector(384);
  opp_record RECORD;
  count_updated integer := 0;
BEGIN
  -- Para cada oportunidade ativa sem embedding
  FOR opp_record IN 
    SELECT id FROM opportunities 
    WHERE ativa = true AND embedding IS NULL
  LOOP
    -- Gera um novo vetor fake para cada oportunidade
    fake_embedding := (
      SELECT ('[' || string_agg(random()::text, ',') || ']')::vector(384)
      FROM generate_series(1, 384)
    );
    
    UPDATE opportunities 
    SET embedding = fake_embedding
    WHERE id = opp_record.id;
    
    count_updated := count_updated + 1;
  END LOOP;
  
  RAISE NOTICE 'Embeddings fake adicionados a % oportunidades', count_updated;
END $$;

-- 3. Verificar se os embeddings foram adicionados
SELECT 
  'Perfil' as tipo,
  COUNT(*) as total,
  COUNT(CASE WHEN embedding IS NOT NULL THEN 1 END) as com_embedding
FROM profiles
WHERE id = 'e895ae8a-68d4-470d-8c80-bace3237fe54'
UNION ALL
SELECT 
  'Oportunidades' as tipo,
  COUNT(*) as total,
  COUNT(CASE WHEN embedding IS NOT NULL THEN 1 END) as com_embedding
FROM opportunities
WHERE ativa = true;

-- 4. Testar a função novamente
SELECT 
  id,
  titulo,
  semantic_score,
  skills_bonus,
  interests_bonus,
  location_bonus,
  score
FROM match_opportunities(
  'e895ae8a-68d4-470d-8c80-bace3237fe54'::uuid,
  NULL,
  10
);

-- 5. Se ainda não funcionar, teste com um embedding explícito
-- Gera um embedding fake e passa diretamente para a função
DO $$
DECLARE
  fake_embedding vector(384);
BEGIN
  fake_embedding := (
    SELECT ('[' || string_agg(random()::text, ',') || ']')::vector(384)
    FROM generate_series(1, 384)
  );
  
  RAISE NOTICE 'Testando com embedding explícito...';
  
  -- Esta query deve retornar resultados se houver oportunidades ativas com embeddings
  PERFORM * FROM match_opportunities(
    'e895ae8a-68d4-470d-8c80-bace3237fe54'::uuid,
    fake_embedding,
    10
  );
END $$;
