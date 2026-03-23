-- Give أحمد الخولي admin role (get his user_id from profiles)
INSERT INTO public.user_roles (user_id, role)
SELECT p.id, 'admin'::app_role
FROM public.profiles p
WHERE p.technician_id = '17d4e5a1-fdbb-4e4e-9893-97cadd56ce4a'
ON CONFLICT (user_id, role) DO NOTHING;

-- Update admin email on technicians table to ahmadelkholy
UPDATE public.technicians SET email = 'ahmadelkholy@app.com' WHERE id = '17d4e5a1-fdbb-4e4e-9893-97cadd56ce4a';