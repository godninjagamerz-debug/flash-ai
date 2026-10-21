
-- Add credits and API fields to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS credits integer NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS api_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS plan_billing_cycle text NOT NULL DEFAULT 'monthly',
  ADD COLUMN IF NOT EXISTS plan_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS total_messages_sent integer NOT NULL DEFAULT 0;

-- API Keys table
CREATE TABLE api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'My API Key',
  key_hash text NOT NULL UNIQUE,
  key_prefix text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  last_used_at timestamptz,
  total_requests integer NOT NULL DEFAULT 0,
  rate_limit_per_min integer NOT NULL DEFAULT 60,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz
);

-- API Usage table
CREATE TABLE api_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  api_key_id uuid REFERENCES api_keys(id) ON DELETE SET NULL,
  model text NOT NULL DEFAULT 'flash',
  input_tokens integer NOT NULL DEFAULT 0,
  output_tokens integer NOT NULL DEFAULT 0,
  credits_used numeric(10,4) NOT NULL DEFAULT 0,
  source text NOT NULL DEFAULT 'chat', -- 'chat' | 'api'
  status text NOT NULL DEFAULT 'success',
  response_ms integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Credits Ledger table
CREATE TABLE credits_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount integer NOT NULL,
  balance_after integer NOT NULL,
  type text NOT NULL, -- 'purchase' | 'usage' | 'bonus' | 'refund' | 'admin_adjustment' | 'plan_grant'
  description text,
  reference_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL
);

-- Credit packs table (admin-defined)
CREATE TABLE credit_packs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  credits integer NOT NULL,
  price_inr integer NOT NULL,
  price_usd numeric(10,2) NOT NULL,
  bonus_credits integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  popular boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Insert default credit packs
INSERT INTO credit_packs (name, credits, price_inr, price_usd, bonus_credits, is_active, popular, sort_order) VALUES
  ('Starter Pack', 500, 99, 1.20, 0, true, false, 1),
  ('Basic Pack', 1500, 249, 3.00, 100, true, false, 2),
  ('Popular Pack', 5000, 699, 8.40, 500, true, true, 3),
  ('Pro Pack', 15000, 1799, 21.60, 2000, true, false, 4),
  ('Business Pack', 50000, 4999, 60.00, 10000, true, false, 5);

-- RLS policies
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE credits_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_packs ENABLE ROW LEVEL SECURITY;

-- API keys policies
CREATE POLICY "users_own_api_keys" ON api_keys
  FOR ALL TO authenticated
  USING (user_id = auth.uid());

-- API usage policies
CREATE POLICY "users_own_api_usage" ON api_usage
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "users_insert_api_usage" ON api_usage
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Credits ledger policies
CREATE POLICY "users_own_credits_ledger" ON credits_ledger
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Admins can insert into credits ledger
CREATE POLICY "admins_manage_credits_ledger" ON credits_ledger
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Credit packs - everyone can read
CREATE POLICY "public_read_credit_packs" ON credit_packs
  FOR SELECT TO authenticated
  USING (is_active = true);

CREATE POLICY "admins_manage_credit_packs" ON credit_packs
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Function: deduct credits atomically
CREATE OR REPLACE FUNCTION deduct_credits(
  p_user_id uuid,
  p_amount integer,
  p_description text DEFAULT 'API usage'
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_credits integer;
  v_new_balance integer;
BEGIN
  SELECT credits INTO v_current_credits FROM profiles WHERE id = p_user_id FOR UPDATE;
  IF v_current_credits IS NULL OR v_current_credits < p_amount THEN
    RETURN false;
  END IF;
  v_new_balance := v_current_credits - p_amount;
  UPDATE profiles SET credits = v_new_balance WHERE id = p_user_id;
  INSERT INTO credits_ledger (user_id, amount, balance_after, type, description)
  VALUES (p_user_id, -p_amount, v_new_balance, 'usage', p_description);
  RETURN true;
END;
$$;

-- Function: add credits (admin)
CREATE OR REPLACE FUNCTION add_credits(
  p_user_id uuid,
  p_amount integer,
  p_type text DEFAULT 'admin_adjustment',
  p_description text DEFAULT 'Credit adjustment',
  p_admin_id uuid DEFAULT NULL
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_balance integer;
BEGIN
  UPDATE profiles SET credits = credits + p_amount WHERE id = p_user_id
  RETURNING credits INTO v_new_balance;
  INSERT INTO credits_ledger (user_id, amount, balance_after, type, description, created_by)
  VALUES (p_user_id, p_amount, v_new_balance, p_type, p_description, p_admin_id);
  RETURN true;
END;
$$;

-- Function: log API usage and deduct credits
CREATE OR REPLACE FUNCTION log_api_usage(
  p_user_id uuid,
  p_model text,
  p_input_tokens integer,
  p_output_tokens integer,
  p_credits_used numeric,
  p_source text DEFAULT 'chat',
  p_api_key_id uuid DEFAULT NULL,
  p_response_ms integer DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO api_usage (user_id, api_key_id, model, input_tokens, output_tokens, credits_used, source, response_ms)
  VALUES (p_user_id, p_api_key_id, p_model, p_input_tokens, p_output_tokens, p_credits_used, p_source, p_response_ms);

  UPDATE profiles SET total_messages_sent = total_messages_sent + 1 WHERE id = p_user_id;

  IF p_api_key_id IS NOT NULL THEN
    UPDATE api_keys SET total_requests = total_requests + 1, last_used_at = now() WHERE id = p_api_key_id;
  END IF;
END;
$$;

-- Enable realtime for api_usage
ALTER PUBLICATION supabase_realtime ADD TABLE api_usage;
ALTER PUBLICATION supabase_realtime ADD TABLE credits_ledger;
