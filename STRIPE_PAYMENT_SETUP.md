# Stripe Payment System Setup Guide

## Overview
Flash AI now includes a professional subscription payment system powered by Stripe, similar to ChatGPT's payment flow. Users can subscribe to Pro, Business, or Hero plans with secure monthly billing.

## What's Been Implemented

### ✅ Database Structure
1. **Subscriptions Table** (`subscriptions`)
   - Tracks user subscriptions
   - Stores Stripe subscription and customer IDs
   - Manages subscription status (active, cancelled, expired, past_due)
   - Records billing periods

2. **Usage Tracking Table** (`usage_tracking`)
   - Tracks message usage per user
   - Resets daily for free plan, monthly for paid plans
   - Enforces plan limits

3. **RPC Functions**
   - `get_plan_limits(plan_type)` - Returns limits for each plan
   - `get_user_usage(user_id)` - Gets current usage stats
   - `check_message_limit(user_id)` - Checks if user can send message
   - `increment_message_count(user_id)` - Increments usage counter

### ✅ Stripe Edge Functions
1. **create_stripe_checkout**
   - Creates Stripe checkout sessions
   - Supports subscription mode for recurring payments
   - Creates order records in database
   - Returns checkout URL for redirect

2. **verify_stripe_payment**
   - Verifies payment completion
   - Updates order status
   - Activates user subscription
   - Updates user plan in profiles

### ✅ Frontend Pages
1. **Payment Page** (`/payment`)
   - Beautiful plan details display
   - Secure payment information
   - Stripe checkout integration
   - Opens Stripe in new tab

2. **Payment Success Page** (`/payment-success`)
   - Verifies payment automatically
   - Shows payment confirmation
   - Displays next steps
   - Refreshes user profile

3. **Plans Page** (Updated)
   - Supports all 4 plans (Free, Pro, Business, Hero)
   - Redirects to payment for paid plans
   - Admin bypass for testing

## Plan Details

### Free Plan - ₹0/forever
- Unlimited messages
- 100MB upload daily
- Flash AI model
- Image generation (slowest)
- Slowest response time
- Community support

### Plus Plan (Hero) - ₹2,999/month
- Unlimited messages
- 1GB upload daily
- Flash AI model
- Image generation (slower than Pro)
- Voice to text
- Standard response speed
- Email support
- No video generation

### Pro Plan - ₹8,999/month ⚡ Best Value
- Unlimited messages in 4K
- Unlimited upload
- Both AI models (Flash & Lightning)
- Faster image generation
- Faster video generation
- Voice to text
- Fastest message receive
- 24/7 priority support
- API access
- Team collaboration
- White-label with special badge

### Business Plan - ₹13,999/month
- 10 Plus accounts included
- All Plus features for each account
- Unlimited messages per account
- 1GB upload daily per account
- Image generation (slower than Pro)
- Voice to text
- Standard response speed
- Email support
- Team collaboration tools
- Centralized billing
- Admin dashboard

## Setup Instructions

### Step 1: Get Stripe API Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
2. Sign up or log in to your Stripe account
3. Navigate to **Developers** → **API keys**
4. Copy your **Secret key** (starts with `sk_test_` for test mode or `sk_live_` for production)

### Step 2: Configure Stripe Secret Key

You need to add your Stripe secret key to the Supabase project:

1. Go to your Supabase project dashboard
2. Navigate to **Project Settings** → **Edge Functions** → **Secrets**
3. Add a new secret:
   - Name: `STRIPE_SECRET_KEY`
   - Value: Your Stripe secret key (e.g., `sk_test_...`)
4. Click **Save**

### Step 3: Test the Payment Flow

1. **Test Mode (Recommended First)**
   - Use Stripe test keys (starting with `sk_test_`)
   - Use test card: `4242 4242 4242 4242`
   - Any future expiry date
   - Any 3-digit CVC
   - Any ZIP code

2. **Test Flow**
   - Navigate to `/plans`
   - Click "Upgrade" on Pro, Business, or Hero plan
   - You'll be redirected to `/payment`
   - Click "Proceed to Secure Checkout"
   - Complete payment on Stripe's hosted page
   - You'll be redirected to `/payment-success`
   - Your plan will be activated automatically

3. **Production Mode**
   - Replace test keys with live keys (starting with `sk_live_`)
   - Test with real cards
   - Monitor payments in Stripe Dashboard

## Payment Flow Diagram

