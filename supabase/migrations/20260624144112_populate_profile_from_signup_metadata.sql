-- Update the new-user trigger so that all registration fields are written
-- into profiles at the moment the auth.users row is created.
-- This runs SECURITY DEFINER (bypasses RLS) and is therefore reliable
-- regardless of whether email confirmation is enabled.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, first_name, middle_name, last_name, mobile_number, icpep_region)
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
