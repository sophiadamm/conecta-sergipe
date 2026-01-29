-- Enum para tipo de usuário
CREATE TYPE public.user_type AS ENUM ('voluntario', 'ong');

-- Enum para status do match
CREATE TYPE public.match_status AS ENUM ('pendente', 'aprovado', 'concluido', 'rejeitado');

-- Tabela de perfis
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  cpf TEXT,
  tipo user_type NOT NULL,
  bio TEXT,
  skills TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Tabela de oportunidades
CREATE TABLE public.opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ong_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  titulo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  skills_required TEXT,
  horas_estimadas INTEGER NOT NULL DEFAULT 0,
  ativa BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Tabela de matches
CREATE TABLE public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voluntario_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  opportunity_id UUID REFERENCES public.opportunities(id) ON DELETE CASCADE NOT NULL,
  status match_status DEFAULT 'pendente' NOT NULL,
  horas_validadas INTEGER DEFAULT 0,
  feedback_ong TEXT,
  feedback_voluntario TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(voluntario_id, opportunity_id)
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Profiles são públicos para leitura"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Usuários podem inserir próprio perfil"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar próprio perfil"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Opportunities policies
CREATE POLICY "Oportunidades são públicas para leitura"
  ON public.opportunities FOR SELECT
  USING (true);

CREATE POLICY "ONGs podem criar oportunidades"
  ON public.opportunities FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = ong_id 
      AND user_id = auth.uid() 
      AND tipo = 'ong'
    )
  );

CREATE POLICY "ONGs podem atualizar próprias oportunidades"
  ON public.opportunities FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = ong_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "ONGs podem deletar próprias oportunidades"
  ON public.opportunities FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = ong_id 
      AND user_id = auth.uid()
    )
  );

-- Matches policies
CREATE POLICY "Usuários podem ver próprios matches"
  ON public.matches FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE (id = voluntario_id OR id IN (SELECT ong_id FROM public.opportunities WHERE id = opportunity_id))
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Voluntários podem criar candidaturas"
  ON public.matches FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = voluntario_id 
      AND user_id = auth.uid() 
      AND tipo = 'voluntario'
    )
  );

CREATE POLICY "Participantes podem atualizar matches"
  ON public.matches FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE (id = voluntario_id OR id IN (SELECT ong_id FROM public.opportunities WHERE id = opportunity_id))
      AND user_id = auth.uid()
    )
  );

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_opportunities_updated_at
  BEFORE UPDATE ON public.opportunities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_matches_updated_at
  BEFORE UPDATE ON public.matches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();