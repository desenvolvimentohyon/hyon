
CREATE TABLE public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  user_agent text,
  device_name text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ps_select" ON public.push_subscriptions FOR SELECT TO authenticated
  USING (org_id = current_org_id() AND user_id = auth.uid());
CREATE POLICY "ps_insert" ON public.push_subscriptions FOR INSERT TO authenticated
  WITH CHECK (org_id = current_org_id() AND user_id = auth.uid());
CREATE POLICY "ps_update" ON public.push_subscriptions FOR UPDATE TO authenticated
  USING (org_id = current_org_id() AND user_id = auth.uid());
CREATE POLICY "ps_delete" ON public.push_subscriptions FOR DELETE TO authenticated
  USING (org_id = current_org_id() AND user_id = auth.uid());
