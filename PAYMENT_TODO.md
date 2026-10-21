# Payment System Upgrade - ChatGPT Style

## Goal
Upgrade the payment system to support Business and Hero plans with Stripe integration, similar to ChatGPT's payment flow.

## Current State
- ✅ Orders table exists (00012_create_orders_table_for_stripe.sql)
- ✅ Plans page exists with 4 plans (Free, Pro, Business, Hero)
- ✅ Subscriptions and usage_tracking tables created
- ✅ Stripe Edge Functions deployed (create_stripe_checkout, verify_stripe_payment)
- ✅ Payment page redesigned with Stripe integration
- ✅ PaymentSuccess page created
- ✅ Routes updated
- ❌ Usage tracking not integrated in Chat
- ❌ Settings page needs subscription management UI
- ❌ No billing history display

## Implementation Plan

### Phase 1: Database Setup ✅
- [x] Create subscriptions table
- [x] Add subscription_id to profiles
- [x] Create usage_tracking table
- [x] Create RPC functions for subscription management

### Phase 2: Stripe Edge Functions ✅
- [x] Create `create_stripe_checkout` Edge Function
- [x] Create `verify_stripe_payment` Edge Function
- [x] Deploy Edge Functions

### Phase 3: Frontend - Payment Flow ✅
- [x] Update Payment.tsx to use Stripe Checkout
- [x] Create PaymentSuccess.tsx page
- [x] Add Stripe checkout redirect logic
- [x] Add payment verification on success page

### Phase 4: Frontend - Subscription Management
- [ ] Add subscription status to Settings page
- [ ] Create BillingHistory component
- [ ] Add cancel subscription dialog
- [ ] Show current plan benefits

### Phase 5: Usage Tracking
- [ ] Add message count tracking in Chat
- [ ] Implement plan limits
- [ ] Show usage progress in UI
- [ ] Add limit warnings

### Phase 6: Testing & Polish
- [ ] Test Stripe checkout flow
- [ ] Test subscription upgrades
- [ ] Add loading states
- [ ] Add error handling

## Plan Structure (Updated)

### Free Plan
- Price: ₹0/forever
- Features: Unlimited messages, 100MB upload daily, Flash AI, Image generation (slowest), Community support

### Plus Plan (Hero)
- Price: ₹2,999/month
- Features: Unlimited messages, 1GB upload daily, Flash AI, Image generation (slower than Pro), Voice to text, Standard speed, Email support

### Pro Plan ⚡ Best Value
- Price: ₹8,999/month
- Features: Unlimited 4K messages, Unlimited upload, Both AI models (Flash & Lightning), Faster image & video generation, Voice to text, Fastest speed, 24/7 support, API access, Team collaboration, White-label with special badge

### Business Plan
- Price: ₹13,999/month
- Features: 10 Plus accounts, All Plus features per account, Unlimited messages per account, 1GB upload daily per account, Image generation, Voice to text, Team collaboration, Admin dashboard

## Next Steps
1. Integrate usage tracking in Chat page
2. Add subscription management UI in Settings
3. Test complete payment flow
4. Add Stripe secret key configuration instructions
