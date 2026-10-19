
-- Fix infinite recursion in profiles SELECT policy.
--
-- The previous migration replaced get_my_role() with an EXISTS subquery on
-- the profiles table itself.  When PostgREST evaluates that policy it reads
-- from profiles, which triggers the policy again → infinite recursion.
--
-- Profiles is the ONLY table that must use the SECURITY DEFINER function
-- get_my_role() so the role lookup bypasses RLS.  All other tables can safely
-- use EXISTS subqueries because they reference profiles from a different table.

DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id OR get_my_role() IN ('officer', 'admin'));

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id OR get_my_role() = 'admin')
  WITH CHECK (auth.uid() = id OR get_my_role() = 'admin');

DROP POLICY IF EXISTS "profiles_delete_admin" ON public.profiles;
CREATE POLICY "profiles_delete_admin" ON public.profiles FOR DELETE
  TO authenticated
  USING (get_my_role() = 'admin');
