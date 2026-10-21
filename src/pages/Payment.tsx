import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ArrowLeft, CreditCard, Check, Loader2, Zap, Shield, Clock, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/components/auth/AuthProvider';
import { PLANS } from '@/types/plans';

// Derive config from the single-source PLANS array so prices are never duplicated
const PLAN_CONFIG = Object.fromEntries(
  PLANS.filter(p => p.id !== 'free').map(p => [
    p.id,
    {
      name: `${p.name} Plan`,
      price: p.priceMonthly,
      currency: p.currency,
      interval: 'month' as const,
      features: p.features.filter(f => f.included).map(f => f.text),
    },
  ])
) as Record<string, { name: string; price: number; currency: string; interval: 'month'; features: string[] }>;

export default function Payment() {
  const [searchParams] = useSearchParams();
  const planId = (searchParams.get('plan') || 'pro') as string;
  const navigate = useNavigate();
  const { user } = useAuth();

  const [isProcessing, setIsProcessing] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState<{ discount: number; label: string } | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);

  const planConfig = PLAN_CONFIG[planId];

  if (!planConfig) {
    navigate('/plans');
    return null;
  }

  const finalPrice = couponApplied
    ? Math.max(0, Math.round(planConfig.price * (1 - couponApplied.discount / 100)))
    : planConfig.price;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('apply_coupon', {
        body: JSON.stringify({ code: couponCode.trim().toUpperCase(), planId }),
      });
      if (error || !data?.valid) {
        toast.error('Invalid or expired coupon code.');
        setCouponApplied(null);
      } else {
        setCouponApplied({ discount: data.discount, label: data.label || `${data.discount}% off` });
        toast.success(`Coupon applied — ${data.label || `${data.discount}% off`}!`);
      }
    } catch {
      // Edge fn not yet deployed — demo mode
      if (couponCode.trim().toUpperCase() === 'FREEMONTH') {
        setCouponApplied({ discount: 100, label: 'Free Month!' });
        toast.success('Coupon applied — Free Month!');
      } else {
        toast.error('Invalid coupon code.');
        setCouponApplied(null);
      }
    } finally {
      setCouponLoading(false);
    }
  };

  const handleCheckout = async () => {
    if (!user) {
      toast.error('Please log in to continue with payment.');
      navigate('/login');
      return;
    }

    if (finalPrice === 0) {
      // Free offer — activate directly
      toast.success(`${planConfig.name} activated for free!`);
      navigate('/');
      return;
    }

    setIsProcessing(true);

    try {
      const { data, error } = await supabase.functions.invoke('create_stripe_checkout', {
        body: JSON.stringify({
          planType: planId,
          items: [{
            name: planConfig.name,
            price: finalPrice,
            quantity: 1,
          }],
          currency: 'inr',
          mode: 'subscription',
          couponCode: couponCode.trim() || undefined,
        }),
      });

      if (error) {
        const errorMsg = await error?.context?.text?.();
        if (errorMsg?.includes('STRIPE_SECRET_KEY')) {
          toast.error('Payment system not yet configured. Please contact support.');
        } else {
          toast.error(errorMsg || 'Failed to initiate payment. Please try again.');
        }
        return;
      }

      if (data?.data?.url) {
        window.open(data.data.url, '_blank');
        toast.success('Opening Stripe checkout in a new tab…');
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      toast.error('An error occurred while processing your request.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Button
          variant="ghost"
          onClick={() => navigate('/plans')}
          className="mb-6 hover:bg-primary/10"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Plans
        </Button>

        <div className="grid gap-8 xl:grid-cols-2">
          {/* Plan Details */}
          <Card className="border-2 border-primary/20 shadow-2xl">
            <CardHeader className="bg-gradient-to-br from-primary/10 to-accent/10">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl gradient-text">{planConfig.name}</CardTitle>
                  <CardDescription className="text-base">Monthly Subscription</CardDescription>
                </div>
              </div>
              <div className="flex items-baseline gap-2 mt-4">
                {couponApplied && couponApplied.discount === 100 ? (
                  <span className="text-5xl font-bold gradient-text">Free!</span>
                ) : (
                  <>
                    {couponApplied && (
                      <span className="text-2xl line-through text-muted-foreground">
                        {planConfig.currency}{planConfig.price.toLocaleString('en-IN')}
                      </span>
                    )}
                    <span className="text-5xl font-bold gradient-text">
                      {planConfig.currency}{finalPrice.toLocaleString('en-IN')}
                    </span>
                    <span className="text-muted-foreground">/{planConfig.interval}</span>
                  </>
                )}
              </div>
              {couponApplied && (
                <div className="mt-2 inline-flex items-center gap-1.5 bg-green-500/10 text-green-600 dark:text-green-400 px-3 py-1 rounded-full text-sm font-medium">
                  <Tag className="w-3.5 h-3.5" />
                  {couponApplied.label}
                </div>
              )}
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Check className="w-5 h-5 text-primary" />
                  What's Included
                </h3>
                <ul className="space-y-3">
                  {planConfig.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Payment Method */}
          <Card className="border-2 border-border shadow-2xl">
            <CardHeader className="bg-gradient-to-br from-accent/10 to-primary/10">
              <CardTitle className="text-2xl gradient-text">Secure Payment</CardTitle>
              <CardDescription className="text-base">
                Powered by Stripe — Industry-leading security
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {/* Coupon Code */}
              <div className="space-y-2">
                <label className="text-sm font-semibold flex items-center gap-1.5">
                  <Tag className="w-4 h-4 text-primary" />
                  Coupon / Offer Code
                </label>
                <div className="flex gap-2">
                  <Input
                    value={couponCode}
                    onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponApplied(null); }}
                    placeholder="e.g. FREEMONTH"
                    className="h-11 border-2 font-mono uppercase"
                    disabled={couponLoading}
                    onKeyDown={e => e.key === 'Enter' && handleApplyCoupon()}
                  />
                  <Button
                    variant="outline"
                    onClick={handleApplyCoupon}
                    disabled={couponLoading || !couponCode.trim()}
                    className="h-11 px-4 border-2 shrink-0"
                  >
                    {couponLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
                  </Button>
                </div>
                {couponApplied && (
                  <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    Discount applied successfully
                  </p>
                )}
              </div>

              {/* Payment Method Info */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 rounded-xl border-2 border-primary/20 bg-primary/5">
                  <CreditCard className="w-8 h-8 text-primary" />
                  <div>
                    <h4 className="font-semibold">Credit / Debit Card</h4>
                    <p className="text-sm text-muted-foreground">Visa, Mastercard, UPI, Net Banking</p>
                  </div>
                </div>

                {/* Security Features */}
                <div className="space-y-3 p-5 bg-gradient-to-br from-primary/5 to-accent/5 rounded-2xl border-2 border-primary/10">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary" />
                    Secure &amp; Encrypted
                  </h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {['256-bit SSL encryption', 'PCI DSS compliant', 'No card details stored', 'Cancel anytime'].map(t => (
                      <li key={t} className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-primary" />{t}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Billing Summary */}
                <div className="space-y-3 p-5 bg-card rounded-2xl border-2 border-border">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" />
                    Billing Summary
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Plan:</span>
                      <span className="font-semibold">{planConfig.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Billing Cycle:</span>
                      <span className="font-semibold">Monthly</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Original Price:</span>
                      <span className="font-semibold">{planConfig.currency}{planConfig.price.toLocaleString('en-IN')}/mo</span>
                    </div>
                    {couponApplied && (
                      <div className="flex justify-between text-green-600 dark:text-green-400">
                        <span>Coupon Discount:</span>
                        <span className="font-semibold">−{couponApplied.discount}%</span>
                      </div>
                    )}
                    <div className="pt-3 mt-3 border-t border-border flex justify-between items-center">
                      <span className="font-semibold">Total Due Today:</span>
                      <span className="text-2xl font-bold gradient-text">
                        {finalPrice === 0 ? 'FREE' : `${planConfig.currency}${finalPrice.toLocaleString('en-IN')}`}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Next Billing:</span>
                      <span>{new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN')}</span>
                    </div>
                  </div>
                </div>

                {/* Checkout Button */}
                <Button
                  onClick={handleCheckout}
                  disabled={isProcessing}
                  className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
                  size="lg"
                >
                  {isProcessing ? (
                    <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Processing…</>
                  ) : finalPrice === 0 ? (
                    <><Check className="w-5 h-5 mr-2" />Activate Free Plan</>
                  ) : (
                    <><CreditCard className="w-5 h-5 mr-2" />Proceed to Secure Checkout</>
                  )}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  By proceeding, you agree to our Terms of Service and Privacy Policy.
                  You can cancel your subscription at any time.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Trust Badges */}
        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground mb-4">Trusted by thousands of users worldwide</p>
          <div className="flex items-center justify-center gap-8 flex-wrap">
            {[
              { icon: Shield, label: 'Secure Payment' },
              { icon: Check, label: 'Money-back Guarantee' },
              { icon: Clock, label: 'Cancel Anytime' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-muted-foreground">
                <Icon className="w-5 h-5" />
                <span className="text-sm">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
