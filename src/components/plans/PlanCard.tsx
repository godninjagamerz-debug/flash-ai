import { Check, X, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Plan, BillingCycle } from '@/types/plans';

interface PlanCardProps {
  plan: Plan;
  currentPlan?: string;
  onSelect: (planId: string, cycle: BillingCycle) => void;
  isLoading?: boolean;
  billingCycle?: BillingCycle;
}

export function PlanCard({ plan, currentPlan, onSelect, isLoading, billingCycle = 'monthly' }: PlanCardProps) {
  const isCurrent = currentPlan === plan.id;
  const price = billingCycle === 'weekly' ? plan.priceWeekly : plan.priceMonthly;
  const credits = billingCycle === 'weekly' ? plan.creditsWeekly : plan.creditsMonthly;
  const period = billingCycle === 'weekly' ? 'week' : 'month';
  const savings = plan.priceMonthly > 0 ? Math.round(((plan.priceWeekly * 4 - plan.priceMonthly) / (plan.priceWeekly * 4)) * 100) : 0;

  return (
    <Card
      className={cn(
        'relative p-6 flex flex-col h-full transition-all hover:shadow-xl hover:shadow-primary/10',
        plan.popular && 'border-2 border-primary shadow-lg shadow-primary/20',
        isCurrent && 'border-2 border-accent shadow-lg shadow-accent/20'
      )}
    >
      {plan.badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
          <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground px-4 py-1 rounded-full text-xs font-semibold shadow-lg flex items-center gap-1">
            <Zap className="w-3 h-3" />
            {plan.badge}
          </div>
        </div>
      )}

      {billingCycle === 'monthly' && savings < 0 && plan.priceMonthly > 0 && (
        <div className="absolute -top-3 right-4 z-10">
          <Badge className="bg-green-500 text-white text-[10px] px-2 py-0.5">
            Save {Math.abs(savings)}% vs weekly
          </Badge>
        </div>
      )}

      <div className="text-center mb-5 pt-2">
        <h3 className="text-xl font-bold gradient-text mb-1">{plan.name}</h3>
        <p className="text-xs text-muted-foreground mb-4 text-pretty">{plan.description}</p>

        <div className="flex items-baseline justify-center gap-1 mb-1">
          {price === 0 ? (
            <span className="text-4xl font-bold gradient-text">Free</span>
          ) : (
            <>
              <span className="text-3xl font-bold gradient-text">
                {plan.currency}{price.toLocaleString('en-IN')}
              </span>
              <span className="text-sm text-muted-foreground">/{period}</span>
            </>
          )}
        </div>

        {/* Credits badge */}
        <div className="flex items-center justify-center gap-1 mt-2">
          <Zap className="w-3 h-3 text-primary" />
          <span className="text-xs font-medium text-primary">{credits.toLocaleString()} credits/{period}</span>
        </div>

        <div className="text-xs text-muted-foreground mt-1">{plan.uploadLimit} upload</div>

        {plan.aiModels && plan.aiModels.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1 justify-center">
            {plan.aiModels.map((model, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary"
              >
                <Zap className="w-2.5 h-2.5" />
                {model}
              </span>
            ))}
            {plan.apiAccess && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400">
                API
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 mb-5">
        <ul className="space-y-2.5">
          {plan.features.map((feature, idx) => (
            <li key={idx} className="flex items-start gap-2.5">
              <div className={cn(
                'flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center mt-0.5',
                feature.included ? 'bg-accent/20' : 'bg-muted'
              )}>
                {feature.included
                  ? <Check className="w-2.5 h-2.5 text-accent" />
                  : <X className="w-2.5 h-2.5 text-muted-foreground" />
                }
              </div>
              <span className={cn(
                'text-xs leading-5',
                feature.included ? 'text-foreground' : 'text-muted-foreground line-through',
                feature.highlight && 'font-semibold text-primary'
              )}>
                {feature.text}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <Button
        onClick={() => onSelect(plan.id, billingCycle)}
        disabled={isCurrent || isLoading}
        variant={plan.popular ? 'default' : 'outline'}
        size="default"
        className={cn(
          'w-full h-9 text-sm',
          plan.popular && 'bg-gradient-to-r from-primary to-primary/80 hover:shadow-lg hover:shadow-primary/30',
          isCurrent && 'border-accent text-accent'
        )}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            Updating…
          </span>
        ) : isCurrent ? (
          <span className="flex items-center gap-2">
            <Check className="w-4 h-4" />
            Current Plan
          </span>
        ) : (
          plan.cta
        )}
      </Button>
    </Card>
  );
}
