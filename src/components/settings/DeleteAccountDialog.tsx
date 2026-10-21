import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, AlertTriangle, Mail, Shield } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { accountDeletionApi } from '@/db/api';
import { supabase } from '@/db/supabase';

interface DeleteAccountDialogProps {
  userId: string;
  username?: string;
}

export function DeleteAccountDialog({ userId, username }: DeleteAccountDialogProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<'confirm' | 'otp' | 'deleting'>('confirm');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleRequestDeletion = async () => {
    setIsLoading(true);

    const result = await accountDeletionApi.requestAccountDeletion();

    if (result.success) {
      toast({
        title: '📧 Verification Code Sent',
        description: 'Please check your email for the 6-digit verification code.',
      });
      setStep('otp');
    } else {
      toast({
        title: 'Request Failed',
        description: result.error || 'Failed to request account deletion.',
        variant: 'destructive',
      });
    }

    setIsLoading(false);
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      toast({
        title: 'Invalid Code',
        description: 'Please enter the 6-digit verification code.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    const verifyResult = await accountDeletionApi.verifyDeletionOtp(otp);

    if (!verifyResult.success) {
      toast({
        title: 'Verification Failed',
        description: verifyResult.error || 'Invalid or expired code.',
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }

    // OTP verified, now complete deletion
    setStep('deleting');

    const deleteResult = await accountDeletionApi.completeAccountDeletion(userId);

    if (deleteResult.success) {
      toast({
        title: '✅ Account Deleted',
        description: 'Your account has been permanently deleted.',
      });

      // Sign out and redirect to login
      await supabase.auth.signOut();
      navigate('/login');
    } else {
      toast({
        title: 'Deletion Failed',
        description: deleteResult.error || 'Failed to delete account.',
        variant: 'destructive',
      });
      setStep('otp');
    }

    setIsLoading(false);
  };

  const handleCancel = () => {
    setOpen(false);
    setStep('confirm');
    setOtp('');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="destructive"
          className="w-full justify-start gap-3 h-auto py-4 text-left hover:scale-[1.02] transition-all"
        >
          <div className="w-10 h-10 rounded-xl bg-destructive/20 flex items-center justify-center flex-shrink-0">
            <Trash2 className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="font-bold text-[15px]">Delete Account</div>
            <div className="text-xs text-destructive-foreground/80 font-normal">
              Permanently delete your account and all data
            </div>
          </div>
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-md">
        {step === 'confirm' && (
          <>
            <DialogHeader>
              <div className="w-16 h-16 rounded-2xl bg-destructive/20 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-destructive" />
              </div>
              <DialogTitle className="text-2xl text-center">Delete Account?</DialogTitle>
              <DialogDescription className="text-center text-[15px] space-y-3 pt-2">
                <p className="font-semibold text-foreground">
                  This action cannot be undone!
                </p>
                <p>
                  Deleting your account will permanently remove:
                </p>
                <ul className="text-left space-y-2 bg-muted/50 p-4 rounded-xl">
                  <li className="flex items-start gap-2">
                    <span className="text-destructive mt-0.5">•</span>
                    <span>All your conversations and chat history</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-destructive mt-0.5">•</span>
                    <span>Your profile and account settings</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-destructive mt-0.5">•</span>
                    <span>Your subscription and payment history</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-destructive mt-0.5">•</span>
                    <span>All associated data and preferences</span>
                  </li>
                </ul>
                {username && (
                  <p className="font-semibold text-foreground pt-2">
                    Account: <span className="text-primary">{username}</span>
                  </p>
                )}
              </DialogDescription>
            </DialogHeader>

            <DialogFooter className="flex-col sm:flex-col gap-2">
              <Button
                variant="destructive"
                onClick={handleRequestDeletion}
                disabled={isLoading}
                className="w-full gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Sending Code...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4" />
                    Yes, Send Verification Code
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={isLoading}
                className="w-full"
              >
                Cancel
              </Button>
            </DialogFooter>
          </>
        )}

        {step === 'otp' && (
          <>
            <DialogHeader>
              <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <DialogTitle className="text-2xl text-center">Verify Your Identity</DialogTitle>
              <DialogDescription className="text-center text-[15px] space-y-2 pt-2">
                <p>
                  We've sent a 6-digit verification code to your email.
                </p>
                <p className="text-xs text-muted-foreground">
                  This code will expire in 10 minutes.
                </p>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="otp" className="text-[15px] font-semibold">
                  Verification Code
                </Label>
                <Input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="text-center text-2xl tracking-widest font-mono h-14"
                  autoFocus
                />
              </div>
            </div>

            <DialogFooter className="flex-col sm:flex-col gap-2">
              <Button
                variant="destructive"
                onClick={handleVerifyOtp}
                disabled={isLoading || otp.length !== 6}
                className="w-full gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Verify & Delete Account
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={isLoading}
                className="w-full"
              >
                Cancel
              </Button>
            </DialogFooter>
          </>
        )}

        {step === 'deleting' && (
          <>
            <DialogHeader>
              <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-4">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
              <DialogTitle className="text-2xl text-center">Deleting Account...</DialogTitle>
              <DialogDescription className="text-center text-[15px] pt-2">
                Please wait while we process your request.
              </DialogDescription>
            </DialogHeader>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
