
/*
# CPECB Certification Renewal Portal — Initial Schema

Creates all tables, policies, triggers, and helper functions for the CPECB portal.
Supports roles: member, officer, admin with full RLS.
*/

-- ============================================================
-- PROFILES (must be created before helper function)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'officer', 'admin')),
  first_name text,
  middle_name text,
  last_name text,
  email text,
  communication_email text,
  mobile_number text,
  place_of_birth text,
  unit_number text,
  village_subdivision text,
  street text,
  barangay text,
  city_town text,
  zip_code text,
  icpep_region text,
  certification_number text,
  certification_type text CHECK (certification_type IN ('CCPE', 'PCPE')),
  date_issued date,
  expiration_date date,
  profile_photo_url text,
  cert_status text NOT NULL DEFAULT 'active' CHECK (cert_status IN ('active', 'expiring_soon', 'expired', 'pending_renewal')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- HELPER FUNCTION (after profiles table exists)
-- ============================================================
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- ============================================================
-- PROFILES POLICIES
-- ============================================================
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id OR get_my_role() IN ('officer', 'admin'));

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id OR get_my_role() = 'admin')
  WITH CHECK (auth.uid() = id OR get_my_role() = 'admin');

DROP POLICY IF EXISTS "profiles_delete_admin" ON public.profiles;
CREATE POLICY "profiles_delete_admin" ON public.profiles FOR DELETE
  TO authenticated
  USING (get_my_role() = 'admin');

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- RENEWALS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.renewals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  renewal_type text NOT NULL CHECK (renewal_type IN ('CCPE', 'PCPE')),
  certification_number text NOT NULL,
  date_id_validity date,
  amount_paid numeric(10, 2),
  bank_name text,
  branch_location text,
  deposit_date date,
  deposit_time text,
  reference_number text,
  batch_number text,
  signature_url text,
  date_signed date,
  declaration_agreed boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft','submitted','under_review','payment_verification',
    'document_verification','recommended_approval','recommended_rejection',
    'approved','rejected'
  )),
  remarks text,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS renewals_member_id_idx ON public.renewals(member_id);
CREATE INDEX IF NOT EXISTS renewals_status_idx ON public.renewals(status);
CREATE INDEX IF NOT EXISTS renewals_submitted_at_idx ON public.renewals(submitted_at);

ALTER TABLE public.renewals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "renewals_select" ON public.renewals;
CREATE POLICY "renewals_select" ON public.renewals FOR SELECT
  TO authenticated
  USING (member_id = auth.uid() OR get_my_role() IN ('officer', 'admin'));

DROP POLICY IF EXISTS "renewals_insert" ON public.renewals;
CREATE POLICY "renewals_insert" ON public.renewals FOR INSERT
  TO authenticated
  WITH CHECK (member_id = auth.uid());

DROP POLICY IF EXISTS "renewals_update" ON public.renewals;
CREATE POLICY "renewals_update" ON public.renewals FOR UPDATE
  TO authenticated
  USING (
    (member_id = auth.uid() AND status = 'draft') OR
    get_my_role() IN ('officer', 'admin')
  )
  WITH CHECK (
    (member_id = auth.uid() AND status = 'draft') OR
    get_my_role() IN ('officer', 'admin')
  );

DROP POLICY IF EXISTS "renewals_delete" ON public.renewals;
CREATE POLICY "renewals_delete" ON public.renewals FOR DELETE
  TO authenticated
  USING (
    (member_id = auth.uid() AND status = 'draft') OR
    get_my_role() = 'admin'
  );

-- ============================================================
-- DOCUMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  renewal_id uuid NOT NULL REFERENCES public.renewals(id) ON DELETE CASCADE,
  document_type text NOT NULL CHECK (document_type IN (
    'profile_photo', 'old_id', 'regional_certificate',
    'national_certificate', 'proof_of_payment', 'signature', 'other'
  )),
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_size bigint,
  upload_date timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS documents_renewal_id_idx ON public.documents(renewal_id);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "documents_select" ON public.documents;
CREATE POLICY "documents_select" ON public.documents FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.renewals r
      WHERE r.id = documents.renewal_id
        AND (r.member_id = auth.uid() OR get_my_role() IN ('officer', 'admin'))
    )
  );

DROP POLICY IF EXISTS "documents_insert" ON public.documents;
CREATE POLICY "documents_insert" ON public.documents FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.renewals r
      WHERE r.id = documents.renewal_id
        AND r.member_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "documents_update" ON public.documents;
CREATE POLICY "documents_update" ON public.documents FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.renewals r
      WHERE r.id = documents.renewal_id
        AND r.member_id = auth.uid()
    ) OR get_my_role() = 'admin'
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.renewals r
      WHERE r.id = documents.renewal_id
        AND r.member_id = auth.uid()
    ) OR get_my_role() = 'admin'
  );

DROP POLICY IF EXISTS "documents_delete" ON public.documents;
CREATE POLICY "documents_delete" ON public.documents FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.renewals r
      WHERE r.id = documents.renewal_id
        AND r.member_id = auth.uid()
    ) OR get_my_role() = 'admin'
  );

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON public.notifications(user_id);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_select_own" ON public.notifications;
CREATE POLICY "notifications_select_own" ON public.notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR get_my_role() = 'admin');

DROP POLICY IF EXISTS "notifications_insert" ON public.notifications;
CREATE POLICY "notifications_insert" ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "notifications_update_own" ON public.notifications;
CREATE POLICY "notifications_update_own" ON public.notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "notifications_delete_own" ON public.notifications;
CREATE POLICY "notifications_delete_own" ON public.notifications FOR DELETE
  TO authenticated
  USING (user_id = auth.uid() OR get_my_role() = 'admin');

-- ============================================================
-- AUDIT LOGS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS audit_logs_user_id_idx ON public.audit_logs(user_id);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_logs_select" ON public.audit_logs;
CREATE POLICY "audit_logs_select" ON public.audit_logs FOR SELECT
  TO authenticated
  USING (get_my_role() = 'admin');

DROP POLICY IF EXISTS "audit_logs_insert" ON public.audit_logs;
CREATE POLICY "audit_logs_insert" ON public.audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================================
-- RENEWAL STATUS HISTORY
-- ============================================================
CREATE TABLE IF NOT EXISTS public.renewal_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  renewal_id uuid NOT NULL REFERENCES public.renewals(id) ON DELETE CASCADE,
  status text NOT NULL,
  changed_by uuid REFERENCES public.profiles(id),
  remarks text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS rsh_renewal_id_idx ON public.renewal_status_history(renewal_id);

ALTER TABLE public.renewal_status_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rsh_select" ON public.renewal_status_history;
CREATE POLICY "rsh_select" ON public.renewal_status_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.renewals r
      WHERE r.id = renewal_status_history.renewal_id
        AND (r.member_id = auth.uid() OR get_my_role() IN ('officer', 'admin'))
    )
  );

DROP POLICY IF EXISTS "rsh_insert" ON public.renewal_status_history;
CREATE POLICY "rsh_insert" ON public.renewal_status_history FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "rsh_update" ON public.renewal_status_history;
CREATE POLICY "rsh_update" ON public.renewal_status_history FOR UPDATE
  TO authenticated
  USING (get_my_role() = 'admin')
  WITH CHECK (get_my_role() = 'admin');

DROP POLICY IF EXISTS "rsh_delete" ON public.renewal_status_history;
CREATE POLICY "rsh_delete" ON public.renewal_status_history FOR DELETE
  TO authenticated
  USING (get_my_role() = 'admin');
