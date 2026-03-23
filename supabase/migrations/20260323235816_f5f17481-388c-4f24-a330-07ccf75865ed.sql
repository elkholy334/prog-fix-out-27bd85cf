ALTER TABLE public.technicians ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;
UPDATE public.technicians SET is_admin = true WHERE id = '17d4e5a1-fdbb-4e4e-9893-97cadd56ce4a';