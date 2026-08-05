-- Function to calculate MRR (Monthly Recurring Revenue)
CREATE OR REPLACE FUNCTION public.calculate_mrr(p_org_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_mrr NUMERIC;
BEGIN
    SELECT COALESCE(SUM(valor_mensal), 0)
    INTO v_mrr
    FROM public.clients
    WHERE org_id = p_org_id 
      AND status = 'ativo';
    
    RETURN v_mrr;
END;
$$;

GRANT EXECUTE ON FUNCTION public.calculate_mrr(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_mrr(UUID) TO service_role;

-- Function to calculate Churn Rate (last 30 days)
CREATE OR REPLACE FUNCTION public.calculate_churn_rate(p_org_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_total_active_start NUMERIC;
    v_total_cancelled NUMERIC;
    v_churn_rate NUMERIC;
BEGIN
    -- Clients active at the start of the 30-day period
    SELECT COUNT(*)
    INTO v_total_active_start
    FROM public.clients
    WHERE org_id = p_org_id 
      AND (status = 'ativo' OR (status = 'cancelado' AND deleted_at > now() - interval '30 days'));

    -- Clients cancelled in the last 30 days
    SELECT COUNT(*)
    INTO v_total_cancelled
    FROM public.clients
    WHERE org_id = p_org_id 
      AND status = 'cancelado' 
      AND deleted_at > now() - interval '30 days';

    IF v_total_active_start = 0 THEN
        RETURN 0;
    END IF;

    v_churn_rate := (v_total_cancelled::NUMERIC / v_total_active_start::NUMERIC) * 100;
    
    RETURN ROUND(v_churn_rate, 2);
END;
$$;

GRANT EXECUTE ON FUNCTION public.calculate_churn_rate(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_churn_rate(UUID) TO service_role;

-- Function to get a summary of analytics for the IA
CREATE OR REPLACE FUNCTION public.get_ia_analytics_summary(p_org_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_summary JSONB;
BEGIN
    SELECT jsonb_build_object(
        'mrr', public.calculate_mrr(p_org_id),
        'churn_rate', public.calculate_churn_rate(p_org_id),
        'active_clients', (SELECT COUNT(*) FROM public.clients WHERE org_id = p_org_id AND status = 'ativo'),
        'pending_tasks', (SELECT COUNT(*) FROM public.tasks WHERE org_id = p_org_id AND status NOT IN ('concluida', 'cancelada')),
        'upcoming_meetings', (SELECT COUNT(*) FROM public.meetings WHERE org_id = p_org_id AND start_time > now() AND start_time < now() + interval '24 hours')
    ) INTO v_summary;
    
    RETURN v_summary;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_ia_analytics_summary(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_ia_analytics_summary(UUID) TO service_role;
