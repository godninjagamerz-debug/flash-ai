/*
# Create Account Reset Functions

## 1. New Tables
- `reset_notifications`
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `message` (text, reset notification message)
  - `reset_by` (uuid, admin who performed reset)
  - `created_at` (timestamptz)
  - `read` (boolean, default false)

## 2. RPC Functions
- `reset_user_account(user_id, message, admin_id)` - Reset single user
- `reset_all_accounts_except_admins(message, admin_id)` - Reset all non-admin users
- `reset_multiple_accounts(user_ids, message, admin_id)` - Reset selected users
- `get_reset_notification(user_id)` - Get user's reset notification
- `mark_notification_read(notification_id)` - Mark notification as read

## 3. Security
- All functions require admin privileges
- RLS enabled on reset_notifications table
- Users can only view their own notifications

## 4. Notes
- Resets delete: conversations, messages, sessions
- Keeps: profile, plan, role
- Sends notification to affected users
*/

-- Create reset_notifications table
CREATE TABLE IF NOT EXISTS reset_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  message text NOT NULL,
  reset_by uuid REFERENCES profiles(id) NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  read boolean DEFAULT false NOT NULL
);

-- Enable RLS
ALTER TABLE reset_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own notifications" ON reset_notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can insert notifications" ON reset_notifications
  FOR INSERT TO authenticated 
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Users can update own notifications" ON reset_notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Function to reset single user account
CREATE OR REPLACE FUNCTION reset_user_account(
  target_user_id uuid,
  reset_message text,
  admin_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_role user_role;
BEGIN
  -- Check if caller is admin
  IF NOT is_admin(admin_id) THEN
    RAISE EXCEPTION 'Only admins can reset user accounts';
  END IF;
  
  -- Check if target user is admin
  SELECT role INTO target_role FROM profiles WHERE id = target_user_id;
  IF target_role = 'admin'::user_role THEN
    RAISE EXCEPTION 'Cannot reset admin accounts';
  END IF;
  
  -- Delete user data
  DELETE FROM messages WHERE conversation_id IN (
    SELECT id FROM conversations WHERE user_id = target_user_id
  );
  DELETE FROM conversations WHERE user_id = target_user_id;
  DELETE FROM sessions WHERE user_id = target_user_id;
  
  -- Create notification
  INSERT INTO reset_notifications (user_id, message, reset_by)
  VALUES (target_user_id, reset_message, admin_id);
END;
$$;

-- Function to reset all non-admin accounts
CREATE OR REPLACE FUNCTION reset_all_accounts_except_admins(
  reset_message text,
  admin_id uuid
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  affected_count integer := 0;
  user_record RECORD;
BEGIN
  -- Check if caller is admin
  IF NOT is_admin(admin_id) THEN
    RAISE EXCEPTION 'Only admins can reset accounts';
  END IF;
  
  -- Loop through all non-admin users
  FOR user_record IN 
    SELECT id FROM profiles WHERE role = 'user'::user_role
  LOOP
    -- Delete user data
    DELETE FROM messages WHERE conversation_id IN (
      SELECT id FROM conversations WHERE user_id = user_record.id
    );
    DELETE FROM conversations WHERE user_id = user_record.id;
    DELETE FROM sessions WHERE user_id = user_record.id;
    
    -- Create notification
    INSERT INTO reset_notifications (user_id, message, reset_by)
    VALUES (user_record.id, reset_message, admin_id);
    
    affected_count := affected_count + 1;
  END LOOP;
  
  RETURN affected_count;
END;
$$;

-- Function to reset multiple selected accounts
CREATE OR REPLACE FUNCTION reset_multiple_accounts(
  target_user_ids uuid[],
  reset_message text,
  admin_id uuid
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  affected_count integer := 0;
  user_id uuid;
  target_role user_role;
BEGIN
  -- Check if caller is admin
  IF NOT is_admin(admin_id) THEN
    RAISE EXCEPTION 'Only admins can reset accounts';
  END IF;
  
  -- Loop through target users
  FOREACH user_id IN ARRAY target_user_ids
  LOOP
    -- Check if target user is admin
    SELECT role INTO target_role FROM profiles WHERE id = user_id;
    
    -- Skip admin accounts
    IF target_role != 'admin'::user_role THEN
      -- Delete user data
      DELETE FROM messages WHERE conversation_id IN (
        SELECT id FROM conversations WHERE user_id = user_id
      );
      DELETE FROM conversations WHERE user_id = user_id;
      DELETE FROM sessions WHERE user_id = user_id;
      
      -- Create notification
      INSERT INTO reset_notifications (user_id, message, reset_by)
      VALUES (user_id, reset_message, admin_id);
      
      affected_count := affected_count + 1;
    END IF;
  END LOOP;
  
  RETURN affected_count;
END;
$$;

-- Function to get user's reset notification
CREATE OR REPLACE FUNCTION get_reset_notification(target_user_id uuid)
RETURNS TABLE (
  id uuid,
  message text,
  created_at timestamptz,
  read boolean
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, message, created_at, read
  FROM reset_notifications
  WHERE user_id = target_user_id
  ORDER BY created_at DESC
  LIMIT 1;
$$;

-- Function to mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(notification_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE reset_notifications
  SET read = true
  WHERE id = notification_id AND user_id = auth.uid();
$$;