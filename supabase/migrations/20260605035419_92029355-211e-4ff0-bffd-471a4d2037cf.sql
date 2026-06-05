
-- =========================
-- TASKS: authenticated only
-- =========================
DROP POLICY IF EXISTS "Anyone can read tasks" ON public.tasks;
DROP POLICY IF EXISTS "Anyone can insert tasks" ON public.tasks;
DROP POLICY IF EXISTS "Anyone can update tasks" ON public.tasks;
DROP POLICY IF EXISTS "Anyone can delete tasks" ON public.tasks;

REVOKE ALL ON public.tasks FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks TO authenticated;

CREATE POLICY "Authenticated can read tasks"
  ON public.tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert tasks"
  ON public.tasks FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update tasks"
  ON public.tasks FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admins can delete tasks"
  ON public.tasks FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- =========================
-- APP_SETTINGS: read auth, write admin
-- =========================
DROP POLICY IF EXISTS "Anyone can read settings" ON public.app_settings;
DROP POLICY IF EXISTS "Anyone can insert settings" ON public.app_settings;
DROP POLICY IF EXISTS "Anyone can update settings" ON public.app_settings;
DROP POLICY IF EXISTS "Anyone can delete settings" ON public.app_settings;

REVOKE ALL ON public.app_settings FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.app_settings TO authenticated;

CREATE POLICY "Admins can read settings"
  ON public.app_settings FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert settings"
  ON public.app_settings FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update settings"
  ON public.app_settings FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete settings"
  ON public.app_settings FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- =========================
-- TECHNICIANS: read auth, write admin
-- =========================
DROP POLICY IF EXISTS "Anyone can read technicians" ON public.technicians;
DROP POLICY IF EXISTS "Anyone can insert technicians" ON public.technicians;
DROP POLICY IF EXISTS "Anyone can update technicians" ON public.technicians;
DROP POLICY IF EXISTS "Anyone can delete technicians" ON public.technicians;

REVOKE ALL ON public.technicians FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.technicians TO authenticated;

CREATE POLICY "Authenticated can read technicians"
  ON public.technicians FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert technicians"
  ON public.technicians FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update technicians"
  ON public.technicians FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete technicians"
  ON public.technicians FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- =========================
-- WHATSAPP_LOGS: admin only
-- =========================
DROP POLICY IF EXISTS "Authenticated users can read logs" ON public.whatsapp_logs;
DROP POLICY IF EXISTS "Authenticated users can insert logs" ON public.whatsapp_logs;
DROP POLICY IF EXISTS "Authenticated users can update logs" ON public.whatsapp_logs;
DROP POLICY IF EXISTS "Authenticated users can delete logs" ON public.whatsapp_logs;

REVOKE ALL ON public.whatsapp_logs FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_logs TO authenticated;

CREATE POLICY "Admins can read whatsapp logs"
  ON public.whatsapp_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert whatsapp logs"
  ON public.whatsapp_logs FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update whatsapp logs"
  ON public.whatsapp_logs FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete whatsapp logs"
  ON public.whatsapp_logs FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- =========================
-- TECHNICIAN_TRANSACTIONS: own read; admin manage
-- =========================
DROP POLICY IF EXISTS "Authenticated users can read transactions" ON public.technician_transactions;
DROP POLICY IF EXISTS "Authenticated users can insert transactions" ON public.technician_transactions;
DROP POLICY IF EXISTS "Authenticated users can update transactions" ON public.technician_transactions;
DROP POLICY IF EXISTS "Authenticated users can delete transactions" ON public.technician_transactions;

REVOKE ALL ON public.technician_transactions FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.technician_transactions TO authenticated;

CREATE POLICY "Techs read own or admin reads all"
  ON public.technician_transactions FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR technician_id IN (
      SELECT technician_id FROM public.profiles WHERE id = auth.uid()
    )
  );
CREATE POLICY "Admins can insert transactions"
  ON public.technician_transactions FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update transactions"
  ON public.technician_transactions FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete transactions"
  ON public.technician_transactions FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- =========================
-- Revoke execute on internal SECURITY DEFINER trigger helpers
-- =========================
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
