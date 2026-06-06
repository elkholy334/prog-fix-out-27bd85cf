
DROP POLICY IF EXISTS "Authenticated can insert tasks" ON public.tasks;
DROP POLICY IF EXISTS "Authenticated can update tasks" ON public.tasks;

CREATE POLICY "Admins can insert tasks"
ON public.tasks FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update tasks"
ON public.tasks FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Assigned technicians can update tasks"
ON public.tasks FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.technician_id IS NOT NULL
      AND (
        tasks.technician_id = p.technician_id
        OR tasks.required_technician = p.technician_id
        OR p.technician_id = ANY (COALESCE(tasks.assigned_technicians, ARRAY[]::uuid[]))
      )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.technician_id IS NOT NULL
      AND (
        tasks.technician_id = p.technician_id
        OR tasks.required_technician = p.technician_id
        OR p.technician_id = ANY (COALESCE(tasks.assigned_technicians, ARRAY[]::uuid[]))
      )
  )
);
