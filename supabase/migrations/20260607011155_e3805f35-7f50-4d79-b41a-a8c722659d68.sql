
-- 1) Restrict profiles INSERT to service_role only (trigger uses definer)
DROP POLICY IF EXISTS "Service role can insert profiles" ON public.profiles;
CREATE POLICY "Service role can insert profiles"
  ON public.profiles
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- 2) Remove direct technician SELECT on tasks; expose via masked view
DROP POLICY IF EXISTS "Technicians read only assigned tasks" ON public.tasks;

CREATE OR REPLACE VIEW public.tasks_view
WITH (security_invoker = false) AS
SELECT
  t.id, t.client_name, t.address, t.type, t.problem, t.status,
  t.scheduled_date, t.repair_date, t.scheduled_time, t.start_time, t.completion_time,
  t.required_technician, t.technician_id, t.assigned_technicians,
  t.is_archived, t.is_favorite, t.sort_order, t.technician_notes,
  t.created_at, t.updated_at,
  CASE WHEN public.has_role(auth.uid(), 'admin'::public.app_role) THEN t.phone END AS phone,
  CASE WHEN public.has_role(auth.uid(), 'admin'::public.app_role) THEN t.expected_amount END AS expected_amount,
  CASE WHEN public.has_role(auth.uid(), 'admin'::public.app_role) THEN t.paid_amount END AS paid_amount,
  CASE WHEN public.has_role(auth.uid(), 'admin'::public.app_role) THEN t.shop_net END AS shop_net,
  CASE WHEN public.has_role(auth.uid(), 'admin'::public.app_role) THEN t.technician_commission END AS technician_commission,
  CASE WHEN public.has_role(auth.uid(), 'admin'::public.app_role) THEN t.money_delivered_to_shop END AS money_delivered_to_shop
FROM public.tasks t
WHERE
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.technician_id IS NOT NULL
      AND (t.technician_id = p.technician_id
        OR t.required_technician = p.technician_id
        OR p.technician_id = ANY (COALESCE(t.assigned_technicians, ARRAY[]::uuid[])))
  );

REVOKE ALL ON public.tasks_view FROM PUBLIC, anon;
GRANT SELECT ON public.tasks_view TO authenticated;

-- 3) Technicians: restrict sensitive columns; expose safe public view
DROP POLICY IF EXISTS "Authenticated can read technicians" ON public.technicians;
CREATE POLICY "Admins can read all technicians"
  ON public.technicians
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE OR REPLACE VIEW public.technicians_public
WITH (security_invoker = false) AS
SELECT id, name, color, is_admin, is_active, tasks_count
FROM public.technicians;

REVOKE ALL ON public.technicians_public FROM PUBLIC, anon;
GRANT SELECT ON public.technicians_public TO authenticated;
