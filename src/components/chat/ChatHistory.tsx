import { useState, useRef } from 'react';
import {
  MessageSquare, Plus, Trash2, X, Zap, Search,
  Pencil, Check, FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FlashLogo } from '@/components/common/FlashLogo';
import { cn } from '@/lib/utils';
import type { Conversation } from '@/types/types';

interface ChatHistoryProps {
  conversations: Conversation[];
  currentConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation?: (id: string, title: string) => void;
  /** System prompt per conversation — stored locally */
  systemPrompts?: Record<string, string>;
  onSystemPromptChange?: (id: string, prompt: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function ChatHistory({
  conversations,
  currentConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  onRenameConversation,
  systemPrompts = {},
  onSystemPromptChange,
  isOpen,
  onClose,
}: ChatHistoryProps) {
  const [search, setSearch] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [systemPromptId, setSystemPromptId] = useState<string | null>(null);
  const [systemPromptValue, setSystemPromptValue] = useState('');
  const renameInputRef = useRef<HTMLInputElement>(null);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    if (diffInHours < 24) return 'Today';
    if (diffInHours < 48) return 'Yesterday';
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
  };

  // Filter + group
  const filtered = conversations.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );
  const today: Conversation[] = [];
  const yesterday: Conversation[] = [];
  const older: Conversation[] = [];
  filtered.forEach((c) => {
    const h = (Date.now() - new Date(c.updated_at).getTime()) / 3600000;
    if (h < 24) today.push(c);
    else if (h < 48) yesterday.push(c);
    else older.push(c);
  });

  const startRename = (conv: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setRenamingId(conv.id);
    setRenameValue(conv.title);
    setTimeout(() => renameInputRef.current?.focus(), 0);
  };

  const submitRename = (id: string) => {
    if (renameValue.trim() && onRenameConversation) {
      onRenameConversation(id, renameValue.trim());
    }
    setRenamingId(null);
  };

  const openSystemPrompt = (conv: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setSystemPromptId(conv.id);
    setSystemPromptValue(systemPrompts[conv.id] || '');
  };

  const saveSystemPrompt = (id: string) => {
    onSystemPromptChange?.(id, systemPromptValue);
    setSystemPromptId(null);
  };

  const ConvItem = ({ conv }: { conv: Conversation }) => {
    const isActive = currentConversationId === conv.id;
    const isRenaming = renamingId === conv.id;
    const hasSystemPrompt = !!systemPrompts[conv.id];

    return (
      <div
        className={cn(
          'group relative flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-all min-w-0 w-full',
          isActive
            ? 'bg-primary/15 border border-primary/25 shadow-sm'
            : 'hover:bg-muted/60 border border-transparent'
        )}
        onClick={() => { if (!isRenaming) { onSelectConversation(conv.id); onClose(); } }}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <MessageSquare className={cn(
            'w-3.5 h-3.5 shrink-0',
            isActive ? 'text-primary' : 'text-muted-foreground'
          )} />

          <div className="min-w-0 flex-1">
            {isRenaming ? (
              <div className="flex items-center gap-1 min-w-0" onClick={e => e.stopPropagation()}>
                <input
                  ref={renameInputRef}
                  value={renameValue}
                  onChange={e => setRenameValue(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') submitRename(conv.id);
                    if (e.key === 'Escape') setRenamingId(null);
                  }}
                  className="w-full min-w-0 text-[13px] bg-background border border-primary/40 rounded px-1.5 py-0.5 outline-none"
                />
              </div>
            ) : (
              <div className="flex items-center gap-1 min-w-0">
                <p className={cn(
                  'text-[13px] font-medium truncate leading-tight flex-1 block',
                  isActive ? 'text-primary font-semibold' : 'text-foreground'
                )}>
                  {conv.title}
                </p>
                {hasSystemPrompt && (
                  <FileText className="w-3 h-3 text-muted-foreground/60 shrink-0" aria-label="Has system prompt" />
                )}
              </div>
            )}
            <p className="text-[10px] text-muted-foreground mt-0.5">{formatDate(conv.updated_at)}</p>
          </div>
        </div>

        {/* Action buttons — visible on hover */}
        {!isRenaming && (
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <Button
              variant="ghost" size="icon"
              className="h-6 w-6 hover:bg-primary/10"
              title="Rename"
              onClick={e => startRename(conv, e)}
            >
              <Pencil className="w-3 h-3 text-muted-foreground" />
            </Button>
            <Button
              variant="ghost" size="icon"
              className="h-6 w-6 hover:bg-primary/10"
              title="System prompt"
              onClick={e => openSystemPrompt(conv, e)}
            >
              <FileText className="w-3 h-3 text-muted-foreground" />
            </Button>
            <Button
              variant="ghost" size="icon"
              className="h-6 w-6 hover:bg-destructive/10"
              title="Delete"
              onClick={e => { e.stopPropagation(); onDeleteConversation(conv.id); }}
            >
              <Trash2 className="w-3 h-3 text-destructive" />
            </Button>
          </div>
        )}
      </div>
    );
  };

