import { supabase } from './supabase';
import type { Profile, PlanType, UserRole, Conversation, ConversationMessage, PaymentRequest, PaymentRequestWithUser, PaymentMethod, ApiKey, ApiUsage, CreditsLedger, CreditPack } from '@/types/types';

export const profilesApi = {
  async getCurrentProfile(): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', (await supabase.auth.getUser()).data.user?.id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }

    return data;
  },

  async getAllProfiles(): Promise<Profile[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching profiles:', error);
      return [];
    }

    return Array.isArray(data) ? data : [];
  },

  async updateProfile(id: string, updates: Partial<Profile>): Promise<boolean> {
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', id);

    if (error) {
      console.error('Error updating profile:', error);
      return false;
    }

    return true;
  },

  async updateUserPlan(userId: string, newPlan: PlanType): Promise<boolean> {
    const { error } = await supabase.rpc('update_user_plan', {
      user_id: userId,
      new_plan: newPlan,
    });

    if (error) {
      console.error('Error updating user plan:', error);
      return false;
    }

    return true;
  },

  async updateUserRole(userId: string, newRole: UserRole): Promise<boolean> {
    const { error } = await supabase.rpc('update_user_role', {
      user_id: userId,
      new_role: newRole,
    });

    if (error) {
      console.error('Error updating user role:', error);
      return false;
    }

    return true;
  },

  async getEmailByUsername(username: string): Promise<string | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('email')
      .eq('username', username)
      .maybeSingle();

    if (error) {
      console.error('Error fetching email by username:', error);
      return null;
    }

    return data?.email || null;
  },
};

export const conversationsApi = {
  async getConversations(): Promise<Conversation[]> {
    const user = await supabase.auth.getUser();
    let query = supabase.from('conversations').select('*').order('updated_at', { ascending: false });
    
    if (user.data.user) {
      query = query.eq('user_id', user.data.user.id);
    }

    const { data, error } = await query;
    if (error) {
      console.error('[SUPABASE GET CONVERSATIONS ERROR]:', error);
      return [];
    }
    return data || [];
  },

  async createConversation(title: string): Promise<Conversation | null> {
    const user = await supabase.auth.getUser();
    const userId = user.data.user?.id || null;

    const { data, error } = await supabase
      .from('conversations')
      .insert({
        user_id: userId,
        title,
      })
      .select()
      .maybeSingle();

    if (error) {
      console.error('[SUPABASE REJECTED CONVERSATION]:', error);
      return null;
    }

    return data;
  },
  async updateConversationTitle(id: string, title: string): Promise<boolean> {
    const { error } = await supabase
      .from('conversations')
      .update({ title })
      .eq('id', id);

    if (error) {
      console.error('Error updating conversation title:', error);
      return false;
    }

    return true;
  },

  async deleteConversation(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting conversation:', error);
      return false;
    }

    return true;
  },
};

export const messagesApi = {
  async getMessages(conversationId: string): Promise<ConversationMessage[]> {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return [];
    }

    return Array.isArray(data) ? data : [];
  },

  async createMessage(
    conversationId: string,
    role: 'user' | 'assistant',
    content: string,
    images?: Array<{ data: string; mimeType: string; name: string }>
  ): Promise<ConversationMessage | null> {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        role,
        content,
        images: images || null,
      })
      .select()
      .maybeSingle();

    if (error) {
      console.error('Error creating message:', error);
      return null;
    }

    return data;
  },

  async deleteMessage(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting message:', error);
      return false;
    }

    return true;
  },
};

