
-- ============================================================
-- Security hardening
-- ============================================================

-- ── 1. Fix mutable search_path on handle_new_user ───────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'member')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- ── 2. Revoke EXECUTE on SECURITY DEFINER functions from anon ─
-- anon has no business calling these; RLS policies run as
-- the function owner (postgres) so authenticated access is
-- still needed for RLS to work correctly.
REVOKE ALL ON FUNCTION public.get_my_role() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_role() TO authenticated;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
-- handle_new_user is a trigger function — no role needs direct EXECUTE.

-- ── 3. Fix always-true INSERT policy on notifications ────────
-- Officers/admins notify members; members may notify themselves.
DROP POLICY IF EXISTS "notifications_insert" ON public.notifications;
CREATE POLICY "notifications_insert" ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('officer', 'admin')
    )
  );

-- ── 4. Fix always-true INSERT policy on audit_logs ───────────
-- Any authenticated user may log an action attributed to themselves
-- or with no user_id; officers/admins may log on behalf of anyone.
DROP POLICY IF EXISTS "audit_logs_insert" ON public.audit_logs;
CREATE POLICY "audit_logs_insert" ON public.audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    OR user_id IS NULL
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('officer', 'admin')
    )
  );

-- ── 5. Fix always-true INSERT policy on renewal_status_history ─
-- Only users who can see the linked renewal may append history.
DROP POLICY IF EXISTS "rsh_insert" ON public.renewal_status_history;
CREATE POLICY "rsh_insert" ON public.renewal_status_history FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.renewals r
      WHERE r.id = renewal_id
        AND (
          r.member_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.role IN ('officer', 'admin')
          )
        )
    )
  );

-- ── 6. Restrict storage listing to own files for members ─────
-- Public bucket URL access is unaffected (bucket is public).
-- This policy only controls the storage API listing endpoint.
DROP POLICY IF EXISTS "renewal_docs_select" ON storage.objects;
CREATE POLICY "renewal_docs_select" ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'renewal-documents'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND p.role IN ('officer', 'admin')
      )
    )
  );
