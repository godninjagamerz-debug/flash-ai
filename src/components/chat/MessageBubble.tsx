import { useState, useCallback, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  User, Copy, Check, Sparkles, ThumbsUp, ThumbsDown,
  RotateCcw, Share2, ChevronDown, ChevronUp, Pencil, X,
  Volume2, AudioLines,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { ImageAttachment, MediaContent } from '@/types/chat';
import { MediaDisplay } from './MediaDisplay';
import { CodeBlock } from './CodeBlock';
import { ArtifactCard } from './ArtifactCard';
import { voiceAssistantService } from '@/services/voiceAssistantService';
import type { Components } from 'react-markdown';

interface MessageBubbleProps {
  role: 'user' | 'model';
  content: string;
  images?: ImageAttachment[];
  media?: MediaContent;
  isStreaming?: boolean;
  activityLabel?: string;
  modelName?: string;
  onRegenerate?: () => void;
  onEdit?: (newContent: string) => void;
  timestamp?: number;
  messageId?: string;
}

// Thinking block parser
function parseThinking(content: string): { thinking: string | null; response: string } {
  const thinkMatch = content.match(/^<think>([\s\S]*?)<\/think>\s*/);
  if (thinkMatch) {
    return { thinking: thinkMatch[1].trim(), response: content.slice(thinkMatch[0].length) };
  }
  return { thinking: null, response: content };
}

function formatTime(ts?: number) {
  if (!ts) return '';
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function MessageBubble({
  role, content, images, media, isStreaming = false, activityLabel,
  modelName = 'Flash AI', onRegenerate, onEdit, timestamp, messageId,
}: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const [liked, setLiked] = useState<boolean | null>(null);
  const [thinkExpanded, setThinkExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [isSpeakingThis, setIsSpeakingThis] = useState(false);

  // Auto-generate stable message key
  const stableMsgIdRef = useRef(messageId || `msg_${timestamp || Date.now()}`);

  // Stable rendered content with smooth interpolation
  const stableContentRef = useRef(content);
  const [displayContent, setDisplayContent] = useState(content);
  const isUser = role === 'user';
  const { thinking, response } = parseThinking(displayContent);

  // Listen to voice assistant status
  useEffect(() => {
    const unsub = voiceAssistantService.subscribe((speaking, id) => {
      setIsSpeakingThis(speaking && id === stableMsgIdRef.current);
    });
    return () => unsub();
  }, []);

  // Smooth streaming delivery: batch DOM updates and fluid char interpolation
  const rafRef = useRef<number | null>(null);
  useEffect(() => {
    if (isStreaming) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        stableContentRef.current = content;
        setDisplayContent(content);
        rafRef.current = null;
      });
    } else {
      stableContentRef.current = content;
      setDisplayContent(content);
    }
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [content, isStreaming]);

  const handleVoiceToggle = useCallback(async () => {
    if (isSpeakingThis) {
      voiceAssistantService.stop();
      setIsSpeakingThis(false);
      return;
    }
    const textToSpeak = response || displayContent;
    if (!textToSpeak) return;
    setIsSpeakingThis(true);
    await voiceAssistantService.speak(textToSpeak, stableMsgIdRef.current);
  }, [isSpeakingThis, response, displayContent]);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(response || displayContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [response, displayContent]);

  const handleShare = useCallback(async () => {
    const text = response || displayContent;
    if (navigator.share) {
      await navigator.share({ text }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [response, displayContent]);

  const handleEditStart = () => {
    setEditValue(content);
    setIsEditing(true);
  };

  const handleEditSubmit = () => {
    if (onEdit && editValue.trim()) {
      onEdit(editValue.trim());
    }
    setIsEditing(false);
  };

  const handleEditCancel = () => setIsEditing(false);

  const mdComponents: Components = {
    code({ className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || '');
      const isBlock = !!(props as { node?: { type?: string } }).node;
      if (match && isBlock) {
        const raw = String(children).replace(/\n$/, '');
        const firstLine = raw.split('\n')[0] || '';
        const filenameMatch =
          firstLine.match(/^(?:\/\/|#|<!--)\s*filename:\s*(.+?)(?:\s*-->)?$/) ||
          firstLine.match(/^(?:\/\/|#)\s*file:\s*(.+?)$/);
        const filename = filenameMatch ? filenameMatch[1].trim() : undefined;
        const codeBody = filename ? raw.split('\n').slice(1).join('\n') : raw;
        const lineCount = codeBody.split('\n').length;

        // Render substantial code or files as Claude-style Artifact cards
        if (lineCount >= 8 || filename || ['html', 'svg', 'tsx', 'jsx', 'py', 'python', 'json'].includes(match[1].toLowerCase())) {
          return <ArtifactCard code={codeBody} language={match[1]} filename={filename} />;
        }
        return <CodeBlock code={codeBody} language={match[1]} filename={filename} />;
      }
      return (
        <code className="bg-muted text-foreground font-mono text-[0.875em] px-1.5 py-0.5 rounded-md border border-border/60" {...props}>
          {children}
        </code>
      );
    },
    h1: ({ children }) => <h1 className="text-xl font-bold mt-6 mb-3 text-foreground border-b border-border pb-2 first:mt-0">{children}</h1>,
    h2: ({ children }) => <h2 className="text-lg font-semibold mt-5 mb-2.5 text-foreground first:mt-0">{children}</h2>,
    h3: ({ children }) => <h3 className="text-base font-semibold mt-4 mb-2 text-foreground first:mt-0">{children}</h3>,
    p: ({ children }) => <p className="mb-3 last:mb-0 leading-7 text-foreground text-pretty">{children}</p>,
    ul: ({ children }) => <ul className="mb-3 space-y-1.5 pl-1 last:mb-0">{children}</ul>,
    ol: ({ children }) => <ol className="mb-3 space-y-1.5 pl-1 last:mb-0 list-decimal list-inside">{children}</ol>,
    li: ({ children }) => (
      <li className="flex gap-2.5 text-foreground leading-6">
        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary/70 flex-shrink-0" />
        <span className="flex-1 min-w-0">{children}</span>
      </li>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-primary/60 bg-primary/5 pl-4 py-2 pr-3 my-3 rounded-r-lg text-muted-foreground italic">
        {children}
      </blockquote>
    ),
    table: ({ children }) => (
      <div className="overflow-x-auto my-4 rounded-xl border border-border shadow-sm">
        <table className="w-full text-sm border-collapse">{children}</table>
      </div>
    ),
    thead: ({ children }) => <thead className="bg-muted/70">{children}</thead>,
    th: ({ children }) => <th className="px-4 py-2.5 text-left font-semibold text-foreground border-b border-border whitespace-nowrap">{children}</th>,
    td: ({ children }) => <td className="px-4 py-2.5 text-foreground border-b border-border/50 last:border-b-0">{children}</td>,
    tr: ({ children }) => <tr className="hover:bg-muted/30 transition-colors">{children}</tr>,
    hr: () => <hr className="border-border my-4" />,
    strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
    em: ({ children }) => <em className="italic text-muted-foreground">{children}</em>,
    a: ({ children, href }) => (
      <a href={href} target="_blank" rel="noopener noreferrer"
        className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors">
        {children}
      </a>
    ),
  };

  return (
    <div className={cn(
      'group flex gap-3 md:gap-4 w-full animate-in fade-in-50 slide-in-from-bottom-2 duration-300 ease-out transition-all',
      isUser ? 'flex-row-reverse' : 'flex-row'
    )}>
      {/* Avatar */}
      <div className={cn(
        'flex-shrink-0 w-8 h-8 md:w-9 md:h-9 rounded-xl flex items-center justify-center shadow-lg ring-2 ring-offset-1 ring-offset-background',
        isUser
          ? 'bg-gradient-to-br from-user-message to-user-message/80 ring-user-message/30'
          : 'bg-gradient-to-br from-primary to-primary/80 ring-primary/30'
      )}>
        {isUser
          ? <User className="w-4 h-4 text-user-message-foreground" />
          : <Sparkles className="w-4 h-4 text-primary-foreground" />
        }
      </div>

      {/* Message body */}
      <div className={cn(
        'flex flex-col gap-1.5 min-w-0',
        isUser ? 'items-end max-w-[80%] md:max-w-[70%]' : 'items-start flex-1 max-w-full'
      )}>
        {/* Name + time row */}
        <div className={cn('flex items-center gap-2 px-1', isUser ? 'flex-row-reverse' : 'flex-row')}>
          <span className={cn('text-xs font-semibold tracking-wide', isUser ? 'text-user-message' : 'text-primary')}>
            {isUser ? 'You' : modelName}
          </span>
          {timestamp && <span className="text-[10px] text-muted-foreground">{formatTime(timestamp)}</span>}
          {!isUser && isStreaming && (
            <span role="status" aria-live="polite" className="flex items-center gap-1.5 text-[11px] text-primary">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              {activityLabel || 'Thinking'}…
            </span>
          )}
        </div>

        {/* Thinking section */}
        {!isUser && thinking && (
          <div className="w-full mb-1 rounded-xl border border-primary/20 bg-primary/5 overflow-hidden">
            <button
              onClick={() => setThinkExpanded(v => !v)}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Reasoning process</span>
              {thinkExpanded ? <ChevronUp className="w-3.5 h-3.5 ml-auto" /> : <ChevronDown className="w-3.5 h-3.5 ml-auto" />}
            </button>
            {thinkExpanded && (
              <div className="px-4 pb-3 text-xs text-muted-foreground leading-6 border-t border-primary/10 pt-2 font-mono whitespace-pre-wrap break-words">
                {thinking}
              </div>
            )}
          </div>
        )}

        {/* Attached images */}
        {images && images.length > 0 && (
          <div className={cn('flex flex-wrap gap-2 mb-1', isUser ? 'justify-end' : 'justify-start')}>
            {images.map((img, idx) => (
              <div key={idx} className="relative rounded-xl overflow-hidden border border-border shadow-md">
                <img src={`data:${img.mimeType};base64,${img.data}`} alt={img.name}
                  className="max-w-[200px] max-h-[200px] object-cover" />
              </div>
            ))}
          </div>
        )}

        {/* User message — inline edit or bubble */}
        {isUser ? (
          isEditing ? (
            <div className="w-full space-y-2">
              <Textarea
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
                className="min-h-[80px] resize-none text-sm"
                autoFocus
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleEditSubmit(); }
                  if (e.key === 'Escape') handleEditCancel();
                }}
              />
              <div className="flex gap-2 justify-end">
                <Button size="sm" variant="ghost" onClick={handleEditCancel} className="h-7 text-xs">
                  <X className="w-3.5 h-3.5 mr-1" />Cancel
                </Button>
                <Button size="sm" onClick={handleEditSubmit} className="h-7 text-xs">
                  <Check className="w-3.5 h-3.5 mr-1" />Save & Send
                </Button>
              </div>
            </div>
          ) : (
            <div className="group/bubble relative">
              <div className="rounded-2xl rounded-tr-sm px-4 py-3 bg-gradient-to-br from-user-message to-user-message/90 text-user-message-foreground shadow-md text-[14px] leading-7 whitespace-pre-wrap break-words max-w-full">
                {response || displayContent}
              </div>
              {/* User edit + retry controls */}
              <div className="flex gap-0.5 mt-1 justify-end opacity-0 group-hover:opacity-100 group-hover/bubble:opacity-100 transition-opacity">
                {onEdit && (
                  <Button variant="ghost" size="sm" onClick={handleEditStart}
                    className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground">
                    <Pencil className="w-3 h-3 mr-1" />Edit
                  </Button>
                )}
                {onRegenerate && (
                  <Button variant="ghost" size="sm" onClick={onRegenerate}
                    className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground">
                    <RotateCcw className="w-3 h-3 mr-1" />Retry
                  </Button>
                )}
              </div>
            </div>
          )
        ) : (
          /* AI message with smooth progressive card */
          <div className={cn(
            'w-full rounded-2xl rounded-tl-sm px-5 py-4 bg-card border border-border/60 shadow-sm text-[14px] transition-all duration-300',
            'prose-sm prose-headings:font-semibold prose-headings:text-foreground',
            isSpeakingThis && 'ring-2 ring-emerald-500/40 border-emerald-500/30 bg-emerald-500/[0.03] shadow-md'
          )}>
            {media && (
              <div className="mb-4">
                <MediaDisplay
                  type={media.type}
                  src={media.url || `data:${media.mimeType};base64,${media.data}`}
                  alt={media.name || `Generated ${media.type}`}
                />
              </div>
            )}
            {(response || displayContent) && (
              <div className="transition-opacity duration-200">
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
                  {response || displayContent}
                </ReactMarkdown>
              </div>
            )}
            {/* Smooth glowing streaming cursor */}
            <span
              aria-hidden
              className={cn(
                'inline-block w-1.5 h-4 bg-primary/90 rounded-sm ml-1 align-middle transition-all',
                isStreaming ? 'animate-pulse shadow-[0_0_8px_rgba(var(--primary),0.6)]' : 'hidden'
              )}
            />
          </div>
        )}

        {/* AI action bar — with Voice Readout */}
        {!isUser && !isStreaming && (response || displayContent) && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity px-1 flex-wrap">
            {/* Voice Readout Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleVoiceToggle}
              className={cn(
                'h-7 px-2.5 text-xs rounded-lg gap-1.5 transition-all',
                isSpeakingThis
                  ? 'text-emerald-400 bg-emerald-500/15 font-semibold ring-1 ring-emerald-500/30'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
              )}
              title={isSpeakingThis ? 'Stop speaking' : 'Read aloud with AI Voice'}
            >
              {isSpeakingThis ? (
                <>
                  <AudioLines className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                  <span className="text-emerald-400">Stop Voice</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Read Aloud</span>
                </>
              )}
            </Button>

            <Button variant="ghost" size="sm" onClick={handleCopy}
              className="h-7 px-2.5 text-xs text-muted-foreground hover:text-foreground rounded-lg">
              {copied
                ? <><Check className="w-3.5 h-3.5 mr-1.5 text-green-500" /><span className="text-green-500">Copied</span></>
                : <><Copy className="w-3.5 h-3.5 mr-1.5" />Copy</>}
            </Button>
            {onRegenerate && (
              <Button variant="ghost" size="sm" onClick={onRegenerate}
                className="h-7 px-2.5 text-xs text-muted-foreground hover:text-foreground rounded-lg">
                <RotateCcw className="w-3.5 h-3.5 mr-1.5" />Regenerate
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => setLiked(true)}
              className={cn('h-7 w-7 p-0 rounded-lg', liked === true ? 'text-primary' : 'text-muted-foreground hover:text-foreground')}>
              <ThumbsUp className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setLiked(false)}
              className={cn('h-7 w-7 p-0 rounded-lg', liked === false ? 'text-destructive' : 'text-muted-foreground hover:text-foreground')}>
              <ThumbsDown className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleShare}
              className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-foreground">
              <Share2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

