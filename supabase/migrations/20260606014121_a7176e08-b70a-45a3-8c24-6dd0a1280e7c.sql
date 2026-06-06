DROP POLICY IF EXISTS "Authenticated can read tasks" ON public.tasks;
DROP POLICY IF EXISTS "Admins can read all tasks" ON public.tasks;
DROP POLICY IF EXISTS "Technicians read only assigned tasks" ON public.tasks;

CREATE POLICY "Admins can read all tasks"
ON public.tasks FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Technicians read only assigned tasks"
ON public.tasks FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.technician_id IS NOT NULL
      AND (
        public.tasks.technician_id = p.technician_id
        OR public.tasks.required_technician = p.technician_id
        OR p.technician_id = ANY(COALESCE(public.tasks.assigned_technicians, ARRAY[]::uuid[]))
      )
  )
);