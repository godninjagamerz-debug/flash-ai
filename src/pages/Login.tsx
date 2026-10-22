import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowRight, Sparkles, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/db/supabase';
import { toast } from 'sonner';
import { FlashLogo } from '@/components/common/FlashLogo';
import { guestService } from '@/services/guestService';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);

  const from = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/';

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password
        });
        if (error) throw error;
        toast.success('Registration successful! Please check your email to verify.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;
        guestService.exitGuestMode();
        toast.success('Welcome back!');
        navigate(from, { replace: true });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Authentication failed';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGuestEntry = () => {
    guestService.enterGuestMode();
    toast.info('Entered Guest Mode (5,000 Credits loaded)');
    navigate(from, { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-neutral-950 p-4">
      <Card className="w-full max-w-md shadow-lg border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
        <CardHeader className="text-center space-y-2 pb-4">
          <div className="flex justify-center mb-2">
            <FlashLogo className="w-12 h-12" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">
            {isSignUp ? 'Create your account' : 'Welcome to Flash AI'}
          </CardTitle>
          <CardDescription>
            {isSignUp
              ? 'Enter your credentials to get started'
              : 'Sign in to access your models, credits, and workspaces'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Guest Mode Direct Access */}
          <Button
            type="button"
            variant="outline"
            onClick={handleGuestEntry}
            className="w-full py-5 border-dashed border-primary/50 text-primary hover:bg-primary/5 flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Continue as Guest (5,000 Free Credits)
          </Button>

          <div className="relative my-2">
            <Separator />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="bg-white dark:bg-neutral-900 px-2 text-xs uppercase text-muted-foreground">
                Email Authentication
              </span>
            </div>
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handleEmailAuth} className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full mt-2">
              {loading ? (
                <RotateCcw className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <ArrowRight className="w-4 h-4 mr-2" />
              )}
              {isSignUp ? 'Sign Up' : 'Sign In'}
            </Button>
          </form>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-xs text-primary hover:underline"
            >
              {isSignUp
                ? 'Already have an account? Sign in'
                : "Don't have an account? Sign up"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}