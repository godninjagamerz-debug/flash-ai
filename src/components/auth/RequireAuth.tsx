import { useEffect, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthProvider';

interface RequireAuthProps {
  children: ReactNode;
  whiteList?: string[];
}

export function RequireAuth({ children, whiteList = ['/login', '/'] }: RequireAuthProps) {
  const { user, profile, loading, refreshProfile } = useAuth();
  const hasGuestSession = profile?.id.startsWith('guest_') ?? false;
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || profile?.is_disabled) return;

    const refresh = () => { void refreshProfile(); };
    const interval = window.setInterval(refresh, 30000);
    window.addEventListener('focus', refresh);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', refresh);
    };
  }, [user, profile?.is_disabled, refreshProfile]);

  useEffect(() => {
    if (!loading && !user && !hasGuestSession) {
      const isWhitelisted = whiteList.some((path) => {
        if (path.endsWith('/*')) {
          return location.pathname.startsWith(path.slice(0, -2));
        }
        return location.pathname === path;
      });

      if (!isWhitelisted) {
        navigate('/login', { state: { from: location.pathname } });
      }
    }
  }, [user, hasGuestSession, loading, location, navigate, whiteList]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (profile?.is_disabled) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-5 text-foreground">
        <section className="w-full max-w-lg space-y-4 border border-destructive/30 bg-card p-6 sm:p-8">
          <h1 className="text-xl font-semibold">This account is disabled</h1>
          <p className="text-sm text-muted-foreground">
            Sign-in and account access have been paused by an administrator. The reason was sent to the email address on this account.
          </p>
          {profile.disabled_reason && (
            <div className="break-words border-l-2 border-destructive/50 pl-3 text-sm">{profile.disabled_reason}</div>
          )}
        </section>
      </main>
    );
  }

  return <>{children}</>;
}
