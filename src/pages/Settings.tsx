import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Settings as SettingsIcon,
  Shield,
  Smartphone,
  Monitor,
  Tablet,
  Globe,
  Clock,
  LogOut,
  Key,
  Eye,
  EyeOff,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { useAuth } from '@/components/auth/AuthProvider';
import { sessionsApi, authApi, adminApi } from '@/db/api';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { DeleteAccountDialog } from '@/components/settings/DeleteAccountDialog';

interface SessionData {
  id: string;
  user_id: string;
  ip_address: string | null;
  user_agent: string | null;
  device_name: string | null;
  last_active: string;
  created_at: string;
  username?: string | null;
  email?: string | null;
}

export default function Settings() {
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [allSessions, setAllSessions] = useState<SessionData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!profile) {
      navigate('/login');
      return;
    }

    loadSessions();
  }, [profile, navigate]);

  const loadSessions = async () => {
    setIsLoading(true);
    const mySessions = await sessionsApi.getMySessions();
    setSessions(mySessions);

    if (profile?.role === 'admin') {
      const all = await adminApi.getAllSessions();
      setAllSessions(all);
    }

    setIsLoading(false);
  };

  const getDeviceIcon = (userAgent: string | null) => {
    if (!userAgent) return <Monitor className="w-5 h-5" />;
    const ua = userAgent.toLowerCase();
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
      return <Smartphone className="w-5 h-5" />;
    }
    if (ua.includes('tablet') || ua.includes('ipad')) {
      return <Tablet className="w-5 h-5" />;
    }
    return <Monitor className="w-5 h-5" />;
  };

  const getDeviceName = (userAgent: string | null) => {
    if (!userAgent) return 'Unknown Device';
    const ua = userAgent.toLowerCase();
    
    if (ua.includes('chrome')) return 'Chrome Browser';
    if (ua.includes('firefox')) return 'Firefox Browser';
    if (ua.includes('safari')) return 'Safari Browser';
    if (ua.includes('edge')) return 'Edge Browser';
    if (ua.includes('opera')) return 'Opera Browser';
    
    if (ua.includes('windows')) return 'Windows PC';
    if (ua.includes('mac')) return 'Mac Computer';
    if (ua.includes('linux')) return 'Linux Computer';
    if (ua.includes('android')) return 'Android Device';
    if (ua.includes('iphone')) return 'iPhone';
    if (ua.includes('ipad')) return 'iPad';
    
    return 'Unknown Device';
  };

  const formatLastActive = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const handleSignOutSession = async (sessionId: string) => {
    const success = await sessionsApi.signOutSession(sessionId);
    if (success) {
      toast({
        title: '✅ Session Signed Out',
        description: 'The device has been signed out successfully.',
      });
      loadSessions();
    } else {
      toast({
        title: 'Sign Out Failed',
        description: 'Failed to sign out the session.',
        variant: 'destructive',
      });
    }
  };

  const handleSignOutAllOther = async () => {
    if (!confirm('Sign out all other devices? You will remain signed in on this device.')) return;

    const currentSessionId = sessions[0]?.id;
    if (!currentSessionId) {
      toast({
        title: 'Error',
        description: 'Could not identify current session.',
        variant: 'destructive',
      });
      return;
    }

    const success = await sessionsApi.signOutOtherSessions(currentSessionId);
    if (success) {
      toast({
        title: '✅ All Other Sessions Signed Out',
        description: 'You have been signed out from all other devices.',
      });
      loadSessions();
    } else {
      toast({
        title: 'Sign Out Failed',
        description: 'Failed to sign out other sessions.',
        variant: 'destructive',
      });
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast({
        title: 'Passwords Do Not Match',
        description: 'Please make sure your new passwords match.',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword.length < 8) {
      toast({
        title: 'Password Too Short',
        description: 'Password must be at least 8 characters long.',
        variant: 'destructive',
      });
      return;
    }

    setIsChangingPassword(true);

    const result = await authApi.changePassword(currentPassword, newPassword);

    if (result.success) {
      toast({
        title: '✅ Password Changed',
        description: 'Your password has been updated successfully.',
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      toast({
        title: 'Password Change Failed',
        description: result.error || 'Failed to change password.',
        variant: 'destructive',
      });
    }

    setIsChangingPassword(false);
  };

  if (!profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 overflow-x-hidden w-full">
      <header className="border-b-2 border-border/50 bg-gradient-to-r from-card to-card/95 shadow-md sticky top-0 z-10 backdrop-blur-xl">
        <div className="container mx-auto px-3 sm:px-4 xl:px-6 py-3.5 flex items-center justify-between gap-2 max-w-full">
          <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/')}
              className="hover:scale-105 transition-all border-2 shrink-0 h-8 px-2 text-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1" />
              <span className="hidden xs:inline">Back</span>
            </Button>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-primary via-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/30 shrink-0">
              <SettingsIcon className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold gradient-text truncate">Settings</h1>
              <p className="text-xs text-muted-foreground truncate hidden sm:block">Manage your account and security</p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <div className="container mx-auto px-3 sm:px-4 xl:px-6 py-6 max-w-5xl w-full">
        <Tabs defaultValue="security" className="w-full">
          <div className="w-full overflow-x-auto no-scrollbar pb-2">
            <TabsList className="inline-flex w-full sm:w-auto justify-start gap-1 p-1 bg-card border-2 border-border/50 rounded-xl min-w-full sm:min-w-0">
              <TabsTrigger
                value="security"
                className="flex-1 sm:flex-initial data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg py-2 px-4 font-semibold text-xs sm:text-sm whitespace-nowrap"
              >
                <Shield className="w-3.5 h-3.5 mr-1.5" />
                Security
              </TabsTrigger>
              <TabsTrigger
                value="password"
                className="flex-1 sm:flex-initial data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg py-2 px-4 font-semibold text-xs sm:text-sm whitespace-nowrap"
              >
                <Key className="w-3.5 h-3.5 mr-1.5" />
                Password
              </TabsTrigger>
              {profile.role === 'admin' && (
                <TabsTrigger
                  value="admin-sessions"
                  className="flex-1 sm:flex-initial data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg py-2 px-4 font-semibold text-xs sm:text-sm whitespace-nowrap"
                >
                  <Globe className="w-3.5 h-3.5 mr-1.5" />
                  All Sessions
                </TabsTrigger>
              )}
            </TabsList>
          </div>

          {/* Security Tab - Device Management */}
          <TabsContent value="security" className="space-y-6 mt-4">
            <Card className="border-2 border-border/50 bg-card shadow-lg">
              <CardHeader className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-xl sm:text-2xl font-bold gradient-text">Active Devices</CardTitle>
                    <CardDescription className="text-xs sm:text-sm mt-0.5">
                      Manage devices where you're currently signed in
                    </CardDescription>
                  </div>
                  {sessions.length > 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSignOutAllOther}
                      className="border-2 hover:bg-destructive/10 hover:border-destructive/50 text-xs shrink-0 self-start sm:self-auto"
                    >
                      <LogOut className="w-3.5 h-3.5 mr-1.5" />
                      Sign Out All Others
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mb-3" />
                    <p className="text-xs text-muted-foreground font-medium">Loading devices...</p>
                  </div>
                ) : sessions.length === 0 ? (
                  <div className="text-center py-8">
                    <Smartphone className="w-12 h-12 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground font-medium">No active sessions found</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sessions.map((session, index) => (
                      <div
                        key={session.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border border-border/60 rounded-xl bg-card/60 transition-all hover:border-primary/30"
                      >
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            {getDeviceIcon(session.user_agent)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                              <h3 className="font-semibold text-sm text-foreground truncate">
                                {getDeviceName(session.user_agent)}
                              </h3>
                              {index === 0 && (
                                <Badge variant="default" className="text-[10px] py-0 px-1.5 h-4 font-bold">
                                  Current
                                </Badge>
                              )}
                            </div>
                            <div className="space-y-0.5 text-xs text-muted-foreground">
                              {session.ip_address && (
                                <div className="flex items-center gap-1.5">
                                  <Globe className="w-3.5 h-3.5" />
                                  <span className="font-mono">{session.ip_address}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5" />
                                <span>Last active {formatLastActive(session.last_active)}</span>
                              </div>
                              <p className="text-[11px] truncate">
                                {session.user_agent || 'Unknown browser'}
                              </p>
                            </div>
                          </div>
                        </div>
                        {index !== 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSignOutSession(session.id)}
                            className="border hover:bg-destructive/10 hover:border-destructive/50 text-xs self-end sm:self-center h-8"
                          >
                            <LogOut className="w-3.5 h-3.5 mr-1" />
                            Sign Out
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Password Tab */}
          <TabsContent value="password" className="space-y-6 mt-4">
            <Card className="border-2 border-border/50 bg-card shadow-lg">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-xl sm:text-2xl font-bold gradient-text">Change Password</CardTitle>
                <CardDescription className="text-xs sm:text-sm mt-0.5">
                  Update your password to keep your account secure
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
                <form onSubmit={handleChangePassword} className="space-y-4 max-w-md w-full">
                  <div className="space-y-1.5">
                    <Label htmlFor="current-password" className="text-xs font-semibold">
                      Current Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="current-password"
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                        className="pr-10 h-10 border text-xs sm:text-sm"
                        placeholder="Enter current password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
                      >
                        {showCurrentPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="new-password" className="text-xs font-semibold">
                      New Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="new-password"
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        minLength={8}
                        className="pr-10 h-10 border text-xs sm:text-sm"
                        placeholder="Min 8 characters"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
                      >
                        {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="confirm-password" className="text-xs font-semibold">
                      Confirm New Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="confirm-password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        minLength={8}
                        className="pr-10 h-10 border text-xs sm:text-sm"
                        placeholder="Confirm new password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
                      >
                        {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </Button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isChangingPassword}
                    className="w-full h-11 bg-primary text-primary-foreground font-semibold text-xs sm:text-sm mt-2"
                  >
                    {isChangingPassword ? 'Changing Password...' : 'Change Password'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Delete Account Section */}
            <Card className="border border-destructive/40 bg-card shadow-lg mt-4">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-lg sm:text-xl font-bold text-destructive flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Danger Zone
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Irreversible actions that will permanently affect your account
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 space-y-3">
                <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-xl">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Once you delete your account, there is no going back. All your data, conversations, 
                    and settings will be permanently removed.
                  </p>
                </div>

                <DeleteAccountDialog 
                  userId={profile.id} 
                  username={profile.username || profile.email || undefined}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Admin Sessions Tab */}
          {profile.role === 'admin' && (
            <TabsContent value="admin-sessions" className="space-y-6 mt-4">
              <Card className="border-2 border-border/50 bg-card shadow-lg">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-xl sm:text-2xl font-bold gradient-text">All User Sessions</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    View active sessions across all accounts
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
                  {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-8">
                      <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mb-3" />
                      <p className="text-xs text-muted-foreground">Loading sessions...</p>
                    </div>
                  ) : allSessions.length === 0 ? (
                    <div className="text-center py-8">
                      <Globe className="w-12 h-12 text-muted-foreground/30 mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">No active sessions found</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {allSessions.map((session) => (
                        <div
                          key={session.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border border-border/50 rounded-xl"
                        >
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                              {getDeviceIcon(session.user_agent)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <h3 className="font-semibold text-sm text-foreground truncate">
                                  {session.username || session.email || 'Unknown User'}
                                </h3>
                                <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4">
                                  {getDeviceName(session.user_agent)}
                                </Badge>
                              </div>
                              <div className="space-y-0.5 text-xs text-muted-foreground">
                                {session.ip_address && (
                                  <div className="flex items-center gap-1.5">
                                    <Globe className="w-3.5 h-3.5" />
                                    <span className="font-mono text-primary">{session.ip_address}</span>
                                  </div>
                                )}
                                <div className="flex items-center gap-1.5">
                                  <Clock className="w-3.5 h-3.5" />
                                  <span>Last active {formatLastActive(session.last_active)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}