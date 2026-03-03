
-- =============================================
-- FASE 1: Núcleo de Segurança e Organização
-- =============================================

-- 1. Organizations
CREATE TABLE public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- 2. Profiles (1:1 com auth.users)
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT 'leitura' CHECK (role IN ('admin','financeiro','comercial','suporte','implantacao','leitura')),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_profiles_org ON public.profiles(org_id);

-- 3. Helper functions for RLS
CREATE OR REPLACE FUNCTION public.current_org_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT org_id FROM public.profiles WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.current_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$;

-- 4. Generic updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_updated_at_organizations BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at_profiles BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 5. Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _org_id uuid;
  _role text;
  _count int;
BEGIN
  -- Get or create default org
  SELECT id INTO _org_id FROM public.organizations LIMIT 1;
  IF _org_id IS NULL THEN
    INSERT INTO public.organizations (name) VALUES ('Minha Empresa') RETURNING id INTO _org_id;
  END IF;
  
  -- First user = admin, others = leitura
  SELECT count(*) INTO _count FROM public.profiles WHERE org_id = _org_id;
  IF _count = 0 THEN _role := 'admin'; ELSE _role := 'leitura'; END IF;
  
  INSERT INTO public.profiles (id, org_id, full_name, role)
  VALUES (NEW.id, _org_id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), _role);
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. RLS Policies for organizations
CREATE POLICY "Users see own org" ON public.organizations
  FOR SELECT TO authenticated
  USING (id = public.current_org_id());

CREATE POLICY "Admin can update org" ON public.organizations
  FOR UPDATE TO authenticated
  USING (id = public.current_org_id() AND public.current_role() = 'admin');

-- 7. RLS Policies for profiles
CREATE POLICY "Users see org profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (org_id = public.current_org_id());

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Admin can update any profile in org" ON public.profiles
  FOR UPDATE TO authenticated
  USING (org_id = public.current_org_id() AND public.current_role() = 'admin');

CREATE POLICY "Admin can insert profiles" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (org_id = public.current_org_id() AND public.current_role() = 'admin');

-- =============================================
-- FASE 2: Catálogos Parametrizáveis
-- =============================================

-- Plans
CREATE TABLE public.plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  months_validity int NOT NULL DEFAULT 1,
  discount_percent numeric NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_plans_org ON public.plans(org_id);
CREATE TRIGGER set_updated_at_plans BEFORE UPDATE ON public.plans FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Systems Catalog
CREATE TABLE public.systems_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  cost_value numeric NOT NULL DEFAULT 0,
  sale_value numeric NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.systems_catalog ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_systems_catalog_org ON public.systems_catalog(org_id);
