import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Blocks,
  Plus,
  Trash2,
  Check,
  Search,
  Sparkles,
  ExternalLink,
  Code2,
  ShieldCheck,
  Radio,
} from 'lucide-react';
import { pluginService, type PluginDefinition } from '@/services/pluginService';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface PluginCenterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPluginToggled?: () => void;
}

export function PluginCenterModal({
  open,
  onOpenChange,
  onPluginToggled,
}: PluginCenterModalProps) {
  const [plugins, setPlugins] = useState<PluginDefinition[]>(() =>
    pluginService.getPlugins()
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'official' | 'custom'>('all');
  const [showAddCustom, setShowAddCustom] = useState(false);

  // Form for custom plugin addition
  const [customName, setCustomName] = useState('');
  const [customDesc, setCustomDesc] = useState('');
  const [customIcon, setCustomIcon] = useState('⚡');
  const [customManifestUrl, setCustomManifestUrl] = useState('');
  const [customApiUrl, setCustomApiUrl] = useState('');
  const [customAuthToken, setCustomAuthToken] = useState('');

  const refreshList = () => {
    setPlugins(pluginService.getPlugins());
    onPluginToggled?.();
  };

  const handleToggle = (id: string) => {
    pluginService.togglePlugin(id);
    refreshList();
    const updated = pluginService.getPlugins().find((p) => p.id === id);
    if (updated?.enabled) {
      toast.success(`Enabled plugin: ${updated.name}`);
    } else {
      toast.info(`Disabled plugin: ${updated?.name}`);
    }
  };

  const handleAddCustomPlugin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) {
      toast.error('Please enter a plugin name');
      return;
    }

    pluginService.addCustomPlugin({
      name: customName.trim(),
      description: customDesc.trim() || 'Custom user integrated AI plugin',
      icon: customIcon || '⚡',
      author: 'You (Custom)',
      version: '1.0.0',
      capabilities: ['Custom tool', 'API proxy execution'],
      manifestUrl: customManifestUrl.trim() || undefined,
      apiUrl: customApiUrl.trim() || undefined,
      authType: customAuthToken.trim() ? 'bearer' : 'none',
      authToken: customAuthToken.trim() || undefined,
    });

    toast.success(`Installed custom plugin: ${customName}`);
    setShowAddCustom(false);
    setCustomName('');
    setCustomDesc('');
    setCustomManifestUrl('');
    setCustomApiUrl('');
    setCustomAuthToken('');
    refreshList();
  };

  const handleDeletePlugin = (id: string) => {
    pluginService.removePlugin(id);
    toast.info('Plugin removed');
    refreshList();
  };

  const filteredPlugins = plugins.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'all' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const activeCount = plugins.filter((p) => p.enabled).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-2xl rounded-3xl liquid-glass-card border border-white/15 p-6 shadow-2xl max-h-[90dvh] overflow-y-auto">
        <DialogHeader className="space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 via-primary to-purple-500 flex items-center justify-center shadow-md">
                <Blocks className="w-5 h-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                  Plugins & Tools Marketplace
                  <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30 text-[10px] font-bold">
                    {activeCount} Active
                  </span>
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Connect live web search, Python interpreter, DALL-E, and custom OpenAPI tools.
                </DialogDescription>
              </div>
            </div>

            <Button
              size="sm"
              onClick={() => setShowAddCustom(!showAddCustom)}
              className="h-8 rounded-xl text-xs gap-1.5 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 font-semibold"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{showAddCustom ? 'Browse' : 'Add Plugin'}</span>
            </Button>
          </div>
        </DialogHeader>

        {showAddCustom ? (
          /* Custom Plugin Addition Form */
          <form
            onSubmit={handleAddCustomPlugin}
            className="mt-4 p-5 rounded-2xl bg-muted/30 border border-white/10 space-y-3.5 animate-in fade-in-50"
          >
            <div className="flex items-center gap-2 pb-2 border-b border-white/10">
              <Code2 className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-bold text-foreground">
                Install Custom Plugin (OpenAPI / Schema)
              </h3>
            </div>

            <div className="grid grid-cols-4 gap-2">
              <div className="col-span-1 space-y-1">
                <label className="text-[11px] font-semibold text-muted-foreground">
                  Icon
                </label>
                <Input
                  value={customIcon}
                  onChange={(e) => setCustomIcon(e.target.value)}
                  placeholder="⚡"
                  className="text-center text-base rounded-xl border-white/15 bg-background/50"
                  maxLength={2}
                />
              </div>
              <div className="col-span-3 space-y-1">
                <label className="text-[11px] font-semibold text-muted-foreground">
                  Plugin Name *
                </label>
                <Input
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="e.g. Weather AI, Crypto Watcher, Jira Sync"
                  required
                  className="rounded-xl border-white/15 bg-background/50 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-muted-foreground">
                Description
              </label>
              <Input
                value={customDesc}
                onChange={(e) => setCustomDesc(e.target.value)}
                placeholder="What does this plugin do?"
                className="rounded-xl border-white/15 bg-background/50 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-muted-foreground">
                OpenAPI Manifest URL (Optional)
              </label>
              <Input
                value={customManifestUrl}
                onChange={(e) => setCustomManifestUrl(e.target.value)}
                placeholder="https://example.com/.well-known/ai-plugin.json"
                className="rounded-xl border-white/15 bg-background/50 text-xs font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-muted-foreground">
                  API Endpoint URL
                </label>
                <Input
                  value={customApiUrl}
                  onChange={(e) => setCustomApiUrl(e.target.value)}
                  placeholder="https://api.example.com/v1"
                  className="rounded-xl border-white/15 bg-background/50 text-xs font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-muted-foreground">
                  Bearer Token (If Required)
                </label>
                <Input
                  type="password"
                  value={customAuthToken}
                  onChange={(e) => setCustomAuthToken(e.target.value)}
                  placeholder="sk-..."
                  className="rounded-xl border-white/15 bg-background/50 text-xs font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowAddCustom(false)}
                className="rounded-xl text-xs border-white/15"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="rounded-xl text-xs font-semibold bg-primary hover:opacity-90"
              >
                Install Plugin 🚀
              </Button>
            </div>
          </form>
        ) : (
          /* Plugin Directory List */
          <div className="space-y-3 mt-3">
            {/* Search and Category Filter */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search plugins and tools…"
                  className="pl-9 h-9 text-xs rounded-xl border-white/15 bg-background/50"
                />
              </div>
              <div className="flex gap-1 p-0.5 rounded-xl bg-muted/40 border border-white/10 shrink-0">
                {(['all', 'official', 'custom'] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={cn(
                      'px-2.5 py-1 rounded-lg text-[11px] font-medium capitalize transition-all',
                      selectedCategory === cat
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Plugin Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {filteredPlugins.map((plugin) => (
                <div
                  key={plugin.id}
                  className={cn(
                    'p-3.5 rounded-2xl border transition-all flex flex-col justify-between',
                    plugin.enabled
                      ? 'bg-primary/10 border-primary/40 shadow-sm ring-1 ring-primary/20'
                      : 'bg-muted/30 border-white/10 hover:bg-muted/50'
                  )}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xl shrink-0 p-1 rounded-xl bg-white/5 border border-white/10">
                          {plugin.icon}
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-foreground truncate">
                            {plugin.name}
                          </p>
                          <p className="text-[10px] text-muted-foreground truncate">
                            by {plugin.author} · v{plugin.version}
                          </p>
                        </div>
                      </div>

                      <Switch
                        checked={plugin.enabled}
                        onCheckedChange={() => handleToggle(plugin.id)}
                      />
                    </div>

                    <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                      {plugin.description}
                    </p>

                    {/* Capabilities Tags */}
                    <div className="flex flex-wrap gap-1 pt-1">
                      {plugin.capabilities.slice(0, 3).map((cap, i) => (
                        <span
                          key={i}
                          className="px-1.5 py-0.5 rounded-md bg-white/10 text-[9px] font-mono text-muted-foreground"
                        >
                          {cap}
                        </span>
                      ))}
                    </div>
                  </div>

                  {plugin.category === 'custom' && (
                    <div className="mt-3 pt-2 border-t border-white/10 flex justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeletePlugin(plugin.id)}
                        className="h-6 px-2 text-[10px] text-destructive hover:bg-destructive/10 rounded-lg gap-1"
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                        <span>Uninstall</span>
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
