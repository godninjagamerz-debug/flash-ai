/*
# Create payment_requests table

## Purpose
Store manual payment requests for subscription plans with screenshot verification.

## Tables Created

### payment_requests
- `id` (uuid, primary key): Unique payment request identifier
- `user_id` (uuid, references profiles): User making the payment
- `plan_id` (text): Plan being purchased ('pro' or 'business')
- `payment_method` (text): Payment method used ('upi' or 'netbanking')
- `screenshot_url` (text): URL to payment proof screenshot
- `amount` (numeric): Payment amount
- `status` (text): Payment status ('pending', 'approved', 'rejected')
- `admin_notes` (text, nullable): Admin notes for rejection/approval
- `created_at` (timestamptz): Request creation time
- `updated_at` (timestamptz): Last update time

## Security
- Enable RLS on payment_requests table
- Users can view their own payment requests
- Users can create new payment requests
- Admins can view all payment requests
- Admins can update payment status and notes

## Indexes
- idx_payment_requests_user_id: Fast lookup by user
- idx_payment_requests_status: Fast lookup by status
*/

-- Create payment_requests table
CREATE TABLE IF NOT EXISTS payment_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan_id text NOT NULL CHECK (plan_id IN ('pro', 'business')),
  payment_method text NOT NULL CHECK (payment_method IN ('upi', 'netbanking')),
  screenshot_url text NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_payment_requests_user_id ON payment_requests(user_id);
CREATE INDEX idx_payment_requests_status ON payment_requests(status);

-- Enable RLS
ALTER TABLE payment_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own payment requests
CREATE POLICY "Users can view own payment requests" ON payment_requests
  FOR SELECT USING (auth.uid() = user_id);

-- Users can create new payment requests
CREATE POLICY "Users can create payment requests" ON payment_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admins can view all payment requests
CREATE POLICY "Admins can view all payment requests" ON payment_requests
  FOR SELECT USING (is_admin(auth.uid()));

-- Admins can update payment requests
CREATE POLICY "Admins can update payment requests" ON payment_requests
  FOR UPDATE USING (is_admin(auth.uid()));

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_payment_request_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_payment_request_timestamp
  BEFORE UPDATE ON payment_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_request_timestamp();