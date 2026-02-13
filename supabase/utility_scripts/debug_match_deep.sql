-- Debug Completo: Por que match_opportunities retorna 0 rows?

-- 1. Verificar se o embedding foi REALMENTE adicionado ao perfil
SELECT 
  id,
  nome,
  tipo,
  skills,
  interests,
  locations,
  CASE 
    WHEN embedding IS NULL THEN '❌ SEM EMBEDDING'
    ELSE '✅ COM EMBEDDING (dimensões: ' || array_length(embedding::real[], 1) || ')'
  END as embedding_status
FROM profiles 
WHERE id = 'e895ae8a-68d4-470d-8c80-bace3237fe54';

-- 2. Verificar oportunidades ativas com embedding
SELECT 
  COUNT(*) as total_ativas,
  COUNT(CASE WHEN embedding IS NOT NULL THEN 1 END) as com_embedding,
  COUNT(CASE WHEN embedding IS NULL THEN 1 END) as sem_embedding
FROM opportunities 
WHERE ativa = true;

-- 3. Testar a função DIRETAMENTE (sem JOIN)
SELECT 
  id,
  titulo,
  skills_required,
  location,
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

-- 4. Se o teste acima retornar 0 rows, vamos testar a lógica da função manualmente
-- Simular o que a função faz internamente
DO $$
DECLARE
  v_user_id uuid := 'e895ae8a-68d4-470d-8c80-bace3237fe54';
  v_locations text[];
  v_skills text;
  v_interests text;
  v_stored_embedding vector(384);
  v_query_embedding vector(384);
  v_count_opportunities integer;
BEGIN
  -- Carregar dados do perfil
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
  FROM profiles AS prof
  WHERE prof.id = v_user_id;

  -- Determinar embedding de consulta
  v_query_embedding := COALESCE(NULL, v_stored_embedding);

  -- Debug: Mostrar o que foi carregado
  RAISE NOTICE '=== DEBUG MATCH_OPPORTUNITIES ===';
  RAISE NOTICE 'User ID: %', v_user_id;
  RAISE NOTICE 'Skills: %', COALESCE(v_skills, 'NULL');
  RAISE NOTICE 'Interests: %', COALESCE(v_interests, 'NULL');
  RAISE NOTICE 'Locations: %', COALESCE(array_to_string(v_locations, ', '), 'NULL');
  RAISE NOTICE 'Stored Embedding: %', CASE WHEN v_stored_embedding IS NULL THEN 'NULL' ELSE 'EXISTS' END;
  RAISE NOTICE 'Query Embedding: %', CASE WHEN v_query_embedding IS NULL THEN 'NULL ❌' ELSE 'EXISTS ✅' END;

  -- Verificar se há embedding
  IF v_query_embedding IS NULL THEN
    RAISE NOTICE '❌ PROBLEMA: Query embedding é NULL - função vai retornar vazio!';
    RAISE NOTICE 'SOLUÇÃO: Execute o UPDATE para adicionar embedding ao perfil';
    RETURN;
  END IF;

  -- Contar oportunidades que passariam no filtro
  SELECT COUNT(*)
  INTO v_count_opportunities
  FROM opportunities AS opp
  WHERE opp.ativa = true
    AND opp.embedding IS NOT NULL;

  RAISE NOTICE 'Oportunidades ativas com embedding: %', v_count_opportunities;

  IF v_count_opportunities = 0 THEN
    RAISE NOTICE '❌ PROBLEMA: Nenhuma oportunidade ativa tem embedding!';
    RAISE NOTICE 'SOLUÇÃO: Execute populate_test_embeddings.sql';
  ELSE
    RAISE NOTICE '✅ Deveria retornar % resultados', v_count_opportunities;
  END IF;
END $$;

-- 5. Verificar se há algum erro na função
-- Tentar chamar a função com um embedding explícito
SELECT 
  COUNT(*) as total_resultados
FROM match_opportunities(
  'e895ae8a-68d4-470d-8c80-bace3237fe54'::uuid,
  (SELECT embedding FROM profiles WHERE embedding IS NOT NULL LIMIT 1),
  10
);

-- 6. Listar algumas oportunidades manualmente para comparar
SELECT 
  id,
  titulo,
  skills_required,
  causas,
  location,
  ativa,
  CASE WHEN embedding IS NULL THEN '❌ SEM' ELSE '✅ COM' END as embedding_status
FROM opportunities
WHERE ativa = true
LIMIT 5;
