import { useEffect, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { accountResetApi } from '@/db/api';
import { useAuth } from '@/components/auth/AuthProvider';

export function ResetNotification() {
  const [notification, setNotification] = useState<{ id: string; message: string; created_at: string; read: boolean } | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const { profile } = useAuth();

  useEffect(() => {
    if (profile?.id) {
      checkForNotification();
    }
  }, [profile]);

  const checkForNotification = async () => {
    if (!profile?.id) return;

    const notif = await accountResetApi.getResetNotification(profile.id);
    if (notif && !notif.read) {
      setNotification(notif);
      setIsVisible(true);
    }
  };

  const handleDismiss = async () => {
    if (notification?.id) {
      await accountResetApi.markNotificationRead(notification.id);
      setIsVisible(false);
      setNotification(null);
    }
  };

  if (!isVisible || !notification) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-fade-in">
      <Card className="max-w-2xl w-full mx-4 border-2 border-destructive/50 shadow-2xl">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-destructive/10 rounded-full">
                <AlertTriangle className="w-6 h-6 text-destructive" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold">Account Reset Notice</CardTitle>
                <CardDescription className="text-[15px] mt-1">
                  Your account was reset on {new Date(notification.created_at).toLocaleString()}
                </CardDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg border-2 border-border/50">
              <p className="text-sm font-semibold mb-2">Message from Administrator:</p>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {notification.message}
              </p>
            </div>
            <div className="p-4 bg-primary/5 rounded-lg border-2 border-primary/20">
              <p className="text-sm font-semibold mb-2">What was reset:</p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>All conversations and chat history</li>
                <li>All messages</li>
              </ul>
              <p className="text-sm font-semibold mt-3">What was preserved:</p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Your profile and account settings</li>
                <li>Your subscription plan</li>
                <li>Your account role and permissions</li>
              </ul>
            </div>
            <Button
              onClick={handleDismiss}
              className="w-full h-12 text-base font-semibold"
            >
              I Understand
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
