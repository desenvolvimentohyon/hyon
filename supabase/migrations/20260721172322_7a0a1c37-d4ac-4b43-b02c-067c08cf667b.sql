ALTER TABLE public.system_modules ADD COLUMN IF NOT EXISTS system_ids uuid[] NOT NULL DEFAULT '{}';
UPDATE public.system_modules SET system_ids = ARRAY[system_id] WHERE system_id IS NOT NULL AND (system_ids IS NULL OR array_length(system_ids,1) IS NULL);
CREATE INDEX IF NOT EXISTS system_modules_system_ids_idx ON public.system_modules USING GIN (system_ids);