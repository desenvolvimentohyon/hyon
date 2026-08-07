-- Drop tables related to Card module
DROP TABLE IF EXISTS public.card_revenue_monthly CASCADE;
DROP TABLE IF EXISTS public.card_commissions CASCADE;
DROP TABLE IF EXISTS public.card_proposal_onboarding CASCADE;
DROP TABLE IF EXISTS public.card_proposals CASCADE;
DROP TABLE IF EXISTS public.card_clients CASCADE;
DROP TABLE IF EXISTS public.card_fee_profiles CASCADE;

-- Drop tables related to Development module
DROP TABLE IF EXISTS public.dev_project_checklist CASCADE;
DROP TABLE IF EXISTS public.dev_project_stages CASCADE;
DROP TABLE IF EXISTS public.dev_projects CASCADE;
DROP TABLE IF EXISTS public.dev_templates CASCADE;

-- Remove contract template categories if any related to these modules
DELETE FROM public.contract_templates WHERE category IN ('Cartões', 'Desenvolvimento');
