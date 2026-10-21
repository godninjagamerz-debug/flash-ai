export type PlanType = 'free' | 'hero' | 'pro' | 'business';
export type BillingCycle = 'weekly' | 'monthly';

// ─── AI Model System ────────────────────────────────────────────────────────

export type FlashModelId = 'f1' | 'f2' | 'f3' | 'f4' | 'f5' | 'f6';
export type AccureModelId = 'a1' | 'a2' | 'a3' | 'a4';
export type ModelId = FlashModelId | AccureModelId;
export type ModelFamily = 'flash' | 'accure';

export interface AIModel {
  id: ModelId;
  name: string;
  family: ModelFamily;
  description: string;
  baseCost: number;          // credits per 1K tokens
  proOnly: boolean;
  icon: string;
  badge?: string;
}

export const FLASH_MODELS: AIModel[] = [
  { id: 'f1', name: 'F1 Instant',       family: 'flash', description: 'Ultra-fast for simple queries',         baseCost: 1,  proOnly: false, icon: '⚡' },
  { id: 'f2', name: 'F2 Turbo',         family: 'flash', description: 'Fast with improved accuracy',           baseCost: 1,  proOnly: false, icon: '🚀' },
  { id: 'f3', name: 'F3 Balanced',      family: 'flash', description: 'Speed & quality balance',               baseCost: 2,  proOnly: false, icon: '⚖️' },
  { id: 'f4', name: 'F4 Long Context',  family: 'flash', description: 'Long documents & conversations',        baseCost: 2,  proOnly: false, icon: '📄' },
  { id: 'f5', name: 'F5 Multilingual',  family: 'flash', description: 'Optimised for all languages',           baseCost: 2,  proOnly: false, icon: '🌍' },
  { id: 'f6', name: 'F6 Vision Fast',   family: 'flash', description: 'Fast image recognition & analysis',     baseCost: 3,  proOnly: false, icon: '👁️' },
];

export const ACCURE_MODELS: AIModel[] = [
  { id: 'a1', name: 'A1 Reasoner',      family: 'accure', description: 'Deep reasoning for complex problems',  baseCost: 5,  proOnly: true, icon: '🧠', badge: 'Thinking' },
  { id: 'a2', name: 'A2 Deep Reasoner', family: 'accure', description: 'Multi-step advanced logic',            baseCost: 8,  proOnly: true, icon: '🔮', badge: 'Deep Think' },
  { id: 'a3', name: 'A3 Math & Code',   family: 'accure', description: 'Specialised for maths & coding',      baseCost: 6,  proOnly: true, icon: '🔢', badge: 'STEM' },
  { id: 'a4', name: 'A4 Research',      family: 'accure', description: 'Research agent with tool calling',     baseCost: 10, proOnly: true, icon: '🔬', badge: 'Agent' },
];

export const ALL_MODELS: AIModel[] = [...FLASH_MODELS, ...ACCURE_MODELS];

