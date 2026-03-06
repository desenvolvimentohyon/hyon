CREATE OR REPLACE FUNCTION public.current_org_id()
 RETURNS uuid
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  RETURN (SELECT org_id FROM public.profiles WHERE id = auth.uid());
END;
$$;