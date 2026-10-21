import { useState } from 'react';
import { Check, Copy, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CodeBlockProps {
  code: string;
  language?: string;
  filename?: string;
}

// Derive a sensible extension from language name
function getExtension(lang: string): string {
  const map: Record<string, string> = {
    javascript: 'js', typescript: 'ts', jsx: 'jsx', tsx: 'tsx',
    python: 'py', py: 'py', rust: 'rs', go: 'go', java: 'java',
    cpp: 'cpp', c: 'c', cs: 'cs', csharp: 'cs', php: 'php',
    ruby: 'rb', swift: 'swift', kotlin: 'kt', shell: 'sh', bash: 'sh',
    html: 'html', css: 'css', scss: 'scss', json: 'json', yaml: 'yml',
    yml: 'yml', toml: 'toml', sql: 'sql', markdown: 'md', md: 'md',
    xml: 'xml', dart: 'dart', r: 'r', matlab: 'm', lua: 'lua',
  };
  return map[lang.toLowerCase()] || 'txt';
}

function downloadFile(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function CodeBlock({ code, language = 'text', filename }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const name = filename || `code.${getExtension(language)}`;
    downloadFile(name, code);
  };

  const displayName = filename || (language !== 'text' ? `code.${getExtension(language)}` : null);

  return (
    <div className="relative group my-4 rounded-xl overflow-hidden border border-border bg-[hsl(220_13%_10%)] shadow-lg">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-muted/40 border-b border-border/60 backdrop-blur-sm">
        <div className="flex items-center gap-2.5">
          {/* Traffic-light dots */}
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
          </div>
          <span className="text-xs font-mono text-muted-foreground/80">
            {displayName ?? language.toUpperCase()}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownload}
            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground opacity-70 hover:opacity-100 transition-opacity gap-1"
            title={`Download ${displayName ?? 'file'}`}
          >
            <Download className="w-3 h-3" />
            <span className="sr-only md:not-sr-only">Download</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground opacity-70 hover:opacity-100 transition-opacity gap-1"
          >
            {copied ? (
              <><Check className="w-3 h-3 text-green-500" /><span className="text-green-500">Copied!</span></>
            ) : (
              <><Copy className="w-3 h-3" /><span className="sr-only md:not-sr-only">Copy</span></>
            )}
          </Button>
        </div>
      </div>
      <pre className="p-4 overflow-x-auto text-sm">
        <code className="font-mono leading-relaxed text-foreground/90 whitespace-pre">
          {code}
        </code>
      </pre>
    </div>
  );
}