CREATE TRIGGER set_updated_at_systems_catalog BEFORE UPDATE ON public.systems_catalog FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- System Modules
CREATE TABLE public.system_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  system_id uuid REFERENCES public.systems_catalog(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  cost_value numeric NOT NULL DEFAULT 0,
  sale_value numeric NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.system_modules ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_system_modules_org ON public.system_modules(org_id);
CREATE TRIGGER set_updated_at_system_modules BEFORE UPDATE ON public.system_modules FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Payment Methods
CREATE TABLE public.payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_payment_methods_org ON public.payment_methods(org_id);
CREATE TRIGGER set_updated_at_payment_methods BEFORE UPDATE ON public.payment_methods FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =============================================
-- FASE 3: Clientes
-- =============================================

CREATE TABLE public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  external_client_id text,
  name text NOT NULL,
  document text,
  phone text,
  email text,
  city text,
  status text NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo','atraso','suspenso','cancelado')),
  contract_signed_at date,
  -- Contador
  accountant_name text,
  accountant_phone text,
  accountant_email text,
  accountant_office text,
  -- Certificado digital
  cert_serial text,
  cert_issuer text,
  cert_recognition_date date,
  cert_expires_at date,
  cert_file_path text,
  -- Plano
  plan_id uuid REFERENCES public.plans(id) ON DELETE SET NULL,
  monthly_value_base numeric NOT NULL DEFAULT 0,
  monthly_value_final numeric NOT NULL DEFAULT 0,
  recurrence_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_clients_org ON public.clients(org_id);
CREATE INDEX idx_clients_status ON public.clients(status);
CREATE TRIGGER set_updated_at_clients BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =============================================
-- FASE 4: Propostas e CRM
-- =============================================

CREATE TABLE public.crm_statuses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.crm_statuses ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_crm_statuses_org ON public.crm_statuses(org_id);
CREATE TRIGGER set_updated_at_crm_statuses BEFORE UPDATE ON public.crm_statuses FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TABLE public.proposal_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL UNIQUE REFERENCES public.organizations(id) ON DELETE CASCADE,
  default_valid_days int NOT NULL DEFAULT 15,
  default_send_method text NOT NULL DEFAULT 'whatsapp',
  default_message_template text,
  company_name text,
  logo_path text,
  pdf_footer text,
  additional_info_default text,
  alert_days_before_expiry int NOT NULL DEFAULT 30,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.proposal_settings ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER set_updated_at_proposal_settings BEFORE UPDATE ON public.proposal_settings FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TABLE public.proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  proposal_number text NOT NULL,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  client_name_snapshot text,
  system_name text,
  plan_name text,
  monthly_value numeric NOT NULL DEFAULT 0,
  implementation_value numeric NOT NULL DEFAULT 0,
  implementation_flow text DEFAULT 'a_vista',
  implementation_installments int,
  sent_at timestamptz,
  valid_days int NOT NULL DEFAULT 15,
  valid_until timestamptz,
  crm_status text,
  view_status text NOT NULL DEFAULT 'nao_enviado' CHECK (view_status IN ('nao_enviado','enviado','visualizado','nao_abriu')),
  acceptance_status text NOT NULL DEFAULT 'pendente' CHECK (acceptance_status IN ('pendente','aceitou','recusou')),
  acceptance_link text,
  pdf_generated_at timestamptz,
  notes_internal text,
  additional_info text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(org_id, proposal_number)
);
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_proposals_org ON public.proposals(org_id);
CREATE INDEX idx_proposals_client ON public.proposals(client_id);
CREATE TRIGGER set_updated_at_proposals BEFORE UPDATE ON public.proposals FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TABLE public.proposal_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  proposal_id uuid NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  description text NOT NULL,
  quantity numeric NOT NULL DEFAULT 1,
  unit_value numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.proposal_items ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_proposal_items_proposal ON public.proposal_items(proposal_id);
CREATE TRIGGER set_updated_at_proposal_items BEFORE UPDATE ON public.proposal_items FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =============================================
-- FASE 5: Tarefas / Suporte
-- =============================================

CREATE TABLE public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  assignee_profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  priority text NOT NULL DEFAULT 'media',
  status text NOT NULL DEFAULT 'a_fazer',
  tipo_operacional text NOT NULL DEFAULT 'interno',
  sistema_relacionado text,
  due_at timestamptz,
  tags text[] DEFAULT '{}',
  total_seconds int NOT NULL DEFAULT 0,
  timer_running boolean NOT NULL DEFAULT false,
  timer_started_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_tasks_org ON public.tasks(org_id);
CREATE INDEX idx_tasks_assignee ON public.tasks(assignee_profile_id);
CREATE INDEX idx_tasks_client ON public.tasks(client_id);
CREATE TRIGGER set_updated_at_tasks BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TABLE public.task_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  author_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_task_comments_task ON public.task_comments(task_id);
CREATE TRIGGER set_updated_at_task_comments BEFORE UPDATE ON public.task_comments FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TABLE public.task_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  action text NOT NULL,
  details text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.task_history ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_task_history_task ON public.task_history(task_id);

CREATE TABLE public.support_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'suporte' CHECK (type IN ('suporte','implantacao','treinamento')),
  duration_minutes int NOT NULL DEFAULT 0,
  resolved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.support_events ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_support_events_client ON public.support_events(client_id);

-- =============================================
-- FASE 6: Financeiro
-- =============================================

CREATE TABLE public.bank_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  bank text,
  agency text,
  account text,
  type text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_bank_accounts_org ON public.bank_accounts(org_id);
