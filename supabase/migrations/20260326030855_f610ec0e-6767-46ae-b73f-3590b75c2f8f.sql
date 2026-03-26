
DROP POLICY "org_update" ON public.clients;
CREATE POLICY "org_update" ON public.clients
  FOR UPDATE TO authenticated
  USING (
    org_id = current_org_id() 
    AND (
      "current_role"() = ANY(ARRAY['admin','comercial','suporte','implantacao'])
      OR has_permission('clientes:editar')
      OR has_permission('clientes:cancelar')
    )
  );
