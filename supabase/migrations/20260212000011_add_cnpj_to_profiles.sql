-- Add CNPJ column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN cnpj text;

-- Update existing ONGs with random 14-digit CNPJ to satisfy the constraint
-- We use a random number generation strategy to ensure uniqueness is likely (though not guaranteed strictly, it's sufficient for migration of test data)
UPDATE public.profiles
SET cnpj = lpad(floor(random() * 100000000000000)::text, 14, '0')
WHERE tipo = 'ong' AND cnpj IS NULL;

-- Add check constraint for length 14
ALTER TABLE public.profiles
ADD CONSTRAINT check_cnpj_length CHECK (cnpj IS NULL OR length(cnpj) = 14);

-- Add constraint to ensure ONGs have CNPJ
ALTER TABLE public.profiles
ADD CONSTRAINT check_ong_cnpj_mandatory 
CHECK (
  (tipo = 'ong' AND cnpj IS NOT NULL) OR 
  (tipo = 'voluntario')
);

-- Optional: Add comment
COMMENT ON COLUMN public.profiles.cnpj IS 'CNPJ mandatory for ONGs (14 digits)';
