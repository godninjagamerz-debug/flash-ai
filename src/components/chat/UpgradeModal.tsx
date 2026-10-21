/**
 * UpgradeModal — plan comparison dialog triggered when a locked model/feature is tapped.
 * Shows plan pills with correct styling and a CTA to /plans.
 */
import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown, Zap, Sparkles, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  /** Optional feature name to show in the headline */
  featureName?: string;
}

interface PlanDef {
  id: string;
  name: string;
  price: string;
  pill: 'free' | 'basic' | 'pro' | 'ultra';
  icon: FC<{ className?: string }>;
  features: readonly string[];
  popular?: boolean;
}

const PLANS: PlanDef[] = [
  {
    id: 'free',
    name: 'Free',
    price: '₹0',
    pill: 'free',
    icon: Zap,
    features: ['50 credits/day', 'F1–F3 Flash models', 'Image generation', 'Voice to text'],
  },
  {
    id: 'hero',
    name: 'Plus',
    price: '₹2,999/mo',
    pill: 'basic',
    icon: Star,
    features: ['500 credits/day', 'All Flash models (F1–F6)', 'Video generation', 'Email support'],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '₹8,999/mo',
    pill: 'pro',
    icon: Crown,
    features: ['Unlimited credits', 'Flash + Accure models', 'API access (60 req/min)', 'Priority support'],
    popular: true,
  },
  {
    id: 'business',
    name: 'Business',
    price: '₹13,999/mo',
    pill: 'ultra',
    icon: Sparkles,
    features: ['10 team seats', 'Unlimited credits/seat', 'API access (120 req/min)', 'Dedicated support'],
  },
];

/** Plan pill badge — matches design spec */
function PlanPill({ plan }: { plan: 'free' | 'basic' | 'pro' | 'ultra' }) {
  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide',
      plan === 'free'  && 'bg-muted text-muted-foreground',
      plan === 'basic' && 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
      plan === 'pro'   && 'bg-gradient-to-r from-primary/20 to-primary/10 text-primary border border-primary/20',
      plan === 'ultra' && 'bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-amber-500/20 text-foreground border border-purple-300/30 animate-shimmer',
    )}>
      {plan}
    </span>
  );
}

export function UpgradeModal({ open, onClose, featureName }: UpgradeModalProps) {
  const navigate = useNavigate();

  const handleUpgrade = () => {
    navigate('/plans');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-2xl p-0 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent px-6 pt-6 pb-4 border-b border-border">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Crown className="w-5 h-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">
                {featureName ? `Unlock ${featureName}` : 'Upgrade your plan'}
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Choose a plan that fits your needs
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4">
          {PLANS.map((plan) => {
            const Icon = plan.icon;
            return (
              <div
                key={plan.id}
                className={cn(
                  'relative flex flex-col gap-2 p-3 rounded-xl border transition-all',
                  plan.popular
                    ? 'border-primary/40 bg-primary/5 shadow-sm shadow-primary/10'
                    : 'border-border bg-card hover:border-primary/30'
                )}
              >
                {plan.popular && (
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                    <span className="text-[10px] font-bold bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                      Best Value
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Icon className={cn('w-4 h-4', plan.popular ? 'text-primary' : 'text-muted-foreground')} />
                  <span className="font-semibold text-sm">{plan.name}</span>
                </div>
                <PlanPill plan={plan.pill} />
                <p className="text-base font-bold text-foreground">{plan.price}</p>
                <ul className="space-y-1 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="text-[11px] text-muted-foreground flex items-start gap-1.5">
                      <span className="text-primary mt-0.5 shrink-0">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="px-4 pb-4 flex gap-2 justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>Maybe later</Button>
          <Button size="sm" onClick={handleUpgrade} className="gap-1.5">
            <Crown className="w-4 h-4" />
            View all plans
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
