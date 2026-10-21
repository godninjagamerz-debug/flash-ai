import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Download,
  Terminal,
  Copy,
  Check,
  Monitor,
  Apple,
  Smartphone,
  ShieldCheck,
  Sparkles,
  ExternalLink,
  Laptop,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface AppInstallModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AppInstallModal({ open, onOpenChange }: AppInstallModalProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [copiedScript, setCopiedScript] = useState<string | null>(null);

  useEffect(() => {
    // Check if running in standalone mode (already installed)
    if (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    ) {
      setIsInstalled(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        toast.success('Flash AI installed successfully on your device!');
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      toast.info(
        'To install: In Chrome/Edge/Brave, click the install icon in the address bar (or Menu > Add to Home screen).'
      );
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedScript(id);
    toast.success('Command copied to clipboard!');
    setTimeout(() => setCopiedScript(null), 2500);
  };

  // PowerShell command for Windows
  const powershellCommand = `$appUrl = "https://${window.location.host}"; Start-Process msedge.exe -ArgumentList "--app=$appUrl"`;

  // Terminal command for macOS / Linux
  const macTerminalCommand = `open -a "Google Chrome" --args --app="https://${window.location.host}"`;
  const linuxTerminalCommand = `google-chrome --app="https://${window.location.host}"`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-2xl rounded-3xl liquid-glass-card border border-white/15 p-6 shadow-2xl max-h-[90dvh] overflow-y-auto">
        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 via-primary to-blue-600 flex items-center justify-center shadow-md">
              <Download className="w-5 h-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                Download & Install Flash AI
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                  Multi-Device Ready
                </span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Install as a standalone native-feeling desktop app on Windows, macOS, Linux, or Android.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 mt-3">
          {/* Method 1: Instant PWA Direct Install */}
          <div className="p-4 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Laptop className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-bold text-foreground">
                  Direct One-Click App Install
                </h3>
              </div>
              <p className="text-xs text-muted-foreground">
                {isInstalled
                  ? 'Application is currently running in desktop standalone mode.'
                  : 'Installs Flash AI directly into your OS app launcher, taskbar, and dock.'}
              </p>
            </div>

            <Button
              onClick={handleInstallPWA}
              disabled={isInstalled}
              className="h-9 px-4 rounded-xl text-xs font-semibold bg-primary hover:opacity-90 shrink-0 gap-1.5 shadow-md"
            >
              {isInstalled ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Installed</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Install App</span>
                </>
              )}
            </Button>
          </div>

          {/* Method 2: Windows PowerShell Command */}
          <div className="p-4 rounded-2xl bg-muted/30 border border-white/10 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Monitor className="w-4 h-4 text-blue-400" />
                <h4 className="text-xs font-bold text-foreground">
                  Windows PowerShell Quick Launch Command
                </h4>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(powershellCommand, 'ps')}
                className="h-7 px-2.5 text-xs text-muted-foreground hover:text-foreground rounded-lg gap-1"
              >
                {copiedScript === 'ps' ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy</span>
                  </>
                )}
              </Button>
            </div>

            <p className="text-[11px] text-muted-foreground">
              Run this in PowerShell to launch Flash AI in dedicated borderless application mode:
            </p>

            <div className="p-3 rounded-xl bg-black/60 border border-white/10 font-mono text-[11px] text-emerald-400 break-all select-all">
              {powershellCommand}
            </div>
          </div>

          {/* Method 3: macOS & Linux Terminal Command */}
          <div className="p-4 rounded-2xl bg-muted/30 border border-white/10 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-purple-400" />
                <h4 className="text-xs font-bold text-foreground">
                  macOS & Linux Terminal Launch Command
                </h4>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(macTerminalCommand, 'sh')}
                className="h-7 px-2.5 text-xs text-muted-foreground hover:text-foreground rounded-lg gap-1"
              >
                {copiedScript === 'sh' ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy</span>
                  </>
                )}
              </Button>
            </div>

            <p className="text-[11px] text-muted-foreground">
              macOS Terminal command:
            </p>
            <div className="p-2.5 rounded-xl bg-black/60 border border-white/10 font-mono text-[11px] text-purple-300 break-all select-all">
              {macTerminalCommand}
            </div>

            <p className="text-[11px] text-muted-foreground pt-1">
              Linux Terminal command:
            </p>
            <div className="p-2.5 rounded-xl bg-black/60 border border-white/10 font-mono text-[11px] text-purple-300 break-all select-all">
              {linuxTerminalCommand}
            </div>
          </div>

          {/* Android / iOS Mobile Guidance */}
          <div className="p-3.5 rounded-2xl bg-muted/20 border border-white/10 flex items-start gap-2.5">
            <Smartphone className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5 text-xs text-muted-foreground">
              <p className="font-semibold text-foreground">
                Mobile Installation (Android & iOS):
              </p>
              <p className="leading-relaxed text-[11px]">
                On Android (Chrome/Edge): Tap the three-dot menu and select <strong>&quot;Install App&quot;</strong> or <strong>&quot;Add to Home Screen&quot;</strong>.
                <br />
                On iOS (Safari): Tap the Share button and select <strong>&quot;Add to Home Screen&quot;</strong>.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
