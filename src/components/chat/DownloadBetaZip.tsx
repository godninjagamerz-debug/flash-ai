/**
 * DownloadBetaZip — sticky sidebar button that bundles a beta ZIP via JSZip CDN.
 * Feature-gated by flags.zip.
 */
import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { flags } from '@/lib/flags';

const README_MD = `# Flash AI — Beta v0.1

Welcome to the Flash AI beta build.

## Getting Started
1. Open \`index.html\` in any modern browser.
2. Sign in with your Flash AI account.
3. Start chatting!

## Features in this build
- Multi-model chat (Flash F1–F6, Accure A1–A4)
- Image generation via /imagine
- Conversation history with search
- Dark / light theme
- Voice to text
`;

const CHANGELOG_MD = `# Changelog

## v0.1-beta (current)
- Initial beta release
- Dual model family (Flash + Accure)
- 5-effort-level system
- ChatGPT-style image generation studio
- Owner-only Beta mode learning loop
- Credit estimation & daily limits
- Streaming + instant response modes
`;

const INDEX_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Flash AI — Beta v0.1</title>
  <style>
    body { font-family: sans-serif; display: flex; align-items: center;
           justify-content: center; min-height: 100vh; margin: 0;
           background: #0f172a; color: #f8fafc; }
    .card { background: #1e293b; border-radius: 16px; padding: 40px 48px;
            text-align: center; box-shadow: 0 20px 60px rgba(0,0,0,.4); }
    h1 { font-size: 2rem; margin: 0 0 8px; }
    p  { color: #94a3b8; margin: 0 0 24px; }
    a  { display: inline-block; padding: 12px 28px; background: #3b82f6;
         color: white; border-radius: 8px; text-decoration: none;
         font-weight: 600; transition: background .2s; }
    a:hover { background: #2563eb; }
  </style>
</head>
<body>
  <div class="card">
    <h1>⚡ Flash AI</h1>
    <p>Beta v0.1 — offline reference build</p>
    <a href="https://flash-ai.app">Open Live App</a>
  </div>
</body>
</html>
`;

declare global {
  interface Window {
    // JSZip is loaded from CDN
    JSZip?: new () => JSZipInstance;
  }
}

interface JSZipInstance {
  file(name: string, content: string): this;
  folder(name: string): this;
  generateAsync(options: { type: 'blob' }): Promise<Blob>;
}

async function loadJSZip(): Promise<new () => JSZipInstance> {
  if (window.JSZip) return window.JSZip;
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
    script.onload = () => resolve(window.JSZip!);
    script.onerror = () => reject(new Error('Failed to load JSZip'));
    document.head.appendChild(script);
  });
}

export function DownloadBetaZip() {
  const [loading, setLoading] = useState(false);

  if (!flags.zip) return null;

  const handleDownload = async () => {
    setLoading(true);
    toast.info('Downloading AI Beta v0.1…');
    try {
      const JSZip = await loadJSZip();
      const zip = new JSZip();
      zip.file('index.html', INDEX_HTML);
      zip.file('README.md', README_MD);
      zip.file('CHANGELOG.md', CHANGELOG_MD);
      // assets/icon.png placeholder (1×1 transparent PNG as base64)
      const pngBase64 =
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      const byteCharacters = atob(pngBase64);
      const byteArray = new Uint8Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) byteArray[i] = byteCharacters.charCodeAt(i);
      zip.folder('assets');
      // JSZip accepts Uint8Array for binary
      (zip as unknown as { file(n: string, c: Uint8Array): void }).file('assets/icon.png', byteArray);

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'ai-beta-v0.1.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Flash AI Beta v0.1 downloaded!');
    } catch (err) {
      toast.error('Download failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleDownload}
      disabled={loading}
      className="w-full h-9 gap-2 text-xs font-medium border-dashed border-primary/40 text-primary hover:bg-primary/5"
    >
      {loading
        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
        : <Download className="w-3.5 h-3.5" />}
      {loading ? 'Preparing…' : '⬇ Download Beta v0.1'}
    </Button>
  );
}
