
-- Create payment_receipts table
CREATE TABLE public.payment_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  payment_id uuid,
  payment_type text NOT NULL DEFAULT 'parcela',
  plan_type text,
  period_start date,
  period_end date,
  competency text,
  amount numeric NOT NULL DEFAULT 0,
  paid_at date NOT NULL DEFAULT CURRENT_DATE,
  method text NOT NULL DEFAULT 'pix',
  notes text,
  file_path text,
  file_name text,
  file_size integer,
  mime_type text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pr_select" ON public.payment_receipts FOR SELECT USING (org_id = current_org_id());
CREATE POLICY "pr_insert" ON public.payment_receipts FOR INSERT WITH CHECK ((org_id = current_org_id()) AND ("current_role"() = ANY(ARRAY['admin','financeiro'])));
CREATE POLICY "pr_update" ON public.payment_receipts FOR UPDATE USING ((org_id = current_org_id()) AND ("current_role"() = ANY(ARRAY['admin','financeiro'])));
CREATE POLICY "pr_delete" ON public.payment_receipts FOR DELETE USING ((org_id = current_org_id()) AND ("current_role"() = ANY(ARRAY['admin','financeiro'])));

INSERT INTO storage.buckets (id, name, public) VALUES ('payment-receipts', 'payment-receipts', false);

CREATE POLICY "pr_storage_select" ON storage.objects FOR SELECT USING (bucket_id = 'payment-receipts' AND (storage.foldername(name))[1] = (SELECT org_id::text FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "pr_storage_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'payment-receipts' AND (storage.foldername(name))[1] = (SELECT org_id::text FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "pr_storage_delete" ON storage.objects FOR DELETE USING (bucket_id = 'payment-receipts' AND (storage.foldername(name))[1] = (SELECT org_id::text FROM public.profiles WHERE id = auth.uid()));