export const adminApi = {
  async searchUsers(query: string): Promise<Profile[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .or(`username.ilike.%${query}%,email.ilike.%${query}%,full_name.ilike.%${query}%`)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error searching users:', error);
      return [];
    }

    return Array.isArray(data) ? data : [];
  },

  async getUserConversations(userId: string): Promise<Conversation[]> {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching user conversations:', error);
      return [];
    }

    return Array.isArray(data) ? data : [];
  },

  async getAllConversations(): Promise<(Conversation & { profile: Profile | null })[]> {
    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        profile:profiles(*)
      `)
      .order('updated_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error fetching all conversations:', error);
      return [];
    }

    return Array.isArray(data) ? data : [];
  },

  async getStatistics() {
    const [usersResult, conversationsResult] = await Promise.all([
      supabase.from('profiles').select('plan, role', { count: 'exact', head: false }),
      supabase.from('conversations').select('id', { count: 'exact', head: true }),
    ]);

    const users = Array.isArray(usersResult.data) ? usersResult.data : [];
    const totalUsers = usersResult.count || 0;
    const totalConversations = conversationsResult.count || 0;

    const planDistribution = {
      free: users.filter(u => u.plan === 'free').length,
      hero: users.filter(u => u.plan === 'hero').length,
      pro: users.filter(u => u.plan === 'pro').length,
      business: users.filter(u => u.plan === 'business').length,
    };

    const roleDistribution = {
      user: users.filter(u => u.role === 'user').length,
      admin: users.filter(u => u.role === 'admin').length,
    };

    return {
      totalUsers,
      totalConversations,
      planDistribution,
      roleDistribution,
    };
  },

  async getAllSessions(): Promise<any[]> {
    const { data, error } = await supabase.rpc('get_all_sessions');

    if (error) {
      console.error('Error fetching all sessions:', error);
      return [];
    }

    return Array.isArray(data) ? data : [];
  },
};

export const sessionsApi = {
  async getMySessions(): Promise<any[]> {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .order('last_active', { ascending: false });

    if (error) {
      console.error('Error fetching sessions:', error);
      return [];
    }

    return Array.isArray(data) ? data : [];
  },

  async signOutSession(sessionId: string): Promise<boolean> {
    const { error } = await supabase.rpc('sign_out_session', {
      session_id: sessionId,
    });

    if (error) {
      console.error('Error signing out session:', error);
      return false;
    }

    return true;
  },

  async signOutOtherSessions(keepSessionId: string): Promise<boolean> {
    const { error } = await supabase.rpc('sign_out_other_sessions', {
      keep_session_id: keepSessionId,
    });

    if (error) {
      console.error('Error signing out other sessions:', error);
      return false;
    }

    return true;
  },
};

export const authApi = {
  async changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
      // First verify current password by attempting to sign in
      const user = await supabase.auth.getUser();
      if (!user.data.user?.email) {
        return { success: false, error: 'No email found for user' };
      }

      // Update password
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to change password' };
    }
  },
};

export const paymentsApi = {
  async createPaymentRequest(
    planId: PlanType,
    paymentMethod: PaymentMethod,
    screenshotFile: File,
    amount: number
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Validate file size (max 1MB)
      if (screenshotFile.size > 1048576) {
        return { success: false, error: 'Screenshot must be less than 1MB' };
      }

      // Validate file type
      if (!['image/jpeg', 'image/png', 'image/jpg'].includes(screenshotFile.type)) {
        return { success: false, error: 'Only JPEG and PNG images are allowed' };
      }

      // Upload screenshot to storage
      const fileExt = screenshotFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('app-7r35kmgp19mp_payment_screenshots')
        .upload(fileName, screenshotFile);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        return { success: false, error: 'Failed to upload screenshot' };
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('app-7r35kmgp19mp_payment_screenshots')
        .getPublicUrl(fileName);

      // Create payment request
      const { error: insertError } = await supabase
        .from('payment_requests')
        .insert({
          user_id: user.id,
          plan_id: planId,
          payment_method: paymentMethod,
          screenshot_url: urlData.publicUrl,
          amount,
          status: 'pending',
        });

      if (insertError) {
        console.error('Insert error:', insertError);
        return { success: false, error: 'Failed to create payment request' };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Payment request error:', error);
      return { success: false, error: error.message || 'Failed to create payment request' };
    }
  },

  async getMyPaymentRequests(): Promise<PaymentRequest[]> {
    const { data, error } = await supabase
      .from('payment_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching payment requests:', error);
      return [];
    }

    return Array.isArray(data) ? data : [];
  },

  async getAllPaymentRequests(): Promise<PaymentRequestWithUser[]> {
    const { data, error } = await supabase
      .from('payment_requests')
      .select(`
        *,
        profiles:user_id (
          username,
          email,
          full_name
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching all payment requests:', error);
      return [];
    }

    if (!Array.isArray(data)) return [];

    return data.map((item: any) => ({
      ...item,
      username: item.profiles?.username || null,
      email: item.profiles?.email || null,
      full_name: item.profiles?.full_name || null,
    }));
  },

  async approvePayment(paymentId: string, adminNotes?: string): Promise<boolean> {
    try {
      // Get payment request details
      const { data: payment, error: fetchError } = await supabase
        .from('payment_requests')
        .select('user_id, plan_id')
        .eq('id', paymentId)
        .maybeSingle();

      if (fetchError || !payment) {
        console.error('Error fetching payment:', fetchError);
        return false;
      }

      // Update payment status
      const { error: updateError } = await supabase
        .from('payment_requests')
        .update({
          status: 'approved',
          admin_notes: adminNotes || 'Payment approved',
        })
        .eq('id', paymentId);

      if (updateError) {
        console.error('Error updating payment:', updateError);
        return false;
      }

      // Update user plan
      const { error: planError } = await supabase
        .from('profiles')
        .update({ plan: payment.plan_id })
        .eq('id', payment.user_id);

      if (planError) {
        console.error('Error updating user plan:', planError);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error approving payment:', error);
      return false;
    }
  },

  async rejectPayment(paymentId: string, adminNotes: string): Promise<boolean> {
    const { error } = await supabase
      .from('payment_requests')
      .update({
        status: 'rejected',
        admin_notes: adminNotes,
      })
      .eq('id', paymentId);

    if (error) {
      console.error('Error rejecting payment:', error);
      return false;
    }

    return true;
  },
};

