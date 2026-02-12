-- =============================================
-- SISTEMA DE NOTIFICAÇÕES IN-APP
-- =============================================

-- 1. Criar tabela de notificações
CREATE TABLE public.notifications (
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
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);

-- 3. Habilitar RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 4. Políticas de segurança
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
-- TRIGGERS PARA CRIAÇÃO AUTOMÁTICA DE NOTIFICAÇÕES
-- =============================================

-- 5. Função para criar notificação quando status do match mudar
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

-- 6. Função para criar notificação quando nova candidatura é criada
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

-- 7. Criar triggers
CREATE TRIGGER trigger_notify_match_status_change
  AFTER UPDATE OF status ON public.matches
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_match_status_change();

CREATE TRIGGER trigger_notify_new_application
  AFTER INSERT ON public.matches
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_application();

-- =============================================
-- COMENTÁRIOS PARA DOCUMENTAÇÃO
-- =============================================
COMMENT ON TABLE public.notifications IS 'Armazena notificações in-app para usuários';
COMMENT ON COLUMN public.notifications.type IS 'Tipos: application_approved, application_rejected, new_candidacy';
COMMENT ON COLUMN public.notifications.link IS 'URL para redirecionamento ao clicar na notificação';
COMMENT ON COLUMN public.notifications.is_read IS 'Indica se a notificação foi lida pelo usuário';
