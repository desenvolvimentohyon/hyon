ALTER TABLE public.financial_titles
  DROP CONSTRAINT financial_titles_bank_account_id_fkey;

ALTER TABLE public.financial_titles
  ADD CONSTRAINT financial_titles_bank_account_id_fkey
  FOREIGN KEY (bank_account_id) REFERENCES public.company_bank_accounts(id)
  ON DELETE SET NULL;