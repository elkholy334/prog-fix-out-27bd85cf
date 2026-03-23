-- Reassign tasks from "on" to "علي شعت"
UPDATE public.tasks SET technician_id = '011c42db-901a-4ee3-aece-2fa15542b301' WHERE technician_id = '2dc02d54-bfda-4a6b-920a-4e4bf2e58967';
UPDATE public.tasks SET required_technician = '011c42db-901a-4ee3-aece-2fa15542b301' WHERE required_technician = '2dc02d54-bfda-4a6b-920a-4e4bf2e58967';

-- Replace "on" in assigned_technicians arrays
UPDATE public.tasks 
SET assigned_technicians = array_replace(assigned_technicians, '2dc02d54-bfda-4a6b-920a-4e4bf2e58967', '011c42db-901a-4ee3-aece-2fa15542b301')
WHERE '2dc02d54-bfda-4a6b-920a-4e4bf2e58967' = ANY(assigned_technicians);

-- Deactivate "on"
UPDATE public.technicians SET is_active = false WHERE id = '2dc02d54-bfda-4a6b-920a-4e4bf2e58967';