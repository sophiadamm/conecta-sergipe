-- =============================================
-- EXECUTAR ESTE SCRIPT NO SUPABASE DASHBOARD
-- SQL Editor > New Query > Copiar e Colar > Run
-- =============================================

-- =============================================
-- PARTE 1: ESTRUTURA BASE (Tabela e Políticas)
-- =============================================

-- 1. Criar tabela de notificações
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  link TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 2. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- 3. Habilitar RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 4. Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Usuários podem ver próprias notificações" ON public.notifications;
DROP POLICY IF EXISTS "Sistema pode criar notificações" ON public.notifications;
DROP POLICY IF EXISTS "Usuários podem atualizar próprias notificações" ON public.notifications;
DROP POLICY IF EXISTS "Usuários podem deletar próprias notificações" ON public.notifications;

-- 5. Criar políticas de segurança
CREATE POLICY "Usuários podem ver próprias notificações"
  ON public.notifications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.user_id = notifications.user_id
    )
  );

CREATE POLICY "Sistema pode criar notificações"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Usuários podem atualizar próprias notificações"
  ON public.notifications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.user_id = notifications.user_id
    )
  );

CREATE POLICY "Usuários podem deletar próprias notificações"
  ON public.notifications FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.user_id = notifications.user_id
    )
  );


-- =============================================
-- PARTE 2: TRIGGERS PARA CRIAÇÃO AUTOMÁTICA
-- =============================================

-- 6. Remover triggers e funções antigas se existirem
DROP TRIGGER IF EXISTS trigger_notify_match_status_change ON public.matches;
DROP TRIGGER IF EXISTS trigger_notify_new_application ON public.matches;
DROP TRIGGER IF EXISTS trigger_notify_reviews ON public.matches; -- Novo
DROP FUNCTION IF EXISTS public.notify_match_status_change();
DROP FUNCTION IF EXISTS public.notify_new_application();
DROP FUNCTION IF EXISTS public.notify_reviews(); -- Novo

-- 7. Função para criar notificação quando status do match mudar
CREATE OR REPLACE FUNCTION public.notify_match_status_change()
RETURNS TRIGGER AS $$
DECLARE
  v_voluntario_user_id UUID;
  v_opportunity_title TEXT;
  v_notification_title TEXT;
  v_notification_message TEXT;
  v_notification_type TEXT;
