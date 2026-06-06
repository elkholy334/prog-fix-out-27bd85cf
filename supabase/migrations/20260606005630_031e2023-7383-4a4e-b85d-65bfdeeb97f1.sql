
CREATE OR REPLACE FUNCTION public.get_login_users()
RETURNS TABLE(id uuid, name text, email text, color text, is_admin boolean)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, name, email, color, is_admin
  FROM public.technicians
  WHERE is_active = true
  ORDER BY name;
$$;

REVOKE ALL ON FUNCTION public.get_login_users() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_login_users() TO anon, authenticated;
