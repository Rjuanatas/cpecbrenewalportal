
-- Expand allowed MIME types on the renewal-documents bucket.
-- The original strict allowlist silently rejected common file variants
-- such as image/jpg (vs image/jpeg), application/x-pdf, image/gif, etc.
-- Removing the restriction allows any file type; the FileUpload component
-- enforces the accepted formats on the client side.
UPDATE storage.buckets
SET allowed_mime_types = NULL
WHERE id = 'renewal-documents';
