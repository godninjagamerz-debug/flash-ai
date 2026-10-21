export interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
  rate: number; // Conversion rate from INR
}

export const CURRENCIES: Record<string, CurrencyInfo> = {
  IN: { code: 'INR', symbol: '₹', name: 'Indian Rupee', rate: 1 },
  US: { code: 'USD', symbol: '$', name: 'US Dollar', rate: 0.012 },
  GB: { code: 'GBP', symbol: '£', name: 'British Pound', rate: 0.0095 },
  EU: { code: 'EUR', symbol: '€', name: 'Euro', rate: 0.011 },
  AU: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', rate: 0.018 },
  CA: { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', rate: 0.016 },
  SG: { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', rate: 0.016 },
  AE: { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', rate: 0.044 },
  JP: { code: 'JPY', symbol: '¥', name: 'Japanese Yen', rate: 1.8 },
  CN: { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', rate: 0.086 },
};

export const COUNTRIES = [
  { code: 'IN', name: 'India', currency: 'INR', flag: '🇮🇳' },
  { code: 'US', name: 'United States', currency: 'USD', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', currency: 'GBP', flag: '🇬🇧' },
  { code: 'EU', name: 'European Union', currency: 'EUR', flag: '🇪🇺' },
  { code: 'AU', name: 'Australia', currency: 'AUD', flag: '🇦🇺' },
  { code: 'CA', name: 'Canada', currency: 'CAD', flag: '🇨🇦' },
  { code: 'SG', name: 'Singapore', currency: 'SGD', flag: '🇸🇬' },
  { code: 'AE', name: 'United Arab Emirates', currency: 'AED', flag: '🇦🇪' },
  { code: 'JP', name: 'Japan', currency: 'JPY', flag: '🇯🇵' },
  { code: 'CN', name: 'China', currency: 'CNY', flag: '🇨🇳' },
];

export function convertPrice(priceInINR: number, countryCode: string): number {
  const currency = CURRENCIES[countryCode];
  if (!currency) return priceInINR;
  
  const converted = priceInINR * currency.rate;
  
  // Round to appropriate decimal places
  if (currency.code === 'JPY') {
    return Math.round(converted); // No decimals for JPY
  }
  return Math.round(converted * 100) / 100; // 2 decimal places for others
}

export function formatPrice(price: number, countryCode: string): string {
  const currency = CURRENCIES[countryCode];
  if (!currency) return `₹${price}`;
  
  const convertedPrice = convertPrice(price, countryCode);
  
  if (currency.code === 'JPY') {
    return `${currency.symbol}${Math.round(convertedPrice)}`;
  }
  
  return `${currency.symbol}${convertedPrice.toFixed(2)}`;
}

export function getCurrencySymbol(countryCode: string): string {
  return CURRENCIES[countryCode]?.symbol || '₹';
}

export function getCurrencyCode(countryCode: string): string {
  return CURRENCIES[countryCode]?.code || 'INR';
}
