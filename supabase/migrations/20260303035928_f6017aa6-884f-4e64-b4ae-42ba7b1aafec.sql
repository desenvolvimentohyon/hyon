
-- 1. Extend tasks table with metadata JSONB
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}';

-- 2. Extend clients table for ReceitaContext fields
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS cancelled_at date;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS cancellation_reason text;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS system_name text;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS cost_active boolean NOT NULL DEFAULT false;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS monthly_cost_value numeric NOT NULL DEFAULT 0;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS cost_system_name text;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}';

-- 3. Extend financial_titles with metadata
ALTER TABLE public.financial_titles ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE public.financial_titles ADD COLUMN IF NOT EXISTS supplier_name text;
ALTER TABLE public.financial_titles ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}';

-- 4. Plan accounts (chart of accounts)
CREATE TABLE IF NOT EXISTS public.plan_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id),
  code text NOT NULL,
  name text NOT NULL,
  type text NOT NULL DEFAULT 'receita',
  parent_id uuid REFERENCES public.plan_accounts(id),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.plan_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "plan_accounts_select" ON public.plan_accounts FOR SELECT USING (org_id = current_org_id());
CREATE POLICY "plan_accounts_insert" ON public.plan_accounts FOR INSERT WITH CHECK (org_id = current_org_id() AND "current_role"() = ANY(ARRAY['admin'::text, 'financeiro'::text]));
CREATE POLICY "plan_accounts_update" ON public.plan_accounts FOR UPDATE USING (org_id = current_org_id() AND "current_role"() = ANY(ARRAY['admin'::text, 'financeiro'::text]));
CREATE POLICY "plan_accounts_delete" ON public.plan_accounts FOR DELETE USING (org_id = current_org_id() AND "current_role"() = 'admin'::text);
CREATE TRIGGER handle_plan_accounts_updated_at BEFORE UPDATE ON public.plan_accounts FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- 5. Monthly adjustments
CREATE TABLE IF NOT EXISTS public.monthly_adjustments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  adjustment_date timestamptz NOT NULL DEFAULT now(),
  previous_value numeric NOT NULL DEFAULT 0,
  new_value numeric NOT NULL DEFAULT 0,
  reason text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.monthly_adjustments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "monthly_adj_select" ON public.monthly_adjustments FOR SELECT USING (org_id = current_org_id());
CREATE POLICY "monthly_adj_insert" ON public.monthly_adjustments FOR INSERT WITH CHECK (org_id = current_org_id() AND "current_role"() = ANY(ARRAY['admin'::text, 'financeiro'::text]));
CREATE POLICY "monthly_adj_update" ON public.monthly_adjustments FOR UPDATE USING (org_id = current_org_id() AND "current_role"() = ANY(ARRAY['admin'::text, 'financeiro'::text]));

-- 6. Custom roles for RBAC
CREATE TABLE IF NOT EXISTS public.custom_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  permissions text[] NOT NULL DEFAULT '{}',
  is_system boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.custom_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "custom_roles_select" ON public.custom_roles FOR SELECT USING (org_id = current_org_id());
CREATE POLICY "custom_roles_insert" ON public.custom_roles FOR INSERT WITH CHECK (org_id = current_org_id() AND "current_role"() = 'admin'::text);
CREATE POLICY "custom_roles_update" ON public.custom_roles FOR UPDATE USING (org_id = current_org_id() AND "current_role"() = 'admin'::text);
CREATE POLICY "custom_roles_delete" ON public.custom_roles FOR DELETE USING (org_id = current_org_id() AND "current_role"() = 'admin'::text);
CREATE TRIGGER handle_custom_roles_updated_at BEFORE UPDATE ON public.custom_roles FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- 7. Add custom_role_id to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS custom_role_id uuid REFERENCES public.custom_roles(id);

-- 8. User settings for UI preferences
CREATE TABLE IF NOT EXISTS public.user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  org_id uuid NOT NULL REFERENCES public.organizations(id),
  settings jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_settings_select" ON public.user_settings FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "user_settings_insert" ON public.user_settings FOR INSERT WITH CHECK (user_id = auth.uid() AND org_id = current_org_id());
CREATE POLICY "user_settings_update" ON public.user_settings FOR UPDATE USING (user_id = auth.uid());
CREATE TRIGGER handle_user_settings_updated_at BEFORE UPDATE ON public.user_settings FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- 9. Function to get user permissions from custom_roles
CREATE OR REPLACE FUNCTION public.get_user_permissions(_user_id uuid)
RETURNS text[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(cr.permissions, '{}')
  FROM public.profiles p
  LEFT JOIN public.custom_roles cr ON cr.id = p.custom_role_id
  WHERE p.id = _user_id
$$;
