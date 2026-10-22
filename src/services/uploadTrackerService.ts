import { UPLOAD_LIMITS_BYTES, type PlanType } from '@/types/plans';

const UPLOAD_USAGE_KEY = 'flash_upload_bytes_used';
const SHARED_FILES_KEY = 'flash_shared_files_registry';

export interface SharedFileRecord {
  id: string;
  filename: string;
  content: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
  publicUrl: string;
  ownerId: string;
}

export const uploadTrackerService = {
  getUsedBytes(userId: string = 'guest'): number {
    try {
      const all = JSON.parse(localStorage.getItem(UPLOAD_USAGE_KEY) || '{}');
      return Number(all[userId] || 0);
    } catch {
      return 0;
    }
  },

  getLimitBytes(plan: PlanType = 'free', customSeatMB?: number): number {
    if (plan === 'enterprise' && customSeatMB) {
      return Math.min(10240, Math.max(2048, customSeatMB)) * 1024 * 1024;
    }
    return UPLOAD_LIMITS_BYTES[plan] || UPLOAD_LIMITS_BYTES.free;
  },

  canUpload(fileSizeBytes: number, userId: string = 'guest', plan: PlanType = 'free'): { allowed: boolean; reason?: string } {
    const used = this.getUsedBytes(userId);
    const limit = this.getLimitBytes(plan);
    if (used + fileSizeBytes > limit) {
      const limitMB = (limit / (1024 * 1024)).toFixed(0);
      return {
        allowed: false,
        reason: `Storage quota exceeded (${this.formatBytes(used)} / ${limitMB} MB used). Upgrade your plan for up to 10 GB storage.`,
      };
    }
    return { allowed: true };
  },

  recordUpload(fileSizeBytes: number, userId: string = 'guest'): number {
    try {
      const all = JSON.parse(localStorage.getItem(UPLOAD_USAGE_KEY) || '{}');
      const updated = (Number(all[userId] || 0)) + fileSizeBytes;
      all[userId] = updated;
      localStorage.setItem(UPLOAD_USAGE_KEY, JSON.stringify(all));
      window.dispatchEvent(new CustomEvent('flash_upload_updated', { detail: updated }));
      return updated;
    } catch {
      return 0;
    }
  },

  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 MB';
    const mb = bytes / (1024 * 1024);
    if (mb < 1024) return `${mb.toFixed(1)} MB`;
    return `${(mb / 1024).toFixed(2)} GB`;
  },

  /**
   * Only Pro users OR Enterprise users with > 100,000 credits can generate public web links
   */
  canGenerateShareLink(plan: PlanType, userCredits: number): boolean {
    if (plan === 'pro') return true;
    if (plan === 'enterprise' && userCredits >= 100000) return true;
    return false;
  },

  createShareableLink(
    filename: string,
    content: string,
    mimeType: string = 'text/plain',
    ownerId: string = 'user'
  ): SharedFileRecord {
    const slug = crypto.randomUUID().slice(0, 10);
    const domain = window.location.hostname === 'localhost'
      ? window.location.origin
      : 'https://flashai.rf.gd';

    const record: SharedFileRecord = {
      id: slug,
      filename,
      content,
      mimeType,
      sizeBytes: new Blob([content]).size,
      createdAt: new Date().toISOString(),
      publicUrl: `${domain}/?shared_file=${slug}`,
      ownerId,
    };

    try {
      const existing: Record<string, SharedFileRecord> = JSON.parse(
        localStorage.getItem(SHARED_FILES_KEY) || '{}'
      );
      existing[slug] = record;
      localStorage.setItem(SHARED_FILES_KEY, JSON.stringify(existing));
    } catch (e) {
      console.error('Failed to save shared file record', e);
    }

    return record;
  },

  getSharedFile(slug: string): SharedFileRecord | null {
    try {
      const existing: Record<string, SharedFileRecord> = JSON.parse(
        localStorage.getItem(SHARED_FILES_KEY) || '{}'
      );
      return existing[slug] || null;
    } catch {
      return null;
    }
  },
};