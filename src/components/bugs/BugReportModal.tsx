import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Bug,
  Send,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { bugReportService, type BugTicket } from '@/services/bugReportService';
import { toast } from 'sonner';

interface BugReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BugReportModal({ open, onOpenChange }: BugReportModalProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<BugTicket['category']>('UI/Streaming');
  const [severity, setSeverity] = useState<BugTicket['severity']>('medium');
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState<BugTicket | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      toast.error('Please fill in both the issue title and description');
      return;
    }

    setIsSubmitting(true);
    try {
      const ticket = bugReportService.submitBugReport({
        title: title.trim(),
        category,
        severity,
        description: description.trim(),
        userEmail: email.trim() || undefined,
      });

      setSubmittedTicket(ticket);
      toast.success(`Bug report ${ticket.id} submitted to Admin Dashboard!`);
      setTitle('');
      setDescription('');
      setEmail('');
    } catch {
      toast.error('Failed to submit bug report');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSubmittedTicket(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-xl rounded-3xl liquid-glass-card border border-white/15 p-6 shadow-2xl">
        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 via-orange-500 to-amber-500 flex items-center justify-center shadow-md">
              <Bug className="w-5 h-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                Report an Issue or Bug
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Your feedback routes directly to our interactive Admin Triage Dashboard.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {submittedTicket ? (
          <div className="py-6 text-center space-y-4 animate-in fade-in-50">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-lg">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-foreground">
                Ticket Created: {submittedTicket.id}
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Thank you! Our engineering team has logged this issue in the Admin Panel and will investigate immediately.
              </p>
            </div>
            <Button
              onClick={handleClose}
              className="rounded-2xl text-xs px-6 bg-primary hover:opacity-90"
            >
              Done
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5 mt-2">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-muted-foreground">
                Issue Summary *
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Code snippet ZIP download button does not trigger"
                required
                className="text-xs rounded-xl border-white/15 bg-background/50"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-muted-foreground">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full h-9 px-3 rounded-xl border border-white/15 bg-background/50 text-xs text-foreground focus:outline-none focus:border-primary/60"
                >
                  <option value="UI/Streaming">UI & Message Streaming</option>
                  <option value="Voice/Audio">Live Voice & Audio</option>
                  <option value="Code/Deployment">Code, ZIP & Sub-links</option>
                  <option value="Plugins">Plugins & Tools</option>
                  <option value="Billing/Account">Billing & Plans</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-muted-foreground">
                  Severity
                </label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value as any)}
                  className="w-full h-9 px-3 rounded-xl border border-white/15 bg-background/50 text-xs text-foreground focus:outline-none focus:border-primary/60"
                >
                  <option value="low">Low - Minor cosmetic or visual typo</option>
                  <option value="medium">Medium - Annoyance but workaround exists</option>
                  <option value="high">High - Feature failure</option>
                  <option value="critical">Critical - App crash or data loss</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-muted-foreground">
                Detailed Description & Reproduction Steps *
              </label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What happened? What were you trying to do?"
                rows={3}
                required
                className="text-xs rounded-xl border-white/15 bg-background/50 resize-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-muted-foreground">
                Your Email (Optional, for updates)
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="text-xs rounded-xl border-white/15 bg-background/50"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClose}
                className="rounded-xl text-xs border-white/15"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting}
                className="rounded-xl text-xs font-semibold bg-gradient-to-r from-rose-500 to-amber-500 hover:opacity-90 gap-1.5 shadow-md"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit Ticket</span>
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
