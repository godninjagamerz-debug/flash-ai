import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User, Session, SupabaseClient } from '@supabase/supabase-js';
import type { Profile } from '@/types/types';
import { profilesApi } from '@/db/api';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  loginAsGuest: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function getGuestProfile(): Profile | null {
  try {
    const guestRaw = localStorage.getItem('flash_guest_user');
    return guestRaw ? JSON.parse(guestRaw) as Profile : null;
  } catch {
    return null;
  }
}

function storeGuestProfile(profile: Profile): void {
  try {
    localStorage.setItem('flash_guest_user', JSON.stringify(profile));
  } catch {
    // Guest mode remains usable for this session without persistent storage.
  }
}

function removeGuestProfile(): void {
  try {
    localStorage.removeItem('flash_guest_user');
  } catch {
    // Ignore unavailable storage.
  }
}

interface AuthProviderProps {
  client: SupabaseClient;
  children: ReactNode;
}

export function AuthProvider({ client, children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    if (user) {
      const profileData = await profilesApi.getCurrentProfile();
      setProfile(profileData);
    } else {
      setProfile(getGuestProfile());
    }
  }, [user]);

  const loginAsGuest = () => {
    const guestId = `guest_${Math.random().toString(36).slice(2, 10)}`;
    const guestUser: Profile = {
      id: guestId,
      username: 'Guest User',
      full_name: 'Guest User',
      email: 'guest@flash.ai',
      plan: 'free',
      role: 'user',
      avatar_url: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      upload_limit_mb: 50,
      api_enabled: false,
      country_code: 'US',
      currency_code: 'USD',
      credits: 100,
      plan_billing_cycle: 'monthly',
      plan_expires_at: null,
      total_messages_sent: 0,
    };
    storeGuestProfile(guestUser);
    setProfile(guestUser);
  };

  useEffect(() => {
    client.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        profilesApi.getCurrentProfile().then(setProfile);
      } else {
        setProfile(getGuestProfile());
      }
      setLoading(false);
    }).catch(() => {
      setLoading(false);
      setProfile(getGuestProfile());
    });

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        removeGuestProfile();
        profilesApi.getCurrentProfile().then(setProfile);
      } else {
        setProfile(getGuestProfile());
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [client.auth]);

  const signOut = async () => {
    removeGuestProfile();
    try {
      localStorage.removeItem('flash_anon_session');
      sessionStorage.removeItem('flash_daily_used');
    } catch {}
    await client.auth.signOut().catch(() => {});
    setUser(null);
    setSession(null);
    setProfile(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, signOut, refreshProfile, loginAsGuest }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}