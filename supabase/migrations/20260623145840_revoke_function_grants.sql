
-- Explicitly revoke EXECUTE from anon and authenticated on both functions.
-- Supabase sets individual role grants that survive REVOKE FROM PUBLIC,
-- so each role must be revoked directly.
REVOKE EXECUTE ON FUNCTION public.get_my_role() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;
-- get_my_role() EXECUTE for authenticated is intentionally kept:
-- RLS policies on profiles/documents/etc. call it at evaluation time
-- and require the authenticated role to have EXECUTE permission.
