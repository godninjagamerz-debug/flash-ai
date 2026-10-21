/*
# Create Subscriptions System for Stripe Payments

## 1. New Tables

### subscriptions
- `id` (uuid, primary key)
- `user_id` (uuid, references auth.users, unique)
- `plan_type` (text, current plan: free, pro, business, hero)
- `stripe_subscription_id` (text, unique, Stripe subscription ID)
- `stripe_customer_id` (text, Stripe customer ID)
- `status` (subscription_status enum, active/cancelled/expired)
- `current_period_start` (timestamptz, billing period start)
- `current_period_end` (timestamptz, billing period end)
- `cancel_at_period_end` (boolean, will cancel at end of period)
- `created_at` (timestamptz, default now())
- `updated_at` (timestamptz, default now())

### usage_tracking
- `id` (uuid, primary key)
- `user_id` (uuid, references auth.users)
- `plan_type` (text, plan at time of usage)
- `messages_count` (integer, messages sent this period)
- `period_start` (timestamptz, tracking period start)
- `period_end` (timestamptz, tracking period end)
- `created_at` (timestamptz, default now())
- `updated_at` (timestamptz, default now())

## 2. Security
- Enable RLS on both tables
- Users can view their own subscription and usage
- Admins can view all subscriptions and usage
- Service role can manage all data

## 3. Indexes
- Index on user_id for fast lookups
- Index on stripe_subscription_id for webhook processing
- Index on status for filtering active subscriptions

## 4. RPC Functions
- `get_user_usage()` - Get current user's usage stats
- `check_message_limit()` - Check if user can send message
- `increment_message_count()` - Increment user's message count
- `get_plan_limits()` - Get limits for a plan type

## 5. Notes
- Free plan users don't have Stripe subscription
- Usage resets monthly for paid plans, daily for free
- Admins have unlimited usage
*/

-- Subscription status enum
CREATE TYPE subscription_status AS ENUM ('active', 'cancelled', 'expired', 'past_due');

-- Subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_type text NOT NULL DEFAULT 'free',
  stripe_subscription_id text UNIQUE,
  stripe_customer_id text,
  status subscription_status NOT NULL DEFAULT 'active'::subscription_status,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Usage tracking table
