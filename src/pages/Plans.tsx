import { useState } from 'react';
import { Zap, ArrowLeft, Sparkles, Shield, Rocket, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PlanCard } from '@/components/plans/PlanCard';
import { FAQItem } from '@/components/plans/FAQItem';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { PLANS } from '@/types/plans';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthProvider';
import { profilesApi } from '@/db/api';
import type { PlanType } from '@/types/types';
import { cn } from '@/lib/utils';

const FAQS = [
  {
    question: 'What is Flash AI?',
    answer: 'Flash AI is a lightning-fast AI assistant powered by Google Gemini. It supports chat, image generation, video generation with sound, and a developer API.',
  },
  {
    question: 'What are the differences between the plans?',
    answer: 'Free gives you 100 messages/month to get started. Plus unlocks video generation and larger uploads. Pro and Business add the Accure precision model and full API access.',
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept UPI, credit/debit cards, and net banking for seamless payments.',
  },
  {
    question: 'Is there a free trial for paid plans?',
    answer: 'The Free plan lets you try Flash AI with no time limit. Upgrade anytime when you need more.',
  },
  {
    question: 'Can I cancel or change my plan?',
    answer: 'Yes — upgrade, downgrade, or cancel anytime from Settings. We offer a 7-day money-back guarantee.',
  },
  {
    question: 'How does the API work?',
    answer: 'Pro and Business plans include full API access. Go to the API Keys page to generate keys and start integrating Flash AI into your own applications.',
  },
];

export default function Plans() {
  const [isUpdating, setIsUpdating] = useState(false);
  const navigate = useNavigate();
  const { profile, refreshProfile } = useAuth();

  const handleSelectPlan = async (planId: string, _cycle?: string) => {
    if (planId === profile?.plan) return;

    if (planId === 'free') {
      setIsUpdating(true);
      try {
        if (profile?.id) {
          const success = await profilesApi.updateUserPlan(profile.id, planId as PlanType);
          if (success) {
            await refreshProfile();
            toast.success('Switched to Free plan');
          } else throw new Error('Failed');
        }
      } catch {
        toast.error('Failed to update plan. Please try again.');
      } finally {
        setIsUpdating(false);
      }
      return;
    }

    if (profile?.role === 'admin') {
      setIsUpdating(true);
      try {
        if (profile?.id) {
          const success = await profilesApi.updateUserPlan(profile.id, planId as PlanType);
          if (success) {
            await refreshProfile();
            const plan = PLANS.find(p => p.id === planId);
            toast.success(`${plan?.name} plan activated (Admin privilege)`);
          } else throw new Error('Failed');
        }
      } catch {
        toast.error('Failed to update plan. Please try again.');
      } finally {
        setIsUpdating(false);
      }
      return;
    }

    navigate(`/payment?plan=${planId}&cycle=monthly`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="text-muted-foreground hover:text-foreground flex-shrink-0">
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              <span className="hidden sm:inline">Back</span>
            </Button>
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
              <Zap className="w-4 h-4 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-bold gradient-text truncate">Flash Plans</h1>
              <p className="text-[10px] text-muted-foreground hidden sm:block">Choose your plan</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {profile?.role === 'admin' && (
              <Badge className="hidden sm:flex text-xs">⚡ Admin</Badge>
            )}
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-10 md:py-16">

        {/* Hero */}
        <div className="text-center mb-10 md:mb-12">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            Simple Pricing
          </div>
          <h2 className="text-3xl md:text-4xl font-bold gradient-text mb-3 text-balance">
            Choose Your Flash Plan
          </h2>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto text-pretty">
            Upgrade or downgrade anytime. All plans include Flash AI — no hidden fees.
          </p>
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 md:gap-6 mb-16">
          {PLANS.map(plan => (
            <PlanCard
              key={plan.id}
              plan={plan}
              currentPlan={profile?.plan || 'free'}
              onSelect={handleSelectPlan}
              isLoading={isUpdating}
              billingCycle="monthly"
            />
          ))}
        </div>

        {/* Why Flash */}
        <div className="bg-card border border-border rounded-2xl p-8 md:p-12 mb-12">
          <h3 className="text-xl font-bold text-foreground mb-8 text-center text-balance">Why Choose Flash AI?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {[
              { icon: Zap, color: 'text-primary bg-primary/10', title: 'Lightning Fast', desc: 'Instant responses with no artificial delays. Maximum speed on all plans.' },
              { icon: Shield, color: 'text-green-600 bg-green-500/10', title: 'Secure & Private', desc: 'Your conversations are encrypted and never shared with third parties.' },
              { icon: Rocket, color: 'text-purple-600 bg-purple-500/10', title: 'Always Improving', desc: 'Regular updates with new models, features, and quality improvements.' },
            ].map(item => (
              <div key={item.title} className="text-center">
                <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4', item.color)}>
                  <item.icon className="w-7 h-7" />
                </div>
                <h4 className="text-sm font-semibold text-foreground mb-2">{item.title}</h4>
                <p className="text-xs text-muted-foreground text-pretty">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Comparison table */}
        <div className="mb-12 overflow-x-auto rounded-2xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground whitespace-nowrap">Feature</th>
                {PLANS.map(p => (
                  <th key={p.id} className="px-4 py-3 text-center text-xs font-semibold whitespace-nowrap">
                    <span className={cn(p.id === profile?.plan ? 'text-primary' : 'text-foreground')}>{p.name}</span>
                    {p.id === profile?.plan && <Badge className="ml-1.5 text-[10px] py-0 px-1.5">Current</Badge>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { feature: 'Messages', values: ['Unlimited', 'Unlimited', 'Unlimited', 'Unlimited'] },
                { feature: 'Monthly price', values: ['Free', '₹2,999', '₹8,999', '₹13,999'] },
                { feature: 'Upload limit', values: ['100MB/day', '1GB/day', 'Unlimited', '1GB/seat'] },
                { feature: 'Flash AI', values: [true, true, true, true] },
                { feature: 'Accure AI', values: [false, false, true, true] },
                { feature: 'Image generation', values: [true, true, true, true] },
                { feature: 'Video generation (with sound)', values: [false, true, true, true] },
                { feature: 'API access', values: [false, false, true, true] },
                { feature: 'Team seats', values: ['—', '1', '1', '10'] },
                { feature: 'Support', values: ['Community', 'Email', '24/7 Priority', 'Dedicated'] },
              ].map(row => (
                <tr key={row.feature} className="border-t border-border/50 hover:bg-muted/20 transition-colors">
                  <td className="px-5 py-3 text-xs font-medium text-foreground whitespace-nowrap">{row.feature}</td>
                  {row.values.map((v, i) => (
                    <td key={i} className="px-4 py-3 text-center text-xs text-muted-foreground">
                      {typeof v === 'boolean'
                        ? v
                          ? <Check className="w-4 h-4 text-green-500 mx-auto" />
                          : <span className="text-muted-foreground/40">—</span>
                        : <span>{v}</span>
                      }
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* FAQ */}
        <div className="bg-card border border-border rounded-2xl p-8 md:p-12">
          <h3 className="text-xl font-bold text-foreground mb-6 text-center text-balance">Frequently Asked Questions</h3>
          <div className="max-w-3xl mx-auto">
            {FAQS.map((faq, idx) => (
              <FAQItem key={idx} question={faq.question} answer={faq.answer} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
