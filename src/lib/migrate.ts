/**
 * Safe localStorage migration contract.
 *
 * Reads old keys → wraps into canonical schema → writes new keys.
 * NEVER overwrites existing new-key data; NEVER deletes old keys until verified.
 *
 * Canonical key map:
 *  ai_accounts        — user accounts array
 *  ai_current_user    — session email string
 *  ai_remembered_email — remember-me email
 *  ai_conversations   — chat history array
 *  ai_settings        — { theme, selectedModel, selectedEffort, streamingMode }
 *  ai_gallery         — generated images array (max 12)
 */

export interface AiSettings {
  theme?: 'light' | 'dark' | 'system';
  selectedModel?: string;
  selectedEffort?: string;
  streamingMode?: 'stream' | 'instant';
}

export interface GalleryItem {
  id: string;
  base64: string;
  prompt: string;
  createdAt: number;
}

// Older key aliases that may have existed before the canonical schema
const LEGACY_MAP: Record<string, string> = {
  flash_selected_model: 'ai_settings',
  flash_theme: 'ai_settings',
  flash_conversations: 'ai_conversations',
};

function safeGet<T>(key: string, fallback: T): T {
  try {
    const raw = safeGetRaw(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeGetRaw(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage full — silently skip
  }
}

/**
 * Run migration once on boot.
 * Call from main.tsx / App.tsx before any component reads localStorage.
 */
export function runMigration(): void {
  // Migrate legacy flash_selected_model → ai_settings
  const oldModel = safeGetRaw('flash_selected_model');
  if (oldModel) {
    const current = safeGet<AiSettings>('ai_settings', {});
    if (!current.selectedModel) {
      current.selectedModel = oldModel;
      safeSet('ai_settings', current);
    }
  }

  // Migrate legacy flash_theme → ai_settings.theme
  const oldTheme = safeGetRaw('flash_theme') as 'light' | 'dark' | null;
  if (oldTheme) {
    const current = safeGet<AiSettings>('ai_settings', {});
    if (!current.theme) {
      current.theme = oldTheme;
      safeSet('ai_settings', current);
    }
  }

  // Migrate legacy flash_conversations → ai_conversations
  const oldConvs = safeGetRaw('flash_conversations');
  if (oldConvs) {
    const existing = safeGetRaw('ai_conversations');
    if (!existing) {
      // Only copy if canonical key is absent — never overwrite
      try {
        localStorage.setItem('ai_conversations', oldConvs);
      } catch {
        // Storage is unavailable — skip migration.
      }
    }
  }

  // Ensure gallery cap at 12 entries
  const gallery = safeGet<GalleryItem[]>('ai_gallery', []);
  if (gallery.length > 12) {
    safeSet('ai_gallery', gallery.slice(-12));
  }

  // Log migration completion (dev only)
  if (import.meta.env.DEV) {
    console.info('[migrate] localStorage migration complete');
  }
}

// ─── Gallery helpers ──────────────────────────────────────────────────────────

export function addToGallery(item: Omit<GalleryItem, 'id' | 'createdAt'>): void {
  const gallery = safeGet<GalleryItem[]>('ai_gallery', []);
  const entry: GalleryItem = { ...item, id: crypto.randomUUID(), createdAt: Date.now() };
  const updated = [...gallery, entry].slice(-12); // keep max 12
  safeSet('ai_gallery', updated);
}

export function getGallery(): GalleryItem[] {
  return safeGet<GalleryItem[]>('ai_gallery', []);
}

// ─── Settings helpers ─────────────────────────────────────────────────────────

export function getSettings(): AiSettings {
  return safeGet<AiSettings>('ai_settings', {});
}

export function saveSettings(patch: Partial<AiSettings>): void {
  const current = getSettings();
  safeSet('ai_settings', { ...current, ...patch });
}
