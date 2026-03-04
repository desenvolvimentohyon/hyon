
-- Enums
CREATE TYPE public.card_client_status AS ENUM ('lead', 'proposta_enviada', 'em_negociacao', 'ativo', 'recusado', 'inativo');
CREATE TYPE public.card_machine_type AS ENUM ('fiscal', 'nao_fiscal');
CREATE TYPE public.card_proposal_status AS ENUM ('draft', 'enviada', 'visualizada', 'aceita', 'recusada', 'expirada');
CREATE TYPE public.card_onboarding_status AS ENUM ('pendente', 'solicitado', 'recebido', 'concluido');
CREATE TYPE public.card_commission_status AS ENUM ('previsto', 'confirmado', 'pago');

-- card_clients
CREATE TABLE public.card_clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id),
  linked_client_id uuid REFERENCES public.clients(id),
  name text NOT NULL,
  company_name text,
  trade_name text,
  cnpj text,
  phone text NOT NULL DEFAULT '',
  email text,
  city text,
  status public.card_client_status NOT NULL DEFAULT 'lead',
  card_machine_type public.card_machine_type NOT NULL DEFAULT 'fiscal',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.card_clients ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER handle_card_clients_updated_at BEFORE UPDATE ON public.card_clients FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE POLICY "cc_select" ON public.card_clients FOR SELECT USING (org_id = current_org_id());
CREATE POLICY "cc_insert" ON public.card_clients FOR INSERT WITH CHECK ((org_id = current_org_id()) AND ("current_role"() = ANY (ARRAY['admin'::text, 'comercial'::text])));
CREATE POLICY "cc_update" ON public.card_clients FOR UPDATE USING ((org_id = current_org_id()) AND ("current_role"() = ANY (ARRAY['admin'::text, 'comercial'::text])));
CREATE POLICY "cc_delete" ON public.card_clients FOR DELETE USING ((org_id = current_org_id()) AND ("current_role"() = 'admin'::text));

-- card_fee_profiles
CREATE TABLE public.card_fee_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id),
  card_client_id uuid NOT NULL REFERENCES public.card_clients(id) ON DELETE CASCADE,
  mdr_debito_percent numeric NOT NULL DEFAULT 0,
  mdr_credito_1x_percent numeric NOT NULL DEFAULT 0,
  mdr_credito_2a6_percent numeric NOT NULL DEFAULT 0,
  mdr_credito_7a12_percent numeric NOT NULL DEFAULT 0,
  antecipacao_percent numeric NOT NULL DEFAULT 0,
  prazo_repasse integer NOT NULL DEFAULT 1,
  aluguel_mensal numeric,
  observacoes text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.card_fee_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cfp_select" ON public.card_fee_profiles FOR SELECT USING (org_id = current_org_id());
CREATE POLICY "cfp_insert" ON public.card_fee_profiles FOR INSERT WITH CHECK ((org_id = current_org_id()) AND ("current_role"() = ANY (ARRAY['admin'::text, 'comercial'::text])));
CREATE POLICY "cfp_update" ON public.card_fee_profiles FOR UPDATE USING ((org_id = current_org_id()) AND ("current_role"() = ANY (ARRAY['admin'::text, 'comercial'::text])));
CREATE POLICY "cfp_delete" ON public.card_fee_profiles FOR DELETE USING ((org_id = current_org_id()) AND ("current_role"() = 'admin'::text));

-- card_proposals
CREATE TABLE public.card_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id),
  card_client_id uuid NOT NULL REFERENCES public.card_clients(id) ON DELETE CASCADE,
  public_token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  title text NOT NULL DEFAULT '',
  machine_type public.card_machine_type NOT NULL DEFAULT 'fiscal',
  commission_percent numeric NOT NULL DEFAULT 30,
  fee_profile_snapshot jsonb,
  validity_days integer NOT NULL DEFAULT 7,
  status public.card_proposal_status NOT NULL DEFAULT 'draft',
  sent_at timestamptz,
  first_viewed_at timestamptz,
  accepted_at timestamptz,
  refused_at timestamptz,
  accepted_by_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.card_proposals ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER handle_card_proposals_updated_at BEFORE UPDATE ON public.card_proposals FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE POLICY "cp2_select" ON public.card_proposals FOR SELECT USING (org_id = current_org_id());
