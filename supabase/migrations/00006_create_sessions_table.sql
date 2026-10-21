/*
# Create Sessions Table for Device Management

## 1. New Tables
- `sessions`
  - `id` (uuid, primary key, default: gen_random_uuid())
  - `user_id` (uuid, references profiles, not null)
  - `session_token` (text, unique, not null)
  - `ip_address` (text)
  - `user_agent` (text)
  - `device_name` (text)
  - `last_active` (timestamptz, default: now())
  - `created_at` (timestamptz, default: now())

## 2. Security
- Enable RLS on `sessions` table
- Users can view their own sessions
- Users can delete their own sessions
- Admins have full access to all sessions

## 3. Indexes
- Index on user_id for fast session lookup
- Index on session_token for authentication
- Index on last_active for cleanup

## 4. Functions
- Auto-cleanup old sessions (older than 30 days)
- RPC function to sign out all other sessions
- RPC function for admins to view all sessions
*/

-- Create sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  session_token text UNIQUE NOT NULL,
  ip_address text,
  user_agent text,
  device_name text,
  last_active timestamptz DEFAULT now() NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_sessions_last_active ON sessions(last_active DESC);

-- Enable RLS
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Policies for sessions
CREATE POLICY "Users can view own sessions" ON sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions" ON sessions
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admins have full access to sessions" ON sessions
  FOR ALL TO authenticated USING (is_admin(auth.uid()));

-- Function to sign out all other sessions
CREATE OR REPLACE FUNCTION sign_out_other_sessions(keep_session_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM sessions
  WHERE user_id = auth.uid()
  AND id != keep_session_id;
END;
$$;

-- Function to sign out specific session
CREATE OR REPLACE FUNCTION sign_out_session(session_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM sessions
  WHERE id = session_id
  AND user_id = auth.uid();
END;
$$;

-- Function to cleanup old sessions (run periodically)
CREATE OR REPLACE FUNCTION cleanup_old_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM sessions
  WHERE last_active < now() - interval '30 days';
END;
$$;

-- Function for admins to get all sessions
CREATE OR REPLACE FUNCTION get_all_sessions()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  username text,
  email text,
  ip_address text,
  user_agent text,
  device_name text,
  last_active timestamptz,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if caller is admin
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only admins can view all sessions';
  END IF;
  
  RETURN QUERY
  SELECT 
    s.id,
    s.user_id,
    p.username,
    p.email,
    s.ip_address,
    s.user_agent,
    s.device_name,
    s.last_active,
    s.created_at
  FROM sessions s
  JOIN profiles p ON s.user_id = p.id
  ORDER BY s.last_active DESC;
END;
$$;