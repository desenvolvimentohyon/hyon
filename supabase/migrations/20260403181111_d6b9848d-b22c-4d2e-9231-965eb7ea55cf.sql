ALTER TABLE public.financial_titles ADD COLUMN is_courtesy boolean NOT NULL DEFAULT false;
ALTER TABLE public.financial_titles ADD COLUMN courtesy_reason text;