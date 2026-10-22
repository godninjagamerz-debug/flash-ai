export type ModelId = 'f1' | 'accure';
export type EffortLevel = 'low' | 'medium' | 'high';
export type PlanType = 'guest' | 'free' | 'plus' | 'pro' | 'enterprise';

export interface PlanDetails {
  id: PlanType;
  name: string;
  credits: number;
  creditsDisplay: string;
  uploadLimitMB: number;
  uploadDisplay: string;
  priceMonthly: number;
  currency: string;
  description: string;
  features: { text: string; included: boolean }[];
}

export const PLAN_DETAILS: Record<PlanType, PlanDetails> = {
  guest: {
    id: 'guest',
    name: 'Guest',
    credits: 5000,
    creditsDisplay: '5,000',
    uploadLimitMB: 50,
    uploadDisplay: '50 MB (Session)',
    priceMonthly: 0,
    currency: '₹',
    description: 'Instant local sandbox with zero sign-up required.',
    features: [
      { text: '5,000 real-time local credits', included: true },
      { text: 'F1 Instant model access', included: true },
      { text: 'Claude-style code artifacts', included: true },
      { text: 'Shareable web file links', included: false },
    ],
  },
  free: {
    id: 'free',
    name: 'Free',
    credits: 11000,
    creditsDisplay: '11,000',
    uploadLimitMB: 512,
    uploadDisplay: '512 MB',
    priceMonthly: 0,
    currency: '₹',
    description: 'Personal isolated workspace for daily productivity.',
    features: [
      { text: '11,000 credits', included: true },
      { text: '512 MB real-time upload storage', included: true },
      { text: 'Personal private chat history', included: true },
      { text: 'Shareable web file links', included: false },
    ],
  },
  plus: {
    id: 'plus',
    name: 'Plus',
    credits: 25000,
    creditsDisplay: '25,000',
    uploadLimitMB: 1536, // 1.5 GB
    uploadDisplay: '1.5 GB',
    priceMonthly: 999,
    currency: '₹',
    description: 'Expanded capacity and deep reasoning models.',
    features: [
      { text: '25,000 real-time credits', included: true },
      { text: '1.5 GB upload tracking quota', included: true },
      { text: 'F1 Instant + Accure Pro models', included: true },
      { text: 'API Access eligible (10 rq/min)', included: true },
    ],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    credits: 60000,
    creditsDisplay: '60,000',
    uploadLimitMB: 5120, // 5 GB
    uploadDisplay: '5 GB',
    priceMonthly: 2499,
    currency: '₹',
    description: 'Full power with instant public web hosting links for artifacts.',
    features: [
      { text: '60,000 real-time credits', included: true },
      { text: '5 GB upload tracking quota', included: true },
      { text: '1-Click public web links (flashai.rf.gd)', included: true },
      { text: 'API Access eligible (25 rq/min)', included: true },
    ],
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    credits: 160000,
    creditsDisplay: '55,000 - 160,000 / seat',
    uploadLimitMB: 10240, // 2GB - 10GB
    uploadDisplay: '2 GB - 10 GB / seat',
    priceMonthly: 6999,
    currency: '₹',
    description: 'Custom seat scaling (55k–160k credits) & dedicated domain hosting.',
    features: [
      { text: '55k–160k credits per seat', included: true },
      { text: '2 GB – 10 GB storage per seat', included: true },
      { text: 'Public web file hosting (100k+ credits)', included: true },
      { text: 'Dedicated API key pool', included: true },
    ],
  },
};

export const PLANS: PlanDetails[] = Object.values(PLAN_DETAILS);

export const DAILY_CREDIT_LIMITS: Record<PlanType, number> = {
  guest: 5000,
  free: 11000,
  plus: 25000,
  pro: 60000,
  enterprise: 160000,
};

export const UPLOAD_LIMITS_BYTES: Record<PlanType, number> = {
  guest: 50 * 1024 * 1024,
  free: 512 * 1024 * 1024,
  plus: 1536 * 1024 * 1024,
  pro: 5120 * 1024 * 1024,
  enterprise: 10240 * 1024 * 1024,
};

export interface ApiTimePackage {
  id: string;
  durationLabel: string;
  durationHours: number;
  plusPriceINR: number;
  proPriceINR: number;
}

export const API_TIME_PACKAGES: ApiTimePackage[] = [
  { id: '1h', durationLabel: '1 Hour', durationHours: 1, plusPriceINR: 100, proPriceINR: 200 },
  { id: '1d', durationLabel: '1 Day', durationHours: 24, plusPriceINR: 1000, proPriceINR: 2000 },
  { id: '1w', durationLabel: '1 Week', durationHours: 168, plusPriceINR: 6500, proPriceINR: 12800 },
  { id: '1m', durationLabel: '1 Month', durationHours: 720, plusPriceINR: 25000, proPriceINR: 49000 },
  { id: '3m', durationLabel: '3 Months', durationHours: 2160, plusPriceINR: 70000, proPriceINR: 140000 },
];

export const API_TIER_SPECS = {
  plus: {
    name: 'Plus API Tier',
    rpm: 10,
    dailyCredits: 1100000, // 1.1M credits/day
    dailyCreditsDisplay: '1.1 Million / day',
  },
  pro: {
    name: 'Pro API Tier',
    rpm: 25,
    dailyCredits: 2500000, // 2.5M credits/day
    dailyCreditsDisplay: '2.5 Million / day',
  },
};

export const FLASH_MODELS = [
  { id: 'f1' as ModelId, name: 'F1 Instant', family: 'flash', icon: '⚡', baseCost: 5, description: 'Ultra-low latency streaming model' },
];

export const ACCURE_MODELS = [
  { id: 'accure' as ModelId, name: 'Accure Pro', family: 'accure', icon: '🧠', baseCost: 15, description: 'Deep analytical & multi-file artifact architect' },
];

export const ALL_MODELS = [...FLASH_MODELS, ...ACCURE_MODELS];
export const EFFORT_LEVELS: EffortLevel[] = ['low', 'medium', 'high'];

export const CREDIT_COSTS = {
  base: 5,
  image_generation: 50,
  model: { f1: 5, accure: 15 } as Record<ModelId, number>,
  effort: { low: 1, medium: 3, high: 6 } as Record<EffortLevel, number>,
};

export const PLAN_MODEL_ACCESS: Record<PlanType, ModelId[]> = {
  guest: ['f1'],
  free: ['f1'],
  plus: ['f1', 'accure'],
  pro: ['f1', 'accure'],
  enterprise: ['f1', 'accure'],
};

export const PLAN_EFFORT_ACCESS: Record<PlanType, EffortLevel[]> = {
  guest: ['low'],
  free: ['low', 'medium'],
  plus: ['low', 'medium', 'high'],
  pro: ['low', 'medium', 'high'],
  enterprise: ['low', 'medium', 'high'],
};

export function estimateCredits(
  modelId: ModelId = 'f1',
  effortLevel: EffortLevel = 'low',
  multiplier: number = 1
): number {
  const modelCost = CREDIT_COSTS.model[modelId] ?? 5;
  const effortCost = CREDIT_COSTS.effort[effortLevel] ?? 1;
  return (CREDIT_COSTS.base + modelCost + effortCost) * multiplier;
}