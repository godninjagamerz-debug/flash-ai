import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Key, Plus, Trash2, Copy, Check, ArrowLeft, Zap, Clock, Shield, Terminal, Gauge,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { API_TIME_PACKAGES, API_TIER_SPECS } from '@/types/plans';
import { useAuth } from '@/components/auth/AuthProvider';

interface ActiveApiKey {
  id: string;
  name: string;
  key: string;
  tier: 'plus' | 'pro';
  rpmLimit: number;
  dailyCreditsLimit: number;
  creditsUsedToday: number;
  durationLabel: string;
  expiresAt: string;
  createdAt: string;
}

const LOCAL_API_KEYS_STORAGE = 'flash_realtime_api_keys';

export default function ApiKeys() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [keys, setKeys] = useState<ActiveApiKey[]>([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [selectedTier, setSelectedTier] = useState<'plus' | 'pro'>('plus');
  const [selectedPkgId, setSelectedPkgId] = useState<string>('1d');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(LOCAL_API_KEYS_STORAGE) || '[]');
      setKeys(saved);
    } catch {
      setKeys([]);
    }
  }, []);

  const saveKeys = (updated: ActiveApiKey[]) => {
    setKeys(updated);
    localStorage.setItem(LOCAL_API_KEYS_STORAGE, JSON.stringify(updated));
  };

  const selectedPkg = API_TIME_PACKAGES.find((p) => p.id === selectedPkgId) || API_TIME_PACKAGES[1];
  const currentPrice = selectedTier === 'plus' ? selectedPkg.plusPriceINR : selectedPkg.proPriceINR;
  const currentSpec = API_TIER_SPECS[selectedTier];

  const handlePurchaseAndCreateKey = () => {
    if (!newKeyName.trim()) {
      toast.error('Please enter a name for your API key first.');
      return;
    }

    // Redirect to Stripe Payment page with time-pass query parameters
    navigate(
      `/payment?type=api_pass&tier=${selectedTier}&duration=${selectedPkg.id}&price=${currentPrice}&keyName=${encodeURIComponent(newKeyName.trim())}`
    );
  };

  const handleInstantTestKey = () => {
    const name = newKeyName.trim() || `${selectedTier.toUpperCase()} Key`;
    const rawSecret = `fl_live_${selectedTier}_${crypto.randomUUID().replace(/-/g, '')}`;
    const expires = new Date(Date.now() + selectedPkg.durationHours * 3600 * 1000).toISOString();

    const newEntry: ActiveApiKey = {
      id: crypto.randomUUID(),
      name,
      key: rawSecret,
      tier: selectedTier,
      rpmLimit: currentSpec.rpm,
      dailyCreditsLimit: currentSpec.dailyCredits,
      creditsUsedToday: 0,
      durationLabel: selectedPkg.durationLabel,
      expiresAt: expires,
      createdAt: new Date().toISOString(),
    };

    saveKeys([newEntry, ...keys]);
    setNewKeyName('');
    toast.success(`Active ${currentSpec.name} API key generated!`);
  };

  const handleDeleteKey = (id: string) => {
    saveKeys(keys.filter((k) => k.id !== id));
    toast.success('API Key revoked.');
  };

  const copyKey = (id: string, keyStr: string) => {
    navigator.clipboard.writeText(keyStr);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success('API key copied to clipboard!');
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <div className="container mx-auto px-4 py-6 max-w-5xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => navigate('/')}>
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Back to Chat
            </Button>
            <div>
              <h1 className="text-2xl font-bold gradient-text">Real-Time Developer API Keys</h1>
              <p className="text-xs text-muted-foreground">
                Rent high-throughput API keys by time — powered by Flash AI
              </p>
            </div>
          </div>
        </div>

        {/* Tier Specs Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(['plus', 'pro'] as const).map((tierKey) => {
            const spec = API_TIER_SPECS[tierKey];
            const active = selectedTier === tierKey;
            return (
              <div
                key={tierKey}
                onClick={() => setSelectedTier(tierKey)}
                className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                  active ? 'border-primary bg-primary/5 shadow-md' : 'border-border hover:border-primary/40'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-bold capitalize flex items-center gap-2">
                    <Zap className="w-4 h-4 text-primary" />
                    {spec.name}
                  </h3>
                  <Badge variant={active ? 'default' : 'outline'}>
                    {spec.rpm} req / min
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Daily Quota: <strong className="text-foreground">{spec.dailyCreditsDisplay}</strong> credits
                </p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Gauge className="w-3.5 h-3.5" /> {spec.rpm} RPM Rate Limit</span>
                  <span className="flex items-center gap-1"><Shield className="w-3.5 h-3.5" /> Real-time key rotation</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Time-Based Pricing Table */}
        <Card className="border border-border shadow-md">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Select API Key Duration & Pricing
            </CardTitle>
            <CardDescription>
              Choose how long your API key stays active. Instant activation after Stripe checkout.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {API_TIME_PACKAGES.map((pkg) => {
                const price = selectedTier === 'plus' ? pkg.plusPriceINR : pkg.proPriceINR;
                const isSelected = selectedPkgId === pkg.id;
                return (
                  <button
                    key={pkg.id}
                    type="button"
                    onClick={() => setSelectedPkgId(pkg.id)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/10 ring-2 ring-primary/20'
                        : 'border-border hover:bg-muted/50'
                    }`}
                  >
                    <p className="text-xs font-semibold text-muted-foreground">{pkg.durationLabel}</p>
                    <p className="text-lg font-bold text-foreground mt-1">₹{price.toLocaleString('en-IN')}</p>
                    <p className="text-[10px] text-primary uppercase font-medium mt-0.5">{selectedTier} tier</p>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <Input
                placeholder="Key Name (e.g. Production Backend Key)"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handlePurchaseAndCreateKey} className="gap-1.5 font-semibold">
                <Key className="w-4 h-4" />
                Buy & Generate Key (₹{currentPrice.toLocaleString('en-IN')})
              </Button>
              {profile?.role === 'admin' && (
                <Button variant="outline" onClick={handleInstantTestKey}>
                  <Plus className="w-4 h-4 mr-1" /> Admin Instant Key
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Active API Keys List */}
        <Card className="border border-border shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">Your Active API Keys ({keys.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {keys.length === 0 ? (
              <p className="text-xs text-muted-foreground py-6 text-center">
                No active API keys yet. Select a time package above to generate one.
              </p>
            ) : (
              keys.map((item) => {
                const isExpired = new Date(item.expiresAt).getTime() < Date.now();
                return (
                  <div
                    key={item.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-border bg-card/60"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm">{item.name}</span>
                        <Badge variant={item.tier === 'pro' ? 'default' : 'secondary'} className="uppercase text-[10px]">
                          {item.tier} · {item.rpmLimit} RPM
                        </Badge>
                        <Badge variant="outline" className="text-[10px]">
                          {item.durationLabel}
                        </Badge>
                        {isExpired && <Badge variant="destructive" className="text-[10px]">Expired</Badge>}
                      </div>
                      <p className="text-xs font-mono text-muted-foreground truncate">{item.key}</p>
                      <p className="text-[11px] text-muted-foreground">
                        Daily Credits: {item.creditsUsedToday.toLocaleString()} / {item.dailyCreditsLimit.toLocaleString()} · Expires: {new Date(item.expiresAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button size="sm" variant="outline" onClick={() => copyKey(item.id, item.key)}>
                        {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDeleteKey(item.id)} className="text-destructive">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Quick Integration Snippet */}
        <Card className="border border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Terminal className="w-4 h-4 text-primary" />
              Quick Start API Request
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="p-3 rounded-xl bg-slate-950 text-slate-100 text-xs font-mono overflow-x-auto">
{`curl https://flashai.rf.gd/api/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_FL_LIVE_API_KEY" \\
  -d '{"model": "f1", "messages": [{"role": "user", "content": "Hello!"}]}'`}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}