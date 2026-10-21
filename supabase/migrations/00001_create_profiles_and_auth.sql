/*
# Create Profiles Table and Authentication System

## 1. New Tables
  - `profiles`
  - `id` (uuid, primary key, references auth.users)
  - `email` (text, unique)
  - `username` (text, unique)
  - `full_name` (text)
  - `avatar_url` (text)
  - `role` (user_role enum: 'user', 'admin')
  - `plan` (plan_type enum: 'free', 'hero', 'pro', 'business')
  - `upload_limit_mb` (integer, default based on plan)
  - `created_at` (timestamptz, default: now())
  - `updated_at` (timestamptz, default: now())

## 2. Security
- Enable RLS on `profiles` table
- Create admin helper function to check user role
- Add policy for admins to have full access to all profiles
- Add policy for users to read their own profile
- Add policy for users to update their own profile without changing role/plan
- Create trigger to auto-create profile on auth user confirmation
-- Administrator privileges are assigned manually by the project owner.

## 3. Notes
- Username/password login uses @miaoda.com domain suffix
- Email verification disabled for username login
- OAuth providers: Google, Apple, Discord
*/

-- Create enums
CREATE TYPE user_role AS ENUM ('user', 'admin');
CREATE TYPE plan_type AS ENUM ('free', 'hero', 'pro', 'business');

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE,
  username text UNIQUE,
  full_name text,
  avatar_url text,
  role user_role DEFAULT 'user'::user_role NOT NULL,
  plan plan_type DEFAULT 'free'::plan_type NOT NULL,
  upload_limit_mb integer DEFAULT 100 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create admin check function
CREATE OR REPLACE FUNCTION is_admin(uid uuid)
RETURNS boolean 
LANGUAGE sql 
SECURITY DEFINER 
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = uid AND p.role = 'admin'::user_role
  );
$$;

-- RLS Policies
CREATE POLICY "Admins have full access" ON profiles
  FOR ALL TO authenticated USING (is_admin(auth.uid()));

CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id) 
  WITH CHECK (
    auth.uid() = id 
    AND role IS NOT DISTINCT FROM (SELECT role FROM profiles WHERE id = auth.uid())
    AND plan IS NOT DISTINCT FROM (SELECT plan FROM profiles WHERE id = auth.uid())
  );

-- Create trigger function for new user
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  new_username text;
BEGIN
  -- Only insert after user is confirmed
  IF OLD IS DISTINCT FROM NULL AND OLD.confirmed_at IS NULL AND NEW.confirmed_at IS NOT NULL THEN
    -- Extract username from email if it's @miaoda.com
    IF NEW.email LIKE '%@miaoda.com' THEN
      new_username := SPLIT_PART(NEW.email, '@', 1);
    END IF;
    
    -- New public signups always receive the least-privileged role.
    INSERT INTO profiles (id, email, username, full_name, role, plan, upload_limit_mb)
    VALUES (
      NEW.id,
      CASE WHEN NEW.email LIKE '%@miaoda.com' THEN NULL ELSE NEW.email END,
      new_username,
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
      'user'::user_role,
      'free'::plan_type,
      100
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS on_auth_user_confirmed ON auth.users;
CREATE TRIGGER on_auth_user_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Create function to update upload limit based on plan
CREATE OR REPLACE FUNCTION update_upload_limit()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.upload_limit_mb := CASE NEW.plan
    WHEN 'free'::plan_type THEN 100
    WHEN 'hero'::plan_type THEN 500
    WHEN 'pro'::plan_type THEN 1024
    WHEN 'business'::plan_type THEN 500
    ELSE 100
  END;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

-- Create trigger for upload limit update
DROP TRIGGER IF EXISTS on_plan_change ON profiles;
CREATE TRIGGER on_plan_change
  BEFORE UPDATE OF plan ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_upload_limit();

-- Create RPC function to update user plan (admin only)
CREATE OR REPLACE FUNCTION update_user_plan(user_id uuid, new_plan plan_type)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if caller is admin
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only admins can update user plans';
  END IF;
  
  -- Update plan
  UPDATE profiles
  SET plan = new_plan
  WHERE id = user_id;
END;
$$;

-- Create RPC function to update user role (admin only)
CREATE OR REPLACE FUNCTION update_user_role(user_id uuid, new_role user_role)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if caller is admin
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only admins can update user roles';
  END IF;
  
  -- Prevent removing last admin
  IF new_role = 'user'::user_role THEN
    IF (SELECT COUNT(*) FROM profiles WHERE role = 'admin'::user_role) <= 1 THEN
      RAISE EXCEPTION 'Cannot remove the last admin';
    END IF;
  END IF;
  
  -- Update role
  UPDATE profiles
  SET role = new_role
  WHERE id = user_id;
END;
$$;