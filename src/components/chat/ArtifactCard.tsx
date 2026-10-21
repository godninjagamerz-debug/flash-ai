import { useState, useMemo, useEffect } from 'react';
import {
  FileCode, Play, Code2, Download, Copy, Check, Eye, Maximize2,
  Terminal, Globe, FileText, Sparkles, FolderArchive, Layers,
  ExternalLink, Link as LinkIcon, Edit3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { zipProjectService, type ReadyProjectBundle } from '@/services/zipProjectService';
import { proDeploymentService, type DeployedApp } from '@/services/proDeploymentService';
import { useAuth } from '@/components/auth/AuthProvider';

export interface ArtifactData {
  id: string;
  title: string;
  language: string;
  code: string;
  filename?: string;
  timestamp?: number;
}

interface ArtifactCardProps {
  code: string;
  language?: string;
  filename?: string;
  title?: string;
}

// Derive clean file extension
export function getArtifactExtension(lang: string): string {
  const map: Record<string, string> = {
    javascript: 'js', js: 'js', typescript: 'ts', ts: 'ts',
    jsx: 'jsx', tsx: 'tsx', python: 'py', py: 'py',
    html: 'html', htm: 'html', css: 'css', scss: 'scss',
    json: 'json', markdown: 'md', md: 'md', sql: 'sql',
    rust: 'rs', rs: 'rs', go: 'go', shell: 'sh', bash: 'sh',
    svg: 'svg', xml: 'xml', yaml: 'yml', yml: 'yml',
  };
  return map[lang.toLowerCase()] || 'txt';
}

// Save artifact to local storage registry for Media Hub
function registerArtifact(artifact: ArtifactData) {
  try {
    const raw = localStorage.getItem('flash_artifacts');
    const list: ArtifactData[] = raw ? JSON.parse(raw) : [];
    const exists = list.some(a => a.id === artifact.id || (a.title === artifact.title && a.code === artifact.code));
    if (!exists) {
      list.unshift(artifact);
      if (list.length > 50) list.pop();
      localStorage.setItem('flash_artifacts', JSON.stringify(list));
    }
  } catch {
    // Ignore storage issues
  }
}

export function downloadArtifactFile(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast.success(`Downloaded ${filename}`);
}

export function ArtifactCard({ code, language = 'typescript', filename, title }: ArtifactCardProps) {
  const [activeTab, setActiveTab] = useState<'code' | 'preview'>('code');
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { profile } = useAuth();

  const isProOrEnterprise = profile?.plan === 'pro' || profile?.plan === 'business' || profile?.plan === 'hero';

  const ext = getArtifactExtension(language);
  const resolvedFilename = filename || (title ? `${title}.${ext}` : `artifact.${ext}`);
  const resolvedTitle = title || filename || `${language.toUpperCase()} Artifact`;

  // Pro Instant Web Sub-link deployment state
  const [deployedApp, setDeployedApp] = useState<DeployedApp | null>(null);
  const [isEditingSlug, setIsEditingSlug] = useState(false);
  const [slugInput, setSlugInput] = useState('');

  // Automatically provision Pro sub-link deployment for code artifacts
  useEffect(() => {
    if (code.trim().length > 20) {
      const app = proDeploymentService.deployCodeSnippet(
        resolvedTitle,
        code,
        language
      );
      setDeployedApp(app);
      setSlugInput(app.slug);
    }
  }, [code, resolvedTitle, language]);

  const isHtml = language.toLowerCase() === 'html' || ext === 'html';
  const isSvg = language.toLowerCase() === 'svg' || ext === 'svg';
  const canPreview = isHtml || isSvg;

  // Register in media hub registry
  useEffect(() => {
    if (code.trim().length > 20) {
      registerArtifact({
        id: `${resolvedFilename}-${code.length}`,
        title: resolvedTitle,
        language,
        code,
        filename: resolvedFilename,
        timestamp: Date.now(),
      });
    }
  }, [code, resolvedTitle, language, resolvedFilename]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success('Code copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    downloadArtifactFile(resolvedFilename, code);
  };

  const handleDownloadZip = async () => {
    try {
      const isRoblox = language.includes('lua') || resolvedFilename.endsWith('.luau') || resolvedFilename.endsWith('.rbxmx');
      const isMinecraft = language.includes('mcfunction') || resolvedFilename.endsWith('.mcfunction');
      const bundle: ReadyProjectBundle = {
        id: `art_${Date.now()}`,
        title: resolvedTitle,
        type: isRoblox ? 'roblox' : isMinecraft ? 'minecraft' : 'webapp',
        description: `Ready-to-open project for ${resolvedFilename}`,
        files: [
          { name: resolvedFilename, path: resolvedFilename, content: code },
          {
            name: 'README.md',
            path: 'README.md',
            content: `# ${resolvedTitle}\n\nGenerated by Flash AI Assistant.\nType: ${isRoblox ? 'Roblox Luau' : isMinecraft ? 'Minecraft Datapack' : 'Application'}\n\nFile: \`${resolvedFilename}\`\n\n## Quick Start:\n1. Unzip this package into your workspace.\n2. Open directly with your editor or engine (Roblox Studio / Minecraft / VS Code).\n`,
          },
        ],
      };
      await zipProjectService.downloadReadyToOpenZip(bundle);
    } catch {
      handleDownload();
    }
  };

  const lines = useMemo(() => code.split('\n'), [code]);

  return (
    <div
      className={cn(
        'my-4 rounded-2xl border border-border/70 bg-card/90 shadow-md overflow-hidden transition-all duration-200',
        isFullscreen && 'fixed inset-4 z-50 flex flex-col bg-card border-border shadow-2xl my-0'
      )}
    >
      {/* ── Artifact Header (Claude-style) ── */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 bg-muted/40 border-b border-border/50 backdrop-blur-sm">
        {/* Left: Icon, Title, Badge */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
            {isHtml ? (
              <Globe className="w-3.5 h-3.5 text-primary" />
            ) : isSvg ? (
              <Layers className="w-3.5 h-3.5 text-primary" />
            ) : (
              <Code2 className="w-3.5 h-3.5 text-primary" />
            )}
          </div>
          <span className="text-xs font-semibold tracking-tight truncate max-w-[200px] sm:max-w-xs text-foreground">
            {resolvedTitle}
          </span>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 capitalize font-mono text-muted-foreground border-border/60">
            {language}
          </Badge>
          <span className="text-[10px] text-muted-foreground/50 hidden sm:inline font-mono">
            {lines.length} lines
          </span>
        </div>

        {/* Right: Tab switchers & action buttons */}
        <div className="flex items-center gap-1 shrink-0">
          {canPreview && (
            <div className="flex items-center p-0.5 rounded-lg bg-muted/70 border border-border/40 mr-1">
              <button
                type="button"
                onClick={() => setActiveTab('code')}
                className={cn(
                  'flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors',
                  activeTab === 'code' ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Code2 className="w-3 h-3" />
                Code
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={cn(
                  'flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors',
                  activeTab === 'preview' ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Eye className="w-3 h-3" />
                Preview
              </button>
            </div>
          )}

          {/* Copy button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
            title="Copy code"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
          </Button>

          {/* Single File Download */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownload}
            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
            title={`Download as ${resolvedFilename}`}
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Download</span>
          </Button>

          {/* Download ZIP */}
          <Button
            size="sm"
            onClick={handleDownloadZip}
            className="h-7 px-2.5 text-xs rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-semibold gap-1.5 shadow-sm shrink-0"
            title="Download Ready-to-Open Project Archive (.zip)"
          >
            <FolderArchive className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">Ready-to-Open ZIP</span>
            <span className="sm:hidden">ZIP</span>
          </Button>

          {/* Fullscreen toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsFullscreen(v => !v)}
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen preview'}
          >
            <Maximize2 className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* ── Content View ── */}
      <div className={cn('relative', isFullscreen ? 'flex-1 overflow-auto' : 'max-h-[500px] overflow-auto')}>
        {/* ── Pro Instant Deployment & Sub-Link Banner ── */}
        {deployedApp && (
          <div className="px-3.5 py-2.5 bg-gradient-to-r from-emerald-500/10 via-primary/10 to-teal-500/10 border-b border-border/60 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span className="font-bold text-emerald-400 flex items-center gap-1 shrink-0">
                ⚡ Pro Web Link:
              </span>
              {isEditingSlug ? (
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground font-mono text-[11px]">/app/</span>
                  <input
                    type="text"
                    value={slugInput}
                    onChange={(e) => setSlugInput(e.target.value)}
                    className="h-6 px-1.5 rounded bg-background border border-primary/50 text-xs font-mono text-foreground"
                    placeholder="custom-slug"
                  />
                  <Button
                    size="sm"
                    onClick={() => {
                      const success = proDeploymentService.updateSlug(deployedApp.id, slugInput);
                      if (success) {
                        toast.success(`Sub-link updated: /app/${slugInput}`);
                        setIsEditingSlug(false);
                        const updated = proDeploymentService.getAppBySlug(slugInput);
                        if (updated) setDeployedApp(updated);
                      } else {
                        toast.error('Slug already taken or invalid. Pick another.');
                      }
                    }}
                    className="h-6 px-2 text-[10px] rounded"
                  >
                    Save
                  </Button>
                </div>
              ) : (
                <a
                  href={`/app/${deployedApp.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-primary underline underline-offset-2 hover:text-primary/80 truncate max-w-[200px] sm:max-w-xs flex items-center gap-1"
                >
                  <span>{deployedApp.subLinkUrl}</span>
                  <ExternalLink className="w-3 h-3 shrink-0" />
                </a>
              )}
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {!isEditingSlug && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditingSlug(true)}
                  className="h-6 px-2 text-[10px] text-muted-foreground hover:text-foreground rounded gap-1"
                  title="Customize URL slug"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Edit URL</span>
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(deployedApp.subLinkUrl);
                  toast.success('Live sub-link copied to clipboard!');
                }}
                className="h-6 px-2 text-[10px] text-muted-foreground hover:text-foreground rounded gap-1"
              >
                <LinkIcon className="w-3 h-3" />
                <span>Copy Link</span>
              </Button>
              <Button
                size="sm"
                onClick={() => proDeploymentService.downloadAppZip(deployedApp)}
                className="h-6 px-2 text-[10px] rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold gap-1 shadow-sm"
              >
                <FolderArchive className="w-3 h-3" />
                <span>Full ZIP</span>
              </Button>
            </div>
          </div>
        )}

        {activeTab === 'preview' && canPreview ? (
          <div className="p-4 bg-background/95 min-h-[220px] flex items-center justify-center">
            {isSvg ? (
              <div
                className="max-w-full overflow-auto flex items-center justify-center p-4 bg-card rounded-xl border border-border"
                dangerouslySetInnerHTML={{ __html: code }}
              />
            ) : (
              <iframe
                title="Artifact Live Preview"
                srcDoc={code}
                sandbox="allow-scripts"
                className="w-full h-80 rounded-xl border border-border bg-white"
              />
            )}
          </div>
        ) : (
          <div className="relative font-mono text-xs bg-[hsl(220_13%_8%)] text-slate-200">
            <div className="flex">
              {/* Line numbers */}
              <div className="select-none py-3 pl-3 pr-2 text-right text-slate-500/50 border-r border-slate-800 text-[11px] leading-5 w-10 shrink-0">
                {lines.map((_, i) => (
                  <div key={i}>{i + 1}</div>
                ))}
              </div>
              {/* Code text */}
              <pre className="py-3 px-4 overflow-x-auto text-[11px] leading-5 flex-1 min-w-0 font-mono scrollbar-thin">
                <code>{code}</code>
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* ── Artifact Footer ── */}
      <div className="px-3.5 py-1.5 bg-muted/30 border-t border-border/40 flex items-center justify-between text-[10px] text-muted-foreground/60">
        <span className="truncate">File: {resolvedFilename}</span>
        <span className="flex items-center gap-1">
          <Sparkles className="w-2.5 h-2.5 text-primary" /> Claude-style Artifact
        </span>
      </div>
    </div>
  );
}
