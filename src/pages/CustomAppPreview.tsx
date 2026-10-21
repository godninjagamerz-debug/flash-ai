import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { proDeploymentService, type DeployedApp } from '@/services/proDeploymentService';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, ExternalLink, Code2, Globe, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export default function CustomAppPreview() {
  const { slug } = useParams<{ slug: string }>();
  const [app, setApp] = useState<DeployedApp | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      const found = proDeploymentService.getAppBySlug(slug);
      setApp(found || null);
    }
    setLoading(false);
  }, [slug]);

  const handleDownload = async () => {
    if (!app) return;
    toast.info('Bundling full project ZIP…');
    await proDeploymentService.downloadAppZip(app);
    toast.success('ZIP package downloaded successfully!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-foreground">
        <Sparkles className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!app) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-muted/40 border border-white/10 flex items-center justify-center text-2xl">
          🔍
        </div>
        <h1 className="text-xl font-bold text-foreground">App Sub-link Not Found</h1>
        <p className="text-sm text-muted-foreground max-w-md">
          No deployed application was found for slug <code className="text-primary font-mono">/app/{slug}</code>.
        </p>
        <Link to="/chat">
          <Button className="rounded-2xl gap-2 text-xs">
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Chat</span>
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-foreground">
      {/* Top Banner Navigation Bar */}
      <header className="h-14 border-b border-white/10 bg-slate-900/80 backdrop-blur-md px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Link to="/chat">
            <Button variant="ghost" size="sm" className="h-8 rounded-xl text-xs gap-1.5 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back</span>
            </Button>
          </Link>
          <div className="h-4 w-px bg-white/10" />
          <div className="flex items-center gap-2 min-w-0">
            <Globe className="w-4 h-4 text-emerald-400 shrink-0" />
            <h1 className="text-sm font-bold text-foreground truncate">{app.title}</h1>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-semibold hidden md:inline">
              /app/{app.slug}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleDownload}
            className="h-8 px-3 rounded-xl text-xs font-semibold bg-primary hover:opacity-90 gap-1.5 shadow-md"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download ZIP</span>
          </Button>
        </div>
      </header>

      {/* Main Sandbox Frame Rendering */}
      <div className="flex-1 w-full relative bg-black">
        <iframe
          srcDoc={app.entryHtml}
          title={app.title}
          sandbox="allow-scripts allow-modals allow-forms"
          className="w-full h-full border-none"
        />
      </div>
    </div>
  );
}
