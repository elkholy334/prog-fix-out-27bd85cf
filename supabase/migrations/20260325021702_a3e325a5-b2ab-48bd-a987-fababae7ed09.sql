CREATE TABLE public.technician_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  technician_id uuid NOT NULL REFERENCES public.technicians(id) ON DELETE CASCADE,
  task_id integer REFERENCES public.tasks(id) ON DELETE SET NULL,
  type text NOT NULL CHECK (type IN ('deposit', 'deduction', 'commission', 'settlement')),
  amount numeric NOT NULL DEFAULT 0,
  description text DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by text DEFAULT ''
);

ALTER TABLE public.technician_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read transactions" ON public.technician_transactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert transactions" ON public.technician_transactions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update transactions" ON public.technician_transactions FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete transactions" ON public.technician_transactions FOR DELETE TO authenticated USING (true);