import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Key, Plus, Trash2, Copy, Check, Eye, EyeOff,
  ArrowLeft, BarChart2, Zap, RefreshCw, AlertTriangle,
  Activity, Clock, Shield, Code, ChevronRight, Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { useAuth } from '@/components/auth/AuthProvider';
import { apiKeysApi, apiUsageApi, creditsApi } from '@/db/api';
import type { ApiKey, ApiUsage, CreditsLedger } from '@/types/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// API per-call credit pricing
const API_CREDIT_PRICING = [
  { action: 'Chat message (Flash)', credits: 1, icon: '⚡', note: 'Default model' },
  { action: 'Chat message (Accure)', credits: 3, icon: '🔮', note: 'Pro/Business only' },
  { action: 'API request (Flash)', credits: 2, icon: '🔌', note: '2× for API calls' },
  { action: 'API request (Accure)', credits: 5, icon: '🔮', note: 'Pro/Business only' },
  { action: 'Image generation', credits: 10, icon: '🎨', note: 'Gemini 2.0 Flash' },
  { action: 'Video generation (5s)', credits: 50, icon: '🎬', note: 'Kling AI + sound' },
  { action: 'Video generation (10s)', credits: 100, icon: '🎬', note: 'Kling AI + sound' },
  { action: 'Video generation (15s)', credits: 150, icon: '🎬', note: 'Kling AI + sound' },
];

// 3-tier API subscription plans
const API_PLANS = [
  {
    id: 'starter',
    name: 'Starter API',
    tagline: 'Build & prototype',
    monthlyCredits: 5000,
    monthlyPrice: '₹1,499',
    monthlyPriceNum: 1499,
    annualPrice: '₹999',
    rateLimit: '30 req/min',
    rpd: '2,000/day',
    maxTokens: '32,768',
    models: ['Flash'],
    features: [
      '5,000 API credits/month',
      'Flash model only',
      '30 req/min rate limit',
      '32,768 max tokens/call',
      'SSE streaming support',
      'REST + JSON API',
      'Community support',
    ],
    popular: false,
    color: 'border-border',
    badge: null,
  },
  {
    id: 'pro',
    name: 'Pro API',
    tagline: 'Scale your product',
    monthlyCredits: 25000,
    monthlyPrice: '₹4,999',
    monthlyPriceNum: 4999,
    annualPrice: '₹3,499',
    rateLimit: '60 req/min',
    rpd: '10,000/day',
    maxTokens: '65,536',
    models: ['Flash', 'Accure'],
    features: [
      '25,000 API credits/month',
      'Flash + Accure models',
      '60 req/min rate limit',
      '65,536 max tokens/call',
      'SSE streaming support',
      'Batch request support',
      'Priority queue',
      'Email support (48h SLA)',
    ],
    popular: true,
    color: 'border-primary',
    badge: 'Most Popular',
  },
  {
    id: 'enterprise',
    name: 'Enterprise API',
    tagline: 'Unlimited at scale',
    monthlyCredits: -1,
    monthlyPrice: '₹12,999',
    monthlyPriceNum: 12999,
    annualPrice: '₹9,999',
    rateLimit: '200 req/min',
    rpd: 'Unlimited',
    maxTokens: '65,536',
    models: ['Flash', 'Accure'],
    features: [
      'Unlimited API credits',
      'Flash + Accure models',
      '200 req/min rate limit',
      '65,536 max tokens/call',
      'SSE streaming support',
      'Batch request support',
      'Dedicated queue',
      '10 API key seats',
      'Priority support (24h SLA)',
      'Custom rate-limit negotiation',
    ],
    popular: false,
    color: 'border-accent/60',
    badge: '🏆 Best Value',
  },
];

