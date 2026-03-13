ALTER TABLE public.company_profile
  ADD COLUMN IF NOT EXISTS cert_file_path text,
  ADD COLUMN IF NOT EXISTS cert_cn text,
  ADD COLUMN IF NOT EXISTS cert_cnpj text,
  ADD COLUMN IF NOT EXISTS cert_issuer text,
  ADD COLUMN IF NOT EXISTS cert_valid_from date,
  ADD COLUMN IF NOT EXISTS cert_valid_to date;