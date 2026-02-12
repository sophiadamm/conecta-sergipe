-- Add new columns to opportunities table for advanced filters
ALTER TABLE public.opportunities 
ADD COLUMN IF NOT EXISTS min_vagas INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS formato TEXT CHECK (formato IN ('presencial', 'remoto', 'hibrido')),
ADD COLUMN IF NOT EXISTS nivel_experiencia TEXT CHECK (nivel_experiencia IN ('iniciante', 'intermediario', 'especialista')),
ADD COLUMN IF NOT EXISTS emite_certificado BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS oferece_treinamento BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS recursos_oferecidos TEXT,
ADD COLUMN IF NOT EXISTS causas TEXT[],
ADD COLUMN IF NOT EXISTS endereco TEXT,
ADD COLUMN IF NOT EXISTS bairro TEXT,
ADD COLUMN IF NOT EXISTS cidade TEXT;

-- Create index for array column to optimize search
CREATE INDEX IF NOT EXISTS idx_opportunities_causas ON public.opportunities USING GIN (causas);

-- Update existing rows (optional, sets defaults)
UPDATE public.opportunities SET min_vagas = 1 WHERE min_vagas IS NULL;
UPDATE public.opportunities SET emite_certificado = FALSE WHERE emite_certificado IS NULL;
UPDATE public.opportunities SET oferece_treinamento = FALSE WHERE oferece_treinamento IS NULL;