function formatDate(s: string) {
  return new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function UsageChart({ usage }: { usage: ApiUsage[] }) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().slice(0, 10);
  });
  const counts = days.map(day => ({
    label: new Date(day).toLocaleDateString('en-US', { weekday: 'short' }),
    count: usage.filter(u => u.created_at.slice(0, 10) === day).length,
    credits: usage.filter(u => u.created_at.slice(0, 10) === day).reduce((s, u) => s + (u.credits_used || 0), 0),
  }));
  const maxCount = Math.max(...counts.map(c => c.count), 1);

  return (
    <div className="flex items-end gap-1.5 h-20 w-full">
      {counts.map((c, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div
            className="w-full rounded-t-md bg-primary/70 transition-all duration-500 min-h-[2px]"
            style={{ height: `${(c.count / maxCount) * 64}px` }}
          />
          <span className="text-[10px] text-muted-foreground">{c.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function ApiKeys() {
  const navigate = useNavigate();
  const { profile } = useAuth();

  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [usage, setUsage] = useState<ApiUsage[]>([]);
  const [apiUsage, setApiUsage] = useState<ApiUsage[]>([]); // source='api' only
  const [ledger, setLedger] = useState<CreditsLedger[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newKeyName, setNewKeyName] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);


  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setIsLoading(true);
    const [ks, us, ld] = await Promise.all([
      apiKeysApi.getKeys(),
      apiUsageApi.getUsage(30),
      creditsApi.getLedger(50),
    ]);
    setKeys(ks);
    setUsage(us);
    // Filter only API-source usage for credits tab
    setApiUsage(us.filter(u => u.source === 'api'));
    setLedger(ld);
    setIsLoading(false);
  };

  const handleCreate = async () => {
    if (!newKeyName.trim()) return;
    setIsCreating(true);
    const result = await apiKeysApi.createKey(newKeyName.trim());
    setIsCreating(false);
    if (!result) { toast.error('Failed to create API key'); return; }
    setGeneratedKey(result.fullKey);
    setKeys(prev => [result.key, ...prev]);
    setNewKeyName('');
    toast.success('API key created!');
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const ok = await apiKeysApi.deleteKey(deleteId);
    if (ok) { setKeys(prev => prev.filter(k => k.id !== deleteId)); toast.success('API key deleted'); }
    else toast.error('Failed to delete API key');
    setDeleteId(null);
  };

  const handleRevoke = async (id: string) => {
    const ok = await apiKeysApi.revokeKey(id);
    if (ok) { setKeys(prev => prev.map(k => k.id === id ? { ...k, is_active: false } : k)); toast.success('API key revoked'); }
    else toast.error('Failed to revoke key');
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
    toast.success('Copied to clipboard');
  };

  // Stats — use all usage for call counts, apiUsage for API-specific credits
  const totalRequests = usage.length;
  const todayRequests = usage.filter(u => u.created_at.slice(0, 10) === new Date().toISOString().slice(0, 10)).length;
  const apiCreditsUsed = apiUsage.reduce((s, u) => s + (u.credits_used || 0), 0);
  const avgResponseMs = usage.filter(u => u.response_ms).reduce((s, u, _, a) => s + (u.response_ms || 0) / a.length, 0);

  const canUseAPI = profile?.plan === 'pro' || profile?.plan === 'business' || profile?.role === 'admin';
  const currentCredits = profile?.credits || 0;
  const isLowCredits = currentCredits < 50;

  if (!canUseAPI) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-8 pb-8">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Key className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-bold mb-2 text-balance">API Access Required</h2>
            <p className="text-muted-foreground text-sm mb-6 text-pretty">
              API access is available on <strong>Pro</strong> and <strong>Business</strong> plans. Upgrade to start building with Flash AI.
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => navigate('/')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>
              <Button onClick={() => navigate('/plans')}>
                View Plans
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            <span className="hidden sm:inline">Back</span>
          </Button>
          <Separator orientation="vertical" className="h-5" />
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Key className="w-4 h-4 text-primary flex-shrink-0" />
            <span className="font-semibold text-sm">API Keys & Usage</span>
          </div>
          <div className="flex items-center gap-2">
            {/* API credits badge — only on this page */}
            <Badge
              variant="outline"
              className={cn(
                'hidden sm:flex items-center gap-1.5 px-3 py-1',
                isLowCredits && 'border-destructive/60 text-destructive bg-destructive/10'
              )}
            >
              <Zap className={cn('w-3 h-3', isLowCredits ? 'text-destructive' : 'text-primary')} />
              <span className="text-xs font-semibold">{currentCredits.toLocaleString()} credits</span>
              {isLowCredits && <AlertTriangle className="w-3 h-3 ml-0.5" />}
            </Badge>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">

        {/* Low credits warning */}
        {isLowCredits && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/30">
            <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0" />
            <p className="text-sm text-destructive font-medium flex-1 min-w-0">
              Low API credits ({currentCredits} remaining). Your API calls may be blocked soon.
            </p>
            <Button size="sm" variant="destructive" onClick={() => navigate('/plans')} className="flex-shrink-0">
              Buy Credits
            </Button>
          </div>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Total Requests', value: totalRequests.toLocaleString(), icon: Activity, color: 'text-primary' },
            { label: 'Today', value: todayRequests.toLocaleString(), icon: Clock, color: 'text-green-500' },
            { label: 'API Credits Used', value: apiCreditsUsed.toLocaleString(), icon: Zap, color: 'text-yellow-500' },
            { label: 'Avg Response', value: avgResponseMs > 0 ? `${Math.round(avgResponseMs)}ms` : '—', icon: BarChart2, color: 'text-blue-500' },
          ].map(stat => (
            <Card key={stat.label} className="h-full">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <stat.icon className={cn('w-4 h-4', stat.color)} />
                  <span className="text-xs text-muted-foreground">{stat.label}</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{isLoading ? '—' : stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="keys">
          <TabsList className="mb-4 flex-wrap h-auto gap-1">
            <TabsTrigger value="keys"><Key className="w-3.5 h-3.5 mr-1.5" />API Keys</TabsTrigger>
            <TabsTrigger value="usage"><BarChart2 className="w-3.5 h-3.5 mr-1.5" />Usage</TabsTrigger>
            <TabsTrigger value="credits"><Zap className="w-3.5 h-3.5 mr-1.5" />Credits</TabsTrigger>
            <TabsTrigger value="plans"><Calendar className="w-3.5 h-3.5 mr-1.5" />API Plans</TabsTrigger>
            <TabsTrigger value="docs"><Code className="w-3.5 h-3.5 mr-1.5" />Docs</TabsTrigger>
          </TabsList>

          {/* ── API KEYS TAB ── */}
          <TabsContent value="keys" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold">Your API Keys</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Keys grant access to the Flash AI API. Keep them secret.</p>
              </div>
              <Button size="sm" onClick={() => setShowCreateDialog(true)} disabled={keys.length >= 5}>
                <Plus className="w-4 h-4 mr-1.5" />New Key
              </Button>
            </div>

            {isLoading ? (
              <div className="space-y-3">{[1, 2].map(i => <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />)}</div>
            ) : keys.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-12 text-center">
                  <Key className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-sm font-medium">No API keys yet</p>
                  <p className="text-xs text-muted-foreground mt-1 mb-4">Create your first key to start using the API</p>
                  <Button size="sm" onClick={() => setShowCreateDialog(true)}>
                    <Plus className="w-4 h-4 mr-1.5" />Create Key
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {keys.map(k => (
                  <Card key={k.id} className={cn('transition-all', !k.is_active && 'opacity-60')}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm truncate">{k.name}</span>
                            <Badge variant={k.is_active ? 'default' : 'secondary'} className="text-[10px] px-1.5 py-0">
                              {k.is_active ? 'Active' : 'Revoked'}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                            <code className="text-xs text-muted-foreground font-mono bg-muted px-2 py-0.5 rounded">{k.key_prefix}</code>
                            <span className="text-xs text-muted-foreground">Created {formatDate(k.created_at)}</span>
                            {k.last_used_at && <span className="text-xs text-muted-foreground">Last used {formatDate(k.last_used_at)}</span>}
                            <span className="text-xs text-muted-foreground">{k.total_requests.toLocaleString()} requests</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {k.is_active && (
                            <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground hover:text-foreground" onClick={() => handleRevoke(k.id)}>
                              <Shield className="w-3.5 h-3.5 mr-1" /><span className="hidden sm:inline">Revoke</span>
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" className="h-8 text-xs text-destructive hover:text-destructive" onClick={() => setDeleteId(k.id)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground flex-shrink-0">Rate limit</span>
                        <Progress value={Math.min((k.total_requests / 10000) * 100, 100)} className="h-1 flex-1" />
                        <span className="text-[10px] text-muted-foreground flex-shrink-0">{k.rate_limit_per_min} req/min</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ── USAGE TAB ── */}
          <TabsContent value="usage" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">7-Day Request Volume</CardTitle>
                <CardDescription className="text-xs">Daily API calls over the past week</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? <div className="h-20 bg-muted animate-pulse rounded-lg" /> : <UsageChart usage={usage} />}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm">Recent Requests</CardTitle>
                  <CardDescription className="text-xs">Last 30 days</CardDescription>
                </div>
                <Button variant="ghost" size="sm" className="h-8" onClick={loadData}>
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5" />Refresh
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/50 border-b border-border">
                      <tr>
                        {['Model', 'In Tokens', 'Out Tokens', 'Credits', 'Source', 'Latency', 'Time'].map(h => (
                          <th key={h} className="px-4 py-2.5 text-left font-semibold text-muted-foreground whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {isLoading ? (
                        <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">Loading…</td></tr>
                      ) : usage.length === 0 ? (
                        <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">No usage yet. Make your first API call.</td></tr>
                      ) : (
                        usage.slice(0, 50).map(log => (
                          <tr key={log.id} className="border-b border-border/50 hover:bg-muted/20">
                            <td className="px-4 py-2.5"><Badge variant="outline" className="text-[10px]">{log.model}</Badge></td>
                            <td className="px-4 py-2.5 tabular-nums whitespace-nowrap">{(log.input_tokens || 0).toLocaleString()}</td>
                            <td className="px-4 py-2.5 tabular-nums whitespace-nowrap">{(log.output_tokens || 0).toLocaleString()}</td>
                            <td className="px-4 py-2.5 font-semibold text-primary whitespace-nowrap">{log.credits_used}</td>
                            <td className="px-4 py-2.5 whitespace-nowrap">
                              <Badge variant={log.source === 'api' ? 'default' : 'secondary'} className="text-[10px]">{log.source || 'chat'}</Badge>
                            </td>
                            <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">{log.response_ms ? `${log.response_ms}ms` : '—'}</td>
                            <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">
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

          {/* ── CREDITS TAB (API only) ── */}
          <TabsContent value="credits" className="space-y-4">
            {/* Current API credit balance */}
            <Card className={cn('border-2', isLowCredits ? 'border-destructive/40' : 'border-primary/20')}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', isLowCredits ? 'bg-destructive/10' : 'bg-primary/10')}>
                      <Zap className={cn('w-6 h-6', isLowCredits ? 'text-destructive' : 'text-primary')} />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">API Credit Balance</p>
                      <p className={cn('text-3xl font-bold', isLowCredits ? 'text-destructive' : 'text-foreground')}>
                        {currentCredits.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <Button size="sm" onClick={() => navigate('/plans')} variant={isLowCredits ? 'destructive' : 'default'}>
                    <Plus className="w-4 h-4 mr-1.5" />Add Credits
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">API Credits Used (30d)</p>
                    <p className="text-lg font-bold text-foreground">{apiCreditsUsed.toLocaleString()}</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">Total API Requests</p>
                    <p className="text-lg font-bold text-foreground">{apiUsage.length.toLocaleString()}</p>
                  </div>
                </div>
                {isLowCredits && (
                  <div className="mt-4 flex items-center gap-2 text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    Running low on API credits. Add credits to avoid service interruption.
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Credit cost table */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">API Credit Costs</CardTitle>
                <CardDescription className="text-xs">Credits consumed per API operation</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {API_CREDIT_PRICING.map(item => (
                    <div key={item.action} className="flex items-center justify-between py-2.5 border-b border-border/50 last:border-b-0">
                      <div className="flex items-center gap-2.5">
                        <span className="text-base">{item.icon}</span>
                        <span className="text-sm text-foreground">{item.action}</span>
                      </div>
                      <Badge variant="outline" className="font-mono text-xs">{item.credits} cr</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Credit ledger */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Credit History</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="p-4 space-y-2">{[1,2,3].map(i => <div key={i} className="h-10 rounded bg-muted animate-pulse" />)}</div>
                ) : ledger.length === 0 ? (
                  <div className="p-6 text-center text-sm text-muted-foreground">No credit history yet</div>
                ) : (
                  <div className="divide-y divide-border/50">
                    {ledger.map(entry => (
                      <div key={entry.id} className="flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{entry.description || entry.type}</p>
                          <p className="text-[10px] text-muted-foreground">{formatDate(entry.created_at)}</p>
                        </div>
                        <div className="text-right flex-shrink-0 ml-4">
                          <p className={cn('text-sm font-semibold', entry.amount > 0 ? 'text-green-500' : 'text-foreground')}>
                            {entry.amount > 0 ? '+' : ''}{entry.amount}
                          </p>
                          <p className="text-[10px] text-muted-foreground">{entry.balance_after} bal</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── API PLANS TAB — 3-tier pricing ── */}
          <TabsContent value="plans" className="space-y-8">

            {/* Hero header */}
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-foreground text-balance">Simple, transparent API pricing</h2>
              <p className="text-sm text-muted-foreground text-pretty max-w-lg mx-auto">
                Pay per month, cancel anytime. All plans include SSE streaming, REST API access, and Gemini-powered models.
              </p>
            </div>

            {/* 3-tier plan cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {API_PLANS.map(plan => {
                const isCurrentPlan = profile?.plan === plan.id;
                return (
                  <Card
                    key={plan.id}
                    className={cn(
                      'relative flex flex-col h-full transition-all hover:shadow-xl',
                      `border-2 ${plan.color}`,
                      isCurrentPlan && 'ring-2 ring-primary/30'
                    )}
                  >
                    {plan.badge && (
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
                        <Badge className={cn(
                          'text-[11px] px-3 py-0.5 shadow-sm',
                          plan.popular ? 'bg-primary text-primary-foreground' : 'bg-accent text-accent-foreground'
                        )}>
                          {plan.badge}
                        </Badge>
                      </div>
                    )}

                    <CardHeader className="pb-3 pt-6">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{plan.tagline}</p>
                      <CardTitle className="text-lg font-bold mt-0.5">{plan.name}</CardTitle>
                      <div className="flex items-baseline gap-1 mt-2">
                        <span className="text-3xl font-extrabold text-foreground">{plan.monthlyPrice}</span>
                        <span className="text-sm text-muted-foreground">/month</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {plan.annualPrice}/mo billed annually <Badge variant="outline" className="text-[10px] px-1.5 ml-1">Save ~30%</Badge>
                      </p>
                    </CardHeader>

                    <CardContent className="flex-1 flex flex-col gap-4 pt-0">
                      {/* Credits callout */}
                      <div className={cn(
                        'flex items-center gap-2 px-3 py-2.5 rounded-xl',
                        plan.popular ? 'bg-primary/10 border border-primary/20' : 'bg-muted/60 border border-border/60'
                      )}>
                        <Zap className={cn('w-4 h-4 flex-shrink-0', plan.popular ? 'text-primary' : 'text-muted-foreground')} />
                        <span className={cn('text-sm font-semibold', plan.popular ? 'text-primary' : 'text-foreground')}>
                          {plan.monthlyCredits === -1 ? 'Unlimited credits' : `${plan.monthlyCredits.toLocaleString()} credits/mo`}
                        </span>
                      </div>

                      {/* Feature list */}
                      <ul className="space-y-2 flex-1">
                        {plan.features.map(f => (
                          <li key={f} className="flex items-start gap-2 text-sm text-foreground">
                            <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>

                      {/* Models chips */}
                      <div className="flex flex-wrap gap-1.5">
                        {plan.models.map(m => (
                          <Badge key={m} variant="secondary" className="text-[11px] px-2 py-0.5">{m}</Badge>
                        ))}
                      </div>

                      <Button
                        className="w-full h-10 mt-1"
                        variant={plan.popular ? 'default' : isCurrentPlan ? 'outline' : 'outline'}
                        onClick={() => navigate(`/payment?plan=${plan.id}&cycle=monthly`)}
                        disabled={isCurrentPlan}
                      >
                        {isCurrentPlan ? '✓ Current Plan' : `Get ${plan.name}`}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Per-call pricing table */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Credit Cost Per API Call</CardTitle>
                <CardDescription className="text-xs">
                  Credits are deducted per request. Buy additional credits any time from the Credits tab.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 border-b border-border">
                      <tr>
                        {['Action', 'Credits', 'Est. ₹ cost', 'Notes'].map(h => (
                          <th key={h} className="px-4 py-2.5 text-left font-semibold text-muted-foreground whitespace-nowrap text-xs">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {API_CREDIT_PRICING.map(item => {
                        // At Pro plan: ₹4999/25000cr ≈ ₹0.20/cr
                        const costPaise = (item.credits * 4999 / 25000).toFixed(3);
                        return (
                          <tr key={item.action} className="border-b border-border/40 hover:bg-muted/20 transition-colors last:border-b-0">
                            <td className="px-4 py-3 font-medium">
                              <span className="mr-2">{item.icon}</span>{item.action}
                            </td>
                            <td className="px-4 py-3">
                              <Badge variant="outline" className="font-mono text-xs tabular-nums">{item.credits} cr</Badge>
                            </td>
                            <td className="px-4 py-3 font-mono text-xs text-muted-foreground tabular-nums">
                              ₹{costPaise}
                            </td>
                            <td className="px-4 py-3 text-xs text-muted-foreground">{item.note}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Rate limits comparison */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Plan Comparison</CardTitle>
                <CardDescription className="text-xs">Rate limits, quotas and capabilities side-by-side</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/50 border-b border-border">
                      <tr>
                        {['Feature', 'Starter', 'Pro', 'Enterprise'].map(h => (
                          <th key={h} className="px-4 py-2.5 text-left font-semibold text-muted-foreground whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ['Monthly credits', '5,000', '25,000', 'Unlimited'],
                        ['Rate limit', '30 req/min', '60 req/min', '200 req/min'],
                        ['Daily requests', '2,000', '10,000', 'Unlimited'],
                        ['Max tokens/call', '32,768', '65,536', '65,536'],
                        ['Flash model', '✓', '✓', '✓'],
                        ['Accure model', '—', '✓', '✓'],
                        ['SSE streaming', '✓', '✓', '✓'],
                        ['Batch requests', '—', '✓', '✓'],
                        ['Priority queue', '—', '✓', '✓ Dedicated'],
                        ['API key seats', '1', '1', '10'],
                        ['Support SLA', 'Community', '48h email', '24h priority'],
                      ].map(([feature, ...vals]) => (
                        <tr key={feature} className="border-b border-border/40 hover:bg-muted/20 last:border-b-0">
                          <td className="px-4 py-2.5 font-medium text-foreground whitespace-nowrap">{feature}</td>
                          {vals.map((v, i) => (
                            <td key={i} className={cn(
                              'px-4 py-2.5 whitespace-nowrap',
                              v === '—' ? 'text-muted-foreground/50' : 'text-foreground',
                              v === 'Unlimited' || v?.toString().includes('Unlimited') ? 'font-semibold text-primary' : ''
                            )}>
                              {v}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── DOCS TAB ── */}
          <TabsContent value="docs" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quick Start</CardTitle>
                <CardDescription>Make your first API call in minutes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">Base URL</Label>
                  <code className="block bg-muted rounded-lg px-4 py-2.5 text-sm font-mono text-foreground break-all">
                    https://api-integrations.appmedo.com/app-7r35kmgp19mp/api-rLob8RdzAOl9/v1beta
                  </code>
                </div>
                <div>
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">Authentication</Label>
                  <code className="block bg-muted rounded-lg px-4 py-2.5 text-sm font-mono text-foreground">
                    Authorization: Bearer {'<'}your-api-key{'>'}
                  </code>
                </div>
                <Separator />
                <div>
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">Chat Completion (cURL)</Label>
                  <pre className="bg-muted rounded-xl px-4 py-3 text-xs font-mono overflow-x-auto text-foreground leading-6 whitespace-pre">{`curl -X POST \\
  "https://api-integrations.appmedo.com/.../v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer sk-..." \\
  -d '{
    "contents": [{ "role": "user", "parts": [{ "text": "Hello!" }] }],
    "generationConfig": { "maxOutputTokens": 8192, "temperature": 0.8 }
  }'`}</pre>
                </div>
                <div>
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">Available Models</Label>
                  <div className="space-y-2">
                    {[
                      { id: 'gemini-2.5-flash', name: 'Flash (Default)', desc: 'Fastest responses, great for chat', credits: 2 },
                      { id: 'gemini-2.5-flash-accure', name: 'Accure (Precise)', desc: 'Higher accuracy, lower temperature', credits: 5 },
                    ].map(m => (
                      <div key={m.id} className="flex items-start gap-3 p-3 rounded-xl bg-muted/50 border border-border/50">
                        <Zap className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium">{m.name}</span>
                            <Badge variant="outline" className="text-[10px]">{m.credits} cr/req</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{m.desc}</p>
                          <code className="text-[10px] text-muted-foreground font-mono">{m.id}</code>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Create Key Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={v => { setShowCreateDialog(v); if (!v) { setGeneratedKey(null); setShowKey(false); } }}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
          <DialogHeader><DialogTitle>Create API Key</DialogTitle></DialogHeader>
          {!generatedKey ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="key-name">Key Name</Label>
                <Input id="key-name" placeholder="e.g. Production, My App" value={newKeyName} onChange={e => setNewKeyName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCreate()} />
              </div>
              <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-muted-foreground">Your API key will be shown <strong>only once</strong>. Store it securely.</p>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
                <Button onClick={handleCreate} disabled={!newKeyName.trim() || isCreating}>
                  {isCreating ? <RefreshCw className="w-4 h-4 mr-1.5 animate-spin" /> : <Plus className="w-4 h-4 mr-1.5" />}
                  Generate Key
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                <p className="text-xs text-green-600 dark:text-green-400 font-medium">Key created! Copy it now — it won't be shown again.</p>
              </div>
              <div className="space-y-2">
                <Label>Your API Key</Label>
                <div className="flex gap-2">
                  <div className="flex-1 flex items-center gap-2 bg-muted rounded-lg px-3 py-2 min-w-0">
                    <code className="text-xs font-mono flex-1 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">
                      {showKey ? generatedKey : '•'.repeat(40)}
                    </code>
                    <button onClick={() => setShowKey(v => !v)} className="flex-shrink-0 text-muted-foreground hover:text-foreground">
                      {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <Button variant="outline" size="sm" className="flex-shrink-0" onClick={() => copyToClipboard(generatedKey!)}>
                    {copiedKey ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={() => { setShowCreateDialog(false); setGeneratedKey(null); setShowKey(false); }}>Done</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={v => { if (!v) setDeleteId(null); }}>
        <AlertDialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete API Key?</AlertDialogTitle>
            <AlertDialogDescription>This is permanent. Any apps using this key will stop working immediately.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete Key</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
