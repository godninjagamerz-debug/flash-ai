import { useState } from 'react';
import {
  FileCode, Download, ExternalLink, Share2, Copy, Check, Eye, Code2, Lock, FolderArchive,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { uploadTrackerService } from '@/services/uploadTrackerService';
import type { PlanType } from '@/types/plans';

export interface ParsedArtifact {
  id: string;
  filename: string;
  language: string;
  content: string;
}

export function extractArtifactsFromContent(markdown: string): ParsedArtifact[] {
  const artifacts: ParsedArtifact[] = [];
  const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
  let match: RegExpExecArray | null;
  let idx = 1;

  while ((match = codeBlockRegex.exec(markdown)) !== null) {
    const lang = (match[1] || 'txt').toLowerCase();
    const rawCode = match[2].trim();
    if (rawCode.length < 40) continue; // Skip tiny one-liners

    // Detect "// filename: App.tsx" or "# filename: script.py"
    const firstLine = rawCode.split('\n')[0] || '';
    const filenameMatch = firstLine.match(/(?:\/\/|#|<!--|--)\s*filename:\s*([^\s-->]+)/i);

    const extMap: Record<string, string> = {
      tsx: 'App.tsx', ts: 'index.ts', jsx: 'Component.jsx', js: 'script.js',
      html: 'index.html', css: 'styles.css', py: 'main.py', sql: 'schema.sql',
      json: 'config.json', md: 'README.md', luau: 'Server.luau', lua: 'script.lua',
    };

    const filename = filenameMatch
      ? filenameMatch[1]
      : `artifact-${idx}.${extMap[lang] ? extMap[lang].split('.').pop() : lang || 'txt'}`;

    artifacts.push({
      id: `art_${idx}_${filename}`,
      filename,
      language: lang,
      content: rawCode,
    });
    idx++;
  }

  return artifacts;
}

interface ArtifactViewerProps {
  artifacts: ParsedArtifact[];
  userPlan: PlanType;
  userCredits: number;
  userId?: string;
}

export function ArtifactViewer({
  artifacts,
  userPlan,
  userCredits,
  userId = 'guest',
}: ArtifactViewerProps) {
  const [selectedIdx, setSelectedIdx] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'code' | 'preview'>('code');
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  if (!artifacts || artifacts.length === 0) return null;

  const current = artifacts[selectedIdx] || artifacts[0];
  const isPreviewable = ['html', 'svg', 'md'].includes(current.language);
  const eligibleForShare = uploadTrackerService.canGenerateShareLink(userPlan, userCredits);

  const handleDownloadSingle = (art: ParsedArtifact) => {
    const blob = new Blob([art.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = art.filename.split('/').pop() || art.filename;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${art.filename}`);
  };

  const handleDownloadAllBundle = () => {
    // Combine all files into a ready-to-open multi-file bundle script/archive
    const manifest = artifacts
      .map((a) => `/* ==========================================\n   FILE: ${a.filename}\n   ========================================== */\n\n${a.content}`)
      .join('\n\n\n');
    const blob = new Blob([manifest], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flash-ai-project-bundle-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Downloaded all ${artifacts.length} project files!`);
  };

  const handleOpenInNewTab = (art: ParsedArtifact) => {
    const mime = art.language === 'html' ? 'text/html' : 'text/plain';
    const blob = new Blob([art.content], { type: `${mime};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  const handleCreateShareLink = () => {
    if (!eligibleForShare) {
      toast.error('Web File Hosting Links are exclusive to Pro & Enterprise (100k+ credits) users.');
      return;
    }
    const record = uploadTrackerService.createShareableLink(
      current.filename,
      current.content,
      current.language === 'html' ? 'text/html' : 'text/plain',
      userId
    );
    setShareUrl(record.publicUrl);
    navigator.clipboard.writeText(record.publicUrl);
    toast.success('Public link created and copied to clipboard!');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(current.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
    toast.success('Copied to clipboard');
  };

  return (
    <div className="my-3 rounded-2xl border border-primary/25 bg-card/95 shadow-lg overflow-hidden">
      {/* Top Bar: Claude-style Artifact Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 bg-primary/5 border-b border-border/60">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-primary/15 text-primary flex items-center justify-center shrink-0">
            <FileCode className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-foreground truncate">{current.filename}</p>
            <p className="text-[10px] text-muted-foreground">
              Interactive Artifact · Ready to open ({artifacts.length} {artifacts.length === 1 ? 'file' : 'files'})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {isPreviewable && (
            <Button
              size="sm"
              variant={viewMode === 'preview' ? 'default' : 'outline'}
              onClick={() => setViewMode(viewMode === 'code' ? 'preview' : 'code')}
              className="h-7 px-2.5 text-xs gap-1"
            >
              {viewMode === 'code' ? <Eye className="w-3.5 h-3.5" /> : <Code2 className="w-3.5 h-3.5" />}
              {viewMode === 'code' ? 'Preview' : 'Code'}
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={() => handleOpenInNewTab(current)}
            className="h-7 px-2.5 text-xs gap-1"
            title="Open directly in browser"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Open File</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => handleDownloadSingle(current)}
            className="h-7 px-2.5 text-xs gap-1"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Download</span>
          </Button>

          {artifacts.length > 1 && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleDownloadAllBundle}
              className="h-7 px-2.5 text-xs gap-1 border-primary/40 text-primary"
            >
              <FolderArchive className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">All ({artifacts.length})</span>
            </Button>
          )}

          <Button
            size="sm"
            variant={eligibleForShare ? 'default' : 'outline'}
            onClick={handleCreateShareLink}
            className="h-7 px-2.5 text-xs gap-1"
            title={
              eligibleForShare
                ? 'Publish file to flashai.rf.gd web link'
                : 'Pro or Enterprise (100k+ credits) required'
            }
          >
            {eligibleForShare ? <Share2 className="w-3.5 h-3.5" /> : <Lock className="w-3 h-3 text-amber-500" />}
            <span>Share Link</span>
          </Button>
        </div>
      </div>

      {/* Multi-file Folder Tabs */}
      {artifacts.length > 1 && (
        <div className="flex items-center gap-1 px-3 py-1.5 bg-muted/40 border-b border-border/50 overflow-x-auto no-scrollbar">
          {artifacts.map((art, i) => (
            <button
              key={art.id}
              onClick={() => { setSelectedIdx(i); setShareUrl(null); }}
              className={`px-2.5 py-1 rounded-md text-xs font-mono transition-colors shrink-0 ${
                i === selectedIdx
                  ? 'bg-primary text-primary-foreground font-semibold'
                  : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              {art.filename}
            </button>
          ))}
        </div>
      )}

      {/* Shareable URL Banner */}
      {shareUrl && (
        <div className="flex items-center justify-between gap-2 px-3.5 py-2 bg-emerald-500/10 border-b border-emerald-500/20 text-xs">
          <span className="font-mono text-emerald-600 dark:text-emerald-400 truncate">
            🌐 Live Link: {shareUrl}
          </span>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 px-2 text-xs"
            onClick={() => {
              navigator.clipboard.writeText(shareUrl);
              toast.success('Link copied!');
            }}
          >
            Copy URL
          </Button>
        </div>
      )}

      {/* Artifact Body */}
      <div className="relative">
        <button
          onClick={handleCopy}
          className="absolute top-2.5 right-2.5 z-10 p-1.5 rounded-lg bg-background/80 border border-border hover:bg-muted text-muted-foreground"
          title="Copy code"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
        </button>

        {viewMode === 'preview' && current.language === 'html' ? (
          <iframe
            title={current.filename}
            srcDoc={current.content}
            className="w-full h-72 bg-white border-0"
            sandbox="allow-scripts"
          />
        ) : (
          <pre className="p-4 text-xs font-mono overflow-x-auto max-h-80 bg-slate-950 text-slate-100 leading-relaxed">
            <code>{current.content}</code>
          </pre>
        )}
      </div>
    </div>
  );
}