BEGIN
  -- Só envia notificação se o status mudou para 'aprovado' ou 'rejeitado'
  IF NEW.status IN ('aprovado', 'rejeitado') AND (OLD.status IS NULL OR OLD.status != NEW.status) THEN
    
    -- Buscar user_id do voluntário e título da oportunidade
    SELECT p.user_id, o.titulo
    INTO v_voluntario_user_id, v_opportunity_title
    FROM public.profiles p
    JOIN public.opportunities o ON o.id = NEW.opportunity_id
    WHERE p.id = NEW.voluntario_id;
    
    -- Definir título e mensagem baseado no status
    IF NEW.status = 'aprovado' THEN
      v_notification_title := '🎉 Candidatura Aprovada!';
      v_notification_message := 'Sua candidatura para "' || v_opportunity_title || '" foi aprovada!';
      v_notification_type := 'application_approved';
    ELSE
      v_notification_title := 'Candidatura Não Aprovada';
      v_notification_message := 'Sua candidatura para "' || v_opportunity_title || '" não foi aprovada desta vez.';
      v_notification_type := 'application_rejected';
    END IF;
    
    -- Inserir notificação
    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (
      v_voluntario_user_id,
      v_notification_title,
      v_notification_message,
      v_notification_type,
      '/dashboard'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Função para criar notificação quando nova candidatura é criada
CREATE OR REPLACE FUNCTION public.notify_new_application()
RETURNS TRIGGER AS $$
DECLARE
  v_ong_user_id UUID;
  v_voluntario_nome TEXT;
  v_opportunity_title TEXT;
BEGIN
  -- Buscar user_id da ONG, nome do voluntário e título da oportunidade
  SELECT p_ong.user_id, p_vol.nome, o.titulo
  INTO v_ong_user_id, v_voluntario_nome, v_opportunity_title
  FROM public.opportunities o
  JOIN public.profiles p_ong ON p_ong.id = o.ong_id
  JOIN public.profiles p_vol ON p_vol.id = NEW.voluntario_id
  WHERE o.id = NEW.opportunity_id;
  
  -- Inserir notificação
  INSERT INTO public.notifications (user_id, title, message, type, link)
  VALUES (
    v_ong_user_id,
    '👋 Nova Candidatura!',
    v_voluntario_nome || ' se candidatou para "' || v_opportunity_title || '"',
    'new_candidacy',
    '/dashboard'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. (NOVO) Função para criar notificação de AVALIAÇÕES (ONG <-> Voluntário)
CREATE OR REPLACE FUNCTION public.notify_reviews()
RETURNS TRIGGER AS $$
DECLARE
  v_ong_user_id UUID;
  v_voluntario_user_id UUID;
  v_ong_nome TEXT;
  v_voluntario_nome TEXT;
  v_opportunity_title TEXT;
BEGIN
  -- Buscar dados comuns
  SELECT 
    p_ong.user_id, p_ong.nome,
    p_vol.user_id, p_vol.nome,
    o.titulo
  INTO 
    v_ong_user_id, v_ong_nome,
    v_voluntario_user_id, v_voluntario_nome,
    v_opportunity_title
  FROM public.opportunities o
  JOIN public.profiles p_ong ON p_ong.id = o.ong_id
  JOIN public.profiles p_vol ON p_vol.id = NEW.voluntario_id
  WHERE o.id = NEW.opportunity_id;

  -- 9.1. CENÁRIO A: ONG avalia Voluntário
  IF (OLD.rating IS NULL AND OLD.feedback_ong IS NULL) AND 
     (NEW.rating IS NOT NULL OR NEW.feedback_ong IS NOT NULL) THEN
     
     INSERT INTO public.notifications (user_id, title, message, type, link)
     VALUES (
       v_voluntario_user_id,
       'Nova avaliação recebida! ⭐',
       'A ONG ' || v_ong_nome || ' avaliou sua participação em "' || v_opportunity_title || '".',
       'volunteer_reviewed',
       '/dashboard?tab=feedbacks' 
     );
  END IF;

  -- 9.2. CENÁRIO B: Voluntário avalia ONG
  IF (OLD.rating_voluntario IS NULL AND OLD.feedback_voluntario IS NULL) AND 
     (NEW.rating_voluntario IS NOT NULL OR NEW.feedback_voluntario IS NOT NULL) THEN
     
     INSERT INTO public.notifications (user_id, title, message, type, link)
     VALUES (
       v_ong_user_id,
       'Nova avaliação de voluntário! ⭐',
       'O voluntário ' || v_voluntario_nome || ' avaliou a experiência em "' || v_opportunity_title || '".',
       'ong_reviewed',
       '/ong-dashboard?tab=feedbacks'
     );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Criar triggers
CREATE TRIGGER trigger_notify_match_status_change
  AFTER UPDATE OF status ON public.matches
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_match_status_change();

CREATE TRIGGER trigger_notify_new_application
  AFTER INSERT ON public.matches
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_application();

CREATE TRIGGER trigger_notify_reviews
  AFTER UPDATE ON public.matches
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_reviews();

-- 11. Comentários para documentação
COMMENT ON TABLE public.notifications IS 'Armazena notificações in-app para usuários';
COMMENT ON COLUMN public.notifications.type IS 'Tipos: application_approved, application_rejected, new_candidacy, volunteer_reviewed, ong_reviewed';
COMMENT ON COLUMN public.notifications.link IS 'URL para redirecionamento ao clicar na notificação';
COMMENT ON COLUMN public.notifications.is_read IS 'Indica se a notificação foi lida pelo usuário';

-- =============================================
-- VERIFICAÇÃO FINAL
-- =============================================

-- Verificar se tudo foi criado corretamente
DO $$
BEGIN
  RAISE NOTICE '✅ Tabela notifications criada/verificada!';
  RAISE NOTICE '✅ Índices criados!';
  RAISE NOTICE '✅ Políticas RLS aplicadas!';
  RAISE NOTICE '✅ Triggers principais instalados!';
  RAISE NOTICE '✅ Trigger de avaliações instalado!';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Sistema de notificações (incluindo avaliações) instalado com sucesso!';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Próximo passo: Habilitar Realtime (se ainda não fez)';
  RAISE NOTICE '   1. Vá em Database → Replication';
  RAISE NOTICE '   2. Habilite Realtime para a tabela "notifications"';
END $$;
