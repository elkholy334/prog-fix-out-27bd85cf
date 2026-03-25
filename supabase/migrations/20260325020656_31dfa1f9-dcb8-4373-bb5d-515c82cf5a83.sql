CREATE TABLE public.whatsapp_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id integer REFERENCES public.tasks(id) ON DELETE SET NULL,
  recipient_phone text NOT NULL,
  recipient_name text NOT NULL DEFAULT '',
  message_type text NOT NULL DEFAULT 'general',
  message_text text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  error_message text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.whatsapp_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read logs" ON public.whatsapp_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert logs" ON public.whatsapp_logs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update logs" ON public.whatsapp_logs FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete logs" ON public.whatsapp_logs FOR DELETE TO authenticated USING (true);