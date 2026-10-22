const GUEST_FLAG_KEY = 'flash_is_guest';
const GUEST_CREDITS_KEY = 'flash_guest_credits';
const GUEST_CONVERSATIONS_KEY = 'flash_guest_conversations';
const DEFAULT_GUEST_CREDITS = 5000;

export interface GuestSession {
  isGuest: boolean;
  credits: number;
}

export const guestService = {
  // Check if active user is guest
  isGuest(): boolean {
    return localStorage.getItem(GUEST_FLAG_KEY) === 'true';
  },

  // Initialize guest mode
  enterGuestMode(): void {
    localStorage.setItem(GUEST_FLAG_KEY, 'true');
    if (!localStorage.getItem(GUEST_CREDITS_KEY)) {
      localStorage.setItem(GUEST_CREDITS_KEY, DEFAULT_GUEST_CREDITS.toString());
    }
    // Broadcast change so UI components update instantly
    window.dispatchEvent(new Event('flash_guest_state_changed'));
  },

  // Exit guest mode (e.g. upon real login)
  exitGuestMode(): void {
    localStorage.removeItem(GUEST_FLAG_KEY);
    localStorage.removeItem(GUEST_CREDITS_KEY);
    localStorage.removeItem(GUEST_CONVERSATIONS_KEY);
    window.dispatchEvent(new Event('flash_guest_state_changed'));
  },

  // Get current remaining credits
  getCredits(): number {
    const val = localStorage.getItem(GUEST_CREDITS_KEY);
    return val !== null ? parseInt(val, 10) : DEFAULT_GUEST_CREDITS;
  },

  // Deduct credits in real-time
  deductCredits(amount: number = 10): boolean {
    const current = this.getCredits();
    if (current < amount) return false;

    const remaining = Math.max(0, current - amount);
    localStorage.setItem(GUEST_CREDITS_KEY, remaining.toString());
    window.dispatchEvent(new CustomEvent('flash_credits_updated', { detail: remaining }));
    return true;
  },

  // Guest Chat Storage
  getConversations(): any[] {
    try {
      const data = localStorage.getItem(GUEST_CONVERSATIONS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveConversation(session: any): void {
    const list = this.getConversations();
    const index = list.findIndex((c: any) => c.id === session.id);
    if (index >= 0) {
      list[index] = session;
    } else {
      list.unshift(session);
    }
    localStorage.setItem(GUEST_CONVERSATIONS_KEY, JSON.stringify(list));
    window.dispatchEvent(new Event('flash_guest_chat_updated'));
  }
};