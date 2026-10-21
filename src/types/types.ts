export type UserRole = 'user' | 'admin';
export type PlanType = 'free' | 'hero' | 'pro' | 'business';
export type BillingCycle = 'weekly' | 'monthly';

export interface Profile {
  id: string;
  email: string | null;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  plan: PlanType;
  upload_limit_mb: number;
  country_code: string;
  currency_code: string;
  credits: number;
  api_enabled: boolean;
  plan_billing_cycle: BillingCycle;
  plan_expires_at: string | null;
  total_messages_sent: number;
  created_at: string;
  updated_at: string;
  is_disabled?: boolean;
  disabled_reason?: string | null;
  disabled_at?: string | null;
}

export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface ConversationMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  images: Array<{
    data: string;
    mimeType: string;
    name: string;
  }> | null;
  created_at: string;
}

export interface Session {
  id: string;
  user_id: string;
  session_token: string;
  ip_address: string | null;
  user_agent: string | null;
  device_name: string | null;
  last_active: string;
  created_at: string;
}

export interface SessionWithUser extends Session {
  username: string | null;
  email: string | null;
}

export type PaymentMethod = 'upi' | 'netbanking';
export type PaymentStatus = 'pending' | 'approved' | 'rejected';

export interface PaymentRequest {
  id: string;
  user_id: string;
  plan_id: PlanType;
  payment_method: PaymentMethod;
  screenshot_url: string;
  amount: number;
  status: PaymentStatus;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentRequestWithUser extends PaymentRequest {
  username: string | null;
  email: string | null;
  full_name: string | null;
}

export interface ApiKey {
  id: string;
  user_id: string;
  name: string;
  key_prefix: string;
  is_active: boolean;
  last_used_at: string | null;
  total_requests: number;
  rate_limit_per_min: number;
  created_at: string;
  expires_at: string | null;
}

export interface ApiUsage {
  id: string;
  user_id: string;
  api_key_id: string | null;
  model: string;
  input_tokens: number;
  output_tokens: number;
  credits_used: number;
  source: 'chat' | 'api';
  status: string;
  response_ms: number | null;
  created_at: string;
}

export interface CreditsLedger {
  id: string;
  user_id: string;
  amount: number;
  balance_after: number;
  type: 'purchase' | 'usage' | 'bonus' | 'refund' | 'admin_adjustment' | 'plan_grant';
  description: string | null;
  reference_id: string | null;
  created_at: string;
}

export interface CreditPack {
  id: string;
  name: string;
  credits: number;
  price_inr: number;
  price_usd: number;
  bonus_credits: number;
  is_active: boolean;
  popular: boolean;
  sort_order: number;
}