export const accountResetApi = {
  async resetUserAccount(userId: string, message: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase.rpc('reset_user_account', {
      target_user_id: userId,
      reset_message: message,
      admin_id: user.id,
    });

    if (error) {
      console.error('Error resetting user account:', error);
      throw error;
    }

    return true;
  },

  async resetAllAccountsExceptAdmins(message: string): Promise<number> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;

    const { data, error } = await supabase.rpc('reset_all_accounts_except_admins', {
      reset_message: message,
      admin_id: user.id,
    });

    if (error) {
      console.error('Error resetting all accounts:', error);
      throw error;
    }

    return data || 0;
  },

  async resetMultipleAccounts(userIds: string[], message: string): Promise<number> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;

    const { data, error } = await supabase.rpc('reset_multiple_accounts', {
      target_user_ids: userIds,
      reset_message: message,
      admin_id: user.id,
    });

    if (error) {
      console.error('Error resetting multiple accounts:', error);
      throw error;
    }

    return data || 0;
  },

  async getResetNotification(userId: string): Promise<{ id: string; message: string; created_at: string; read: boolean } | null> {
    const { data, error } = await supabase.rpc('get_reset_notification', {
      target_user_id: userId,
    });

    if (error) {
      console.error('Error fetching reset notification:', error);
      return null;
    }

    return Array.isArray(data) && data.length > 0 ? data[0] : null;
  },

  async markNotificationRead(notificationId: string): Promise<boolean> {
    const { error } = await supabase.rpc('mark_notification_read', {
      notification_id: notificationId,
    });

    if (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }

    return true;
  },
};

// Account Deletion API
export const accountDeletionApi = {
  async requestAccountDeletion(): Promise<{ success: boolean; otp?: string; error?: string }> {
    const { data, error } = await supabase.rpc('request_account_deletion');

    if (error) {
      console.error('Error requesting account deletion:', error);
      return { success: false, error: error.message };
    }

    return data as { success: boolean; otp?: string; error?: string };
  },

  async verifyDeletionOtp(otp: string): Promise<{ success: boolean; error?: string }> {
    const { data, error } = await supabase.rpc('verify_deletion_otp', {
      p_otp: otp,
    });

    if (error) {
      console.error('Error verifying deletion OTP:', error);
      return { success: false, error: error.message };
    }

    return data as { success: boolean; error?: string };
  },

  async completeAccountDeletion(userId: string, reason?: string): Promise<{ success: boolean; error?: string }> {
    const { data, error } = await supabase.rpc('complete_account_deletion', {
      p_user_id: userId,
      p_reason: reason || null,
    });

    if (error) {
      console.error('Error completing account deletion:', error);
      return { success: false, error: error.message };
    }

    return data as { success: boolean; error?: string };
  },

  async cancelDeletionRequest(): Promise<{ success: boolean; error?: string }> {
    const { data, error } = await supabase.rpc('cancel_deletion_request');

    if (error) {
      console.error('Error cancelling deletion request:', error);
      return { success: false, error: error.message };
    }

    return data as { success: boolean; error?: string };
  },

  async adminAccountAction(
    action: 'disable' | 'enable' | 'delete',
    userId: string,
    reason = ''
  ): Promise<{ success: boolean; error?: string; emailSent?: boolean; emailError?: string | null }> {
    const { data, error } = await supabase.functions.invoke('account-action', {
      body: { action, userId, reason },
    });

    if (error) {
      console.error('Admin account action failed:', error);
      return { success: false, error: error.message };
    }

    return data as { success: boolean; error?: string; emailSent?: boolean; emailError?: string | null };
  },

  async adminDeleteUserAccount(userId: string, reason: string) {
    return this.adminAccountAction('delete', userId, reason);
  },
};

