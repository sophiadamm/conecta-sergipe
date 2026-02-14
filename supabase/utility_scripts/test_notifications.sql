-- ═══════════════════════════════════════════════════════════════
-- 🧪 SCRIPT DE TESTE MANUAL - SISTEMA DE NOTIFICAÇÕES
-- ═══════════════════════════════════════════════════════════════
-- Execute estes comandos no SQL Editor do Supabase para testar
-- o sistema de notificações manualmente
-- ═══════════════════════════════════════════════════════════════

-- ┌─────────────────────────────────────────────────────────────┐
-- │ 1. VERIFICAR SE A TABELA FOI CRIADA                         │
-- └─────────────────────────────────────────────────────────────┘

SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'notifications'
ORDER BY ordinal_position;

-- Deve retornar 8 linhas com as colunas:
-- id, user_id, title, message, type, link, is_read, created_at


-- ┌─────────────────────────────────────────────────────────────┐
-- │ 2. VERIFICAR ÍNDICES                                        │
-- └─────────────────────────────────────────────────────────────┘

SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'notifications';

-- Deve retornar 4 índices:
-- notifications_pkey, idx_notifications_user_id, 
-- idx_notifications_is_read, idx_notifications_created_at


-- ┌─────────────────────────────────────────────────────────────┐
-- │ 3. VERIFICAR POLÍTICAS RLS                                  │
-- └─────────────────────────────────────────────────────────────┘

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'notifications';

-- Deve retornar 4 políticas


-- ┌─────────────────────────────────────────────────────────────┐
-- │ 4. VERIFICAR TRIGGERS                                       │
-- └─────────────────────────────────────────────────────────────┘

SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_timing
FROM information_schema.triggers
WHERE trigger_name IN (
  'trigger_notify_match_status_change',
  'trigger_notify_new_application'
);

-- Deve retornar 2 triggers


-- ┌─────────────────────────────────────────────────────────────┐
-- │ 5. CRIAR NOTIFICAÇÃO DE TESTE MANUAL                       │
-- └─────────────────────────────────────────────────────────────┘

-- ⚠️ SUBSTITUA user_id_aqui pelo user_id de um perfil existente
-- Você pode pegar um user_id executando: SELECT user_id FROM profiles LIMIT 1;

INSERT INTO public.notifications (user_id, title, message, type, link)
VALUES (
  'user_id_aqui'::uuid,  -- ← SUBSTITUA AQUI
  '🧪 Teste de Notificação',
  'Esta é uma notificação de teste manual criada pelo SQL Editor.',
  'test',
  '/dashboard'
);

-- Após executar, vá na aplicação e veja a notificação aparecer!


-- ┌─────────────────────────────────────────────────────────────┐
-- │ 6. LISTAR TODAS AS NOTIFICAÇÕES                             │
-- └─────────────────────────────────────────────────────────────┘

SELECT 
  n.id,
  p.nome AS usuario,
  p.tipo AS tipo_usuario,
  n.title,
  n.message,
  n.type,
  n.is_read,
  n.created_at
FROM public.notifications n
JOIN public.profiles p ON p.user_id = n.user_id
ORDER BY n.created_at DESC
LIMIT 10;


-- ┌─────────────────────────────────────────────────────────────┐
-- │ 7. CONTAR NOTIFICAÇÕES NÃO LIDAS POR USUÁRIO               │
-- └─────────────────────────────────────────────────────────────┘

SELECT 
  p.nome,
  p.tipo,
  COUNT(*) AS notificacoes_nao_lidas
FROM public.notifications n
JOIN public.profiles p ON p.user_id = n.user_id
WHERE n.is_read = false
GROUP BY p.id, p.nome, p.tipo
ORDER BY notificacoes_nao_lidas DESC;


-- ┌─────────────────────────────────────────────────────────────┐
-- │ 8. TESTAR TRIGGER DE NOVA CANDIDATURA                      │
-- └─────────────────────────────────────────────────────────────┘

-- 8.1. Primeiro, encontre uma oportunidade e um voluntário

SELECT 
  o.id AS opportunity_id,
  o.titulo AS oportunidade,
  p_ong.nome AS ong,
  p_ong.user_id AS ong_user_id
FROM public.opportunities o
JOIN public.profiles p_ong ON p_ong.id = o.ong_id
LIMIT 1;

SELECT 
  p.id AS voluntario_profile_id,
  p.nome AS voluntario,
  p.user_id AS voluntario_user_id