```
User clicks "Upgrade" on Plans page
         ↓
Redirected to Payment page (/payment)
         ↓
Clicks "Proceed to Secure Checkout"
         ↓
Frontend calls create_stripe_checkout Edge Function
         ↓
Edge Function creates order and Stripe session
         ↓
Returns checkout URL
         ↓
Opens Stripe checkout in new tab
         ↓
User completes payment on Stripe
         ↓
Stripe redirects to /payment-success?session_id=xxx
         ↓
Frontend calls verify_stripe_payment Edge Function
         ↓
Edge Function verifies payment with Stripe
         ↓
Updates order status to "completed"
         ↓
Creates/updates subscription record
         ↓
Updates user plan in profiles
         ↓
Shows success message
         ↓
User can start using new plan
```

## Database Schema

### subscriptions
```sql
CREATE TABLE subscriptions (
  id uuid PRIMARY KEY,
  user_id uuid UNIQUE REFERENCES auth.users(id),
  plan_type text NOT NULL DEFAULT 'free',
  stripe_subscription_id text UNIQUE,
  stripe_customer_id text,
  status subscription_status NOT NULL DEFAULT 'active',
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### usage_tracking
```sql
CREATE TABLE usage_tracking (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  plan_type text NOT NULL,
  messages_count integer DEFAULT 0,
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

## Security Features

1. **Stripe Hosted Checkout**
   - No card details touch your server
   - PCI DSS compliant automatically
   - 256-bit SSL encryption

2. **Edge Functions**
   - Server-side payment verification
   - Secrets never exposed to client
   - Secure order creation

3. **Row Level Security**
   - Users can only view their own subscriptions
   - Admins can view all subscriptions
   - Service role for Edge Functions

## Testing Checklist

- [ ] Stripe secret key configured
- [ ] Can access payment page
- [ ] Stripe checkout opens in new tab
- [ ] Test payment completes successfully
- [ ] Redirected to success page
- [ ] Payment verified automatically
- [ ] User plan updated in database
- [ ] Subscription record created
- [ ] Can view updated plan in Settings

## Troubleshooting

### Error: "STRIPE_SECRET_KEY not configured"
**Solution:** Add your Stripe secret key to Supabase Edge Functions secrets (see Step 2 above)

### Error: "Payment verification failed"
**Solution:** 
- Check that the session_id is in the URL
- Verify Stripe secret key is correct
- Check Edge Function logs in Supabase dashboard

### Payment completed but plan not updated
**Solution:**
- Check the orders table for order status
- Check the subscriptions table for subscription record
- Verify the verify_stripe_payment Edge Function ran successfully
- Check Edge Function logs for errors

### Checkout page doesn't open
**Solution:**
- Check browser console for errors
- Verify create_stripe_checkout Edge Function is deployed
- Check that user is authenticated
- Verify Stripe secret key is configured

## Next Steps (Optional Enhancements)

1. **Usage Tracking Integration**
   - Add message counting in Chat page
   - Show usage progress bar
   - Block messages when limit reached
   - Show upgrade prompt

2. **Subscription Management**
   - Add subscription details in Settings
   - Show billing history
   - Add cancel subscription button
   - Add upgrade/downgrade flow

3. **Webhooks (Advanced)**
   - Handle subscription renewals
   - Handle payment failures
   - Handle subscription cancellations
   - Send email notifications

4. **Admin Features**
   - View all subscriptions
   - Manual subscription activation
   - Refund management
   - Revenue analytics

## Support

If you encounter any issues:
1. Check the Supabase Edge Function logs
2. Check the browser console for errors
3. Verify all environment variables are set
4. Test with Stripe test mode first
5. Check Stripe Dashboard for payment status

## Important Notes

- **Test Mode First:** Always test with Stripe test keys before going live
- **Webhook Setup:** For production, set up Stripe webhooks for subscription events
- **Email Notifications:** Configure email templates in Stripe Dashboard
- **Refund Policy:** Define your refund policy and update Terms of Service
- **Tax Handling:** Configure tax settings in Stripe Dashboard if needed

## Files Modified/Created

### Database Migrations
- `supabase/migrations/00013_create_subscriptions_system.sql`

### Edge Functions
- `supabase/functions/create_stripe_checkout/index.ts` (updated)
- `supabase/functions/verify_stripe_payment/index.ts` (updated)

### Frontend Pages
- `src/pages/Payment.tsx` (redesigned)
- `src/pages/PaymentSuccess.tsx` (new)
- `src/pages/Plans.tsx` (updated)

### Routes
- `src/routes.tsx` (updated)

## Conclusion

Your Flash AI application now has a professional, secure payment system powered by Stripe. Users can subscribe to paid plans with confidence, and you can manage subscriptions through the Stripe Dashboard.

Remember to:
1. Add your Stripe secret key to Supabase
2. Test thoroughly in test mode
3. Switch to live keys when ready for production
4. Monitor payments in Stripe Dashboard

Happy selling! 🚀