CREATE POLICY "cp2_insert" ON public.card_proposals FOR INSERT WITH CHECK ((org_id = current_org_id()) AND ("current_role"() = ANY (ARRAY['admin'::text, 'comercial'::text])));
CREATE POLICY "cp2_update" ON public.card_proposals FOR UPDATE USING ((org_id = current_org_id()) AND ("current_role"() = ANY (ARRAY['admin'::text, 'comercial'::text])));
CREATE POLICY "cp2_delete" ON public.card_proposals FOR DELETE USING ((org_id = current_org_id()) AND ("current_role"() = 'admin'::text));

-- card_proposal_onboarding
CREATE TABLE public.card_proposal_onboarding (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id),
  card_proposal_id uuid NOT NULL REFERENCES public.card_proposals(id) ON DELETE CASCADE,
  card_client_id uuid NOT NULL REFERENCES public.card_clients(id) ON DELETE CASCADE,
  status public.card_onboarding_status NOT NULL DEFAULT 'pendente',
  data_payload jsonb DEFAULT '{}',
  requested_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.card_proposal_onboarding ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cpo_select" ON public.card_proposal_onboarding FOR SELECT USING (org_id = current_org_id());
CREATE POLICY "cpo_insert" ON public.card_proposal_onboarding FOR INSERT WITH CHECK (org_id = current_org_id());
CREATE POLICY "cpo_update" ON public.card_proposal_onboarding FOR UPDATE USING (org_id = current_org_id());
CREATE POLICY "cpo_delete" ON public.card_proposal_onboarding FOR DELETE USING ((org_id = current_org_id()) AND ("current_role"() = 'admin'::text));

-- card_revenue_monthly
CREATE TABLE public.card_revenue_monthly (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id),
  card_client_id uuid NOT NULL REFERENCES public.card_clients(id) ON DELETE CASCADE,
  competency text NOT NULL,
  gross_volume numeric NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(org_id, card_client_id, competency)
);
ALTER TABLE public.card_revenue_monthly ENABLE ROW LEVEL SECURITY;

CREATE POLICY "crm2_select" ON public.card_revenue_monthly FOR SELECT USING (org_id = current_org_id());
CREATE POLICY "crm2_insert" ON public.card_revenue_monthly FOR INSERT WITH CHECK ((org_id = current_org_id()) AND ("current_role"() = ANY (ARRAY['admin'::text, 'comercial'::text, 'financeiro'::text])));
CREATE POLICY "crm2_update" ON public.card_revenue_monthly FOR UPDATE USING ((org_id = current_org_id()) AND ("current_role"() = ANY (ARRAY['admin'::text, 'comercial'::text, 'financeiro'::text])));
CREATE POLICY "crm2_delete" ON public.card_revenue_monthly FOR DELETE USING ((org_id = current_org_id()) AND ("current_role"() = 'admin'::text));

-- card_commissions
CREATE TABLE public.card_commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id),
  card_client_id uuid NOT NULL REFERENCES public.card_clients(id) ON DELETE CASCADE,
  competency text NOT NULL,
  gross_volume numeric NOT NULL DEFAULT 0,
  commission_percent numeric NOT NULL DEFAULT 30,
  commission_value numeric NOT NULL DEFAULT 0,
  status public.card_commission_status NOT NULL DEFAULT 'previsto',
  paid_at date,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(org_id, card_client_id, competency)
);
ALTER TABLE public.card_commissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ccom_select" ON public.card_commissions FOR SELECT USING (org_id = current_org_id());
CREATE POLICY "ccom_insert" ON public.card_commissions FOR INSERT WITH CHECK ((org_id = current_org_id()) AND ("current_role"() = ANY (ARRAY['admin'::text, 'comercial'::text, 'financeiro'::text])));
CREATE POLICY "ccom_update" ON public.card_commissions FOR UPDATE USING ((org_id = current_org_id()) AND ("current_role"() = ANY (ARRAY['admin'::text, 'comercial'::text, 'financeiro'::text])));
CREATE POLICY "ccom_delete" ON public.card_commissions FOR DELETE USING ((org_id = current_org_id()) AND ("current_role"() = 'admin'::text));
