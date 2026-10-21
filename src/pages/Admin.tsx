import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Shield, 
  Users, 
  Crown, 
  Zap, 
  Search, 
  MessageSquare, 
  TrendingUp,
  Eye,
  Trash2,
  X,
  CreditCard,
  RotateCcw,
  AlertTriangle,
  PlusCircle,
  MinusCircle,
  Activity,
  BarChart2,
  Ban,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { useAuth } from '@/components/auth/AuthProvider';
import { profilesApi, adminApi, conversationsApi, messagesApi, accountResetApi, accountDeletionApi, apiUsageApi } from '@/db/api';
import { toast } from 'sonner';
import type { Profile, PlanType, UserRole, Conversation, ConversationMessage, ApiUsage } from '@/types/types';
import { PLANS } from '@/types/plans';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PaymentVerification } from '@/components/admin/PaymentVerification';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/db/supabase';
import { promoService, type PromoCode, type SiteBanner } from '@/services/promoService';
import { bugReportService, type BugTicket } from '@/services/bugReportService';
import { Sparkles, Gift, Bug, CheckCircle2, Clock } from 'lucide-react';

export default function Admin() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [filteredProfiles, setFilteredProfiles] = useState<Profile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [statistics, setStatistics] = useState<any>(null);

  // Bug Reports & Tickets State
  const [bugTickets, setBugTickets] = useState<BugTicket[]>(() => bugReportService.getTickets());
  const [bugCategoryFilter, setBugCategoryFilter] = useState<string>('all');
  const [bugStatusFilter, setBugStatusFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [userConversations, setUserConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [conversationMessages, setConversationMessages] = useState<ConversationMessage[]>([]);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [isConversationDialogOpen, setIsConversationDialogOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isResetMessageOpen, setIsResetMessageOpen] = useState(false);
  const [resetMessage, setResetMessage] = useState('');
  const [resetType, setResetType] = useState<'all' | 'single' | 'multiple'>('all');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [isResetting, setIsResetting] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [accountAction, setAccountAction] = useState<'disable' | 'delete'>('delete');
  const [deleteReason, setDeleteReason] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [apiUsageLogs, setApiUsageLogs] = useState<ApiUsage[]>([]);
  const [isUsageLoading, setIsUsageLoading] = useState(false);
  const [creditAdjustUserId, setCreditAdjustUserId] = useState<string | null>(null);
  const [creditAdjustAmount, setCreditAdjustAmount] = useState('');
  const [creditAdjustNote, setCreditAdjustNote] = useState('');
  const [isCreditDialogOpen, setIsCreditDialogOpen] = useState(false);
  const [isAdjustingCredits, setIsAdjustingCredits] = useState(false);
  const { profile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (profile?.role !== 'admin') {
      navigate('/');
      return;
    }

    loadData();
  }, [profile, navigate]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = profiles.filter(
        (p) =>
          p.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredProfiles(filtered);
    } else {
      setFilteredProfiles(profiles);
    }
  }, [searchQuery, profiles]);

  const loadData = async () => {
    setIsLoading(true);
    const [profilesData, statsData] = await Promise.all([
      profilesApi.getAllProfiles(),
      adminApi.getStatistics(),
    ]);
    setProfiles(profilesData);
    setFilteredProfiles(profilesData);
    setStatistics(statsData);
    setIsLoading(false);
  };

  const handleUpdatePlan = async (userId: string, newPlan: PlanType) => {
    const success = await profilesApi.updateUserPlan(userId, newPlan);
    if (success) {
      toast.success('User plan has been updated successfully.');
      loadData();
    } else {
      toast.error('Failed to update user plan.');
    }
  };

  const handleUpdateRole = async (userId: string, newRole: UserRole) => {
    const success = await profilesApi.updateUserRole(userId, newRole);
    if (success) {
      toast.success('User role has been updated successfully.');
      loadData();
    } else {
      toast.error('Failed to update user role.');
    }
  };

  const handleViewUser = async (user: Profile) => {
    setSelectedUser(user);
    setIsUserDialogOpen(true);
    const conversations = await adminApi.getUserConversations(user.id);
    setUserConversations(conversations);
  };

  const handleViewConversation = async (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setIsConversationDialogOpen(true);
    const messages = await messagesApi.getMessages(conversation.id);
    setConversationMessages(messages);
  };

  const handleDeleteConversation = async (conversationId: string) => {
    if (!confirm('Are you sure you want to delete this conversation?')) return;
    
    const success = await conversationsApi.deleteConversation(conversationId);
    if (success) {
      toast.success('The conversation has been deleted successfully.');
      if (selectedUser) {
        const conversations = await adminApi.getUserConversations(selectedUser.id);
        setUserConversations(conversations);
      }
    } else {
      toast.error('Failed to delete conversation.');
    }
  };

  const handleResetAllAccounts = () => {
    setResetType('all');
    setIsResetConfirmOpen(true);
  };

  const handleResetSingleAccount = (userId: string) => {
    setResetType('single');
    setSelectedUserIds([userId]);
    setIsResetConfirmOpen(true);
  };

  const handleResetMultipleAccounts = () => {
    if (selectedUserIds.length === 0) {
      toast.error('Please select at least one user to reset.');
      return;
    }
    setResetType('multiple');
    setIsResetConfirmOpen(true);
  };

  const handleConfirmReset = () => {
    setIsResetConfirmOpen(false);
    setIsResetMessageOpen(true);
  };

  const handleExecuteReset = async () => {
    if (!resetMessage.trim()) {
      toast.error('Please enter a message for the users.');
      return;
    }

    setIsResetting(true);

    try {
      let affectedCount = 0;

      if (resetType === 'all') {
        affectedCount = await accountResetApi.resetAllAccountsExceptAdmins(resetMessage);
      } else if (resetType === 'single') {
        await accountResetApi.resetUserAccount(selectedUserIds[0], resetMessage);
        affectedCount = 1;
      } else if (resetType === 'multiple') {
        affectedCount = await accountResetApi.resetMultipleAccounts(selectedUserIds, resetMessage);
      }

      toast.success(`✅ ${affectedCount} account(s) reset. Users will see your message when they log in.`);

      setIsResetMessageOpen(false);
      setResetMessage('');
      setSelectedUserIds([]);
      await loadData();
    } catch (error: any) {
      toast.error('Reset Failed');
    } finally {
      setIsResetting(false);
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const selectAllUsers = () => {
    const nonAdminUsers = filteredProfiles.filter(p => p.role === 'user').map(p => p.id);
    setSelectedUserIds(nonAdminUsers);
  };

  const deselectAllUsers = () => {
    setSelectedUserIds([]);
  };

  const handleDeleteUser = (userId: string) => {
    setAccountAction('delete');
    setDeleteUserId(userId);
    setDeleteReason('');
    setIsDeleteConfirmOpen(true);
  };

  const handleDisableUser = (userId: string) => {
    setAccountAction('disable');
    setDeleteUserId(userId);
    setDeleteReason('');
    setIsDeleteConfirmOpen(true);
  };

  const handleEnableUser = async (userId: string) => {
    const result = await accountDeletionApi.adminAccountAction('enable', userId);
    if (result.success) {
      toast.success('Account re-enabled.');
      await loadData();
    } else {
      toast.error(result.error || 'Could not re-enable account.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteUserId) return;

    if (!deleteReason.trim()) {
      toast.error(`Please provide a reason for ${accountAction === 'delete' ? 'deleting' : 'disabling'} this account.`);
      return;
    }

    setIsDeleting(true);

    try {
      const result = await accountDeletionApi.adminAccountAction(accountAction, deleteUserId, deleteReason);

      if (result.success) {
        const actionLabel = accountAction === 'delete' ? 'deleted' : 'disabled';
        if (result.emailSent) {
          toast.success(`Account ${actionLabel}; reason emailed to the user.`);
        } else {
          toast.warning(`Account ${actionLabel}, but email was not sent: ${result.emailError || 'email service unavailable'}`);
        }

        setIsDeleteConfirmOpen(false);
        setDeleteUserId(null);
        setDeleteReason('');
        await loadData();
      } else {
        toast.error(result.error || `Could not ${accountAction} account.`);
      }
    } catch (error: any) {
      toast.error(error.message || `Could not ${accountAction} account.`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenCreditAdjust = (userId: string) => {
    setCreditAdjustUserId(userId);
    setCreditAdjustAmount('');
    setCreditAdjustNote('');
    setIsCreditDialogOpen(true);
  };

  const handleAdjustCredits = async () => {
    if (!creditAdjustUserId) return;
    const amount = parseInt(creditAdjustAmount, 10);
    if (isNaN(amount) || amount === 0) {
      toast.error('Please enter a valid non-zero credit amount.');
      return;
    }
    setIsAdjustingCredits(true);
    try {
      if (amount > 0) {
        const { error } = await supabase.rpc('add_credits', {
          p_user_id: creditAdjustUserId,
          p_amount: Math.abs(amount),
          p_type: 'admin_adjustment',
          p_description: creditAdjustNote || 'Admin credit grant',
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.rpc('deduct_credits', {
          p_user_id: creditAdjustUserId,
          p_amount: Math.abs(amount),
          p_description: creditAdjustNote || 'Admin credit deduction',
        });
        if (error) throw error;
      }
      toast.success(`Credits ${amount > 0 ? 'added' : 'deducted'} successfully.`);
      setIsCreditDialogOpen(false);
      await loadData();
    } catch (err: unknown) {
      const e = err as { message?: string };
      toast.error(e.message || 'Failed to adjust credits.');
    } finally {
      setIsAdjustingCredits(false);
    }
  };

  const loadApiUsage = async () => {
    setIsUsageLoading(true);
    const data = await apiUsageApi.getAllUsage(7);
    setApiUsageLogs(data);
    setIsUsageLoading(false);
  };

  if (profile?.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <header className="border-b-2 border-border/50 bg-gradient-to-r from-card to-card/95 shadow-2xl sticky top-0 z-10 backdrop-blur-xl">
        <div className="container mx-auto px-4 xl:px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate('/')} 
              className="mr-2 hover:scale-105 transition-all border-2"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Chat
            </Button>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary via-primary to-primary/80 flex items-center justify-center shadow-2xl shadow-primary/30 animate-float">
              <Shield className="w-7 h-7 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold gradient-text">Admin Dashboard</h1>
              <p className="text-sm text-muted-foreground font-medium">Manage users, plans, and conversations</p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <div className="container mx-auto px-4 xl:px-6 py-8 max-w-7xl">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
          <Card className="border-2 border-border/50 bg-gradient-to-br from-card to-card/95 shadow-xl hover:shadow-2xl hover:shadow-primary/10 transition-all hover:scale-[1.02]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-bold">Total Users</CardTitle>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-500/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{statistics?.totalUsers || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Registered accounts</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-border/50 bg-gradient-to-br from-card to-card/95 shadow-xl hover:shadow-2xl hover:shadow-accent/10 transition-all hover:scale-[1.02]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-bold">Conversations</CardTitle>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent/20 to-accent/10 flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-accent" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{statistics?.totalConversations || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Total chats</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-border/50 bg-gradient-to-br from-card to-card/95 shadow-xl hover:shadow-2xl hover:shadow-primary/10 transition-all hover:scale-[1.02]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-bold">Premium Users</CardTitle>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                <Crown className="h-5 w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {(statistics?.planDistribution?.hero || 0) + 
                 (statistics?.planDistribution?.pro || 0) + 
                 (statistics?.planDistribution?.business || 0)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Paid subscriptions</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-border/50 bg-gradient-to-br from-card to-card/95 shadow-xl hover:shadow-2xl hover:shadow-primary/10 transition-all hover:scale-[1.02]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-bold">Admins</CardTitle>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500/20 to-red-500/10 flex items-center justify-center">
                <Shield className="h-5 w-5 text-red-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {statistics?.roleDistribution?.admin || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Admin accounts</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for User Management, Payments, Offers, Analytics, Bug Reports */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 h-14 bg-card border-2 border-border shadow-xl">
            <TabsTrigger value="users" className="text-sm font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-accent data-[state=active]:text-white">
              <Users className="w-4 h-4 mr-1.5" />
              Users
            </TabsTrigger>
            <TabsTrigger value="payments" className="text-sm font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-accent data-[state=active]:text-white">
              <CreditCard className="w-4 h-4 mr-1.5" />
              Payments
            </TabsTrigger>
            <TabsTrigger value="offers" className="text-sm font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-accent data-[state=active]:text-white">
              <PlusCircle className="w-4 h-4 mr-1.5" />
              Offers
            </TabsTrigger>
            <TabsTrigger value="analytics" className="text-sm font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-accent data-[state=active]:text-white" onClick={loadApiUsage}>
              <Activity className="w-4 h-4 mr-1.5" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="bugs" className="text-sm font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-accent data-[state=active]:text-white">
              <Bug className="w-4 h-4 mr-1.5" />
              Bugs ({bugTickets.filter(t => t.status === 'new' || t.status === 'investigating').length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card className="border-2 border-border/50 bg-gradient-to-br from-card to-card/95 shadow-2xl">
              <CardHeader>
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-2xl font-bold gradient-text">User Management</CardTitle>
                    <CardDescription className="text-[15px] mt-1">Search and manage all user accounts</CardDescription>
                  </div>
                  <div className="relative w-full xl:w-80">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      placeholder="Search by username, email, or name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-11 h-12 border-2 border-border focus:border-primary/50 rounded-xl shadow-md text-[15px]"
                    />
                    {searchQuery && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-destructive/10"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Bulk Actions */}
                <div className="mb-6 p-4 border-2 border-border/50 rounded-xl bg-gradient-to-r from-muted/30 to-muted/10">
                  <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={selectedUserIds.length === filteredProfiles.filter(p => p.role === 'user').length && selectedUserIds.length > 0}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            selectAllUsers();
                          } else {
                            deselectAllUsers();
                          }
                        }}
                        className="border-2"
                      />
                      <span className="text-sm font-medium">
                        {selectedUserIds.length > 0 ? `${selectedUserIds.length} user(s) selected` : 'Select all users'}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        onClick={handleResetAllAccounts}
                        variant="destructive"
                        size="sm"
                        className="shadow-lg"
                      >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Reset All Accounts
                      </Button>
                      {selectedUserIds.length > 0 && (
                        <>
                          <Button
                            onClick={handleResetMultipleAccounts}
                            variant="outline"
                            size="sm"
                            className="border-2 shadow-lg"
                          >
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Reset Selected ({selectedUserIds.length})
                          </Button>
                          <Button
                            onClick={deselectAllUsers}
                            variant="ghost"
                            size="sm"
                          >
                            <X className="w-4 h-4 mr-2" />
                            Clear Selection
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-muted-foreground font-medium">Loading users...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredProfiles.map((user) => (
                  <div
                    key={user.id}
                    className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 p-5 border-2 border-border/50 rounded-2xl hover:bg-gradient-to-r hover:from-primary/5 hover:to-accent/5 transition-all hover:shadow-lg hover:border-primary/30 group"
                  >
                    {/* Checkbox for selection (only for non-admin users) */}
                    {user.role !== 'admin' && (
                      <div className="flex items-start pt-1">
                        <Checkbox
                          checked={selectedUserIds.includes(user.id)}
                          onCheckedChange={() => toggleUserSelection(user.id)}
                          className="border-2"
                        />
                      </div>
                    )}
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-bold text-[16px] text-foreground">
                          {user.username || user.full_name || 'Unknown User'}
                        </h3>
                        {user.role === 'admin' && (
                          <Badge variant="default" className="text-xs font-bold shadow-md">
                            <Shield className="w-3 h-3 mr-1" />
                            Admin
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{user.email || 'No email'}</p>
                      <div className="flex items-center gap-3 flex-wrap">
                        <Badge variant="outline" className="text-xs font-semibold border-2">
                          <Zap className="w-3 h-3 mr-1" />
                          {PLANS.find((p) => p.id === user.plan)?.name || 'Free'}
                        </Badge>
                        <span className="text-xs text-muted-foreground font-medium">
                          {user.upload_limit_mb}MB upload limit
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Joined {new Date(user.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col xl:flex-row gap-3">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs text-muted-foreground font-semibold">Plan</label>
                        <Select
                          value={user.plan}
                          onValueChange={(value) => handleUpdatePlan(user.id, value as PlanType)}
                        >
                          <SelectTrigger className="w-full xl:w-[150px] h-10 border-2 rounded-xl">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {PLANS.map((plan) => (
                              <SelectItem key={plan.id} value={plan.id}>
                                {plan.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs text-muted-foreground font-semibold">Role</label>
                        <Select
                          value={user.role}
                          onValueChange={(value) => handleUpdateRole(user.id, value as UserRole)}
                        >
                          <SelectTrigger className="w-full xl:w-[130px] h-10 border-2 rounded-xl">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">User</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs text-muted-foreground font-semibold">Actions</label>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewUser(user)}
                            className="h-10 border-2 rounded-xl hover:bg-primary/10 hover:border-primary/50 hover:scale-105 transition-all"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View Chats
                          </Button>
                          {user.role !== 'admin' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => user.is_disabled ? handleEnableUser(user.id) : handleDisableUser(user.id)}
                                className="h-10 rounded-xl hover:scale-105 transition-all border-2"
                                title={user.is_disabled ? 'Re-enable Account' : 'Disable Account'}
                              >
                                {user.is_disabled ? <ShieldCheck className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenCreditAdjust(user.id)}
                                className="h-10 rounded-xl hover:scale-105 transition-all border-2 hover:bg-primary/10 hover:border-primary/50"
                                title="Adjust Credits"
                              >
                                <Zap className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleResetSingleAccount(user.id)}
                                className="h-10 rounded-xl hover:scale-105 transition-all border-2 hover:bg-orange-500/10 hover:border-orange-500/50"
                                title="Reset Account"
                              >
                                <RotateCcw className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDeleteUser(user.id)}
                                className="h-10 rounded-xl hover:scale-105 transition-all"
                                title="Delete Account"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {filteredProfiles.length === 0 && (
                  <div className="text-center py-12">
                    <Users className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-muted-foreground font-medium text-lg">
                      {searchQuery ? 'No users found matching your search' : 'No users found'}
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
          </TabsContent>

          <TabsContent value="payments">
            <PaymentVerification />
          </TabsContent>

          {/* ── Offers Tab ── */}
          <TabsContent value="offers">
            <OffersPanel profiles={profiles} onRefresh={loadData} />
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            {/* Summary cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <Card className="border-2 border-border/50 bg-gradient-to-br from-card to-card/95 shadow-xl">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-bold">Total API Calls (7d)</CardTitle>
                  <BarChart2 className="h-5 w-5 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">{apiUsageLogs.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">Last 7 days</p>
                </CardContent>
              </Card>
              <Card className="border-2 border-border/50 bg-gradient-to-br from-card to-card/95 shadow-xl">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-bold">Credits Consumed (7d)</CardTitle>
                  <Zap className="h-5 w-5 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">
                    {apiUsageLogs.reduce((s, r) => s + (r.credits_used || 0), 0).toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Across all users</p>
                </CardContent>
              </Card>
              <Card className="border-2 border-border/50 bg-gradient-to-br from-card to-card/95 shadow-xl">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-bold">Avg Response Time</CardTitle>
                  <Activity className="h-5 w-5 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">
                    {apiUsageLogs.length
                      ? Math.round(apiUsageLogs.reduce((s, r) => s + (r.response_ms || 0), 0) / apiUsageLogs.length)
                      : 0}
                    <span className="text-sm font-normal text-muted-foreground ml-1">ms</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Average latency</p>
                </CardContent>
              </Card>
            </div>

            {/* Usage log table */}
            <Card className="border-2 border-border/50 shadow-xl">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold">API Usage Log</CardTitle>
                  <CardDescription>Recent model calls across all users (last 7 days)</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={loadApiUsage} disabled={isUsageLoading} className="h-9">
                  <RotateCcw className={`w-4 h-4 mr-2 ${isUsageLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 border-b border-border">
                      <tr>
                        {['User', 'Model', 'In Tokens', 'Out Tokens', 'Credits', 'Source', 'Latency', 'Time'].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {isUsageLoading ? (
                        <tr>
                          <td colSpan={8} className="text-center py-12 text-muted-foreground">
                            <Activity className="w-8 h-8 mx-auto animate-pulse mb-2" />
                            Loading…
                          </td>
                        </tr>
                      ) : apiUsageLogs.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="text-center py-12 text-muted-foreground">
                            No usage data yet. Refresh after users send messages.
                          </td>
                        </tr>
                      ) : (
                        apiUsageLogs.slice(0, 100).map((log) => (
                          <tr key={log.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                            <td className="px-4 py-3 text-xs text-muted-foreground font-mono truncate max-w-[100px]">{log.user_id?.slice(0, 8)}…</td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <Badge variant="outline" className="text-[10px]">{log.model}</Badge>
                            </td>
                            <td className="px-4 py-3 text-xs text-foreground whitespace-nowrap">{(log.input_tokens || 0).toLocaleString()}</td>
                            <td className="px-4 py-3 text-xs text-foreground whitespace-nowrap">{(log.output_tokens || 0).toLocaleString()}</td>
                            <td className="px-4 py-3 text-xs font-semibold text-primary whitespace-nowrap">{log.credits_used}</td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <Badge variant={log.source === 'api' ? 'default' : 'secondary'} className="text-[10px]">{log.source || 'chat'}</Badge>
                            </td>
                            <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{log.response_ms ? `${log.response_ms}ms` : '—'}</td>
                            <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                              {log.created_at ? new Date(log.created_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bug Reports & Triage Tab */}
          <TabsContent value="bugs">
            <Card className="border-2 border-border/50 bg-gradient-to-br from-card to-card/95 shadow-2xl">
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-2xl font-bold gradient-text flex items-center gap-2">
                      <Bug className="w-6 h-6 text-rose-500" />
                      Bug Reports & Triage Center
                    </CardTitle>
                    <CardDescription className="text-[15px] mt-1">
                      User submitted issue tickets, severity triage, and resolution tracking
                    </CardDescription>
                  </div>

                  {/* Filters */}
                  <div className="flex flex-wrap items-center gap-2">
                    <Select value={bugCategoryFilter} onValueChange={setBugCategoryFilter}>
                      <SelectTrigger className="w-36 h-9 text-xs">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="UI/Streaming">UI/Streaming</SelectItem>
                        <SelectItem value="Voice/Audio">Voice/Audio</SelectItem>
                        <SelectItem value="Code/Deployment">Code/Deploy</SelectItem>
                        <SelectItem value="Plugins">Plugins</SelectItem>
                        <SelectItem value="Billing/Account">Billing</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={bugStatusFilter} onValueChange={setBugStatusFilter}>
                      <SelectTrigger className="w-36 h-9 text-xs">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="investigating">Investigating</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {bugTickets
                    .filter((t) => bugCategoryFilter === 'all' || t.category === bugCategoryFilter)
                    .filter((t) => bugStatusFilter === 'all' || t.status === bugStatusFilter)
                    .map((ticket) => (
                      <div
                        key={ticket.id}
                        className="p-4 rounded-2xl bg-muted/30 border border-white/10 hover:border-white/20 transition-all space-y-2.5"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs text-primary px-2 py-0.5 rounded-lg bg-primary/10 border border-primary/20">
                              {ticket.id}
                            </span>
                            <span className="font-bold text-sm text-foreground">
                              {ticket.title}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <Badge
                              variant="outline"
                              className={
                                ticket.severity === 'critical'
                                  ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                                  : ticket.severity === 'high'
                                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                                  : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                              }
                            >
                              {ticket.severity}
                            </Badge>
                            <Badge variant="secondary" className="text-[10px]">
                              {ticket.category}
                            </Badge>
                          </div>
                        </div>

                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {ticket.description}
                        </p>

                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/10 text-[11px] text-muted-foreground">
                          <div className="flex items-center gap-3">
                            <span>User: <strong className="text-foreground">{ticket.userEmail}</strong></span>
                            <span>Env: <strong className="font-mono text-[10px]">{ticket.systemEnv}</strong></span>
                            <span>Reported: {new Date(ticket.createdAt).toLocaleDateString()}</span>
                          </div>

                          {/* Status Action Switcher */}
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-xs text-foreground">Status:</span>
                            <Select
                              value={ticket.status}
                              onValueChange={(val: any) => {
                                bugReportService.updateTicketStatus(ticket.id, val);
                                setBugTickets(bugReportService.getTickets());
                                toast.success(`Ticket ${ticket.id} status updated to ${val}`);
                              }}
                            >
                              <SelectTrigger className="w-32 h-7 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="new">New</SelectItem>
                                <SelectItem value="investigating">Investigating</SelectItem>
                                <SelectItem value="resolved">Resolved</SelectItem>
                                <SelectItem value="closed">Closed</SelectItem>
                              </SelectContent>
                            </Select>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                bugReportService.deleteTicket(ticket.id);
                                setBugTickets(bugReportService.getTickets());
                                toast.info(`Deleted ticket ${ticket.id}`);
                              }}
                              className="h-7 w-7 text-destructive hover:bg-destructive/10 rounded-lg p-0"
                              title="Delete ticket"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}

                  {bugTickets.length === 0 && (
                    <div className="py-12 text-center text-muted-foreground">
                      <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
                      <p className="text-sm font-semibold">No reported bugs at this time!</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* User Conversations Dialog */}
      <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold gradient-text">
              {selectedUser?.username || selectedUser?.full_name}'s Conversations
            </DialogTitle>
            <DialogDescription className="text-[15px]">
              View and manage all conversations for this user
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {userConversations.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground font-medium">No conversations found</p>
              </div>
            ) : (
              userConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className="flex items-center justify-between p-4 border-2 border-border/50 rounded-xl hover:bg-muted/50 transition-all group"
                >
                  <div className="flex-1">
                    <h4 className="font-bold text-[15px] mb-1">{conversation.title}</h4>
                    <p className="text-xs text-muted-foreground">
                      Updated {new Date(conversation.updated_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewConversation(conversation)}
                      className="border-2 hover:scale-105 transition-all"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteConversation(conversation.id)}
                      className="border-2 hover:bg-destructive/10 hover:border-destructive/50 hover:scale-105 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Conversation Messages Dialog */}
      <Dialog open={isConversationDialogOpen} onOpenChange={setIsConversationDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold gradient-text">
              {selectedConversation?.title}
            </DialogTitle>
            <DialogDescription className="text-[15px]">
              View all messages in this conversation
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {conversationMessages.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground font-medium">No messages found</p>
              </div>
            ) : (
              conversationMessages.map((message) => (
                <div
                  key={message.id}
                  className={`p-4 rounded-xl border-2 ${
                    message.role === 'user'
                      ? 'bg-gradient-to-br from-accent/10 to-accent/5 border-accent/30 ml-8'
                      : 'bg-gradient-to-br from-card to-card/95 border-border/50 mr-8'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={message.role === 'user' ? 'default' : 'outline'} className="text-xs font-bold">
                      {message.role === 'user' ? 'User' : 'AI'}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(message.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{message.content}</p>
                  {message.images && message.images.length > 0 && (
                    <div className="flex gap-2 mt-3 flex-wrap">
                      {message.images.map((img, idx) => (
                        <img
                          key={idx}
                          src={`data:${img.mimeType};base64,${img.data}`}
                          alt={img.name}
                          className="w-24 h-24 object-cover rounded-lg border-2 border-border"
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Reset Confirmation Dialog */}
      <Dialog open={isResetConfirmOpen} onOpenChange={setIsResetConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-destructive/10 rounded-full">
                <AlertTriangle className="w-6 h-6 text-destructive" />
              </div>
              <DialogTitle className="text-2xl font-bold">Confirm Account Reset</DialogTitle>
            </div>
            <DialogDescription className="text-[15px] leading-relaxed">
              {resetType === 'all' && (
                <>
                  You are about to <span className="font-bold text-destructive">reset ALL user accounts</span> (except admins).
                  This will permanently delete:
                  <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                    <li>All conversations</li>
                    <li>All messages</li>
                    <li>All chat history</li>
                  </ul>
                  <p className="mt-3 font-semibold">User profiles, plans, and roles will be preserved.</p>
                </>
              )}
              {resetType === 'single' && (
                <>
                  You are about to <span className="font-bold text-destructive">reset this user's account</span>.
                  This will permanently delete:
                  <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                    <li>All conversations</li>
                    <li>All messages</li>
                    <li>All chat history</li>
                  </ul>
                  <p className="mt-3 font-semibold">User profile, plan, and role will be preserved.</p>
                </>
              )}
              {resetType === 'multiple' && (
                <>
                  You are about to <span className="font-bold text-destructive">reset {selectedUserIds.length} user account(s)</span>.
                  This will permanently delete:
                  <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                    <li>All conversations</li>
                    <li>All messages</li>
                    <li>All chat history</li>
                  </ul>
                  <p className="mt-3 font-semibold">User profiles, plans, and roles will be preserved.</p>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => setIsResetConfirmOpen(false)}
              className="flex-1 border-2"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmReset}
              className="flex-1"
            >
              Continue
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reset Message Dialog */}
      <Dialog open={isResetMessageOpen} onOpenChange={setIsResetMessageOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold gradient-text">Message for Users</DialogTitle>
            <DialogDescription className="text-[15px]">
              Enter a message that will be displayed to affected users when they log in.
              This helps them understand why their account was reset.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-semibold mb-2 block">Reset Notification Message</label>
              <Textarea
                value={resetMessage}
                onChange={(e) => setResetMessage(e.target.value)}
                placeholder="Example: Your account has been reset due to system maintenance. Your profile and plan remain unchanged. Please start a new conversation to continue using Flash AI."
                rows={6}
                className="border-2 resize-none"
              />
              <p className="text-xs text-muted-foreground mt-2">
                {resetMessage.length} characters
              </p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg border-2 border-border/50">
              <p className="text-sm font-semibold mb-2">Preview:</p>
              <p className="text-sm text-muted-foreground">
                {resetMessage || 'Your message will appear here...'}
              </p>
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setIsResetMessageOpen(false);
                setResetMessage('');
              }}
              className="flex-1 border-2"
              disabled={isResetting}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={handleExecuteReset}
              className="flex-1"
              disabled={isResetting || !resetMessage.trim()}
            >
              {isResetting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Resetting...
                </>
              ) : (
                <>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset Accounts
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation Dialog */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="w-16 h-16 rounded-2xl bg-destructive/20 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>
            <DialogTitle className="text-2xl text-center text-destructive">
              {accountAction === 'delete' ? 'Delete User Account?' : 'Disable User Account?'}
            </DialogTitle>
            <DialogDescription className="text-center text-[15px] space-y-3 pt-2">
              <p className="font-semibold text-foreground">
                {accountAction === 'delete'
                  ? 'This action is permanent and cannot be undone!'
                  : 'This account will be blocked from signing in until re-enabled by an administrator.'}
              </p>
              {accountAction === 'delete' && <>
              <p>Deleting this user account will permanently remove:</p>
              <ul className="text-left space-y-2 bg-muted/50 p-4 rounded-xl">
                <li className="flex items-start gap-2">
                  <span className="text-destructive mt-0.5">•</span>
                  <span>All conversations and chat history</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive mt-0.5">•</span>
                  <span>User profile and account settings</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive mt-0.5">•</span>
                  <span>Subscription and payment history</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive mt-0.5">•</span>
                  <span>All associated data and preferences</span>
                </li>
              </ul>
              </>}
              {deleteUserId && (
                <p className="font-semibold text-foreground pt-2">
                  User: <span className="text-primary">
                    {profiles.find(p => p.id === deleteUserId)?.username || 
                     profiles.find(p => p.id === deleteUserId)?.email || 
                     'Unknown User'}
                  </span>
                </p>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">
                Reason for {accountAction === 'delete' ? 'Deletion' : 'Disabling'} <span className="text-destructive">*</span>
              </label>
              <Textarea
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder={`Enter the reason for ${accountAction === 'delete' ? 'deleting' : 'disabling'} this account...`}
                className="min-h-[100px] border-2 rounded-xl text-[15px]"
                disabled={isDeleting}
              />
              <p className="text-xs text-muted-foreground">
                This reason is recorded in the audit log and emailed to the user.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-col gap-2">
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isDeleting || !deleteReason.trim()}
              className="w-full gap-2"
            >
              {isDeleting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {accountAction === 'delete' ? 'Deleting Account...' : 'Disabling Account...'}
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  {accountAction === 'delete' ? 'Delete Account' : 'Disable Account'}
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteConfirmOpen(false);
                setDeleteUserId(null);
                setDeleteReason('');
              }}
              disabled={isDeleting}
              className="w-full"
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Credit Adjustment Dialog */}
      <Dialog open={isCreditDialogOpen} onOpenChange={setIsCreditDialogOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
          <DialogHeader>
            <DialogTitle className="gradient-text">Adjust User Credits</DialogTitle>
            <DialogDescription>
              Enter a positive number to add credits, negative to deduct.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Amount</label>
              <Input
                type="number"
                placeholder="e.g. 500 or -100"
                value={creditAdjustAmount}
                onChange={(e) => setCreditAdjustAmount(e.target.value)}
                className="h-10"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Positive = add credits &nbsp;·&nbsp; Negative = deduct credits
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Note (optional)</label>
              <Input
                placeholder="Reason for adjustment"
                value={creditAdjustNote}
                onChange={(e) => setCreditAdjustNote(e.target.value)}
                className="h-10"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1 h-10"
                onClick={() => setIsCreditDialogOpen(false)}
                disabled={isAdjustingCredits}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 h-10"
                onClick={handleAdjustCredits}
                disabled={isAdjustingCredits || !creditAdjustAmount}
              >
                {isAdjustingCredits ? (
                  <Activity className="w-4 h-4 mr-2 animate-spin" />
                ) : parseInt(creditAdjustAmount || '0') >= 0 ? (
                  <PlusCircle className="w-4 h-4 mr-2" />
                ) : (
                  <MinusCircle className="w-4 h-4 mr-2" />
                )}
                {parseInt(creditAdjustAmount || '0') >= 0 ? 'Add Credits' : 'Deduct Credits'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── OffersPanel ─────────────────────────────────────────────────────────────

interface Offer {
  id: string;
  code: string;
  label: string;
  discount: number;         // 0–100 (100 = free)
  applicablePlans: string[];
  maxUses: number | null;   // null = unlimited
  usedCount: number;
  expiresAt: string | null; // ISO date or null
  active: boolean;
  createdAt: number;
}

const EMPTY_OFFER: Omit<Offer, 'id' | 'usedCount' | 'createdAt'> = {
  code: '',
  label: '',
  discount: 100,
  applicablePlans: ['hero', 'pro', 'business'],
  maxUses: null,
  expiresAt: null,
  active: true,
};

const LS_KEY = 'ai_admin_offers';
function loadOffers(): Offer[] {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); } catch { return []; }
}
function saveOffers(offers: Offer[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(offers));
}

function OffersPanel({ profiles, onRefresh }: { profiles?: Profile[]; onRefresh?: () => Promise<void> }) {
  const [promos, setPromos] = useState<PromoCode[]>(() => promoService.getPromos());
  const [banner, setBanner] = useState<SiteBanner>(() => promoService.getBanner());
  
  // Direct grant state
  const [grantEmail, setGrantEmail] = useState('');
  const [grantTier, setGrantTier] = useState<'pro' | 'plus'>('pro');
  const [isGranting, setIsGranting] = useState(false);

  // Custom offer dialog state
  const [customCode, setCustomCode] = useState('');
  const [customLabel, setCustomLabel] = useState('');
  const [customReward, setCustomReward] = useState<PromoCode['rewardType']>('pro_1m');
  const [customMaxUses, setCustomMaxUses] = useState('100');
  const [customDays, setCustomDays] = useState('30');
  const [dialogOpen, setDialogOpen] = useState(false);

  const refreshPromos = () => {
    setPromos([...promoService.getPromos()]);
  };

  const handleGeneratePreset = (type: 'pro_1m' | 'plus_1m' | 'credits_500') => {
    const prefixMap = {
      pro_1m: 'FREEPRO',
      plus_1m: 'FREEPLUS',
      credits_500: 'CREDITS',
    };
    const labelMap = {
      pro_1m: '1 Month Free Pro Plan (Special Offer)',
      plus_1m: '1 Month Free Plus Plan (Special Offer)',
      credits_500: '500 Free AI Generation Credits',
    };
    const code = promoService.generateRandomCode(prefixMap[type]);
    promoService.createPromo({
      code,
      rewardType: type,
      rewardLabel: labelMap[type],
      description: `Automated ${labelMap[type]} generated from Admin Dashboard`,
      maxRedemptions: 100,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      isActive: true,
    });
    refreshPromos();
    toast.success(`Generated Code: ${code}! Ready for users to redeem.`);
  };

  const handleCreateCustom = () => {
    if (!customCode.trim()) {
      toast.error('Please enter a promo code');
      return;
    }
    const days = parseInt(customDays, 10) || 30;
    const maxUses = parseInt(customMaxUses, 10) || 100;
    const labelMap: Record<PromoCode['rewardType'], string> = {
      pro_1m: '1 Month Free Pro Plan',
      plus_1m: '1 Month Free Plus Plan',
      credits_500: '500 Bonus AI Credits',
      free_lifetime: '100% Free Lifetime Pro Access',
    };

    promoService.createPromo({
      code: customCode.trim().toUpperCase(),
      rewardType: customReward,
      rewardLabel: customLabel.trim() || labelMap[customReward],
      description: customLabel.trim() || labelMap[customReward],
      maxRedemptions: maxUses,
      expiresAt: new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString(),
      isActive: true,
    });
    refreshPromos();
    setDialogOpen(false);
    setCustomCode('');
    setCustomLabel('');
    toast.success(`Promo Code ${customCode.toUpperCase()} created successfully!`);
  };

  const handleTogglePromo = (id: string) => {
    promoService.togglePromoStatus(id);
    refreshPromos();
  };

  const handleDeletePromo = (id: string) => {
    promoService.deletePromo(id);
    refreshPromos();
    toast.success('Promo code deleted');
  };

  const handleSaveBanner = () => {
    promoService.saveBanner(banner);
    toast.success('Site-wide announcement banner updated!');
  };

  const handleDirectGrant = async () => {
    const target = grantEmail.trim().toLowerCase();
    if (!target) {
      toast.error('Please enter a user email or username');
      return;
    }
    setIsGranting(true);
    try {
      const matched = profiles?.find(p => p.email?.toLowerCase() === target || p.username?.toLowerCase() === target);
      if (matched) {
        await profilesApi.updateUserPlan(matched.id, grantTier as PlanType);
      }
      promoService.grantUserFreeMonth(target, grantTier);
      toast.success(`Successfully granted 1 Month Free ${grantTier.toUpperCase()} to ${target}!`);
      setGrantEmail('');
      if (onRefresh) await onRefresh();
    } catch {
      toast.error('Failed to grant subscription. Please try again.');
    } finally {
      setIsGranting(false);
    }
  };

  if (promos.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Promotional codes disabled</CardTitle>
          <CardDescription>
            Promo-code redemption and free subscription grants have been removed. Manage paid plans from User Management.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── 1. Instant Preset Offer Generators ── */}
      <Card className="border-2 border-border/50 bg-gradient-to-br from-card to-card/95 shadow-xl rounded-2xl">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <Gift className="w-5 h-5 text-primary" />
                <span>Quick Promo &amp; Offer Generator</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Instantly release 1-month free subscription codes, credits, or custom offers
              </CardDescription>
            </div>
            <Button
              onClick={() => setDialogOpen(true)}
              className="h-9 px-3 text-xs rounded-xl bg-primary text-primary-foreground gap-1.5 shrink-0"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Custom Code</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleGeneratePreset('pro_1m')}
              className="h-16 rounded-xl border-border/70 hover:border-primary/60 hover:bg-primary/5 flex flex-col items-start justify-center p-3 text-left transition-all group"
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-foreground group-hover:text-primary">
                <Crown className="w-4 h-4 text-amber-500" />
                <span>+ 1 Month Free Pro</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">30 days all models &amp; full effort</p>
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => handleGeneratePreset('plus_1m')}
              className="h-16 rounded-xl border-border/70 hover:border-primary/60 hover:bg-primary/5 flex flex-col items-start justify-center p-3 text-left transition-all group"
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-foreground group-hover:text-primary">
                <Sparkles className="w-4 h-4 text-primary" />
                <span>+ 1 Month Free Plus</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">30 days fast Flash F1-F6 models</p>
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => handleGeneratePreset('credits_500')}
              className="h-16 rounded-xl border-border/70 hover:border-primary/60 hover:bg-primary/5 flex flex-col items-start justify-center p-3 text-left transition-all group"
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-foreground group-hover:text-primary">
                <Zap className="w-4 h-4 text-emerald-500" />
                <span>+ 500 Free AI Credits</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">Instant credit boost for images &amp; chats</p>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── 2. Direct 1-Month Free Subscription Grant Tool ── */}
      <Card className="border-2 border-border/50 bg-gradient-to-br from-card to-card/95 shadow-xl rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Crown className="w-4 h-4 text-amber-500" />
            <span>Direct 1-Month Free Subscription Grant</span>
          </CardTitle>
          <CardDescription className="text-xs">
            Directly upgrade a specific user to 1 Month Free Pro or Plus without a coupon code
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="flex-1 w-full">
              <Input
                placeholder="Enter user email or username (e.g. user@example.com)..."
                value={grantEmail}
                onChange={(e) => setGrantEmail(e.target.value)}
                className="h-10 rounded-xl text-xs"
              />
            </div>
            <div className="w-full sm:w-40 shrink-0">
              <Select value={grantTier} onValueChange={(v) => setGrantTier(v as 'pro' | 'plus')}>
                <SelectTrigger className="h-10 rounded-xl text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pro">Pro (1 Month Free)</SelectItem>
                  <SelectItem value="plus">Plus (1 Month Free)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleDirectGrant}
              disabled={isGranting || !grantEmail.trim()}
              className="h-10 px-4 text-xs font-semibold rounded-xl bg-gradient-to-r from-primary to-accent text-white shadow-sm w-full sm:w-auto shrink-0"
            >
              {isGranting ? 'Granting...' : 'Grant 1-Month Free 🎁'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── 3. Site-Wide Announcement Banner Manager ── */}
      <Card className="border-2 border-border/50 bg-gradient-to-br from-card to-card/95 shadow-xl rounded-2xl">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span>Site-Wide Offer Banner in Chat</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Broadcast special offers, free trial codes, or announcements at the top of the user chat
              </CardDescription>
            </div>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <Checkbox
                checked={banner.isActive}
                onCheckedChange={(checked) => setBanner(b => ({ ...b, isActive: !!checked }))}
              />
              <span className="text-xs font-semibold">{banner.isActive ? 'Banner Active' : 'Disabled'}</span>
            </label>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Badge Text</label>
              <Input
                value={banner.badge}
                onChange={(e) => setBanner(b => ({ ...b, badge: e.target.value }))}
                placeholder="🎉 SPECIAL OFFER"
                className="h-9 text-xs rounded-xl"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Action Button Text</label>
              <Input
                value={banner.actionText}
                onChange={(e) => setBanner(b => ({ ...b, actionText: e.target.value }))}
                placeholder="Redeem FREE30PRO"
                className="h-9 text-xs rounded-xl"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Auto-Fill Code</label>
              <Input
                value={banner.actionCode || ''}
                onChange={(e) => setBanner(b => ({ ...b, actionCode: e.target.value }))}
                placeholder="FREE30PRO"
                className="h-9 text-xs rounded-xl font-mono uppercase"
              />
            </div>
          </div>
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Banner Headline</label>
            <Input
              value={banner.text}
              onChange={(e) => setBanner(b => ({ ...b, text: e.target.value }))}
              placeholder="Get 1 Month of Pro Plan for FREE! Use code at checkout or redeem now:"
              className="h-9 text-xs rounded-xl"
            />
          </div>
          <div className="flex justify-end pt-1">
            <Button
              onClick={handleSaveBanner}
              size="sm"
              className="h-8 px-4 text-xs font-semibold rounded-xl"
            >
              Save &amp; Update Banner
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── 4. Active Promo Codes Table ── */}
      <Card className="border-2 border-border/50 bg-gradient-to-br from-card to-card/95 shadow-xl rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold">Active Promo Codes &amp; Vouchers</CardTitle>
          <CardDescription className="text-xs">
            Review existing codes, tracked redemption counts, expiration dates, and active statuses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs whitespace-nowrap">
              <thead className="bg-muted/40">
                <tr>
                  <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Code</th>
                  <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Reward</th>
                  <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Redeemed</th>
                  <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Expires</th>
                  <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Status</th>
                  <th className="text-right px-3 py-2 font-semibold text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {promos.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/20">
                    <td className="px-3 py-2.5 font-mono font-bold text-primary">{p.code}</td>
                    <td className="px-3 py-2.5 text-foreground font-medium">{p.rewardLabel}</td>
                    <td className="px-3 py-2.5">
                      <span className="font-semibold text-foreground">{p.currentRedemptions}</span>
                      <span className="text-muted-foreground">/{p.maxRedemptions}</span>
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground">
                      {new Date(p.expiresAt).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-2.5">
                      <button
                        onClick={() => handleTogglePromo(p.id)}
                        className={`px-2 py-0.5 rounded-full font-semibold text-[10px] border ${
                          p.isActive
                            ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30'
                            : 'bg-muted text-muted-foreground border-border'
                        }`}
                      >
                        {p.isActive ? 'Active' : 'Paused'}
                      </button>
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeletePromo(p.id)}
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Custom Promo Code Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Create Custom Offer Code</DialogTitle>
            <DialogDescription className="text-xs">
              Configure code name, reward type, validity duration, and redemption limit
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3.5 py-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold">Promo Code Name *</label>
              <Input
                placeholder="e.g. SUMMERPRO, FREEVIP"
                value={customCode}
                onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
                className="h-9 text-xs font-mono uppercase rounded-xl"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold">Reward Offer</label>
              <Select value={customReward} onValueChange={(v) => setCustomReward(v as PromoCode['rewardType'])}>
                <SelectTrigger className="h-9 text-xs rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pro_1m">1 Month Free Pro Plan (All Models)</SelectItem>
                  <SelectItem value="plus_1m">1 Month Free Plus Plan (Fast Flash)</SelectItem>
                  <SelectItem value="credits_500">+500 Bonus AI Credits</SelectItem>
                  <SelectItem value="free_lifetime">100% Free Lifetime Pro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold">Custom Label / Description</label>
              <Input
                placeholder="e.g. Exclusive Creator 1-Month Pro Access"
                value={customLabel}
                onChange={(e) => setCustomLabel(e.target.value)}
                className="h-9 text-xs rounded-xl"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold">Max Uses</label>
                <Input
                  type="number"
                  placeholder="100"
                  value={customMaxUses}
                  onChange={(e) => setCustomMaxUses(e.target.value)}
                  className="h-9 text-xs rounded-xl"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold">Valid For (Days)</label>
                <Input
                  type="number"
                  placeholder="30"
                  value={customDays}
                  onChange={(e) => setCustomDays(e.target.value)}
                  className="h-9 text-xs rounded-xl"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button size="sm" onClick={handleCreateCustom} className="rounded-xl">
              Create Offer Code
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
