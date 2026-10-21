/*
# Update Profile Creation for Email Authentication

## Changes
1. Update handle_new_user() trigger to properly extract username from metadata
2. Ensure email and username uniqueness is enforced
3. Handle email-based signup flow correctly
4. Extract username from raw_user_meta_data

## Notes
- Email and username already have UNIQUE constraints in the schema
- This migration updates the trigger to work with email OTP verification
- Username is extracted from user metadata during signup
*/

-- Drop existing trigger
DROP TRIGGER IF EXISTS on_auth_user_confirmed ON auth.users;

-- Update trigger function for email-based auth
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  new_username text;
  new_email text;
BEGIN
  -- Only insert after user is confirmed
  IF OLD IS DISTINCT FROM NULL AND OLD.confirmed_at IS NULL AND NEW.confirmed_at IS NOT NULL THEN
    -- Extract username from metadata
    new_username := COALESCE(
      NEW.raw_user_meta_data->>'username',
      SPLIT_PART(NEW.email, '@', 1)
    );
    
    -- Use the actual email
    new_email := NEW.email;
    
    -- Public signups always receive the least-privileged role.
    INSERT INTO profiles (id, email, username, full_name, role, plan, upload_limit_mb)
    VALUES (
      NEW.id,
      new_email,
      new_username,
      COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        new_username
      ),
      'user'::user_role,
      'free'::plan_type,
      100
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- Recreate trigger
CREATE TRIGGER on_auth_user_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Create function to check if email exists
CREATE OR REPLACE FUNCTION check_email_exists(check_email text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE email = check_email
  );
$$;

-- Create function to check if username exists
CREATE OR REPLACE FUNCTION check_username_exists(check_username text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE username = check_username
  );
$$;