// Promo & Offer Engine Service
export interface PromoCode {
  id: string;
  code: string;
  rewardType: 'pro_1m' | 'plus_1m' | 'credits_500' | 'free_lifetime';
  rewardLabel: string;
  description: string;
  maxRedemptions: number;
  currentRedemptions: number;
  expiresAt: string;
  isActive: boolean;
  createdAt: string;
}

export interface SiteBanner {
  id: string;
  isActive: boolean;
  badge: string;
  text: string;
  actionText: string;
  actionCode?: string;
  backgroundColor?: string;
}

const STORAGE_KEY_PROMOS = 'flash_promos_list';
const STORAGE_KEY_BANNER = 'flash_site_banner';
const STORAGE_KEY_REDEEMED = 'flash_redeemed_codes';

const DEFAULT_BANNER: SiteBanner = {
  id: 'banner-default',
  isActive: false,
  badge: '',
  text: '',
  actionText: '',
};

function clearStoredPromotions(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_PROMOS);
    localStorage.removeItem(STORAGE_KEY_BANNER);
    localStorage.removeItem(STORAGE_KEY_REDEEMED);
    localStorage.removeItem('flash_user_grants');
  } catch {}
}

export function revokeStoredPromotions(): void {
  clearStoredPromotions();
}

export const promoService = {
  getPromos(): PromoCode[] {
    clearStoredPromotions();
    return [];
  },

  savePromos(promos: PromoCode[]) {
    try {
      localStorage.setItem(STORAGE_KEY_PROMOS, JSON.stringify(promos));
    } catch {}
  },

  createPromo(data: Omit<PromoCode, 'id' | 'currentRedemptions' | 'createdAt'>): PromoCode {
    const list = this.getPromos();
    const newPromo: PromoCode = {
      ...data,
      id: `promo_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      code: data.code.toUpperCase().trim(),
      currentRedemptions: 0,
      createdAt: new Date().toISOString(),
    };
    list.unshift(newPromo);
    this.savePromos(list);
    return newPromo;
  },

  generateRandomCode(prefix = 'FLASH'): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let res = `${prefix}-`;
    for (let i = 0; i < 6; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return res;
  },

  deletePromo(id: string) {
    const list = this.getPromos().filter(p => p.id !== id);
    this.savePromos(list);
  },

  togglePromoStatus(id: string) {
    const list = this.getPromos().map(p => p.id === id ? { ...p, isActive: !p.isActive } : p);
    this.savePromos(list);
  },

  getBanner(): SiteBanner {
    clearStoredPromotions();
    return DEFAULT_BANNER;
  },

  saveBanner(banner: SiteBanner) {
    try {
      localStorage.setItem(STORAGE_KEY_BANNER, JSON.stringify(banner));
    } catch {}
  },

  redeemCode(): { success: false; message: string } {
    clearStoredPromotions();
    return { success: false, message: 'Promo code redemptions are disabled.' };
  },

  // Direct 1-Month Free Grant to specific user / email
  grantUserFreeMonth(_email: string, _tier: 'pro' | 'plus'): boolean {
    clearStoredPromotions();
    return false;
  }
};
