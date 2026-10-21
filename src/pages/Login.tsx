import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Mail,
  Lock,
  User,
  ShieldCheck,
  ArrowRight,
  KeyRound,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle2,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/db/supabase';
import { profilesApi } from '@/db/api';
import { toast } from 'sonner';
import { FlashLogo } from '@/components/common/FlashLogo';
import type { Provider } from '@supabase/supabase-js';

interface SocialProviderDef {
  id: Provider;
  name: string;
  badge: string;
}

const SOCIAL_PROVIDERS: SocialProviderDef[] = [
  { id: 'google', name: 'Google', badge: 'G' },
  { id: 'apple', name: 'Apple', badge: '' },
  { id: 'github', name: 'GitHub', badge: 'GH' },
  { id: 'discord', name: 'Discord', badge: 'DC' },
  { id: 'twitter', name: 'X / Grok', badge: '𝕏' },
  { id: 'facebook', name: 'Meta / IG', badge: 'f' },
  { id: 'linkedin_oidc', name: 'LinkedIn', badge: 'in' },
  { id: 'azure', name: 'Microsoft', badge: 'MS' },
  { id: 'spotify', name: 'Spotify', badge: 'SP' },
  { id: 'twitch', name: 'Twitch', badge: 'TW' },
  { id: 'slack_oidc', name: 'Slack', badge: 'SL' },
  { id: 'figma', name: 'Figma', badge: 'FG' },
  { id: 'gitlab', name: 'GitLab', badge: 'GL' },
  { id: 'notion', name: 'Notion', badge: 'N' },
  { id: 'zoom', name: 'Zoom', badge: 'ZM' },
];

