import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ArrowLeft, CreditCard, Check, Loader2, Zap, Shield, Clock, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/components/auth/AuthProvider';
import { PLAN_DETAILS, API_TIME_PACKAGES, API_TIER_SPECS, type PlanType } from '@/types/plans';

export default function Payment() {
  const [searchParams] = useSearchParams();
  const checkoutType = searchParams.get('type') || 'plan'; // 'plan' | 'api_pass'
  const planId = (searchParams.get('plan') || 'pro') as PlanType;
  const apiTier = (searchParams.get('tier') || 'plus') as 'plus' | 'pro';
  const apiDuration = searchParams.get('duration') || '1d';
  const apiKeyName = searchParams.get('keyName') || 'API Key';

  const navigate = useNavigate();
  const { profile } = useAuth();

  const [isProcessing, setIsProcessing] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState<{ discount: number; label: string } | null>(null);
  const [enterpriseSeats, setEnterpriseSeats] = useState(1);
  const [enterpriseCreditsPerSeat, setEnterpriseCreditsPerSeat] = useState(100000); // 55k - 160k

  const planConfig = PLAN_DETAILS[planId] || PLAN_DETAILS.pro;
  const apiPkg = API_TIME_PACKAGES.find((p) => p.id === apiDuration) || API_TIME_PACKAGES[1];

  const basePrice = checkoutType === 'api_pass'
    ? (apiTier === 'plus' ? apiPkg.plusPriceINR : apiPkg.proPriceINR)
    : planId === 'enterprise'
      ? Math.round((enterpriseCreditsPerSeat / 1000) * 65 * enterpriseSeats)
      : planConfig.priceMonthly;

  const finalPrice = couponApplied
    ? Math.max(0, Math.round(basePrice * (1 - couponApplied.discount / 100)))
    : basePrice;

  const handleApplyCoupon = () => {
    const code = couponCode.trim().toUpperCase();
    if (code === 'FREEMONTH' || code === 'FLASH100') {
      setCouponApplied({ discount: 100, label: '100% Off Applied!' });
      toast.success('Coupon applied!');
    } else if (code === 'FLASH50') {
      setCouponApplied({ discount: 50, label: '50% Off Applied!' });
      toast.success('50% discount applied!');
    } else {
      toast.error('Invalid coupon code.');
    }
  };

  const activateApiPassLocally = () => {
    const spec = API_TIER_SPECS[apiTier];
    const rawSecret = `fl_live_${apiTier}_${crypto.randomUUID().replace(/-/g, '')}`;
    const expires = new Date(Date.now() + apiPkg.durationHours * 3600 * 1000).toISOString();
    const existing = JSON.parse(localStorage.getItem('flash_realtime_api_keys') || '[]');
    existing.unshift({
      id: crypto.randomUUID(),
      name: apiKeyName,
      key: rawSecret,
      tier: apiTier,
      rpmLimit: spec.rpm,
      dailyCreditsLimit: spec.dailyCredits,
      creditsUsedToday: 0,
      durationLabel: apiPkg.durationLabel,
      expiresAt: expires,
      createdAt: new Date().toISOString(),
    });
    localStorage.setItem('flash_realtime_api_keys', JSON.stringify(existing));
  };

  const handleStripeCheckout = async () => {
    setIsProcessing(true);
    try {
      if (finalPrice === 0) {
        if (checkoutType === 'api_pass') {
          activateApiPassLocally();
          toast.success('API Key activated!');
          navigate('/api-keys');
          return;
        }
        const targetCredits = planId === 'enterprise' ? enterpriseCreditsPerSeat * enterpriseSeats : planConfig.credits;
        localStorage.setItem('flash_active_plan_override', planId);
        localStorage.setItem('flash_realtime_user_credits', String(targetCredits));
        window.dispatchEvent(new CustomEvent('flash_credits_updated', { detail: targetCredits }));
        toast.success(`${planConfig.name} Plan (${targetCredits.toLocaleString()} credits) activated!`);
        navigate('/');
        return;
      }

      const { data, error } = await supabase.functions.invoke('create_stripe_checkout', {
        body: JSON.stringify({
          planType: checkoutType === 'api_pass' ? `api_${apiTier}_${apiPkg.id}` : planId,
          items: [{
            name: checkoutType === 'api_pass'
              ? `${API_TIER_SPECS[apiTier].name} (${apiPkg.durationLabel})`
              : `${planConfig.name} Plan`,
            price: finalPrice,
            quantity: 1,
          }],
          currency: 'inr',
          mode: checkoutType === 'api_pass' ? 'payment' : 'subscription',
          successUrl: `${window.location.origin}/payment-success?type=${checkoutType}&plan=${planId}`,
          cancelUrl: window.location.href,
        }),
      });

      if (!error && data?.data?.url) {
        window.location.href = data.data.url;
        return;
      }

      toast.error('Stripe edge function unreachable. Use coupon FLASH100 for instant testing activation.');
    } catch {
      toast.error('Stripe checkout error. Ensure STRIPE_SECRET_KEY is set in Supabase Edge Functions.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden w-full">
      <div className="container mx-auto px-3 sm:px-4 py-6 max-w-4xl w-full">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
        </Button>

        <div className="grid gap-6 lg:grid-cols-2 w-full">
          <Card className="border border-primary/25 shadow-lg">
            <CardHeader className="bg-primary/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-xl">
                    {checkoutType === 'api_pass'
                      ? `${API_TIER_SPECS[apiTier].name} — ${apiPkg.durationLabel}`
                      : `${planConfig.name} Plan`}
                  </CardTitle>
                  <CardDescription>
                    {checkoutType === 'api_pass'
                      ? `${API_TIER_SPECS[apiTier].rpm} rq/min · ${API_TIER_SPECS[apiTier].dailyCreditsDisplay}`
                      : `${planConfig.creditsDisplay} credits · ${planConfig.uploadDisplay} uploads`}
                  </CardDescription>
                </div>
              </div>
              <div className="mt-4">
                <span className="text-3xl font-bold gradient-text">
                  ₹{finalPrice.toLocaleString('en-IN')}
                </span>
              </div>
            </CardHeader>

            <CardContent className="pt-5 space-y-4">
              {checkoutType === 'plan' && planId === 'enterprise' && (
                <div className="p-3.5 rounded-xl bg-muted/50 border border-border space-y-3">
                  <div>
                    <label className="text-xs font-semibold flex justify-between">
                      <span>Credits per Seat (55k – 160k):</span>
                      <span className="text-primary font-bold">{enterpriseCreditsPerSeat.toLocaleString()}</span>
                    </label>
                    <input
                      type="range"
                      min={55000}
                      max={160000}
                      step={5000}
                      value={enterpriseCreditsPerSeat}
                      onChange={(e) => setEnterpriseCreditsPerSeat(Number(e.target.value))}
                      className="w-full mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold flex justify-between">
                      <span>Number of Seats:</span>
                      <span className="text-primary font-bold">{enterpriseSeats}</span>
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={enterpriseSeats}
                      onChange={(e) => setEnterpriseSeats(Math.max(1, Number(e.target.value)))}
                      className="w-full mt-1 px-2 py-1 rounded border bg-background text-sm"
                    />
                  </div>
                </div>
              )}

              <ul className="space-y-2 text-xs sm:text-sm">
                {(checkoutType === 'api_pass'
                  ? [
                      `${API_TIER_SPECS[apiTier].rpm} Requests per minute`,
                      `${API_TIER_SPECS[apiTier].dailyCreditsDisplay} quota`,
                      `Active for ${apiPkg.durationLabel}`,
                      'Instant key activation',
                    ]
                  : planConfig.features.filter((f) => f.included).map((f) => f.text)
                ).map((item, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-primary shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="border border-border shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl">Stripe Checkout</CardTitle>
              <CardDescription>256-bit SSL encrypted payment processing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-primary" /> Coupon / Offer Code
                </label>
                <div className="flex gap-2">
                  <Input
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="E.G. FREEMONTH"
                    className="uppercase font-mono text-xs flex-1 min-w-0"
                  />
                  <Button variant="outline" onClick={handleApplyCoupon} className="shrink-0">
                    Apply
                  </Button>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-border space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Account:</span>
                  <span className="font-medium">{profile?.email || 'Current User'}</span>
                </div>
                <div className="flex justify-between font-semibold text-sm pt-2 border-t">
                  <span>Total Due:</span>
                  <span className="text-primary">₹{finalPrice.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <Button
                onClick={handleStripeCheckout}
                disabled={isProcessing}
                className="w-full h-12 font-semibold text-sm gap-2"
              >
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                {finalPrice === 0 ? 'Activate Immediately' : 'Proceed to Stripe Checkout'}
              </Button>

              <div className="flex items-center justify-center gap-4 text-[11px] text-muted-foreground pt-2">
                <span className="flex items-center gap-1"><Shield className="w-3.5 h-3.5" /> Stripe Verified</span>
                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Instant Credits</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}