-- Create recovery_plans table for auditing and history
CREATE TABLE public.recovery_plans (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id uuid DEFAULT auth.uid(),
    source_insight text NOT NULL,
    plan_content text NOT NULL,
    created_at timestamptz DEFAULT now(),
    created_by uuid REFERENCES auth.users(id)
);

-- Grant access
GRANT SELECT, INSERT ON public.recovery_plans TO authenticated;
GRANT ALL ON public.recovery_plans TO service_role;

-- Enable RLS
ALTER TABLE public.recovery_plans ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own recovery plans" 
ON public.recovery_plans FOR SELECT TO authenticated 
USING (true);

CREATE POLICY "Users can insert recovery plans" 
ON public.recovery_plans FOR INSERT TO authenticated 
WITH CHECK (true);
