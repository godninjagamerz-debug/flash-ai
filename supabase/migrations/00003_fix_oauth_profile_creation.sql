/*
# Fix OAuth Profile Creation

## Changes
- Update handle_new_user() trigger function to handle OAuth users
- OAuth users are automatically confirmed, so profile should be created immediately
- Handle both INSERT (OAuth) and UPDATE (email confirmation) cases

## Notes
- OAuth providers (Google, Apple, Discord) create users with confirmed_at already set
- Username/password login requires confirmation, so profile created on UPDATE
*/

-- Drop existing trigger
DROP TRIGGER IF EXISTS on_auth_user_confirmed ON auth.users;

-- Update trigger function to handle both INSERT and UPDATE
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  new_username text;
  extracted_name text;
BEGIN
  -- Handle INSERT (OAuth users) - they come with confirmed_at already set
  IF TG_OP = 'INSERT' AND NEW.confirmed_at IS NOT NULL THEN
    -- Extract username from email if it's @miaoda.com
    IF NEW.email LIKE '%@miaoda.com' THEN
      new_username := SPLIT_PART(NEW.email, '@', 1);
    END IF;
    
    -- Try to get name from metadata
    extracted_name := COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      NEW.raw_user_meta_data->>'username'
    );
    
    -- Public signups always receive the least-privileged role.
    INSERT INTO profiles (id, email, username, full_name, avatar_url, role, plan, upload_limit_mb)
    VALUES (
      NEW.id,
      CASE WHEN NEW.email LIKE '%@miaoda.com' THEN NULL ELSE NEW.email END,
      new_username,
      extracted_name,
      NEW.raw_user_meta_data->>'avatar_url',
      'user'::user_role,
      'free'::plan_type,
      100
    );
  END IF;
  
  -- Handle UPDATE (email confirmation for username/password login)
  IF TG_OP = 'UPDATE' AND OLD.confirmed_at IS NULL AND NEW.confirmed_at IS NOT NULL THEN
    -- Extract username from email if it's @miaoda.com
    IF NEW.email LIKE '%@miaoda.com' THEN
      new_username := SPLIT_PART(NEW.email, '@', 1);
    END IF;
    
    -- Try to get name from metadata
    extracted_name := COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      NEW.raw_user_meta_data->>'username'
    );
    
    -- Public signups always receive the least-privileged role.
    INSERT INTO profiles (id, email, username, full_name, avatar_url, role, plan, upload_limit_mb)
    VALUES (
      NEW.id,
      CASE WHEN NEW.email LIKE '%@miaoda.com' THEN NULL ELSE NEW.email END,
      new_username,
      extracted_name,
      NEW.raw_user_meta_data->>'avatar_url',
      'user'::user_role,
      'free'::plan_type,
      100
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for INSERT (OAuth users)
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Create trigger for UPDATE (email confirmation)
CREATE TRIGGER on_auth_user_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
