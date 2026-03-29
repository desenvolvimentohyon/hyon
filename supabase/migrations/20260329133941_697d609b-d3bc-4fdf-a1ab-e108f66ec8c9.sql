
-- dev_projects
CREATE TABLE public.dev_projects (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid NOT NULL REFERENCES public.organizations(id),
  client_id uuid REFERENCES public.clients(id),
  title text NOT NULL,
  description text DEFAULT '',
  status text NOT NULL DEFAULT 'planejamento',
  plan_type text NOT NULL DEFAULT 'unico',
  project_value numeric NOT NULL DEFAULT 0,
  monthly_value numeric NOT NULL DEFAULT 0,
  setup_value numeric NOT NULL DEFAULT 0,
  started_at date,
  deadline_at date,
  completed_at date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.dev_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dp_select" ON public.dev_projects FOR SELECT TO authenticated
  USING (org_id = current_org_id());
CREATE POLICY "dp_insert" ON public.dev_projects FOR INSERT TO authenticated
  WITH CHECK (org_id = current_org_id() AND has_permission('desenvolvimento:criar'));
CREATE POLICY "dp_update" ON public.dev_projects FOR UPDATE TO authenticated
  USING (org_id = current_org_id() AND has_permission('desenvolvimento:editar'));
CREATE POLICY "dp_delete" ON public.dev_projects FOR DELETE TO authenticated
  USING (org_id = current_org_id() AND has_permission('desenvolvimento:excluir'));

-- dev_project_stages
CREATE TABLE public.dev_project_stages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid NOT NULL REFERENCES public.organizations(id),
  project_id uuid NOT NULL REFERENCES public.dev_projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pendente',
  deadline_at date,
  completed_at date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.dev_project_stages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dps_select" ON public.dev_project_stages FOR SELECT TO authenticated
  USING (org_id = current_org_id());
CREATE POLICY "dps_insert" ON public.dev_project_stages FOR INSERT TO authenticated
  WITH CHECK (org_id = current_org_id() AND has_permission('desenvolvimento:criar'));
CREATE POLICY "dps_update" ON public.dev_project_stages FOR UPDATE TO authenticated
  USING (org_id = current_org_id() AND has_permission('desenvolvimento:editar'));
CREATE POLICY "dps_delete" ON public.dev_project_stages FOR DELETE TO authenticated
  USING (org_id = current_org_id() AND has_permission('desenvolvimento:excluir'));

-- dev_project_checklist
CREATE TABLE public.dev_project_checklist (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid NOT NULL REFERENCES public.organizations(id),
  project_id uuid NOT NULL REFERENCES public.dev_projects(id) ON DELETE CASCADE,
  stage_id uuid REFERENCES public.dev_project_stages(id) ON DELETE SET NULL,
  title text NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.dev_project_checklist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dpc_select" ON public.dev_project_checklist FOR SELECT TO authenticated
  USING (org_id = current_org_id());
CREATE POLICY "dpc_insert" ON public.dev_project_checklist FOR INSERT TO authenticated
  WITH CHECK (org_id = current_org_id() AND has_permission('desenvolvimento:criar'));
CREATE POLICY "dpc_update" ON public.dev_project_checklist FOR UPDATE TO authenticated
  USING (org_id = current_org_id() AND has_permission('desenvolvimento:editar'));
CREATE POLICY "dpc_delete" ON public.dev_project_checklist FOR DELETE TO authenticated
  USING (org_id = current_org_id() AND has_permission('desenvolvimento:excluir'));
