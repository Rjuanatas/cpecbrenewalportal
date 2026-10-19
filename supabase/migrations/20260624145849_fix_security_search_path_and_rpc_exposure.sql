-- ============================================================
-- Security Fix 1: Immutable search_path on handle_new_user
--
-- The populate_profile_from_signup_metadata migration overwrote
-- handle_new_user without SET search_path, re-introducing the
-- mutable search_path vulnerability. Fix: use SET search_path = ''
-- and fully-qualify every object reference.
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (
    id, email, role,
    first_name, middle_name, last_name,
    mobile_number, icpep_region
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'member'),
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'middle_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.raw_user_meta_data->>'mobile_number',
    NEW.raw_user_meta_data->>'icpep_region'
  )
  ON CONFLICT (id) DO UPDATE SET
    first_name    = COALESCE(EXCLUDED.first_name,    public.profiles.first_name),
    middle_name   = COALESCE(EXCLUDED.middle_name,   public.profiles.middle_name),
    last_name     = COALESCE(EXCLUDED.last_name,     public.profiles.last_name),
    mobile_number = COALESCE(EXCLUDED.mobile_number, public.profiles.mobile_number),
    icpep_region  = COALESCE(EXCLUDED.icpep_region,  public.profiles.icpep_region);
  RETURN NEW;
END;
$$;

-- ============================================================
-- Security Fix 2: Move get_my_role() out of the public schema
--
-- PostgREST exposes only the public schema via /rest/v1/rpc/.
-- Moving the function to the private schema prevents direct
-- REST API calls while keeping EXECUTE for authenticated so
-- that profiles RLS policies (which must use a SECURITY DEFINER
-- function to avoid infinite recursion) continue to work.
-- ============================================================

-- Step 1: Create private schema (idempotent)
CREATE SCHEMA IF NOT EXISTS private;

-- Step 2: Re-create the function in private with an immutable
--         search_path and full object qualification.
CREATE OR REPLACE FUNCTION private.get_my_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- Step 3: Grant only what is needed — authenticated must be able
--         to call private.get_my_role() from within RLS policies.
GRANT USAGE ON SCHEMA private TO authenticated;
GRANT EXECUTE ON FUNCTION private.get_my_role() TO authenticated;

-- Step 4: Update the three profiles policies that still call the
--         old public.get_my_role() (set by fix_profiles_policy_recursion).
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id OR private.get_my_role() IN ('officer', 'admin'));

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE
  TO authenticated
  USING  (auth.uid() = id OR private.get_my_role() = 'admin')
  WITH CHECK (auth.uid() = id OR private.get_my_role() = 'admin');

DROP POLICY IF EXISTS "profiles_delete_admin" ON public.profiles;
CREATE POLICY "profiles_delete_admin" ON public.profiles FOR DELETE
  TO authenticated
  USING (private.get_my_role() = 'admin');

-- Step 5: Revoke all direct access to the old public version and
--         drop it so the scanner no longer flags it.
REVOKE ALL ON FUNCTION public.get_my_role() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_my_role() FROM authenticated;
REVOKE ALL ON FUNCTION public.get_my_role() FROM anon;
DROP FUNCTION IF EXISTS public.get_my_role();
