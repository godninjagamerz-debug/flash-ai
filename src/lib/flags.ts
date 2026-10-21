/**
 * Feature flags — flip any flag to enable/disable a capability at runtime.
 * All flags are persisted in localStorage under 'ai_flags'.
 */
export interface AiFlags {
  auth: boolean;
  models: boolean;
  imageGen: boolean;
  zip: boolean;
  mobileUI: boolean;
}

const FLAG_KEY = 'ai_flags';

const DEFAULTS: AiFlags = {
  auth: true,
  models: true,
  imageGen: true,
  zip: true,
  mobileUI: true,
};

export function getFlags(): AiFlags {
  try {
    const raw = localStorage.getItem(FLAG_KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return DEFAULTS;
  }
}

export function setFlag(key: keyof AiFlags, value: boolean): void {
  const flags = getFlags();
  flags[key] = value;
  localStorage.setItem(FLAG_KEY, JSON.stringify(flags));
}

export const flags = getFlags();
