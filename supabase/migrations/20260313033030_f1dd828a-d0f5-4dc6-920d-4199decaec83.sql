
-- Add deployment cost columns to company_profile
ALTER TABLE company_profile
  ADD COLUMN IF NOT EXISTS impl_cost_per_km numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS impl_daily_rate numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS impl_default_days integer NOT NULL DEFAULT 1;

-- Create deployment_regions table
CREATE TABLE IF NOT EXISTS deployment_regions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  base_value numeric NOT NULL DEFAULT 0,
  additional_fee numeric NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE deployment_regions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dr_select" ON deployment_regions FOR SELECT TO authenticated
  USING (org_id = current_org_id());

CREATE POLICY "dr_insert" ON deployment_regions FOR INSERT TO authenticated
  WITH CHECK (org_id = current_org_id() AND "current_role"() = 'admin');

CREATE POLICY "dr_update" ON deployment_regions FOR UPDATE TO authenticated
  USING (org_id = current_org_id() AND "current_role"() = 'admin');

CREATE POLICY "dr_delete" ON deployment_regions FOR DELETE TO authenticated
  USING (org_id = current_org_id() AND "current_role"() = 'admin');

CREATE TRIGGER set_updated_at BEFORE UPDATE ON deployment_regions
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