/** Models accessible by plan */
export const PLAN_MODEL_ACCESS: Record<PlanType | 'admin', ModelId[]> = {
  free:     ['f1', 'f2', 'f3'],
  hero:     ['f1', 'f2', 'f3', 'f4', 'f5', 'f6'],
  pro:      ['f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'a1', 'a2', 'a3', 'a4'],
  business: ['f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'a1', 'a2', 'a3', 'a4'],
  admin:    ['f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'a1', 'a2', 'a3', 'a4'],
};

// ─── Effort Levels ──────────────────────────────────────────────────────────

export type EffortLevel = 'instant' | 'low' | 'medium' | 'high' | 'max';

export interface EffortDef {
  id: EffortLevel;
  label: string;
  description: string;
  multiplier: number;  // applied to baseCost
  proOnly: boolean;
  temperature: number;
  maxOutputTokens: number;
  topP: number;
  topK: number;
}

export const EFFORT_LEVELS: EffortDef[] = [
  { id: 'instant', label: 'Instant', description: 'Fastest — minimal reasoning', multiplier: 0.5, proOnly: false, temperature: 0.9, maxOutputTokens: 2048,  topP: 0.95, topK: 40  },
  { id: 'low',     label: 'Low',     description: 'Quick with basic logic',       multiplier: 0.8, proOnly: false, temperature: 0.8, maxOutputTokens: 4096,  topP: 0.92, topK: 35  },
  { id: 'medium',  label: 'Medium',  description: 'Balanced quality & speed',     multiplier: 1.0, proOnly: false, temperature: 0.7, maxOutputTokens: 8192,  topP: 0.90, topK: 30  },
  { id: 'high',    label: 'High',    description: 'Deep analysis & detail',        multiplier: 1.8, proOnly: true,  temperature: 0.4, maxOutputTokens: 16384, topP: 0.85, topK: 20  },
  { id: 'max',     label: 'Max/Pro', description: 'Maximum quality — Pro only',    multiplier: 3.0, proOnly: true,  temperature: 0.2, maxOutputTokens: 32768, topP: 0.75, topK: 10  },
];

/** Effort levels accessible by plan */
export const PLAN_EFFORT_ACCESS: Record<PlanType | 'admin', EffortLevel[]> = {
  free:     ['instant', 'low'],
  hero:     ['instant', 'low', 'medium'],
  pro:      ['instant', 'low', 'medium', 'high', 'max'],
  business: ['instant', 'low', 'medium', 'high', 'max'],
  admin:    ['instant', 'low', 'medium', 'high', 'max'],
};

/**
 * Credit formula:
 *   credits = base_model_cost × effort_multiplier × (tokens / 1000)
 * Minimum 1 credit per message.
 */
export function calcCredits(modelId: ModelId, effort: EffortLevel, tokens: number): number {
  const model  = ALL_MODELS.find(m => m.id === modelId)!;
  const effortDef = EFFORT_LEVELS.find(e => e.id === effort)!;
  return Math.max(1, Math.ceil(model.baseCost * effortDef.multiplier * (tokens / 1000)));
}

/** Quick flat-rate estimate before sending (assume 500 tokens) */
export function estimateCredits(modelId: ModelId, effort: EffortLevel): number {
  return calcCredits(modelId, effort, 500);
}

export interface PlanFeature {
  text: string;
  included: boolean;
  highlight?: boolean;
}

export interface Plan {
  id: PlanType;
  name: string;
  description: string;
  priceMonthly: number;
  priceWeekly: number;
  currency: string;
  popular?: boolean;
  features: PlanFeature[];
  cta: string;
  badge?: string;
  uploadLimit: string;
  aiModels?: string[];
  creditsMonthly: number;
  creditsWeekly: number;
  /** Daily credit limit for chat. -1 = unlimited. */
  dailyCreditLimit: number;
  apiAccess: boolean;
}

export interface CreditPackDef {
  id: string;
  name: string;
  credits: number;
  bonusCredits: number;
  priceInr: number;
  priceUsd: number;
  popular?: boolean;
  description: string;
}

/** Daily chat credit limits per plan. -1 = unlimited (admin / Pro / Business). */
export const DAILY_CREDIT_LIMITS: Record<PlanType | 'admin', number> = {
  free: 50,
  hero: 500,
  pro: -1,       // unlimited
  business: -1,  // unlimited
  admin: -1,     // owner — always unlimited
};

/** Credit cost per action */
export const CREDIT_COSTS = {
  chat_flash: 1,
  chat_accure: 3,
  image_generation: 10,
  video_5s: 50,
  video_10s: 100,
  video_15s: 150,
} as const;

export const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'Perfect for trying out Flash AI',
    priceMonthly: 0,
    priceWeekly: 0,
    currency: '₹',
    uploadLimit: '100MB daily',
    aiModels: ['Flash'],
    cta: 'Get Started',
    creditsMonthly: 1500,
    creditsWeekly: 450,
    dailyCreditLimit: 50,
    apiAccess: false,
    features: [
      { text: '50 credits/day (≈50 messages)', included: true },
      { text: '100MB upload daily', included: true },
      { text: 'Flash AI model', included: true },
      { text: '1,500 credits/month', included: true },
      { text: 'File & code downloads', included: true },
      { text: 'Image generation (10 cr each)', included: true },
      { text: 'Voice to text', included: true },
      { text: 'Community support', included: true },
      { text: 'Video generation', included: false },
      { text: 'API access', included: false },
      { text: 'Priority support', included: false },
    ],
  },
  {
    id: 'hero',
    name: 'Plus',
    description: 'Lightning-fast AI for power users',
    priceMonthly: 2999,
    priceWeekly: 899,
    currency: '₹',
    popular: true,
    badge: 'Most Popular',
    uploadLimit: '1GB daily',
    aiModels: ['Flash'],
    cta: 'Upgrade to Plus',
    creditsMonthly: 15000,
    creditsWeekly: 4500,
    dailyCreditLimit: 500,
    apiAccess: false,
    features: [
      { text: '500 credits/day (≈500 messages)', included: true, highlight: true },
      { text: '1GB upload daily', included: true, highlight: true },
      { text: 'Flash AI (fast)', included: true, highlight: true },
      { text: '15,000 credits/month', included: true, highlight: true },
      { text: 'File & code downloads', included: true },
      { text: 'Image generation', included: true },
      { text: 'Video generation', included: true, highlight: true },
      { text: 'Voice to text', included: true },
      { text: 'Email support', included: true },
      { text: 'API access', included: false },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'Unlimited usage + Accure precision model',
    priceMonthly: 8999,
    priceWeekly: 2499,
    currency: '₹',
    badge: '⚡ Best Value',
    uploadLimit: 'Unlimited',
    aiModels: ['Flash', 'Accure'],
    cta: 'Upgrade to Pro',
    creditsMonthly: -1,
    creditsWeekly: -1,
    dailyCreditLimit: -1,
    apiAccess: true,
    features: [
      { text: 'Unlimited credits (no daily cap)', included: true, highlight: true },
      { text: 'Unlimited upload', included: true, highlight: true },
      { text: 'Flash + Accure AI models', included: true, highlight: true },
      { text: 'File & code downloads', included: true },
      { text: 'Fastest image generation', included: true, highlight: true },
      { text: 'Fastest video generation', included: true, highlight: true },
      { text: 'Voice to text', included: true },
      { text: '24/7 priority support', included: true, highlight: true },
      { text: 'API access (60 req/min)', included: true, highlight: true },
      { text: 'Team collaboration', included: true },
    ],
  },
  {
    id: 'business',
    name: 'Business',
    description: '10 team seats + full API + unlimited usage',
    priceMonthly: 13999,
    priceWeekly: 3999,
    currency: '₹',
    uploadLimit: '1GB daily/seat',
    aiModels: ['Flash', 'Accure'],
    cta: 'Upgrade to Business',
    creditsMonthly: -1,
    creditsWeekly: -1,
    dailyCreditLimit: -1,
    apiAccess: true,
    features: [
      { text: '10 team seats included', included: true, highlight: true },
      { text: 'Flash AI + Accure (precise)', included: true, highlight: true },
      { text: 'Unlimited credits per seat', included: true, highlight: true },
      { text: 'File & code downloads', included: true },
      { text: 'Image & video generation', included: true },
      { text: 'Voice to text', included: true },
      { text: 'API access (120 req/min)', included: true, highlight: true },
      { text: 'Team collaboration tools', included: true },
      { text: 'Centralized billing', included: true },
      { text: 'Admin dashboard', included: true },
      { text: 'Dedicated support', included: true, highlight: true },
    ],
  },
];

export const CREDIT_PACKS: CreditPackDef[] = [
  { id: 'starter', name: 'Starter', credits: 500, bonusCredits: 0, priceInr: 99, priceUsd: 1.20, description: '≈500 messages' },
  { id: 'basic', name: 'Basic', credits: 1500, bonusCredits: 100, priceInr: 249, priceUsd: 3.00, description: '≈1,600 messages' },
  { id: 'popular', name: 'Popular', credits: 5000, bonusCredits: 500, priceInr: 699, priceUsd: 8.40, popular: true, description: '≈5,500 messages' },
  { id: 'pro', name: 'Pro Pack', credits: 15000, bonusCredits: 2000, priceInr: 1799, priceUsd: 21.60, description: '≈17,000 messages' },
  { id: 'business', name: 'Business', credits: 50000, bonusCredits: 10000, priceInr: 4999, priceUsd: 60.00, description: '≈60,000 messages' },
];