CREATE TABLE IF NOT EXISTS public.usage_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_type text NOT NULL,
  messages_count integer DEFAULT 0,
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_subscription_id ON public.subscriptions(stripe_subscription_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX idx_usage_tracking_user_id ON public.usage_tracking(user_id);
CREATE INDEX idx_usage_tracking_period ON public.usage_tracking(period_start, period_end);

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;

-- Subscriptions policies
CREATE POLICY "Users can view own subscription"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all subscriptions"
  ON public.subscriptions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Service role can manage subscriptions"
  ON public.subscriptions FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Usage tracking policies
CREATE POLICY "Users can view own usage"
  ON public.usage_tracking FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all usage"
  ON public.usage_tracking FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Service role can manage usage"
  ON public.usage_tracking FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_usage_tracking_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_subscriptions_updated_at();

CREATE TRIGGER usage_tracking_updated_at
  BEFORE UPDATE ON public.usage_tracking
  FOR EACH ROW
  EXECUTE FUNCTION update_usage_tracking_updated_at();

-- RPC: Get plan limits
CREATE OR REPLACE FUNCTION get_plan_limits(p_plan_type text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN CASE p_plan_type
    WHEN 'free' THEN jsonb_build_object(
      'messages_per_period', -1,
      'period_type', 'unlimited',
      'upload_limit', '100MB daily',
      'features', jsonb_build_array('Unlimited messages', 'Flash AI', 'Image generation (slowest)', 'Community support')
    )
    WHEN 'hero' THEN jsonb_build_object(
      'messages_per_period', -1,
      'period_type', 'unlimited',
      'upload_limit', '1GB daily',
      'features', jsonb_build_array('Unlimited messages', 'Flash AI', 'Image generation', 'Voice to text', 'Standard speed', 'Email support')
    )
    WHEN 'pro' THEN jsonb_build_object(
      'messages_per_period', -1,
      'period_type', 'unlimited',
      'upload_limit', 'unlimited',
      'features', jsonb_build_array('Unlimited 4K messages', 'Unlimited upload', 'Both AI models', 'Faster image & video generation', 'Voice to text', 'Fastest speed', '24/7 support', 'API access', 'White-label')
    )
    WHEN 'business' THEN jsonb_build_object(
      'messages_per_period', -1,
      'period_type', 'unlimited',
      'upload_limit', '1GB daily per account',
      'features', jsonb_build_array('10 Plus accounts', 'All Plus features', 'Unlimited messages per account', 'Voice to text', 'Team collaboration', 'Admin dashboard')
    )
    ELSE jsonb_build_object(
      'messages_per_period', -1,
      'period_type', 'unlimited',
      'upload_limit', '100MB daily',
      'features', jsonb_build_array('Basic features')
    )
  END;
END;
$$;

-- RPC: Get user usage
CREATE OR REPLACE FUNCTION get_user_usage(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_profile profiles%ROWTYPE;
  v_subscription subscriptions%ROWTYPE;
  v_usage usage_tracking%ROWTYPE;
  v_plan_limits jsonb;
  v_period_start timestamptz;
  v_period_end timestamptz;
BEGIN
  -- Get user profile
  SELECT * INTO v_profile FROM profiles WHERE id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'User not found');
  END IF;

  -- Admins have unlimited usage
  IF v_profile.role = 'admin' THEN
    RETURN jsonb_build_object(
      'plan_type', v_profile.plan,
      'messages_used', 0,
      'messages_limit', -1,
      'unlimited', true,
      'period_start', now(),
      'period_end', now() + interval '1 month'
    );
  END IF;

  -- Get plan limits
  v_plan_limits := get_plan_limits(v_profile.plan);

  -- Calculate period based on plan
  IF v_profile.plan = 'free' THEN
    v_period_start := date_trunc('day', now());
    v_period_end := v_period_start + interval '1 day';
  ELSE
    v_period_start := date_trunc('month', now());
    v_period_end := v_period_start + interval '1 month';
  END IF;

  -- Get or create usage tracking
  SELECT * INTO v_usage
  FROM usage_tracking
  WHERE user_id = p_user_id
    AND period_start = v_period_start
    AND period_end = v_period_end;

  IF NOT FOUND THEN
    INSERT INTO usage_tracking (user_id, plan_type, messages_count, period_start, period_end)
    VALUES (p_user_id, v_profile.plan, 0, v_period_start, v_period_end)
    RETURNING * INTO v_usage;
  END IF;

  RETURN jsonb_build_object(
    'plan_type', v_profile.plan,
    'messages_used', v_usage.messages_count,
    'messages_limit', (v_plan_limits->>'messages_per_period')::integer,
    'unlimited', (v_plan_limits->>'messages_per_period')::integer = -1,
    'period_start', v_usage.period_start,
    'period_end', v_usage.period_end,
    'period_type', v_plan_limits->>'period_type'
  );
END;
$$;

-- RPC: Check message limit
CREATE OR REPLACE FUNCTION check_message_limit(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_usage jsonb;
  v_messages_used integer;
  v_messages_limit integer;
  v_unlimited boolean;
BEGIN
  v_usage := get_user_usage(p_user_id);
  
  v_messages_used := (v_usage->>'messages_used')::integer;
  v_messages_limit := (v_usage->>'messages_limit')::integer;
  v_unlimited := (v_usage->>'unlimited')::boolean;

  -- Unlimited or under limit
  IF v_unlimited OR v_messages_limit = -1 THEN
    RETURN true;
  END IF;

  RETURN v_messages_used < v_messages_limit;
END;
$$;

-- RPC: Increment message count
CREATE OR REPLACE FUNCTION increment_message_count(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_profile profiles%ROWTYPE;
  v_period_start timestamptz;
  v_period_end timestamptz;
  v_can_send boolean;
BEGIN
  -- Check if user can send message
  v_can_send := check_message_limit(p_user_id);
  
  IF NOT v_can_send THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Message limit reached',
      'usage', get_user_usage(p_user_id)
    );
  END IF;

  -- Get user profile
  SELECT * INTO v_profile FROM profiles WHERE id = p_user_id;

  -- Skip increment for admins
  IF v_profile.role = 'admin' THEN
    RETURN jsonb_build_object(
      'success', true,
      'usage', get_user_usage(p_user_id)
    );
  END IF;

  -- Calculate period
  IF v_profile.plan = 'free' THEN
    v_period_start := date_trunc('day', now());
    v_period_end := v_period_start + interval '1 day';
  ELSE
    v_period_start := date_trunc('month', now());
    v_period_end := v_period_start + interval '1 month';
  END IF;

  -- Increment count
  UPDATE usage_tracking
  SET messages_count = messages_count + 1
  WHERE user_id = p_user_id
    AND period_start = v_period_start
    AND period_end = v_period_end;

  RETURN jsonb_build_object(
    'success', true,
    'usage', get_user_usage(p_user_id)
  );
END;
$$;

-- Create subscription for existing users
INSERT INTO subscriptions (user_id, plan_type, status)
SELECT id, plan, 'active'::subscription_status
FROM profiles
ON CONFLICT (user_id) DO NOTHING;