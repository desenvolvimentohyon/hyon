
ALTER TABLE public.tasks ADD COLUMN linked_ticket_id uuid REFERENCES public.portal_tickets(id) ON DELETE SET NULL;
ALTER TABLE public.portal_tickets ADD COLUMN linked_task_id uuid REFERENCES public.tasks(id) ON DELETE SET NULL;
