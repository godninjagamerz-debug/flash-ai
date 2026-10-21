
-- Harden signup: administrator privileges are assigned manually by the project owner.
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  new_username text;
  extracted_name text;
BEGIN
  IF TG_OP = 'INSERT' AND NEW.confirmed_at IS NOT NULL THEN
    IF NEW.email LIKE '%@miaoda.com' THEN
      new_username := SPLIT_PART(NEW.email, '@', 1);
    END IF;
    extracted_name := COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      NEW.raw_user_meta_data->>'username'
    );
    INSERT INTO profiles (id, email, username, full_name, avatar_url, role, plan, upload_limit_mb)
    VALUES (
      NEW.id,
      CASE WHEN NEW.email LIKE '%@miaoda.com' THEN NULL ELSE NEW.email END,
      COALESCE(new_username, NEW.raw_user_meta_data->>'username'),
      extracted_name,
      NEW.raw_user_meta_data->>'avatar_url',
      'user'::user_role,
      'free'::plan_type,
      100
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.confirmed_at IS NULL AND NEW.confirmed_at IS NOT NULL THEN
    IF NEW.email LIKE '%@miaoda.com' THEN
      new_username := SPLIT_PART(NEW.email, '@', 1);
    END IF;
    extracted_name := COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      NEW.raw_user_meta_data->>'username'
    );
    INSERT INTO profiles (id, email, username, full_name, avatar_url, role, plan, upload_limit_mb)
    VALUES (
      NEW.id,
      CASE WHEN NEW.email LIKE '%@miaoda.com' THEN NULL ELSE NEW.email END,
      COALESCE(new_username, NEW.raw_user_meta_data->>'username'),
      extracted_name,
      NEW.raw_user_meta_data->>'avatar_url',
      'user'::user_role,
      'free'::plan_type,
      100
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- Fix add_credits: ensure correct parameter signature with p_type and p_description
CREATE OR REPLACE FUNCTION add_credits(
  p_user_id uuid,
  p_amount integer,
  p_type text DEFAULT 'admin_adjustment',
  p_description text DEFAULT NULL,
  p_admin_id uuid DEFAULT NULL,
  p_reason text DEFAULT NULL  -- alias for p_description for backward compat
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_desc text;
  v_new_balance integer;
BEGIN
  v_desc := COALESCE(p_description, p_reason, 'Credit adjustment');
  
  UPDATE profiles 
  SET credits = credits + p_amount
  WHERE id = p_user_id
  RETURNING credits INTO v_new_balance;
  
  INSERT INTO credits_ledger (user_id, amount, balance_after, type, description)
  VALUES (p_user_id, p_amount, v_new_balance, p_type, v_desc);
END;
$$;

-- Fix deduct_credits: ensure correct parameter signature
CREATE OR REPLACE FUNCTION deduct_credits(
  p_user_id uuid,
  p_amount integer,
  p_description text DEFAULT NULL,
  p_reason text DEFAULT NULL  -- alias for backward compat
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_desc text;
  v_current_balance integer;
  v_new_balance integer;
BEGIN
  v_desc := COALESCE(p_description, p_reason, 'Credit deduction');
  
  SELECT credits INTO v_current_balance FROM profiles WHERE id = p_user_id;
  IF v_current_balance < p_amount THEN
    RETURN false;
  END IF;
  
  UPDATE profiles 
  SET credits = credits - p_amount
  WHERE id = p_user_id
  RETURNING credits INTO v_new_balance;
  
  INSERT INTO credits_ledger (user_id, amount, balance_after, type, description)
  VALUES (p_user_id, -p_amount, v_new_balance, 'usage', v_desc);
  
  RETURN true;
END;
$$;