  const SectionLabel = ({ label }: { label: string }) => (
    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 px-3 pt-3 pb-1">
      {label}
    </p>
  );

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
          onClick={onClose}
        />
      )}

      <aside className={cn(
        'fixed md:static inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-card border-r border-border/60 flex flex-col transition-transform duration-300 ease-out shadow-2xl md:shadow-none min-w-0',
        isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      )}>
        {/* Header */}
        <div className="px-4 py-4 border-b border-border/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <FlashLogo className="w-7 h-7 rounded-lg" />
            <span className="text-base font-bold gradient-text">Flash AI</span>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="md:hidden h-8 w-8">
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* New Chat */}
        <div className="px-3 pt-3 pb-2 shrink-0">
          <Button
            onClick={() => { onNewConversation(); onClose(); }}
            className="w-full h-9 text-sm font-semibold bg-gradient-to-r from-primary to-primary/80 hover:opacity-90 shadow-sm gap-2"
          >
            <Plus className="w-4 h-4" />
            New Chat
          </Button>
        </div>

        {/* Search */}
        <div className="px-3 pb-2 shrink-0">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search conversations…"
              className="w-full h-8 pl-8 pr-3 text-xs bg-muted/60 border border-border/50 rounded-lg outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 placeholder:text-muted-foreground/60"
            />
            {search && (
              <button onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Conversation list */}
        <ScrollArea className="flex-1 min-h-0 w-full overflow-hidden">
          <div className="px-2 pb-4 w-full min-w-0">
            {filtered.length === 0 ? (
              <div className="text-center py-10 px-4">
                <MessageSquare className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground font-medium">
                  {search ? 'No results' : 'No conversations yet'}
                </p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  {search ? `Nothing matched "${search}"` : 'Start a new chat above'}
                </p>
              </div>
            ) : (
              <>
                {today.length > 0 && (
                  <><SectionLabel label="Today" />{today.map(c => <ConvItem key={c.id} conv={c} />)}</>
                )}
                {yesterday.length > 0 && (
                  <><SectionLabel label="Yesterday" />{yesterday.map(c => <ConvItem key={c.id} conv={c} />)}</>
                )}
                {older.length > 0 && (
                  <><SectionLabel label="Older" />{older.map(c => <ConvItem key={c.id} conv={c} />)}</>
                )}
              </>
            )}
          </div>
        </ScrollArea>

        {/* Quick Nav: Media & Files Hub */}
        <div className="px-3 pt-2 pb-3 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              window.location.href = '/media-hub';
              onClose();
            }}
            className="w-full h-8 text-xs font-medium rounded-xl border-border/60 hover:bg-muted/80 flex items-center justify-start gap-2"
          >
            <Zap className="w-3.5 h-3.5 text-primary" />
            <span>Media & Files Hub</span>
          </Button>
        </div>

      </aside>

      {/* System Prompt Dialog */}
      {systemPromptId && (
        <div
          className="fixed inset-0 z-[60] flex items-end md:items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setSystemPromptId(null)}
        >
          <div
            className="w-full max-w-md bg-card border border-border rounded-2xl p-5 shadow-2xl space-y-3"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                System Prompt
              </h3>
              <button onClick={() => setSystemPromptId(null)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Add a custom instruction for this conversation. The AI will follow this throughout.
            </p>
            <textarea
              value={systemPromptValue}
              onChange={e => setSystemPromptValue(e.target.value)}
              placeholder="e.g. You are a Python tutor. Always explain concepts with code examples."
              rows={4}
              className="w-full text-xs bg-muted/50 border border-border rounded-xl px-3 py-2.5 resize-none outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 placeholder:text-muted-foreground/60"
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setSystemPromptId(null)}>
                Cancel
              </Button>
              <Button size="sm" className="h-8 text-xs gap-1.5" onClick={() => saveSystemPrompt(systemPromptId)}>
                <Check className="w-3.5 h-3.5" />Save
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}