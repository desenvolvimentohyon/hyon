
CREATE POLICY "cm_update" ON public.client_modules
FOR UPDATE TO authenticated
USING ((org_id = current_org_id()) AND ("current_role"() = ANY (ARRAY['admin'::text, 'comercial'::text, 'suporte'::text, 'implantacao'::text])));
