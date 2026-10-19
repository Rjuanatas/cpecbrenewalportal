
/*
# Fix RLS Policies — Replace get_my_role() with EXISTS subqueries

## Problem
The get_my_role() SECURITY DEFINER function returns NULL in some PostgREST/Supabase
query contexts, causing officers and admins to see no data.

## Fix
Replace all get_my_role() calls in RLS policies with direct EXISTS subqueries
against the profiles table. This is the recommended pattern for role-based RLS
in Supabase and is evaluated reliably for every row.

## Changes
- Drops and recreates all SELECT/UPDATE/DELETE policies on renewals, documents,
  notifications, audit_logs, renewal_status_history, and profiles that used
  get_my_role().
- Uses: EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = '...')
*/

-- ============================================================
-- Helper: inline role check (keeps function for backward compat)
-- ============================================================
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- ============================================================
-- PROFILES
-- ============================================================
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM public.profiles AS p2
      WHERE p2.id = auth.uid() AND p2.role IN ('officer', 'admin')
    )
  );

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM public.profiles AS p2
      WHERE p2.id = auth.uid() AND p2.role = 'admin'
    )
  )
  WITH CHECK (
    auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM public.profiles AS p2
      WHERE p2.id = auth.uid() AND p2.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "profiles_delete_admin" ON public.profiles;
CREATE POLICY "profiles_delete_admin" ON public.profiles FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles AS p2
      WHERE p2.id = auth.uid() AND p2.role = 'admin'
    )
  );

-- ============================================================
-- RENEWALS
-- ============================================================
DROP POLICY IF EXISTS "renewals_select" ON public.renewals;
CREATE POLICY "renewals_select" ON public.renewals FOR SELECT
  TO authenticated
  USING (
    member_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles AS p
      WHERE p.id = auth.uid() AND p.role IN ('officer', 'admin')
    )
  );

DROP POLICY IF EXISTS "renewals_update" ON public.renewals;
CREATE POLICY "renewals_update" ON public.renewals FOR UPDATE
  TO authenticated
  USING (
    (member_id = auth.uid() AND status = 'draft')
    OR EXISTS (
      SELECT 1 FROM public.profiles AS p
      WHERE p.id = auth.uid() AND p.role IN ('officer', 'admin')
    )
  )
  WITH CHECK (
    (member_id = auth.uid() AND status = 'draft')
    OR EXISTS (
      SELECT 1 FROM public.profiles AS p
      WHERE p.id = auth.uid() AND p.role IN ('officer', 'admin')
    )
  );

DROP POLICY IF EXISTS "renewals_delete" ON public.renewals;
CREATE POLICY "renewals_delete" ON public.renewals FOR DELETE
  TO authenticated
  USING (
    (member_id = auth.uid() AND status = 'draft')
    OR EXISTS (
      SELECT 1 FROM public.profiles AS p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- ============================================================
-- DOCUMENTS
-- ============================================================
DROP POLICY IF EXISTS "documents_select" ON public.documents;
CREATE POLICY "documents_select" ON public.documents FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.renewals r
      WHERE r.id = documents.renewal_id
        AND (
          r.member_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.role IN ('officer', 'admin')
          )
        )
    )
  );

DROP POLICY IF EXISTS "documents_update" ON public.documents;
CREATE POLICY "documents_update" ON public.documents FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.renewals r
      WHERE r.id = documents.renewal_id AND r.member_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.renewals r
      WHERE r.id = documents.renewal_id AND r.member_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "documents_delete" ON public.documents;
CREATE POLICY "documents_delete" ON public.documents FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.renewals r
      WHERE r.id = documents.renewal_id AND r.member_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
DROP POLICY IF EXISTS "notifications_select_own" ON public.notifications;
CREATE POLICY "notifications_select_own" ON public.notifications FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "notifications_delete_own" ON public.notifications;
CREATE POLICY "notifications_delete_own" ON public.notifications FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- ============================================================
-- AUDIT LOGS
-- ============================================================
DROP POLICY IF EXISTS "audit_logs_select" ON public.audit_logs;
CREATE POLICY "audit_logs_select" ON public.audit_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- ============================================================
-- RENEWAL STATUS HISTORY
-- ============================================================
DROP POLICY IF EXISTS "rsh_select" ON public.renewal_status_history;
CREATE POLICY "rsh_select" ON public.renewal_status_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.renewals r
      WHERE r.id = renewal_status_history.renewal_id
        AND (
          r.member_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.role IN ('officer', 'admin')
          )
        )
    )
  );

DROP POLICY IF EXISTS "rsh_update" ON public.renewal_status_history;
CREATE POLICY "rsh_update" ON public.renewal_status_history FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "rsh_delete" ON public.renewal_status_history;
CREATE POLICY "rsh_delete" ON public.renewal_status_history FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );
