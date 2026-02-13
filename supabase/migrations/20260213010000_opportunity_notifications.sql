-- =============================================
-- SISTEMA DE NOTIFICAÇÕES PARA ALTERAÇÕES E EXCLUSÕES DE OPORTUNIDADES
-- =============================================

-- PARTE 1: Ajustar tabela notifications para aceitar link nullable
ALTER TABLE public.notifications 
ALTER COLUMN link DROP NOT NULL;

-- PARTE 2: Função para notificar candidatos quando uma oportunidade for editada
CREATE OR REPLACE FUNCTION public.notify_opportunity_updated()
RETURNS TRIGGER AS $$
DECLARE
  v_candidate RECORD;
  v_opportunity_title TEXT;
BEGIN
  -- Pegar o título da oportunidade
  v_opportunity_title := NEW.titulo;
  
  -- Buscar todos os candidatos desta oportunidade e criar notificações
  FOR v_candidate IN 
    SELECT DISTINCT p.user_id, p.nome
    FROM public.matches m
    JOIN public.profiles p ON p.id = m.voluntario_id
    WHERE m.opportunity_id = NEW.id
  LOOP
    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (
      v_candidate.user_id,
      '✏️ Oportunidade Alterada',
      'A vaga "' || v_opportunity_title || '" sofreu alterações. Verifique as mudanças.',
      'opportunity_updated',
      '/vaga/' || NEW.id::text
    );
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PARTE 3: Trigger para detectar UPDATE em opportunities
DROP TRIGGER IF EXISTS trigger_notify_opportunity_updated ON public.opportunities;
CREATE TRIGGER trigger_notify_opportunity_updated
  AFTER UPDATE ON public.opportunities
  FOR EACH ROW
  WHEN (
    -- Só dispara se campos importantes mudaram (não dispara para updated_at)
    OLD.titulo IS DISTINCT FROM NEW.titulo OR
    OLD.descricao IS DISTINCT FROM NEW.descricao OR
    OLD.skills_required IS DISTINCT FROM NEW.skills_required OR
    OLD.horas_estimadas IS DISTINCT FROM NEW.horas_estimadas OR
    OLD.location IS DISTINCT FROM NEW.location OR
    OLD.ativa IS DISTINCT FROM NEW.ativa
  )
  EXECUTE FUNCTION public.notify_opportunity_updated();

-- PARTE 4: RPC Function para deletar oportunidade com notificação prévia
CREATE OR REPLACE FUNCTION public.delete_opportunity_and_notify(p_opportunity_id UUID)
RETURNS JSON AS $$
DECLARE
  v_candidate RECORD;
  v_opportunity_title TEXT;
  v_deleted_count INTEGER := 0;
BEGIN
  -- 1. Buscar o título da oportunidade antes de deletar
  SELECT titulo INTO v_opportunity_title
  FROM public.opportunities
  WHERE id = p_opportunity_id;
  
  -- Verificar se a oportunidade existe
  IF v_opportunity_title IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Oportunidade não encontrada'
    );
  END IF;
  
  -- 2. Buscar todos os candidatos e criar notificações ANTES de deletar
  FOR v_candidate IN 
    SELECT DISTINCT p.user_id, p.nome
    FROM public.matches m
    JOIN public.profiles p ON p.id = m.voluntario_id
    WHERE m.opportunity_id = p_opportunity_id
  LOOP
    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (
      v_candidate.user_id,
      '⚠️ Oportunidade Cancelada',
      'A vaga "' || v_opportunity_title || '" para a qual você se candidatou foi encerrada pela ONG.',
      'opportunity_deleted',
      NULL  -- Link é NULL pois a vaga não existe mais
    );
    
    v_deleted_count := v_deleted_count + 1;
  END LOOP;
  
  -- 3. Deletar a oportunidade (CASCADE vai deletar os matches automaticamente)
  DELETE FROM public.opportunities WHERE id = p_opportunity_id;
  
  -- 4. Retornar sucesso
  RETURN json_build_object(
    'success', true,
    'opportunity_title', v_opportunity_title,
    'notifications_sent', v_deleted_count
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PARTE 5: Atualizar comentários da documentação
COMMENT ON FUNCTION public.delete_opportunity_and_notify IS 'Deleta uma oportunidade e notifica todos os candidatos ANTES da exclusão';
COMMENT ON FUNCTION public.notify_opportunity_updated IS 'Notifica candidatos quando uma oportunidade é editada';

-- Atualizar comentário dos tipos de notificação
COMMENT ON COLUMN public.notifications.type IS 'Tipos: application_approved, application_rejected, new_candidacy, opportunity_updated, opportunity_deleted';
