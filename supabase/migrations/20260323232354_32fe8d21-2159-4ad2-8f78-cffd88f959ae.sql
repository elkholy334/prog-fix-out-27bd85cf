
-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Technicians table
CREATE TABLE public.technicians (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#f59e0b',
  tasks_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.technicians ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read technicians" ON public.technicians FOR SELECT USING (true);
CREATE POLICY "Anyone can insert technicians" ON public.technicians FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update technicians" ON public.technicians FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete technicians" ON public.technicians FOR DELETE USING (true);

CREATE TRIGGER update_technicians_updated_at
  BEFORE UPDATE ON public.technicians
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Tasks table
CREATE TABLE public.tasks (
  id SERIAL PRIMARY KEY,
  client_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT DEFAULT '',
  type TEXT NOT NULL DEFAULT 'أخرى',
  problem TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'waiting',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  scheduled_date DATE,
  scheduled_time TEXT DEFAULT '',
  repair_date DATE,
  start_time TEXT,
  technician_id UUID REFERENCES public.technicians(id),
  assigned_technicians UUID[] DEFAULT '{}',
  required_technician UUID REFERENCES public.technicians(id),
  expected_amount NUMERIC DEFAULT 0,
  paid_amount NUMERIC DEFAULT 0,
  technician_commission NUMERIC DEFAULT 0,
  shop_net NUMERIC DEFAULT 0,
  is_favorite BOOLEAN DEFAULT false
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read tasks" ON public.tasks FOR SELECT USING (true);
CREATE POLICY "Anyone can insert tasks" ON public.tasks FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update tasks" ON public.tasks FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete tasks" ON public.tasks FOR DELETE USING (true);

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Settings table (key-value store)
CREATE TABLE public.app_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read settings" ON public.app_settings FOR SELECT USING (true);
CREATE POLICY "Anyone can insert settings" ON public.app_settings FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update settings" ON public.app_settings FOR UPDATE USING (true);

CREATE TRIGGER update_settings_updated_at
  BEFORE UPDATE ON public.app_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
