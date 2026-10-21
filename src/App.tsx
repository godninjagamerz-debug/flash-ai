import React, { Suspense, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { ResetNotification } from '@/components/common/ResetNotification';
import { SplashScreen } from '@/components/common/SplashScreen';
import { isSupabaseConfigured, supabase } from '@/db/supabase';
import routes from './routes';

const App: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [hasSeenSplash, setHasSeenSplash] = useState(false);

  useEffect(() => {
    // Check if user has seen splash screen in this session
    let splashSeen = null;
    try {
      splashSeen = sessionStorage.getItem('splash-seen');
    } catch {
      // Continue normally when session storage is unavailable.
    }
    if (splashSeen === 'true') {
      setShowSplash(false);
      setHasSeenSplash(true);
    }
  }, []);

  const handleSplashComplete = () => {
    try {
      sessionStorage.setItem('splash-seen', 'true');
    } catch {
      // The splash should still close when session storage is unavailable.
    }
    setShowSplash(false);
    setHasSeenSplash(true);
  };

  if (!isSupabaseConfigured) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
        <section className="w-full max-w-lg border border-border bg-card p-8">
          <h1 className="text-2xl font-semibold">Supabase configuration required</h1>
          <p className="mt-3 text-muted-foreground">
            The app cannot connect to its backend until these environment variables are configured:
          </p>
          <ul className="mt-4 list-inside list-disc space-y-2 font-mono text-sm">
            <li>VITE_SUPABASE_URL</li>
            <li>VITE_SUPABASE_ANON_KEY</li>
          </ul>
          <p className="mt-4 text-sm text-muted-foreground">
            Add them to the project environment and restart the development server.
          </p>
        </section>
      </div>
    );
  }

  return (
    <ThemeProvider defaultTheme="dark" storageKey="flash-ui-theme">
      {showSplash && !hasSeenSplash && (
        <SplashScreen onComplete={handleSplashComplete} />
      )}
      <Router>
        <AuthProvider client={supabase}>
          <RequireAuth whiteList={['/login', '/plans', '/']}>
            <div className="flex flex-col min-h-screen">
              <main className="flex-grow">
                <Suspense fallback={(
                  <div role="status" className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
                    Loading your workspace…
                  </div>
                )}>
                  <Routes>
                    {routes.map((route, index) => (
                      <Route key={index} path={route.path} element={route.element} />
                    ))}
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Suspense>
              </main>
            </div>
            <ResetNotification />
          </RequireAuth>
          <Toaster />
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
};

export default App;
