import { useState } from 'react';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Code2, Copy, Download, Info, Check, Box, Layers, Play, ShieldAlert,
  FolderArchive, Sparkles, Swords, Pickaxe, Gamepad2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  gameBridgeService, GAME_BRIDGE_LIMITATION_NOTICE, type GameArtifact,
} from '@/services/gameBridgeService';
import { cn } from '@/lib/utils';

interface GameBridgeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTopic?: string;
}

export function GameBridgeModal({
  open,
  onOpenChange,
  initialTopic = 'Battlegrounds Combat',
}: GameBridgeModalProps) {
  const [selectedType, setSelectedType] = useState<
    'roblox_battlegrounds' | 'roblox_simulator' | 'roblox_obby' | 'minecraft_datapack' | 'godot_controller'
  >('roblox_battlegrounds');
  const [artifact, setArtifact] = useState<GameArtifact>(() =>
    gameBridgeService.generateGamePackage('roblox_battlegrounds', initialTopic)
  );
  const [hasCopied, setHasCopied] = useState(false);
  const [isZipping, setIsZipping] = useState(false);

  const handleSelectTemplate = (
    type: 'roblox_battlegrounds' | 'roblox_simulator' | 'roblox_obby' | 'minecraft_datapack' | 'godot_controller',
    label: string
  ) => {
    setSelectedType(type);
    const art = gameBridgeService.generateGamePackage(type, label);
    setArtifact(art);
    toast.info(`Generated ${art.title} package`);
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(artifact.code);
      setHasCopied(true);
      toast.success('Copied code to clipboard!');
      setTimeout(() => setHasCopied(false), 2000);
    } catch {
      toast.error('Failed to copy to clipboard');
    }
  };

  const handleDownloadStandalone = () => {
    const ext = artifact.platform === 'minecraft' ? 'mcfunction' : artifact.platform === 'godot' ? 'gd' : 'luau';
    const filename = `${artifact.title.replace(/\s+/g, '_').toLowerCase()}.${ext}`;
    gameBridgeService.downloadFile(artifact.code, filename, 'text/plain');
    toast.success(`Downloaded ${filename}!`);
  };

  const handleDownloadRbxmx = () => {
    if (!artifact.xmlModel) {
      toast.error('Roblox Studio .rbxmx XML model is not applicable for this engine.');
      return;
    }
    const filename = `${artifact.title.replace(/\s+/g, '_').toLowerCase()}.rbxmx`;
    gameBridgeService.downloadFile(artifact.xmlModel, filename, 'application/xml');
    toast.success(`Downloaded ${filename} ready for Roblox Studio Explorer > Insert from file!`);
  };

  const handleDownloadZipBundle = async () => {
    setIsZipping(true);
    try {
      await gameBridgeService.downloadProjectZip(artifact);
    } catch {
      toast.error('Failed to package project ZIP archive');
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-3xl rounded-3xl liquid-glass-card border border-white/15 p-6 shadow-2xl max-h-[90dvh] overflow-y-auto">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 via-primary to-accent flex items-center justify-center shadow-md">
              <Gamepad2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                Roblox AI & Game Builder Studio
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-[10px] font-bold">
                  v80 Final
                </span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Build games on Roblox (Lemon.gg / Superbullet AI style), Minecraft Datapacks, and Godot 4.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Technical Boundary & Sandbox Notice Callout */}
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200/90 text-xs space-y-1">
          <div className="flex items-center gap-1.5 font-semibold text-amber-300">
            <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400" />
            <span>{GAME_BRIDGE_LIMITATION_NOTICE.title}</span>
          </div>
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            {GAME_BRIDGE_LIMITATION_NOTICE.summary} {GAME_BRIDGE_LIMITATION_NOTICE.solution}
          </p>
        </div>

        {/* System Preset Selector */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-foreground">Select Game Engine & Architecture</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {[
              {
                type: 'roblox_battlegrounds' as const,
                label: 'Roblox Battlegrounds Combat',
                icon: Swords,
                desc: 'M1 4-hit combo, ragdoll knockback & hitboxes (Lemon.gg style)',
              },
              {
                type: 'roblox_simulator' as const,
                label: 'Roblox Pet Simulator & RNG',
                icon: Sparkles,
                desc: 'Weighted egg hatching, clicker economy & multipliers',
              },
              {
                type: 'roblox_obby' as const,
                label: 'Roblox Obby Hazards',
                icon: Box,
                desc: 'Instant kill bricks, checkpoint leaderstats & respawn',
              },
              {
                type: 'minecraft_datapack' as const,
                label: 'Minecraft Soul Fire Spell',
                icon: Pickaxe,
                desc: '1.21 Datapack with pack.mcmeta, tick loop & ability',
              },
              {
                type: 'godot_controller' as const,
                label: 'Godot 4 3D Controller',
                icon: Code2,
                desc: 'GDScript 2.0 CharacterBody3D with sprint & dash',
              },
            ].map((item) => {
              const IconComp = item.icon;
              return (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => handleSelectTemplate(item.type, item.label)}
                  className={cn(
                    'p-3 rounded-2xl text-left border transition-all flex flex-col justify-between',
                    selectedType === item.type
                      ? 'bg-primary/15 border-primary/40 shadow-sm'
                      : 'bg-muted/30 border-white/10 hover:bg-muted/50'
                  )}
                >
                  <div>
                    <p className="text-xs font-semibold text-foreground flex items-center justify-between">
                      <span className="flex items-center gap-1.5 truncate">
                        <IconComp className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </span>
                      {selectedType === item.type && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">{item.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Script Viewer & Studio Exporter */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs font-semibold text-foreground truncate">{artifact.title}</span>
              <span className="px-2 py-0.5 rounded-full bg-muted text-[10px] font-mono text-muted-foreground border border-white/10 shrink-0">
                {artifact.targetLocation}
              </span>
            </div>

            {/* Actions: Copy, Standalone File, .rbxmx Model, and Ready-to-Open ZIP */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleCopyCode}
                className="h-7 px-2.5 text-xs rounded-xl border-white/15 gap-1"
              >
                {hasCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                {hasCopied ? 'Copied' : 'Copy'}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleDownloadStandalone}
                className="h-7 px-2.5 text-xs rounded-xl border-white/15 gap-1"
              >
                <Download className="w-3 h-3" />
                Script
              </Button>
              {artifact.xmlModel && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleDownloadRbxmx}
                  className="h-7 px-2.5 text-xs rounded-xl border-white/15 gap-1"
                >
                  <Download className="w-3 h-3" />
                  .rbxmx
                </Button>
              )}
              <Button
                type="button"
                size="sm"
                disabled={isZipping}
                onClick={handleDownloadZipBundle}
                className="h-7 px-3 text-xs rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold gap-1 shadow-sm active:scale-95"
              >
                <FolderArchive className="w-3.5 h-3.5" />
                <span>Ready-to-Open ZIP</span>
              </Button>
            </div>
          </div>

          <div className="relative rounded-2xl bg-black/85 border border-white/15 p-3.5 font-mono text-xs overflow-x-auto max-h-56 text-slate-200">
            <pre className="text-[11px] leading-5 whitespace-pre">
              {artifact.code}
            </pre>
          </div>
        </div>

        {/* How to Import in Roblox Studio Guide */}
        <div className="p-3.5 rounded-2xl bg-muted/30 border border-white/10 space-y-1.5 text-xs">
          <p className="font-semibold text-foreground flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-primary" />
            <span>How to use the generated project:</span>
          </p>
          <ol className="list-decimal list-inside text-[11px] text-muted-foreground space-y-1 pl-1">
            <li>
              <strong>Roblox Studio:</strong> Click <em>&quot;Ready-to-Open ZIP&quot;</em> or <em>&quot;.rbxmx&quot;</em>. In Roblox Studio, right-click Explorer &gt; &quot;Insert from File...&quot; or unzip with Rojo.
            </li>
            <li>
              <strong>Minecraft:</strong> Click <em>&quot;Ready-to-Open ZIP&quot;</em>, unzip the archive directly into your world&apos;s <code>datapacks/</code> folder, and type <code>/reload</code> in game.
            </li>
          </ol>
        </div>
      </DialogContent>
    </Dialog>
  );
}
