CREATE OR REPLACE FUNCTION public.current_user_gym_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT gym_id FROM public.profiles WHERE id = auth.uid()
$$;

GRANT EXECUTE ON FUNCTION public.current_user_gym_id() TO authenticated;

DROP POLICY IF EXISTS "Users can view gym profiles" ON public.profiles;
CREATE POLICY "Users can view own and gym profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    id = auth.uid()
    OR gym_id = public.current_user_gym_id()
  );

DROP POLICY IF EXISTS "Users can insert gym profiles" ON public.profiles;
CREATE POLICY "Users can insert gym profiles"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (gym_id = public.current_user_gym_id());
