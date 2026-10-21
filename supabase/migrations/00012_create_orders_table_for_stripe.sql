/*
# Create Orders Table for Stripe Payment System

## 1. New Tables
- `orders`
  - `id` (uuid, primary key)
  - `user_id` (uuid, references auth.users, nullable for guest checkout)
  - `items` (jsonb, order items with name, price, quantity)
  - `total_amount` (numeric, total order amount in cents)
  - `currency` (text, currency code, default 'usd')
  - `status` (order_status enum, default 'pending')
  - `stripe_session_id` (text, unique, Stripe checkout session ID)
  - `stripe_payment_intent_id` (text, Stripe payment intent ID)
  - `customer_email` (text, customer email from Stripe)
  - `customer_name` (text, customer name from Stripe)
  - `plan_type` (text, plan type: hero, pro, business)
  - `completed_at` (timestamptz, payment completion timestamp)
  - `created_at` (timestamptz, default now())
  - `updated_at` (timestamptz, default now())

## 2. Security
- Enable RLS on `orders` table
- Users can view their own orders
- Service role (Edge Functions) can manage all orders

## 3. Indexes
- Index on user_id for faster user order lookups
- Index on stripe_session_id for payment verification
- Index on status for filtering orders by status

## 4. Notes
- Orders are created with 'pending' status
- Edge Functions update status to 'completed' after Stripe verification
- Supports guest checkout (user_id can be null)
- All amounts stored in cents (multiply by 100)
*/

-- Order status enum
CREATE TYPE order_status AS ENUM ('pending', 'completed', 'cancelled', 'refunded');

-- Orders table
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  items jsonb NOT NULL,
  total_amount numeric(12,2) NOT NULL,
  currency text NOT NULL DEFAULT 'usd',
  status order_status NOT NULL DEFAULT 'pending'::order_status,
  stripe_session_id text UNIQUE,
  stripe_payment_intent_id text,
  customer_email text,
  customer_name text,
  plan_type text,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_orders_user_id ON public.orders(user_id);
CREATE INDEX idx_orders_stripe_session_id ON public.orders(stripe_session_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_created_at ON public.orders(created_at DESC);

-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Users can view their own orders
CREATE POLICY "Users can view own orders"
  ON public.orders FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can manage all orders (for Edge Functions)
CREATE POLICY "Service role can manage orders"
  ON public.orders FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Admins can view all orders
CREATE POLICY "Admins can view all orders"
  ON public.orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION update_orders_updated_at();