FROM public.profiles p
WHERE p.tipo = 'voluntario'
LIMIT 1;

-- 8.2. Crie um match (candidatura)
-- ⚠️ SUBSTITUA os IDs pelos retornados acima

INSERT INTO public.matches (voluntario_id, opportunity_id, status)
VALUES (
  'voluntario_profile_id_aqui'::uuid,  -- ← SUBSTITUA
  'opportunity_id_aqui'::uuid,         -- ← SUBSTITUA
  'pendente'
);

-- 8.3. Verifique se a notificação foi criada para a ONG

SELECT 
  n.title,
  n.message,
  n.type,
  p.nome AS destinatario
FROM public.notifications n
JOIN public.profiles p ON p.user_id = n.user_id
WHERE n.type = 'new_candidacy'
ORDER BY n.created_at DESC
LIMIT 1;


-- ┌─────────────────────────────────────────────────────────────┐
-- │ 9. TESTAR TRIGGER DE APROVAÇÃO                             │
-- └─────────────────────────────────────────────────────────────┘

-- 9.1. Aprove o match criado anteriormente
-- ⚠️ SUBSTITUA match_id pelo ID retornado na query anterior

UPDATE public.matches
SET status = 'aprovado'
WHERE id = 'match_id_aqui'::uuid;  -- ← SUBSTITUA

-- 9.2. Verifique se a notificação foi criada para o voluntário

SELECT 
  n.title,
  n.message,
  n.type,
  p.nome AS destinatario
FROM public.notifications n
JOIN public.profiles p ON p.user_id = n.user_id
WHERE n.type = 'application_approved'
ORDER BY n.created_at DESC
LIMIT 1;


-- ┌─────────────────────────────────────────────────────────────┐
-- │ 10. LIMPAR NOTIFICAÇÕES DE TESTE                           │
-- └─────────────────────────────────────────────────────────────┘

-- ⚠️ CUIDADO: Isto deleta TODAS as notificações!
-- Use apenas em ambiente de desenvolvimento

/*
DELETE FROM public.notifications WHERE type = 'test';
-- ou para deletar tudo:
-- DELETE FROM public.notifications;
*/


-- ┌─────────────────────────────────────────────────────────────┐
-- │ 11. ESTATÍSTICAS GERAIS                                    │
-- └─────────────────────────────────────────────────────────────┘

SELECT 
  'Total de Notificações' AS metrica,
  COUNT(*)::text AS valor
FROM public.notifications
UNION ALL
SELECT 
  'Notificações Não Lidas',
  COUNT(*)::text
FROM public.notifications
WHERE is_read = false
UNION ALL
SELECT 
  'Taxa de Leitura',
  ROUND(
    (COUNT(*) FILTER (WHERE is_read = true)::numeric / 
     NULLIF(COUNT(*), 0) * 100),
    2
  )::text || '%'
FROM public.notifications
UNION ALL
SELECT 
  'Usuários com Notificações',
  COUNT(DISTINCT user_id)::text
FROM public.notifications;


-- ═══════════════════════════════════════════════════════════════
-- 📊 QUERIES ÚTEIS PARA ANÁLISE
-- ═══════════════════════════════════════════════════════════════

-- Notificações por tipo
SELECT 
  type,
  COUNT(*) AS total,
  COUNT(*) FILTER (WHERE is_read = true) AS lidas,
  COUNT(*) FILTER (WHERE is_read = false) AS nao_lidas
FROM public.notifications
GROUP BY type
ORDER BY total DESC;

-- Notificações recentes (últimas 24h)
SELECT 
  p.nome,
  n.title,
  n.message,
  n.is_read,
  n.created_at
FROM public.notifications n
JOIN public.profiles p ON p.user_id = n.user_id
WHERE n.created_at > NOW() - INTERVAL '24 hours'
ORDER BY n.created_at DESC;

-- Usuários mais notificados
SELECT 
  p.nome,
  p.tipo,
  COUNT(*) AS total_notificacoes,
  COUNT(*) FILTER (WHERE n.is_read = false) AS nao_lidas
FROM public.notifications n
JOIN public.profiles p ON p.user_id = n.user_id
GROUP BY p.id, p.nome, p.tipo
ORDER BY total_notificacoes DESC
LIMIT 10;

-- ═══════════════════════════════════════════════════════════════
-- ✅ FIM DO SCRIPT DE TESTES
-- ═══════════════════════════════════════════════════════════════
