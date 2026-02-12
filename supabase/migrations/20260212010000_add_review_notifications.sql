-- =============================================
-- EXTENSÃO DO SISTEMA DE NOTIFICAÇÕES: AVALIAÇÕES
-- =============================================

-- 1. Função Trigger para Avaliações (Unificada)
CREATE OR REPLACE FUNCTION public.notify_reviews()
RETURNS TRIGGER AS $$
DECLARE
  v_ong_user_id UUID;
  v_voluntario_user_id UUID;
  v_ong_nome TEXT;
  v_voluntario_nome TEXT;
  v_opportunity_title TEXT;
BEGIN
  -- Buscar dados dos perfis e oportunidade envolvidos
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

  -- =================================================================
  -- CENÁRIO A: ONG avalia Voluntário
  -- Dispara quando rating ou feedback_ong são preenchidos pela PRIMEIRA vez
  -- =================================================================
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

  -- =================================================================
  -- CENÁRIO B: Voluntário avalia ONG
  -- Dispara quando rating_voluntario ou feedback_voluntario são preenchidos pela PRIMEIRA vez
  -- =================================================================
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

-- 2. Criar Trigger na tabela matches
DROP TRIGGER IF EXISTS trigger_notify_reviews ON public.matches;

CREATE TRIGGER trigger_notify_reviews
  AFTER UPDATE ON public.matches
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_reviews();

-- 3. Atualizar comentários com novos tipos
COMMENT ON COLUMN public.notifications.type IS 'Tipos: application_approved, application_rejected, new_candidacy, volunteer_reviewed, ong_reviewed';
