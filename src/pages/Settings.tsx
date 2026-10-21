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
  User,
  Trash2,
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

    // Get current session (first one is usually current)
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <header className="border-b-2 border-border/50 bg-gradient-to-r from-card to-card/95 shadow-2xl sticky top-0 z-10 backdrop-blur-xl">
        <div className="container mx-auto px-4 xl:px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/')}
              className="mr-2 hover:scale-105 transition-all border-2"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Chat
            </Button>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary via-primary to-primary/80 flex items-center justify-center shadow-2xl shadow-primary/30 animate-float">
              <SettingsIcon className="w-7 h-7 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold gradient-text">Settings</h1>
              <p className="text-sm text-muted-foreground font-medium">Manage your account and security</p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <div className="container mx-auto px-4 xl:px-6 py-8 max-w-6xl">
        <Tabs defaultValue="security" className="w-full">
          <TabsList className="grid w-full grid-cols-2 xl:grid-cols-3 mb-8 h-auto p-1 bg-card border-2 border-border/50 rounded-2xl">
            <TabsTrigger
              value="security"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-primary-foreground rounded-xl py-3 font-bold text-[15px]"
            >
              <Shield className="w-4 h-4 mr-2" />
              Security
            </TabsTrigger>
            <TabsTrigger
              value="password"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-primary-foreground rounded-xl py-3 font-bold text-[15px]"
            >
              <Key className="w-4 h-4 mr-2" />
              Password
            </TabsTrigger>
            {profile.role === 'admin' && (
              <TabsTrigger
                value="admin-sessions"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-primary-foreground rounded-xl py-3 font-bold text-[15px]"
              >
                <Globe className="w-4 h-4 mr-2" />
                All Sessions
              </TabsTrigger>
            )}
          </TabsList>

          {/* Security Tab - Device Management */}
          <TabsContent value="security" className="space-y-6">
            <Card className="border-2 border-border/50 bg-gradient-to-br from-card to-card/95 shadow-2xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl font-bold gradient-text">Active Devices</CardTitle>
                    <CardDescription className="text-[15px] mt-1">
                      Manage devices where you're currently signed in
                    </CardDescription>
                  </div>
                  {sessions.length > 1 && (
                    <Button
                      variant="outline"
                      onClick={handleSignOutAllOther}
                      className="border-2 hover:bg-destructive/10 hover:border-destructive/50 hover:scale-105 transition-all"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out All Others
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
                    <p className="text-muted-foreground font-medium">Loading devices...</p>
                  </div>
                ) : sessions.length === 0 ? (
                  <div className="text-center py-12">
                    <Smartphone className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-muted-foreground font-medium">No active sessions found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sessions.map((session, index) => (
                      <div
                        key={session.id}
                        className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 p-5 border-2 border-border/50 rounded-2xl hover:bg-gradient-to-r hover:from-primary/5 hover:to-accent/5 transition-all hover:shadow-lg hover:border-primary/30 group"
                      >
                        <div className="flex items-start gap-4 flex-1">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0">
                            {getDeviceIcon(session.user_agent)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-bold text-[16px] text-foreground">
                                {getDeviceName(session.user_agent)}
                              </h3>
                              {index === 0 && (
                                <Badge variant="default" className="text-xs font-bold">
                                  Current Device
                                </Badge>
                              )}
                            </div>
                            <div className="space-y-1">
                              {session.ip_address && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Globe className="w-4 h-4" />
                                  <span className="font-mono">{session.ip_address}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Clock className="w-4 h-4" />
                                <span>Last active {formatLastActive(session.last_active)}</span>
                              </div>
                              <p className="text-xs text-muted-foreground truncate">
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
                            className="border-2 hover:bg-destructive/10 hover:border-destructive/50 hover:scale-105 transition-all"
                          >
                            <LogOut className="w-4 h-4 mr-2" />
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
          <TabsContent value="password">
            <Card className="border-2 border-border/50 bg-gradient-to-br from-card to-card/95 shadow-2xl">
              <CardHeader>
                <CardTitle className="text-2xl font-bold gradient-text">Change Password</CardTitle>
                <CardDescription className="text-[15px] mt-1">
                  Update your password to keep your account secure
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleChangePassword} className="space-y-6 max-w-md">
                  <div className="space-y-2">
                    <Label htmlFor="current-password" className="text-sm font-semibold">
                      Current Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="current-password"
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                        className="pr-10 h-12 border-2 rounded-xl text-[15px]"
                        placeholder="Enter current password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                      >
                        {showCurrentPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new-password" className="text-sm font-semibold">
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
                        className="pr-10 h-12 border-2 rounded-xl text-[15px]"
                        placeholder="Enter new password (min 8 characters)"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                      >
                        {showNewPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password" className="text-sm font-semibold">
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
                        className="pr-10 h-12 border-2 rounded-xl text-[15px]"
                        placeholder="Confirm new password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isChangingPassword}
                    className="w-full h-12 bg-gradient-to-r from-primary to-primary/80 hover:from-primary hover:to-primary/90 shadow-lg hover:shadow-xl transition-all hover:scale-105 font-bold text-[15px]"
                  >
                    {isChangingPassword ? (
                      <>
                        <div className="w-5 h-5 border-3 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                        Changing Password...
                      </>
                    ) : (
                      <>
                        <Key className="w-5 h-5 mr-2" />
                        Change Password
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Delete Account Section */}
            <Card className="border-2 border-destructive/50 bg-gradient-to-br from-card to-destructive/5 shadow-2xl mt-6">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-destructive flex items-center gap-2">
                  <AlertTriangle className="w-6 h-6" />
                  Danger Zone
                </CardTitle>
                <CardDescription className="text-[15px] mt-1">
                  Irreversible actions that will permanently affect your account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-destructive/10 border-2 border-destructive/30 rounded-xl">
                    <h3 className="font-bold text-[15px] text-destructive mb-2 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      Warning: This action is permanent
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Once you delete your account, there is no going back. All your data, conversations, 
                      and settings will be permanently removed from our servers.
                    </p>
                  </div>

                  <DeleteAccountDialog 
                    userId={profile.id} 
                    username={profile.username || profile.email || undefined}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Admin Sessions Tab */}
          {profile.role === 'admin' && (
            <TabsContent value="admin-sessions">
              <Card className="border-2 border-border/50 bg-gradient-to-br from-card to-card/95 shadow-2xl">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold gradient-text">All User Sessions</CardTitle>
                  <CardDescription className="text-[15px] mt-1">
                    View all active sessions across all users with IP addresses
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
                      <p className="text-muted-foreground font-medium">Loading sessions...</p>
                    </div>
                  ) : allSessions.length === 0 ? (
                    <div className="text-center py-12">
                      <Globe className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                      <p className="text-muted-foreground font-medium">No active sessions found</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {allSessions.map((session) => (
                        <div
                          key={session.id}
                          className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 p-5 border-2 border-border/50 rounded-2xl hover:bg-gradient-to-r hover:from-primary/5 hover:to-accent/5 transition-all hover:shadow-lg hover:border-primary/30"
                        >
                          <div className="flex items-start gap-4 flex-1">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0">
                              {getDeviceIcon(session.user_agent)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-bold text-[16px] text-foreground">
                                  {session.username || session.email || 'Unknown User'}
                                </h3>
                                <Badge variant="outline" className="text-xs font-semibold">
                                  {getDeviceName(session.user_agent)}
                                </Badge>
                              </div>
                              <div className="space-y-1">
                                {session.ip_address && (
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Globe className="w-4 h-4" />
                                    <span className="font-mono font-bold text-primary">{session.ip_address}</span>
                                  </div>
                                )}
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Clock className="w-4 h-4" />
                                  <span>Last active {formatLastActive(session.last_active)}</span>
                                </div>
                                <p className="text-xs text-muted-foreground truncate">
                                  {session.user_agent || 'Unknown browser'}
                                </p>
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