type ForgotStep = 'idle' | 'request_email' | 'verify_code' | 'new_password';

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [showAllProviders, setShowAllProviders] = useState(false);

  // Forgot Password states
  const [forgotStep, setForgotStep] = useState<ForgotStep>('idle');
  const [resetEmailInput, setResetEmailInput] = useState('');
  const [resetOtpCode, setResetOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // Visible inline status banner
  const [statusMessage, setStatusMessage] = useState<{
    type: 'error' | 'success' | 'info';
    text: string;
  } | null>(null);

  // Controlled form state
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string })?.from || '/';

  const showError = (msg: string) => {
    console.error('[Flash AI Auth]:', msg);
    setStatusMessage({ type: 'error', text: msg });
    try {
      toast.error(msg);
    } catch {}
  };

  const showSuccess = (msg: string) => {
    console.log('[Flash AI Auth]:', msg);
    setStatusMessage({ type: 'success', text: msg });
    try {
      toast.success(msg);
    } catch {}
  };

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const withTimeout = <T,>(promise: Promise<T>, ms = 14000): Promise<T> => {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(
          () =>
            reject(
              new Error('Network request timed out. Please check your internet connection.')
            ),
          ms
        )
      ),
    ]);
  };

  const resolveEmailFromInput = async (inputTarget: string): Promise<string | null> => {
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inputTarget);
    if (isEmail) return inputTarget;

    const fetchedEmail = await withTimeout(profilesApi.getEmailByUsername(inputTarget), 8000);
    if (!fetchedEmail) {
      showError('No account found with this username. Please enter your email address.');
      return null;
    }
    return fetchedEmail;
  };

  // ==================== FORGOT PASSWORD FLOW ====================
  const handleSendResetCode = async () => {
    if (isLoading) return;
    setStatusMessage(null);

    const target = resetEmailInput.trim();
    if (!target) {
      showError('Please enter your email address or username.');
      return;
    }

    setIsLoading(true);
    try {
      const resolvedEmail = await resolveEmailFromInput(target);
      if (!resolvedEmail) {
        setIsLoading(false);
        return;
      }

      const { error } = await withTimeout(
        supabase.auth.resetPasswordForEmail(resolvedEmail),
        12000
      );

      if (error) throw error;

      setUserEmail(resolvedEmail);
      setResetOtpCode('');
      setForgotStep('verify_code');
      setResendCooldown(60);
      showSuccess(`6-digit password reset code sent to ${resolvedEmail}!`);
    } catch (error: unknown) {
      const err = error as { message?: string };
      showError(err.message || 'Failed to send password reset code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyResetCode = async () => {
    if (isLoading) return;
    setStatusMessage(null);

    const code = resetOtpCode.replace(/\D/g, '').trim();
    if (code.length !== 6) {
      showError('Please enter the complete 6-digit recovery code.');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await withTimeout(
        supabase.auth.verifyOtp({
          email: userEmail,
          token: code,
          type: 'recovery',
        }),
        12000
      );

      if (error) throw error;

      setNewPassword('');
      setConfirmNewPassword('');
      setForgotStep('new_password');
      showSuccess('Code verified! Enter your new password below.');
    } catch (error: unknown) {
      const err = error as { message?: string };
      showError(err.message || 'Invalid or expired 6-digit recovery code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateNewPassword = async () => {
    if (isLoading) return;
    setStatusMessage(null);

    const pass = newPassword.trim();
    const confirmPass = confirmNewPassword.trim();

    if (pass.length < 6) {
      showError('New password must be at least 6 characters long.');
      return;
    }

    if (pass !== confirmPass) {
      showError('Passwords do not match. Please check both fields.');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await withTimeout(
        supabase.auth.updateUser({ password: pass }),
        12000
      );

      if (error) throw error;

      showSuccess('Password updated successfully! Welcome back to Flash AI.');
      setForgotStep('idle');
      navigate(from, { replace: true });
    } catch (error: unknown) {
      const err = error as { message?: string };
      showError(err.message || 'Failed to update password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendResetCode = async () => {
    if (isLoading || resendCooldown > 0) return;
    setIsLoading(true);
    setStatusMessage(null);
    try {
      const { error } = await withTimeout(
        supabase.auth.resetPasswordForEmail(userEmail),
        10000
      );
      if (error) throw error;
      setResendCooldown(60);
      showSuccess('A new 6-digit password reset code has been sent to your email!');
    } catch (error: unknown) {
      const err = error as { message?: string };
      showError(err.message || 'Failed to resend reset code.');
    } finally {
      setIsLoading(false);
    }
  };

  // ==================== SIGN IN & SIGN UP FLOW ====================
  const handleEmailAuth = async () => {
    if (isLoading) return;
    setStatusMessage(null);

    const inputTarget = emailOrUsername.trim();
    const inputPass = password.trim();

    if (!inputTarget) {
      showError(
        mode === 'login'
          ? 'Please enter your email or username.'
          : 'Please enter your email address.'
      );
      return;
    }

    if (!inputPass) {
      showError('Please enter your password.');
      return;
    }

    if (mode === 'signup') {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inputTarget)) {
        showError('Please enter a valid email address (e.g. name@gmail.com).');
        return;
      }
      const cleanUsername = username.trim().replace(/\s+/g, '_');
      if (!cleanUsername || !/^[a-zA-Z0-9_]+$/.test(cleanUsername)) {
        showError('Username can only contain letters, numbers, and underscores (_).');
        return;
      }
      if (!fullName.trim()) {
        showError('Please enter your Full Name.');
        return;
      }
      if (inputPass !== confirmPassword.trim()) {
        showError('Passwords do not match! Check Password and Confirm fields.');
        return;
      }
      if (inputPass.length < 6) {
        showError('Password must be at least 6 characters long.');
        return;
      }
    }

    setIsLoading(true);
    setStatusMessage({
      type: 'info',
      text:
        mode === 'login'
          ? 'Signing in to Flash AI...'
          : 'Creating account & sending 6-digit verification email...',
    });

    try {
      let email = inputTarget;

      if (mode === 'login') {
        const resolved = await resolveEmailFromInput(inputTarget);
        if (!resolved) {
          setIsLoading(false);
          return;
        }
        email = resolved;

        const { error } = await withTimeout(
          supabase.auth.signInWithPassword({
            email,
            password: inputPass,
          }),
          14000
        );

        if (error) {
          if (error.message.toLowerCase().includes('email not confirmed')) {
            await supabase.auth.resend({ type: 'signup', email });
            setUserEmail(email);
            setOtpCode('');
            setShowOtpInput(true);
            setResendCooldown(60);
            showSuccess('Please verify your email! We sent a 6-digit code to your inbox.');
            return;
          }
          throw error;
        }

        showSuccess('Welcome back to Flash AI!');
        navigate(from, { replace: true });
      } else {
        const cleanUsername = username.trim().replace(/\s+/g, '_');
        const { data, error } = await withTimeout(
          supabase.auth.signUp({
            email,
            password: inputPass,
            options: {
              data: {
                username: cleanUsername,
                full_name: fullName.trim(),
              },
            },
          }),
          14000
        );

        if (error) throw error;

        if (data.user && data.user.identities && data.user.identities.length === 0) {
          showError(
            'This email is already registered! Switch to Sign In or use Forgot Password.'
          );
          setIsLoading(false);
          return;
        }

        if (data.session) {
          showSuccess('Account created! Redirecting...');
          navigate(from, { replace: true });
        } else {
          setUserEmail(email);
          setOtpCode('');
          setShowOtpInput(true);
          setResendCooldown(60);
          showSuccess(`6-digit verification code sent to ${email}!`);
        }
      }
    } catch (error: unknown) {
      const err = error as { message?: string };
      showError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpVerification = async () => {
    if (isLoading) return;
    setStatusMessage(null);

    const code = otpCode.replace(/\D/g, '').trim();
    if (code.length !== 6) {
      showError('Please enter the complete 6-digit verification code.');
      return;
    }

    setIsLoading(true);

    try {
      let { error } = await withTimeout(
        supabase.auth.verifyOtp({
          email: userEmail,
          token: code,
          type: 'signup',
        }),
        12000
      );

      if (error) {
        const retry = await supabase.auth.verifyOtp({
          email: userEmail,
          token: code,
          type: 'email',
        });
        error = retry.error;
      }

      if (error) throw error;

      showSuccess('Email verified successfully! Welcome to Flash AI.');
      navigate(from, { replace: true });
    } catch (error: unknown) {
      const err = error as { message?: string };
      showError(err.message || 'Invalid or expired verification code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (isLoading || resendCooldown > 0) return;
    setIsLoading(true);
    setStatusMessage(null);
    try {
      const { error } = await withTimeout(
        supabase.auth.resend({
          type: 'signup',
          email: userEmail,
        }),
        10000
      );
      if (error) throw error;
      setResendCooldown(60);
      showSuccess('A new 6-digit verification code has been sent to your email!');
    } catch (error: unknown) {
      const err = error as { message?: string };
      showError(err.message || 'Failed to resend code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: Provider, providerName: string) => {
    try {
      setIsLoading(true);
      setStatusMessage(null);
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });
      if (error) throw error;
    } catch (error: unknown) {
      const err = error as { message?: string };
      showError(
        err.message || `Could not connect to ${providerName}. Enable it in Supabase Auth Providers.`
      );
      setIsLoading(false);
    }
  };

  const visibleProviders = showAllProviders ? SOCIAL_PROVIDERS : SOCIAL_PROVIDERS.slice(0, 6);

  // ==================== RENDER 1: FORGOT PASSWORD PANEL ====================
  if (forgotStep !== 'idle') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background relative overflow-hidden">
        <Card className="w-full max-w-md relative z-10 border border-white/15 shadow-2xl rounded-3xl p-6 bg-card">
          <CardHeader className="space-y-3 text-center pb-4">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-3xl flex items-center justify-center shadow-lg">
              <RotateCcw className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold">
              {forgotStep === 'request_email' && 'Reset Your Password'}
              {forgotStep === 'verify_code' && 'Enter Recovery Code'}
              {forgotStep === 'new_password' && 'Create New Password'}
            </CardTitle>
            <CardDescription className="text-sm">
              {forgotStep === 'request_email' &&
                'Enter your email or username and we will send a 6-digit recovery code.'}
              {forgotStep === 'verify_code' && (
                <>
                  We sent a 6-digit recovery code to{' '}
                  <span className="font-semibold text-foreground">{userEmail}</span>
                </>
              )}
              {forgotStep === 'new_password' &&
                'Code verified! Enter your new password below to finish resetting your account.'}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            {statusMessage && (
              <div
                className={`p-3 rounded-xl text-xs font-medium flex items-start gap-2 border ${
                  statusMessage.type === 'error'
                    ? 'bg-destructive/15 text-destructive border-destructive/30'
                    : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                }`}
              >
                {statusMessage.type === 'error' ? (
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                )}
                <span>{statusMessage.text}</span>
              </div>
            )}

            {forgotStep === 'request_email' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email" className="text-xs font-semibold text-muted-foreground">
                    Email or Username
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="reset-email"
                      value={resetEmailInput}
                      onChange={(e) => setResetEmailInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSendResetCode();
                      }}
                      type="text"
                      placeholder="email@example.com or username"
                      className="pl-10 h-11 rounded-2xl border-white/15 bg-background/50 text-sm"
                      autoFocus
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSendResetCode}
                  disabled={isLoading}
                  className="relative z-20 w-full h-11 text-sm font-semibold text-white rounded-2xl bg-gradient-to-r from-primary to-accent hover:opacity-90 active:scale-95 transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? 'Sending 6-Digit Code...' : 'Send Recovery Code'}
                </button>
              </div>
            )}

            {forgotStep === 'verify_code' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-otp" className="text-sm font-semibold">
                    6-Digit Recovery Code
                  </Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="reset-otp"
                      value={resetOtpCode}
                      onChange={(e) =>
                        setResetOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleVerifyResetCode();
                      }}
                      type="text"
                      inputMode="numeric"
                      placeholder="123456"
                      maxLength={6}
                      className="pl-10 h-12 text-center text-2xl tracking-[0.5em] font-mono font-bold rounded-2xl border-white/15 bg-background/50"
                      autoFocus
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleVerifyResetCode}
                  disabled={isLoading || resetOtpCode.length < 6}
                  className="relative z-20 w-full h-11 text-sm font-semibold text-white rounded-2xl bg-gradient-to-r from-primary to-accent hover:opacity-90 active:scale-95 transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? 'Verifying Code...' : 'Verify Code'}
                </button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleResendResetCode}
                  disabled={isLoading || resendCooldown > 0}
                  className="w-full h-10 text-xs rounded-xl border-white/10"
                >
                  {resendCooldown > 0 ? `Resend Code in ${resendCooldown}s` : 'Resend Recovery Code'}
                </Button>
              </div>
            )}

            {forgotStep === 'new_password' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password" className="text-xs font-semibold text-muted-foreground">
                    New Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="new-password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      type="password"
                      placeholder="Minimum 6 characters"
                      className="pl-10 h-11 rounded-2xl border-white/15 bg-background/50 text-sm"
                      autoFocus
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="confirm-new-password"
                    className="text-xs font-semibold text-muted-foreground"
                  >
                    Confirm New Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="confirm-new-password"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleUpdateNewPassword();
                      }}
                      type="password"
                      placeholder="Repeat new password"
                      className="pl-10 h-11 rounded-2xl border-white/15 bg-background/50 text-sm"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleUpdateNewPassword}
                  disabled={isLoading}
                  className="relative z-20 w-full h-11 text-sm font-semibold text-white rounded-2xl bg-gradient-to-r from-primary to-accent hover:opacity-90 active:scale-95 transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? 'Saving Password...' : 'Save New Password & Sign In'}
                </button>
              </div>
            )}

            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setForgotStep('idle');
                setStatusMessage(null);
              }}
              className="w-full h-10 text-xs text-muted-foreground"
            >
              Back to Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ==================== RENDER 2: SIGNUP EMAIL VERIFICATION PANEL ====================
  if (showOtpInput) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background relative overflow-hidden">
        <Card className="w-full max-w-md relative z-10 border border-white/15 shadow-2xl rounded-3xl p-6 bg-card">
          <CardHeader className="space-y-3 text-center pb-4">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-3xl flex items-center justify-center shadow-lg">
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold">Verify Your Email</CardTitle>
            <CardDescription className="text-sm">
              We've sent a 6-digit code to{' '}
              <span className="font-semibold text-foreground">{userEmail}</span>
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            {statusMessage && (
              <div
                className={`p-3 rounded-xl text-xs font-medium flex items-start gap-2 border ${
                  statusMessage.type === 'error'
                    ? 'bg-destructive/15 text-destructive border-destructive/30'
                    : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                }`}
              >
                {statusMessage.type === 'error' ? (
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                )}
                <span>{statusMessage.text}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="otp" className="text-sm font-semibold">
                Verification Code
              </Label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="otp"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleOtpVerification();
                  }}
                  type="text"
                  inputMode="numeric"
                  placeholder="123456"
                  maxLength={6}
                  className="pl-10 h-12 text-center text-2xl tracking-[0.5em] font-mono font-bold rounded-2xl border-white/15 bg-background/50"
                  autoFocus
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleOtpVerification}
              disabled={isLoading}
              className="relative z-20 w-full h-11 text-sm font-semibold text-white rounded-2xl bg-gradient-to-r from-primary to-accent hover:opacity-90 active:scale-95 transition-all shadow-md cursor-pointer disabled:opacity-50"
            >
              {isLoading ? 'Verifying...' : 'Verify & Continue'}
            </button>

            <div className="text-center space-y-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleResendOtp}
                disabled={isLoading || resendCooldown > 0}
                className="w-full h-10 text-xs rounded-xl border-white/10"
              >
                {resendCooldown > 0 ? `Resend Code in ${resendCooldown}s` : 'Resend Code'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setShowOtpInput(false);
                  setStatusMessage(null);
                }}
                className="w-full h-10 text-xs text-muted-foreground"
              >
                Back to Sign Up
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ==================== RENDER 3: MAIN SIGN IN / CREATE ACCOUNT PANEL ====================
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background relative overflow-hidden">
      <Card className="w-full max-w-md relative z-10 border border-white/15 shadow-2xl rounded-3xl p-6 sm:p-7 bg-card/95 backdrop-blur-xl">
        <CardHeader className="space-y-3 text-center pb-4">
          <FlashLogo className="mx-auto h-14 w-14 rounded-2xl" />
          <div>
            <CardTitle className="text-2xl font-bold tracking-tight">Flash AI</CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-1">
              Curved Liquid Experience · Fast, Private & Unlimited
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 px-0">
          {/* Mode Switcher */}
          <div className="grid w-full grid-cols-2 h-11 bg-muted/40 rounded-2xl border border-white/10 p-1">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setStatusMessage(null);
              }}
              className={`text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                mode === 'login'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setStatusMessage(null);
              }}
              className={`text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                mode === 'signup'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Create Account
            </button>
          </div>

          {statusMessage && (
            <div
              className={`p-3 rounded-xl text-xs font-medium flex items-start gap-2 border ${
                statusMessage.type === 'error'
                  ? 'bg-destructive/15 text-destructive border-destructive/30'
                  : statusMessage.type === 'success'
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                  : 'bg-primary/15 text-primary border-primary/30'
              }`}
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{statusMessage.text}</span>
            </div>
          )}

          {mode === 'login' ? (
            <div className="space-y-3.5 pt-1">
              <div className="space-y-1.5">
                <Label htmlFor="login-email" className="text-xs font-semibold text-muted-foreground">
                  Email or Username
                </Label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="login-email"
                    value={emailOrUsername}
                    onChange={(e) => setEmailOrUsername(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleEmailAuth();
                    }}
                    type="text"
                    placeholder="email@example.com or username"
                    className="pl-10 h-11 rounded-2xl border-white/10 bg-background/50 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="login-password"
                    className="text-xs font-semibold text-muted-foreground"
                  >
                    Password
                  </Label>
                  <button
                    type="button"
                    onClick={() => {
                      setResetEmailInput(emailOrUsername);
                      setStatusMessage(null);
                      setForgotStep('request_email');
                    }}
                    className="text-xs font-semibold text-primary hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="login-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleEmailAuth();
                    }}
                    type="password"
                    placeholder="Enter password"
                    className="pl-10 h-11 rounded-2xl border-white/10 bg-background/50 text-sm"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleEmailAuth}
                disabled={isLoading}
                className="relative z-20 w-full h-11 text-sm font-semibold text-white rounded-2xl bg-gradient-to-r from-primary to-accent hover:opacity-95 active:scale-95 transition-all shadow-md mt-2 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <span>Signing in...</span>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-3 pt-1">
              <div className="space-y-1">
                <Label htmlFor="signup-email" className="text-xs font-semibold text-muted-foreground">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="signup-email"
                    value={emailOrUsername}
                    onChange={(e) => setEmailOrUsername(e.target.value)}
                    type="email"
                    placeholder="your.email@example.com"
                    className="pl-10 h-11 rounded-2xl border-white/10 bg-background/50 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label
                    htmlFor="signup-username"
                    className="text-xs font-semibold text-muted-foreground"
                  >
                    Username
                  </Label>
                  <Input
                    id="signup-username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    type="text"
                    placeholder="username"
                    className="h-11 rounded-2xl border-white/10 bg-background/50 text-sm px-3"
                  />
                </div>

                <div className="space-y-1">
                  <Label
                    htmlFor="signup-name"
                    className="text-xs font-semibold text-muted-foreground"
                  >
                    Full Name
                  </Label>
                  <Input
                    id="signup-name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    type="text"
                    placeholder="John Doe"
                    className="h-11 rounded-2xl border-white/10 bg-background/50 text-sm px-3"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label
                    htmlFor="signup-password"
                    className="text-xs font-semibold text-muted-foreground"
                  >
                    Password
                  </Label>
                  <Input
                    id="signup-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type="password"
                    placeholder="Min 6 chars"
                    className="h-11 rounded-2xl border-white/10 bg-background/50 text-sm px-3"
                  />
                </div>

                <div className="space-y-1">
                  <Label
                    htmlFor="signup-confirm-password"
                    className="text-xs font-semibold text-muted-foreground"
                  >
                    Confirm
                  </Label>
                  <Input
                    id="signup-confirm-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleEmailAuth();
                    }}
                    type="password"
                    placeholder="Repeat password"
                    className="h-11 rounded-2xl border-white/10 bg-background/50 text-sm px-3"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleEmailAuth}
                disabled={isLoading}
                className="relative z-20 w-full h-11 text-sm font-semibold text-white rounded-2xl bg-gradient-to-r from-primary to-accent hover:opacity-95 active:scale-95 transition-all shadow-md mt-2 flex items-center justify-center cursor-pointer disabled:opacity-50"
              >
                {isLoading ? 'Creating account...' : 'Create Account'}
              </button>
            </div>
          )}

          {/* 15 Social Connect Providers */}
          <div className="space-y-3 pt-1">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full opacity-40" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase">
                <span className="bg-card px-2 text-muted-foreground font-medium">
                  Or Continue With
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {visibleProviders.map((prov) => (
                <Button
                  key={prov.id}
                  type="button"
                  variant="outline"
                  disabled={isLoading}
                  onClick={() => handleSocialLogin(prov.id, prov.name)}
                  className="h-9 text-xs rounded-xl border-white/10 hover:border-primary/40 hover:bg-primary/5 transition-all flex items-center justify-center gap-1.5 px-2"
                >
                  <span className="w-4 h-4 rounded bg-muted flex items-center justify-center text-[10px] font-bold shrink-0">
                    {prov.badge}
                  </span>
                  <span className="truncate">{prov.name}</span>
                </Button>
              ))}
            </div>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowAllProviders((prev) => !prev)}
              className="w-full h-7 text-[11px] text-muted-foreground hover:text-foreground gap-1"
            >
              {showAllProviders ? (
                <>
                  <span>Show fewer providers</span>
                  <ChevronUp className="w-3.5 h-3.5" />
                </>
              ) : (
                <>
                  <span>Show all 15 login providers</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}