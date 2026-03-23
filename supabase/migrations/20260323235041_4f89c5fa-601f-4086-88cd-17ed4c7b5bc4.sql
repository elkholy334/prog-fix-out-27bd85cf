ALTER TABLE public.technicians ADD COLUMN IF NOT EXISTS email text;

UPDATE public.technicians SET email = 'nebrawy@app.com' WHERE id = '63c44aed-cbfb-4a07-ac14-cfa6bad9fece';
UPDATE public.technicians SET email = 'mostafa@app.com' WHERE id = '87a24c60-3e89-404d-a060-eac478e7ea20';
UPDATE public.technicians SET email = 'alishaat@app.com' WHERE id = '011c42db-901a-4ee3-aece-2fa15542b301';
UPDATE public.technicians SET email = 'hesham@app.com' WHERE id = '0e8a5913-0591-404f-af7b-fde7cd9a76a2';
UPDATE public.technicians SET email = 'arboud@app.com' WHERE id = '658a4745-4dff-412f-94ca-f672e8de4575';
UPDATE public.technicians SET email = 'on@app.com' WHERE id = '2dc02d54-bfda-4a6b-920a-4e4bf2e58967';
UPDATE public.technicians SET email = 'serawy@app.com' WHERE id = '4d46f9ea-f3ad-410f-b35b-294ae6f90e1c';
UPDATE public.technicians SET email = 'ahmadredwan@app.com' WHERE id = '331ebdcf-c964-4418-9739-8f831d7d887c';
UPDATE public.technicians SET email = 'kareemelkholy@app.com' WHERE id = '9caf9c0a-c248-4122-8a7e-f2cc088ebef6';
UPDATE public.technicians SET email = 'ahmadelkholy@app.com' WHERE id = '17d4e5a1-fdbb-4e4e-9893-97cadd56ce4a';
UPDATE public.technicians SET email = 'sonbol@app.com' WHERE id = '071424b5-4756-4660-8530-1b4727665b12';