CREATE TRIGGER set_updated_at_bank_accounts BEFORE UPDATE ON public.bank_accounts FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TABLE public.financial_titles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('receber','pagar')),
  origin text,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  description text NOT NULL DEFAULT '',
  plan_account_code text,
  competency text,
  issued_at date,
  due_at date,
  value_original numeric NOT NULL DEFAULT 0,
  discount numeric NOT NULL DEFAULT 0,
  interest numeric NOT NULL DEFAULT 0,
  fine numeric NOT NULL DEFAULT 0,
  value_final numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'aberto' CHECK (status IN ('aberto','pago','parcial','vencido','cancelado')),
  payment_method_id uuid REFERENCES public.payment_methods(id) ON DELETE SET NULL,
  bank_account_id uuid REFERENCES public.bank_accounts(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.financial_titles ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_financial_titles_org ON public.financial_titles(org_id);
CREATE INDEX idx_financial_titles_client ON public.financial_titles(client_id);
CREATE INDEX idx_financial_titles_due ON public.financial_titles(due_at);
CREATE TRIGGER set_updated_at_financial_titles BEFORE UPDATE ON public.financial_titles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TABLE public.bank_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  bank_account_id uuid NOT NULL REFERENCES public.bank_accounts(id) ON DELETE CASCADE,
  date date NOT NULL,
  description text NOT NULL DEFAULT '',
  value numeric NOT NULL DEFAULT 0,
  type text NOT NULL CHECK (type IN ('credito','debito')),
  reconciled boolean NOT NULL DEFAULT false,
  linked_title_id uuid REFERENCES public.financial_titles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.bank_transactions ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_bank_transactions_org ON public.bank_transactions(org_id);
CREATE INDEX idx_bank_transactions_account ON public.bank_transactions(bank_account_id);

-- =============================================
-- FASE 7: RLS Policies (padrão org_id para todas as tabelas)
-- =============================================

-- Macro: todas as tabelas de dados usam o mesmo padrão
-- SELECT: authenticated + org_id match
-- INSERT: authenticated + org_id match + role check
-- UPDATE: authenticated + org_id match + role check  
-- DELETE: authenticated + org_id match + admin only

-- Plans
CREATE POLICY "org_select" ON public.plans FOR SELECT TO authenticated USING (org_id = public.current_org_id());
CREATE POLICY "org_insert" ON public.plans FOR INSERT TO authenticated WITH CHECK (org_id = public.current_org_id() AND public.current_role() IN ('admin'));
CREATE POLICY "org_update" ON public.plans FOR UPDATE TO authenticated USING (org_id = public.current_org_id() AND public.current_role() IN ('admin'));
CREATE POLICY "org_delete" ON public.plans FOR DELETE TO authenticated USING (org_id = public.current_org_id() AND public.current_role() = 'admin');

-- Systems catalog
CREATE POLICY "org_select" ON public.systems_catalog FOR SELECT TO authenticated USING (org_id = public.current_org_id());
CREATE POLICY "org_insert" ON public.systems_catalog FOR INSERT TO authenticated WITH CHECK (org_id = public.current_org_id() AND public.current_role() IN ('admin'));
CREATE POLICY "org_update" ON public.systems_catalog FOR UPDATE TO authenticated USING (org_id = public.current_org_id() AND public.current_role() IN ('admin'));
CREATE POLICY "org_delete" ON public.systems_catalog FOR DELETE TO authenticated USING (org_id = public.current_org_id() AND public.current_role() = 'admin');

-- System modules
CREATE POLICY "org_select" ON public.system_modules FOR SELECT TO authenticated USING (org_id = public.current_org_id());
CREATE POLICY "org_insert" ON public.system_modules FOR INSERT TO authenticated WITH CHECK (org_id = public.current_org_id() AND public.current_role() IN ('admin'));
CREATE POLICY "org_update" ON public.system_modules FOR UPDATE TO authenticated USING (org_id = public.current_org_id() AND public.current_role() IN ('admin'));
CREATE POLICY "org_delete" ON public.system_modules FOR DELETE TO authenticated USING (org_id = public.current_org_id() AND public.current_role() = 'admin');

-- Payment methods
CREATE POLICY "org_select" ON public.payment_methods FOR SELECT TO authenticated USING (org_id = public.current_org_id());
CREATE POLICY "org_insert" ON public.payment_methods FOR INSERT TO authenticated WITH CHECK (org_id = public.current_org_id() AND public.current_role() IN ('admin'));
CREATE POLICY "org_update" ON public.payment_methods FOR UPDATE TO authenticated USING (org_id = public.current_org_id() AND public.current_role() IN ('admin'));
CREATE POLICY "org_delete" ON public.payment_methods FOR DELETE TO authenticated USING (org_id = public.current_org_id() AND public.current_role() = 'admin');

-- Clients
CREATE POLICY "org_select" ON public.clients FOR SELECT TO authenticated USING (org_id = public.current_org_id());
CREATE POLICY "org_insert" ON public.clients FOR INSERT TO authenticated WITH CHECK (org_id = public.current_org_id() AND public.current_role() IN ('admin','comercial','suporte','implantacao'));
CREATE POLICY "org_update" ON public.clients FOR UPDATE TO authenticated USING (org_id = public.current_org_id() AND public.current_role() IN ('admin','comercial','suporte','implantacao'));
CREATE POLICY "org_delete" ON public.clients FOR DELETE TO authenticated USING (org_id = public.current_org_id() AND public.current_role() = 'admin');

-- CRM Statuses
CREATE POLICY "org_select" ON public.crm_statuses FOR SELECT TO authenticated USING (org_id = public.current_org_id());
CREATE POLICY "org_insert" ON public.crm_statuses FOR INSERT TO authenticated WITH CHECK (org_id = public.current_org_id() AND public.current_role() IN ('admin'));
CREATE POLICY "org_update" ON public.crm_statuses FOR UPDATE TO authenticated USING (org_id = public.current_org_id() AND public.current_role() IN ('admin'));
CREATE POLICY "org_delete" ON public.crm_statuses FOR DELETE TO authenticated USING (org_id = public.current_org_id() AND public.current_role() = 'admin');

-- Proposal settings
CREATE POLICY "org_select" ON public.proposal_settings FOR SELECT TO authenticated USING (org_id = public.current_org_id());
CREATE POLICY "org_insert" ON public.proposal_settings FOR INSERT TO authenticated WITH CHECK (org_id = public.current_org_id() AND public.current_role() IN ('admin'));
CREATE POLICY "org_update" ON public.proposal_settings FOR UPDATE TO authenticated USING (org_id = public.current_org_id() AND public.current_role() IN ('admin','comercial'));
CREATE POLICY "org_delete" ON public.proposal_settings FOR DELETE TO authenticated USING (org_id = public.current_org_id() AND public.current_role() = 'admin');

-- Proposals
CREATE POLICY "org_select" ON public.proposals FOR SELECT TO authenticated USING (org_id = public.current_org_id());
CREATE POLICY "org_insert" ON public.proposals FOR INSERT TO authenticated WITH CHECK (org_id = public.current_org_id() AND public.current_role() IN ('admin','comercial'));
CREATE POLICY "org_update" ON public.proposals FOR UPDATE TO authenticated USING (org_id = public.current_org_id() AND public.current_role() IN ('admin','comercial'));
CREATE POLICY "org_delete" ON public.proposals FOR DELETE TO authenticated USING (org_id = public.current_org_id() AND public.current_role() = 'admin');

-- Proposal items
CREATE POLICY "org_select" ON public.proposal_items FOR SELECT TO authenticated USING (org_id = public.current_org_id());
CREATE POLICY "org_insert" ON public.proposal_items FOR INSERT TO authenticated WITH CHECK (org_id = public.current_org_id() AND public.current_role() IN ('admin','comercial'));
CREATE POLICY "org_update" ON public.proposal_items FOR UPDATE TO authenticated USING (org_id = public.current_org_id() AND public.current_role() IN ('admin','comercial'));
CREATE POLICY "org_delete" ON public.proposal_items FOR DELETE TO authenticated USING (org_id = public.current_org_id() AND public.current_role() = 'admin');

-- Tasks
CREATE POLICY "org_select" ON public.tasks FOR SELECT TO authenticated USING (org_id = public.current_org_id());
CREATE POLICY "org_insert" ON public.tasks FOR INSERT TO authenticated WITH CHECK (org_id = public.current_org_id() AND public.current_role() IN ('admin','suporte','implantacao','comercial'));
CREATE POLICY "org_update" ON public.tasks FOR UPDATE TO authenticated USING (org_id = public.current_org_id() AND public.current_role() IN ('admin','suporte','implantacao','comercial'));
CREATE POLICY "org_delete" ON public.tasks FOR DELETE TO authenticated USING (org_id = public.current_org_id() AND public.current_role() = 'admin');

-- Task comments
CREATE POLICY "org_select" ON public.task_comments FOR SELECT TO authenticated USING (org_id = public.current_org_id());
CREATE POLICY "org_insert" ON public.task_comments FOR INSERT TO authenticated WITH CHECK (org_id = public.current_org_id());
CREATE POLICY "org_update" ON public.task_comments FOR UPDATE TO authenticated USING (org_id = public.current_org_id() AND author_profile_id = auth.uid());
CREATE POLICY "org_delete" ON public.task_comments FOR DELETE TO authenticated USING (org_id = public.current_org_id() AND (author_profile_id = auth.uid() OR public.current_role() = 'admin'));

-- Task history
CREATE POLICY "org_select" ON public.task_history FOR SELECT TO authenticated USING (org_id = public.current_org_id());
CREATE POLICY "org_insert" ON public.task_history FOR INSERT TO authenticated WITH CHECK (org_id = public.current_org_id());

-- Support events
CREATE POLICY "org_select" ON public.support_events FOR SELECT TO authenticated USING (org_id = public.current_org_id());
CREATE POLICY "org_insert" ON public.support_events FOR INSERT TO authenticated WITH CHECK (org_id = public.current_org_id() AND public.current_role() IN ('admin','suporte','implantacao'));
CREATE POLICY "org_update" ON public.support_events FOR UPDATE TO authenticated USING (org_id = public.current_org_id() AND public.current_role() IN ('admin','suporte','implantacao'));

-- Bank accounts
CREATE POLICY "org_select" ON public.bank_accounts FOR SELECT TO authenticated USING (org_id = public.current_org_id());
CREATE POLICY "org_insert" ON public.bank_accounts FOR INSERT TO authenticated WITH CHECK (org_id = public.current_org_id() AND public.current_role() IN ('admin','financeiro'));
CREATE POLICY "org_update" ON public.bank_accounts FOR UPDATE TO authenticated USING (org_id = public.current_org_id() AND public.current_role() IN ('admin','financeiro'));
CREATE POLICY "org_delete" ON public.bank_accounts FOR DELETE TO authenticated USING (org_id = public.current_org_id() AND public.current_role() = 'admin');

-- Financial titles
CREATE POLICY "org_select" ON public.financial_titles FOR SELECT TO authenticated USING (org_id = public.current_org_id());
CREATE POLICY "org_insert" ON public.financial_titles FOR INSERT TO authenticated WITH CHECK (org_id = public.current_org_id() AND public.current_role() IN ('admin','financeiro'));
CREATE POLICY "org_update" ON public.financial_titles FOR UPDATE TO authenticated USING (org_id = public.current_org_id() AND public.current_role() IN ('admin','financeiro'));
CREATE POLICY "org_delete" ON public.financial_titles FOR DELETE TO authenticated USING (org_id = public.current_org_id() AND public.current_role() = 'admin');

-- Bank transactions
CREATE POLICY "org_select" ON public.bank_transactions FOR SELECT TO authenticated USING (org_id = public.current_org_id());
CREATE POLICY "org_insert" ON public.bank_transactions FOR INSERT TO authenticated WITH CHECK (org_id = public.current_org_id() AND public.current_role() IN ('admin','financeiro'));
CREATE POLICY "org_update" ON public.bank_transactions FOR UPDATE TO authenticated USING (org_id = public.current_org_id() AND public.current_role() IN ('admin','financeiro'));

-- =============================================
-- FASE 8: Storage Buckets
-- =============================================

INSERT INTO storage.buckets (id, name, public) VALUES ('logos', 'logos', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('certificates', 'certificates', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('proposal_pdfs', 'proposal_pdfs', false);

-- Storage policies
CREATE POLICY "Authenticated users can upload to logos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'logos');

CREATE POLICY "Authenticated users can read logos" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'logos');

CREATE POLICY "Authenticated users can upload certificates" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'certificates');

CREATE POLICY "Authenticated users can read certificates" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'certificates');

CREATE POLICY "Authenticated users can upload proposal pdfs" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'proposal_pdfs');

CREATE POLICY "Authenticated users can read proposal pdfs" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'proposal_pdfs');
