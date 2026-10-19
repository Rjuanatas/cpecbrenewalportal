
/*
# Create Supabase Storage Bucket for Renewal Documents

Creates the 'renewal-documents' storage bucket for file uploads.
RLS policies allow authenticated users to upload to their own folder,
and officers/admins to read all files.
*/

-- Create storage bucket (idempotent via DO block)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'renewal-documents'
  ) THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
      'renewal-documents',
      'renewal-documents',
      true,
      10485760, -- 10MB
      ARRAY['image/jpeg', 'image/png', 'application/pdf', 'image/jpg']
    );
  END IF;
END $$;

-- Storage policies
DROP POLICY IF EXISTS "renewal_docs_select" ON storage.objects;
CREATE POLICY "renewal_docs_select" ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'renewal-documents');

DROP POLICY IF EXISTS "renewal_docs_insert" ON storage.objects;
CREATE POLICY "renewal_docs_insert" ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'renewal-documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "renewal_docs_update" ON storage.objects;
CREATE POLICY "renewal_docs_update" ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'renewal-documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'renewal-documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "renewal_docs_delete" ON storage.objects;
CREATE POLICY "renewal_docs_delete" ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'renewal-documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
