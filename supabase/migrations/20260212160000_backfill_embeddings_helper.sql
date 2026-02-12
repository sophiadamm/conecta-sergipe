-- Script de Backfill de Embeddings
-- Este script ajuda a gerar embeddings para registros existentes
-- 
-- IMPORTANTE: Para gerar embeddings reais, você precisa:
-- 1. Deployar a Edge Function 'semantic-sync'
-- 2. Configurar webhooks no Supabase Dashboard
-- 3. OU chamar manualmente a Edge Function para cada registro
--
-- Por enquanto, este script apenas verifica quantos registros precisam de embeddings

-- Verificar perfis sem embedding
SELECT 
  COUNT(*) as perfis_sem_embedding,
  COUNT(*) FILTER (WHERE tipo = 'voluntario') as voluntarios_sem_embedding,
  COUNT(*) FILTER (WHERE tipo = 'ong') as ongs_sem_embedding
FROM public.profiles
WHERE embedding IS NULL;

-- Verificar oportunidades sem embedding
SELECT 
  COUNT(*) as oportunidades_sem_embedding
FROM public.opportunities
WHERE embedding IS NULL OR ativa = false;

-- Listar IDs de perfis que precisam de embedding (para facilitar backfill manual)
-- Descomente e ajuste o LIMIT conforme necessário
/*
SELECT 
  id,
  nome,
  tipo,
  CASE 
    WHEN bio IS NULL AND skills IS NULL THEN 'Sem conteúdo para gerar embedding'
    ELSE 'Pronto para gerar embedding'
  END as status
FROM public.profiles
WHERE embedding IS NULL
  AND (bio IS NOT NULL OR skills IS NOT NULL)
LIMIT 100;
*/

-- Listar IDs de oportunidades que precisam de embedding
/*
SELECT 
  id,
  titulo,
  CASE 
    WHEN descricao IS NULL AND skills_required IS NULL THEN 'Sem conteúdo para gerar embedding'
    ELSE 'Pronto para gerar embedding'
  END as status
FROM public.opportunities
WHERE (embedding IS NULL OR embedding IS NOT NULL)
  AND ativa = true
  AND (descricao IS NOT NULL OR skills_required IS NOT NULL)
LIMIT 100;
*/
