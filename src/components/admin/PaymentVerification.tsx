import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Check, X, Eye, Clock, CreditCard, Building2, Loader2 } from 'lucide-react';
import { paymentsApi } from '@/db/api';
import type { PaymentRequestWithUser } from '@/types/types';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

export function PaymentVerification() {
  const [payments, setPayments] = useState<PaymentRequestWithUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<PaymentRequestWithUser | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    setIsLoading(true);
    const data = await paymentsApi.getAllPaymentRequests();
    setPayments(data);
    setIsLoading(false);
  };

  const handleViewScreenshot = (payment: PaymentRequestWithUser) => {
    setSelectedPayment(payment);
    setAdminNotes(payment.admin_notes || '');
    setIsDialogOpen(true);
  };

  const handleApprove = async () => {
    if (!selectedPayment) return;

    setIsProcessing(true);
    const success = await paymentsApi.approvePayment(selectedPayment.id, adminNotes || 'Payment approved');
    
    if (success) {
      toast({
        title: '✅ Payment Approved',
        description: `User ${selectedPayment.username || selectedPayment.email} has been upgraded to ${selectedPayment.plan_id} plan.`,
      });
      setIsDialogOpen(false);
      loadPayments();
    } else {
      toast({
        title: 'Approval Failed',
        description: 'Failed to approve payment. Please try again.',
        variant: 'destructive',
      });
    }
    setIsProcessing(false);
  };

  const handleReject = async () => {
    if (!selectedPayment) return;
    if (!adminNotes.trim()) {
      toast({
        title: 'Notes Required',
        description: 'Please provide a reason for rejection.',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    const success = await paymentsApi.rejectPayment(selectedPayment.id, adminNotes);
    
    if (success) {
      toast({
        title: '❌ Payment Rejected',
        description: `Payment request from ${selectedPayment.username || selectedPayment.email} has been rejected.`,
      });
      setIsDialogOpen(false);
      loadPayments();
    } else {
      toast({
        title: 'Rejection Failed',
        description: 'Failed to reject payment. Please try again.',
        variant: 'destructive',
      });
    }
    setIsProcessing(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge className="bg-green-500 hover:bg-green-600"><Check className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><X className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const pendingPayments = payments.filter(p => p.status === 'pending');
  const processedPayments = payments.filter(p => p.status !== 'pending');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pending Payments */}
      <Card className="border-2 border-yellow-500/30 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10">
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-yellow-500" />
            Pending Payments ({pendingPayments.length})
          </CardTitle>
          <CardDescription>Review and approve payment requests</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {pendingPayments.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No pending payments</p>
          ) : (
            <div className="space-y-4">
              {pendingPayments.map((payment) => (
                <div
                  key={payment.id}
                  className="p-4 border-2 border-border rounded-xl hover:border-primary/50 transition-all bg-card"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold">
                          {payment.username?.[0]?.toUpperCase() || payment.email?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div>
                          <p className="font-semibold">{payment.full_name || payment.username || 'Unknown User'}</p>
                          <p className="text-sm text-muted-foreground">{payment.email}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-muted-foreground">Plan</p>
                          <p className="font-semibold capitalize">{payment.plan_id}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Amount</p>
                          <p className="font-semibold text-primary">₹{payment.amount}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Method</p>
                          <div className="flex items-center gap-1">
                            {payment.payment_method === 'upi' ? (
                              <CreditCard className="w-4 h-4" />
                            ) : (
                              <Building2 className="w-4 h-4" />
                            )}
                            <p className="font-semibold capitalize">{payment.payment_method}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Date</p>
                          <p className="font-semibold">{new Date(payment.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleViewScreenshot(payment)}
                      className="bg-gradient-to-r from-primary to-accent hover:shadow-lg"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Review
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Processed Payments */}
      <Card className="border-2 border-border shadow-xl">
        <CardHeader className="bg-gradient-to-r from-primary/10 to-accent/10">
          <CardTitle>Payment History ({processedPayments.length})</CardTitle>
          <CardDescription>Previously processed payments</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {processedPayments.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No payment history</p>
          ) : (
            <div className="space-y-3">
              {processedPayments.map((payment) => (
                <div
                  key={payment.id}
                  className={cn(
                    'p-4 border rounded-xl bg-card',
                    payment.status === 'approved' && 'border-green-500/30',
                    payment.status === 'rejected' && 'border-red-500/30'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <p className="font-semibold">{payment.full_name || payment.username || payment.email}</p>
                        {getStatusBadge(payment.status)}
                      </div>
                      <div className="grid grid-cols-4 gap-3 text-sm text-muted-foreground">
                        <div>
                          <span className="font-semibold capitalize">{payment.plan_id}</span> Plan
                        </div>
                        <div>₹{payment.amount}</div>
                        <div className="capitalize">{payment.payment_method}</div>
                        <div>{new Date(payment.created_at).toLocaleDateString()}</div>
                      </div>
                      {payment.admin_notes && (
                        <p className="text-sm text-muted-foreground mt-2 italic">
                          Note: {payment.admin_notes}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewScreenshot(payment)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Screenshot Review Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl gradient-text">Payment Verification</DialogTitle>
            <DialogDescription>
              Review payment screenshot and approve or reject
            </DialogDescription>
          </DialogHeader>

          {selectedPayment && (
            <div className="space-y-6">
              {/* User Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">User Information</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-semibold">{selectedPayment.full_name || selectedPayment.username || 'Unknown'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-semibold">{selectedPayment.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Plan</p>
                    <p className="font-semibold capitalize">{selectedPayment.plan_id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Amount</p>
                    <p className="font-semibold text-primary">₹{selectedPayment.amount}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Payment Method</p>
                    <p className="font-semibold capitalize">{selectedPayment.payment_method}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    {getStatusBadge(selectedPayment.status)}
                  </div>
                </CardContent>
              </Card>

              {/* Screenshot */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Payment Screenshot</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-xl overflow-hidden border-2 border-border">
                    <img
                      src={selectedPayment.screenshot_url}
                      alt="Payment screenshot"
                      className="w-full h-auto"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Admin Notes */}
              <div className="space-y-2">
                <label className="text-sm font-semibold">Admin Notes</label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add notes about this payment..."
                  rows={3}
                  disabled={selectedPayment.status !== 'pending'}
                />
              </div>

              {/* Actions */}
              {selectedPayment.status === 'pending' && (
                <div className="flex gap-3">
                  <Button
                    onClick={handleApprove}
                    disabled={isProcessing}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                  >
                    {isProcessing ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4 mr-2" />
                    )}
                    Approve Payment
                  </Button>
                  <Button
                    onClick={handleReject}
                    disabled={isProcessing}
                    variant="destructive"
                    className="flex-1"
                  >
                    {isProcessing ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <X className="w-4 h-4 mr-2" />
                    )}
                    Reject Payment
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
