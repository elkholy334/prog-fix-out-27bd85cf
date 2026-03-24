
ALTER TABLE public.technicians ADD COLUMN IF NOT EXISTS commission_rate numeric DEFAULT 0;

ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS technician_notes text DEFAULT '';
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS money_delivered_to_shop boolean DEFAULT false;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS completion_time text;