// API Keys management
export const apiKeysApi = {
  // Generate a cryptographically secure API key (client-side prefix only, hash stored)
  generateKey(): { full: string; prefix: string; hash: string } {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    const full = 'sk-' + Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
    const prefix = full.slice(0, 12) + '...';
    // Simple hash for display (real hash happens server-side via DB function)
    const hash = btoa(full).replace(/[^a-zA-Z0-9]/g, '').slice(0, 64);
    return { full, prefix, hash };
  },

  async createKey(name: string): Promise<{ key: ApiKey; fullKey: string } | null> {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return null;

    const { full, prefix, hash } = apiKeysApi.generateKey();

    const { data, error } = await supabase
      .from('api_keys')
      .insert({ user_id: user.id, name, key_prefix: prefix, key_hash: hash })
      .select()
      .maybeSingle();

    if (error) { console.error('Error creating API key:', error); return null; }
    return { key: data as ApiKey, fullKey: full };
  },

  async getKeys(): Promise<ApiKey[]> {
    const { data, error } = await supabase
      .from('api_keys')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) { console.error('Error fetching API keys:', error); return []; }
    return Array.isArray(data) ? (data as ApiKey[]) : [];
  },

  async revokeKey(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('api_keys')
      .update({ is_active: false })
      .eq('id', id);
    if (error) { console.error('Error revoking API key:', error); return false; }
    return true;
  },

  async deleteKey(id: string): Promise<boolean> {
    const { error } = await supabase.from('api_keys').delete().eq('id', id);
    if (error) { console.error('Error deleting API key:', error); return false; }
    return true;
  },

  async updateKey(id: string, name: string): Promise<boolean> {
    const { error } = await supabase.from('api_keys').update({ name }).eq('id', id);
    if (error) { console.error('Error updating API key:', error); return false; }
    return true;
  },
};

// API Usage analytics
export const apiUsageApi = {
  async getUsage(days = 30): Promise<ApiUsage[]> {
    const since = new Date(Date.now() - days * 86400000).toISOString();
    const { data, error } = await supabase
      .from('api_usage')
      .select('*')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(500);
    if (error) { console.error('Error fetching usage:', error); return []; }
    return Array.isArray(data) ? (data as ApiUsage[]) : [];
  },

  async logUsage(params: {
    model: string;
    inputTokens: number;
    outputTokens: number;
    creditsUsed: number;
    source?: 'chat' | 'api';
    responseMs?: number;
  }): Promise<void> {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return;
    await supabase.rpc('log_api_usage', {
      p_user_id: user.id,
      p_model: params.model,
      p_input_tokens: params.inputTokens,
      p_output_tokens: params.outputTokens,
      p_credits_used: params.creditsUsed,
      p_source: params.source || 'chat',
      p_response_ms: params.responseMs || null,
    });
  },

  async getAllUsage(days = 7): Promise<ApiUsage[]> {
    const since = new Date(Date.now() - days * 86400000).toISOString();
    const { data, error } = await supabase
      .from('api_usage')
      .select('*')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(1000);
    if (error) { console.error('Error fetching all usage:', error); return []; }
    return Array.isArray(data) ? (data as ApiUsage[]) : [];
  },
};

// Credits management
export const creditsApi = {
  async getLedger(limit = 50): Promise<CreditsLedger[]> {
    const { data, error } = await supabase
      .from('credits_ledger')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) { console.error('Error fetching ledger:', error); return []; }
    return Array.isArray(data) ? (data as CreditsLedger[]) : [];
  },

  async getPacks(): Promise<CreditPack[]> {
    const { data, error } = await supabase
      .from('credit_packs')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });
    if (error) { console.error('Error fetching credit packs:', error); return []; }
    return Array.isArray(data) ? (data as CreditPack[]) : [];
  },

  async adminAdjustCredits(userId: string, amount: number, description: string): Promise<boolean> {
    const admin = (await supabase.auth.getUser()).data.user;
    if (!admin) return false;
    const { error } = await supabase.rpc('add_credits', {
      p_user_id: userId,
      p_amount: amount,
      p_type: 'admin_adjustment',
      p_description: description,
      p_admin_id: admin.id,
    });
    if (error) { console.error('Error adjusting credits:', error); return false; }
    return true;
  },

  async deductCredits(amount: number, description: string): Promise<boolean> {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return false;
    const { data, error } = await supabase.rpc('deduct_credits', {
      p_user_id: user.id,
      p_amount: amount,
      p_description: description,
    });
    if (error) { console.error('Error deducting credits:', error); return false; }
    return !!data;
  },
};
