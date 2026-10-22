import { supabase } from './supabase';
import type { Conversation, Profile } from '@/types/types';

// ==========================================
// Conversations API (Isolated per user)
// ==========================================
export const conversationsApi = {
  async getConversations(): Promise<Conversation[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching conversations:', error);
      return [];
    }
    return (data as Conversation[]) || [];
  },

  async createConversation(title: string = 'New Chat'): Promise<Conversation | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('conversations')
      .insert({
        user_id: user.id,
        title,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating conversation:', error);
      return null;
    }
    return data as Conversation;
  },

  async updateConversationTitle(id: string, title: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
      .from('conversations')
      .update({ title, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) console.error('Error updating title:', error);
    return !error;
  },

  async deleteConversation(id: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    await supabase.from('messages').delete().eq('conversation_id', id);

    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) console.error('Error deleting conversation:', error);
    return !error;
  },
};

// ==========================================
// Messages API (Linked to conversation)
// ==========================================
export const messagesApi = {
  async getMessages(conversationId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
    return data || [];
  },

  async createMessage(
    conversationId: string,
    role: 'user' | 'assistant',
    content: string,
    images?: any[]
  ): Promise<any | null> {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        role,
        content,
        images: images || null,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error inserting message:', error);
      return null;
    }

    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId);

    return data;
  },
};

// ==========================================
// Profiles API
// ==========================================
export const profilesApi = {
  async getProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) return null;
    return data as Profile;
  },

  async updateProfile(userId: string, updates: Partial<Profile>): Promise<boolean> {
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId);

    return !error;
  },

  async getAllProfiles(): Promise<Profile[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return [];
    return (data as Profile[]) || [];
  },
};

// ==========================================
// Auth API
// ==========================================
export const authApi = {
  async updatePassword(password: string): Promise<boolean> {
    const { error } = await supabase.auth.updateUser({ password });
    return !error;
  },

  async updateEmail(email: string): Promise<boolean> {
    const { error } = await supabase.auth.updateUser({ email });
    return !error;
  },

  async deleteAccount(): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    const { error } = await supabase.from('profiles').delete().eq('id', user.id);
    await supabase.auth.signOut();
    return !error;
  },
};

// ==========================================
// Admin API
// ==========================================
export const adminApi = {
  async getStats(): Promise<any> {
    const { data: profiles } = await supabase.from('profiles').select('id, plan, role');
    const { count: conversationsCount } = await supabase.from('conversations').select('*', { count: 'exact', head: true });
    const { count: messagesCount } = await supabase.from('messages').select('*', { count: 'exact', head: true });

    return {
      totalUsers: profiles?.length || 0,
      totalConversations: conversationsCount || 0,
      totalMessages: messagesCount || 0,
      proUsers: profiles?.filter((p: any) => p.plan === 'pro').length || 0,
    };
  },

  async updateUserPlan(userId: string, plan: string): Promise<boolean> {
    const { error } = await supabase
      .from('profiles')
      .update({ plan })
      .eq('id', userId);
    return !error;
  },

  async updateUserCredits(userId: string, credits: number): Promise<boolean> {
    const { error } = await supabase
      .from('profiles')
      .update({ credits })
      .eq('id', userId);
    return !error;
  },
};

// ==========================================
// API Keys API
// ==========================================
export const apiKeysApi = {
  async getKeys(): Promise<any[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('api_keys')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) return [];
    return data || [];
  },

  async createKey(name: string): Promise<any | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const rawKey = `fl_${crypto.randomUUID().replace(/-/g, '')}`;

    const { data, error } = await supabase
      .from('api_keys')
      .insert({
        user_id: user.id,
        name,
        key: rawKey,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) return null;
    return data;
  },

  async deleteKey(id: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
      .from('api_keys')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    return !error;
  },
};

// ==========================================
// Credits API
// ==========================================
export const creditsApi = {
  async getBalance(): Promise<number> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;

    const { data } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', user.id)
      .single();

    return data?.credits ?? 0;
  },

  async deductCredits(amount: number): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const current = await this.getBalance();
    if (current < amount) return false;

    const { error } = await supabase
      .from('profiles')
      .update({ credits: current - amount })
      .eq('id', user.id);

    return !error;
  },
};

// ==========================================
// Payments API
// ==========================================
export const paymentsApi = {
  async getPaymentHistory(): Promise<any[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) return [];
    return data || [];
  },

  async getAllPayments(): Promise<any[]> {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return [];
    return data || [];
  },

  async verifyPayment(paymentId: string, status: 'approved' | 'rejected'): Promise<boolean> {
    const { error } = await supabase
      .from('payments')
      .update({ status })
      .eq('id', paymentId);

    return !error;
  },
};

// ==========================================
// Account Reset API
// ==========================================
export const accountResetApi = {
  async getPendingResets(): Promise<any[]> {
    const { data, error } = await supabase
      .from('account_resets')
      .select('*')
      .eq('status', 'pending');
    if (error) return [];
    return data || [];
  },

  async requestReset(userId: string, reason: string): Promise<boolean> {
    const { error } = await supabase
      .from('account_resets')
      .insert({ user_id: userId, reason, status: 'pending', created_at: new Date().toISOString() });
    return !error;
  },

  async checkNotification(userId: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('account_resets')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) return null;
    return data;
  },
};

// ==========================================
// Account Deletion API
// ==========================================
export const accountDeletionApi = {
  async requestDeletion(userId: string, reason?: string): Promise<boolean> {
    const { error } = await supabase
      .from('account_deletions')
      .insert({ user_id: userId, reason: reason || 'User requested', status: 'pending', created_at: new Date().toISOString() });
    return !error;
  },

  async cancelDeletion(userId: string): Promise<boolean> {
    const { error } = await supabase
      .from('account_deletions')
      .delete()
      .eq('user_id', userId);
    return !error;
  },
};

// ==========================================
// API Usage API
// ==========================================
export const apiUsageApi = {
  async logUsage(entry: {
    model: string;
    inputTokens: number;
    outputTokens: number;
    creditsUsed: number;
    source: string;
    responseMs: number;
  }): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('api_usage').insert({
      user_id: user.id,
      model: entry.model,
      input_tokens: entry.inputTokens,
      output_tokens: entry.outputTokens,
      credits_used: entry.creditsUsed,
      source: entry.source,
      response_ms: entry.responseMs,
      created_at: new Date().toISOString(),
    });
  },

  async getRecentUsage(limit: number = 20): Promise<any[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('api_usage')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) return [];
    return data || [];
  },
};

// ==========================================
// Sessions API
// ==========================================
export const sessionsApi = {
  async getMySessions(): Promise<any[]> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return [];
    return [{ id: session.access_token.slice(-12), current: true }];
  },

  async signOutOtherSessions(_currentSessionId: string): Promise<boolean> {
    const { error } = await supabase.auth.signOut({ scope: 'others' });
    return !error;
  },
};