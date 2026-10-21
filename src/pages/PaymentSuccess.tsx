import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Loader2, XCircle, ArrowRight, Home } from 'lucide-react';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/components/auth/AuthProvider';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();
  
  const [isVerifying, setIsVerifying] = useState(true);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!sessionId) {
      setError('No session ID provided');
      setIsVerifying(false);
      return;
    }

    verifyPayment();
  }, [sessionId]);

  const verifyPayment = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('verify_stripe_payment', {
        body: JSON.stringify({ sessionId }),
      });

      if (error) {
        const errorMsg = await error?.context?.text();
        console.error('Edge function error in verify_stripe_payment:', errorMsg);
        setError(errorMsg || 'Failed to verify payment');
        setIsVerifying(false);
        return;
      }

      if (data?.data) {
        setVerificationResult(data.data);
        
        // Refresh user profile to get updated plan
        if (data.data.verified) {
          await refreshProfile();
        }
      } else {
        setError('Invalid response from server');
      }
    } catch (err) {
      console.error('Verification error:', err);
      setError('An error occurred while verifying payment');
    } finally {
      setIsVerifying(false);
    }
  };

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-2 border-border shadow-2xl">
          <CardContent className="pt-12 pb-12 text-center">
            <Loader2 className="w-16 h-16 mx-auto mb-6 text-primary animate-spin" />
            <h2 className="text-2xl font-bold mb-2">Verifying Payment</h2>
            <p className="text-muted-foreground">
              Please wait while we confirm your payment...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !verificationResult?.verified) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-2 border-destructive/20 shadow-2xl">
          <CardHeader className="text-center pb-4">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-10 h-10 text-destructive" />
            </div>
            <CardTitle className="text-2xl">Payment Verification Failed</CardTitle>
            <CardDescription className="text-base">
              {error || 'We could not verify your payment'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Don't worry! If you were charged, your payment will be processed shortly.
              Please check your email for confirmation or contact support.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => navigate('/plans')}
                className="flex-1"
              >
                Back to Plans
              </Button>
              <Button
                onClick={() => navigate('/')}
                className="flex-1"
              >
                <Home className="w-4 h-4 mr-2" />
                Go Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-2 border-primary/20 shadow-2xl">
        <CardHeader className="text-center pb-4">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-4 animate-pulse-glow">
            <CheckCircle2 className="w-12 h-12 text-white" />
          </div>
          <CardTitle className="text-3xl gradient-text">Payment Successful!</CardTitle>
          <CardDescription className="text-base">
            Your subscription has been activated
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Payment Details */}
          <div className="space-y-3 p-5 bg-gradient-to-br from-primary/5 to-accent/5 rounded-2xl border-2 border-primary/10">
            <h3 className="font-semibold text-lg mb-3">Payment Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount Paid:</span>
                <span className="font-semibold">
                  ${(verificationResult.amount / 100).toFixed(2)} {verificationResult.currency?.toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment ID:</span>
                <span className="font-mono text-xs">
                  {verificationResult.sessionId?.slice(0, 20)}...
                </span>
              </div>
              {verificationResult.customerEmail && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email:</span>
                  <span className="font-semibold">{verificationResult.customerEmail}</span>
                </div>
              )}
            </div>
          </div>

          {/* Next Steps */}
          <div className="space-y-3 p-5 bg-card rounded-2xl border-2 border-border">
            <h3 className="font-semibold text-lg mb-3">What's Next?</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                <span>Your plan has been activated immediately</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                <span>A confirmation email has been sent to your inbox</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                <span>You can manage your subscription in Settings</span>
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => navigate('/settings')}
              className="flex-1"
            >
              View Settings
            </Button>
            <Button
              onClick={() => navigate('/')}
              className="flex-1 bg-gradient-to-r from-primary to-accent"
            >
              Start Chatting
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Thank you for choosing Flash AI! 🎉
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
