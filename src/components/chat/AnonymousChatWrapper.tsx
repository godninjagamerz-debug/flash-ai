import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { getOrCreateAnonSession, hasAnonCredits, getAnonRemainingCredits } from '@/services/anonSessionService';
import { AlertCircle, Lock, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface AnonymousChatWrapperProps {
  children: React.ReactNode;
}

/**
 * Wrapper component that provides anonymous chat access with limited features
 * Shows warnings and prompts for anonymous users to sign up for full access
 */
export function AnonymousChatWrapper({ children }: AnonymousChatWrapperProps) {
  const { profile, loginAsGuest } = useAuth();
  const navigate = useNavigate();
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [remainingCredits, setRemainingCredits] = useState(5);

  // Initialize anonymous session if user is not logged in
  useEffect(() => {
    if (!profile) {
      // User is not logged in, create anonymous session
      const session = getOrCreateAnonSession();
      setIsAnonymous(true);
      setRemainingCredits(getAnonRemainingCredits());
    } else {
      setIsAnonymous(false);
    }
  }, [profile]);

  const handleSignUp = () => {
    navigate('/login');
  };

  // Show anonymous mode banner
  if (isAnonymous) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        {/* Anonymous Mode Banner */}
        <div className="bg-gradient-to-r from-amber-950/40 to-orange-950/40 border-b border-amber-900/30 px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-amber-100 font-medium">
                  You're using Flash AI in guest mode
                </p>
                <p className="text-xs text-amber-200/80">
                  {remainingCredits > 0 
                    ? `${remainingCredits} free messages remaining today • Sign up for unlimited access` 
                    : 'Daily limit reached • Sign up to continue'}
                </p>
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Button
                size="sm"
                variant="outline"
                className="border-amber-700/50 text-amber-100 hover:bg-amber-900/20"
                onClick={handleSignUp}
              >
                <Lock className="w-4 h-4 mr-2" />
                Sign Up Free
              </Button>
            </div>
          </div>
        </div>

        {/* Chat Content */}
        <div className="flex-1 overflow-auto">
          {children}
        </div>

        {/* Anonymous Features Notice - Bottom Sticky Card */}
        {remainingCredits <= 2 && remainingCredits > 0 && (
          <div className="border-t border-border/50 bg-card/50 backdrop-blur-sm p-4 sticky bottom-0">
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Zap className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {remainingCredits} message{remainingCredits !== 1 ? 's' : ''} left today
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Create a free account for unlimited access
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                onClick={handleSignUp}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
              >
                Get Started
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Render normally for authenticated users
  return <>{children}</>;
}
