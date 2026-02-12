-- 1. Adiciona a coluna cnpj permitindo nulos inicialmente
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS cnpj text;

-- 2. Gera CNPJs aleatórios para ONGs existentes para evitar erro na constraint de não-nulo
-- Usamos random() para gerar números de 14 dígitos. A chance de colisão é baixíssima para dados de teste.
UPDATE public.profiles
SET cnpj = lpad(floor(random() * 99999999999999)::text, 14, '0')
WHERE tipo = 'ong' AND cnpj IS NULL;

-- 3. Adiciona constraint para garantir que tenha exatamente 14 caracteres (se preenchido)
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS check_cnpj_length; -- Garante que não duplique se rodar de novo

ALTER TABLE public.profiles
ADD CONSTRAINT check_cnpj_length CHECK (cnpj IS NULL OR length(cnpj) = 14);

-- 4. Adiciona constraint UNIQUE para garantir que não haja CNPJs repetidos
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS unique_cnpj;

ALTER TABLE public.profiles
ADD CONSTRAINT unique_cnpj UNIQUE (cnpj);

-- 5. Adiciona constraint para garantir que ONGs tenham CNPJ obrigatório
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS check_ong_cnpj_mandatory;

ALTER TABLE public.profiles
ADD CONSTRAINT check_ong_cnpj_mandatory 
CHECK (
  (tipo != 'ong') OR 
  (tipo = 'ong' AND cnpj IS NOT NULL)
);

COMMENT ON COLUMN public.profiles.cnpj IS 'CNPJ obrigatório para ONGs (14 dígitos) e único.';
