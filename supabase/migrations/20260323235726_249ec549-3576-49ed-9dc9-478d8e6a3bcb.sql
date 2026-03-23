-- Reassign tasks from السراوي to النبراوي
UPDATE public.tasks SET technician_id = '63c44aed-cbfb-4a07-ac14-cfa6bad9fece' WHERE technician_id = '4d46f9ea-f3ad-410f-b35b-294ae6f90e1c';
UPDATE public.tasks SET required_technician = '63c44aed-cbfb-4a07-ac14-cfa6bad9fece' WHERE required_technician = '4d46f9ea-f3ad-410f-b35b-294ae6f90e1c';
UPDATE public.tasks SET assigned_technicians = array_replace(assigned_technicians, '4d46f9ea-f3ad-410f-b35b-294ae6f90e1c', '63c44aed-cbfb-4a07-ac14-cfa6bad9fece') WHERE '4d46f9ea-f3ad-410f-b35b-294ae6f90e1c' = ANY(assigned_technicians);

-- Deactivate السراوي
UPDATE public.technicians SET is_active = false WHERE id = '4d46f9ea-f3ad-410f-b35b-294ae6f90e1c';