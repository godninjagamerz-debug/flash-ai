import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Send, Square, Download, Trash2, Zap, Paperclip, X, Code,
  Sparkles, Crown, LogOut, User, Menu, ArrowUp,
  Image as ImageIcon, Settings as SettingsIcon, Smartphone,
  Key, Brain, ChevronDown, Gauge,
  FolderOpen, Video, Box, Blocks, Bug, HardDrive, ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VideoGenerationModal } from '@/components/media/VideoGenerationModal';
import { GameBridgeModal } from '@/components/bridge/GameBridgeModal';
import { PluginCenterModal } from '@/components/plugins/PluginCenterModal';
import { AppInstallModal } from '@/components/install/AppInstallModal';
import { BugReportModal } from '@/components/bugs/BugReportModal';
import { pluginService, type PluginDefinition } from '@/services/pluginService';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { ArtifactViewer, extractArtifactsFromContent } from '@/components/chat/ArtifactViewer';
import { SuggestionCard } from '@/components/chat/SuggestionCard';
import { MediaGallery } from '@/components/chat/MediaGallery';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { FlashLogo } from '@/components/common/FlashLogo';
import { ChatHistory } from '@/components/chat/ChatHistory';
import { UpgradeModal } from '@/components/chat/UpgradeModal';
import { streamChat, type StreamMetrics } from '@/services/llm';
import { generateImageFromText, generateImageFromImage, isImageGenerationRequest } from '@/services/imageGeneration';
import { moderateContent, checkFeaturePermission } from '@/services/contentModeration';
import type { Message, ApiContent, ImageAttachment } from '@/types/chat';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  DAILY_CREDIT_LIMITS, CREDIT_COSTS, ALL_MODELS, EFFORT_LEVELS,
  PLAN_MODEL_ACCESS, PLAN_EFFORT_ACCESS, estimateCredits,
  type ModelId, type EffortLevel, type PlanType,
} from '@/types/plans';
import { useAuth } from '@/components/auth/AuthProvider';
import { conversationsApi, messagesApi, sessionsApi, apiUsageApi } from '@/db/api';
import type { Conversation } from '@/types/types';
import { guestService } from '@/services/guestService';
import { uploadTrackerService } from '@/services/uploadTrackerService';
import { getRandomGreeting } from '@/utils/greetings';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const SUGGESTIONS = [
  {
    icon: ImageIcon,
    title: '🎨 Generate Image',
    description: 'Create stunning AI-generated visuals',
    prompt: 'Generate an image of a futuristic eco-city with glass towers at sunrise',
  },
  {
    icon: Code,
    title: '💻 Build Interactive Artifact',
    description: 'Ready-to-open HTML/React files',
    prompt: 'Create a complete single-file HTML/CSS/JS interactive Pomodoro timer app with // filename: index.html',
  },
  {
    icon: Brain,
    title: '🧠 Deep Architecture',
    description: 'Reason through complex systems',
    prompt: 'Design a scalable microservices architecture with SQL schema and TypeScript API endpoints',
  },
  {
    icon: Sparkles,
    title: '✨ Creative Studio',
    description: 'High-converting copy and stories',
    prompt: 'Write a compelling product launch landing page copy for Flash AI',
  },
];

export type AiModeId = 'general' | 'turbo' | 'roblox' | 'minecraft' | 'code' | 'research' | 'analyst' | 'creative' | 'video';

export interface AiModeDef {
  id: AiModeId;
  name: string;
  icon: string;
  description: string;
  systemPrompt: string;
}

export const AI_MODES: AiModeDef[] = [
  { id: 'general', name: 'General', icon: '⚡', description: 'Fast assistant for daily tasks', systemPrompt: '' },
  { id: 'turbo', name: 'Turbo Speed', icon: '🚀', description: 'Ultra low latency token streaming', systemPrompt: 'You are Flash AI in Turbo mode. Give direct, accurate answers.' },
  { id: 'code', name: 'Claude Artifacts & Code', icon: '💻', description: 'Generates ready-to-open files & previews', systemPrompt: 'Always include a filename comment on line 1 of every code block (e.g. `// filename: App.tsx` or `<!-- filename: index.html -->`) so Flash AI renders interactive Claude-style Artifact cards.' },
  { id: 'roblox', name: 'Roblox Builder', icon: '🎮', description: 'Luau scripts & .rbxmx structures', systemPrompt: 'Output clean Luau scripts with `-- filename: Server.luau` annotations.' },
  { id: 'minecraft', name: 'Minecraft Datapack', icon: '⛏️', description: '1.21+ Datapack functions', systemPrompt: 'Format outputs with `# filename: data/custom/functions/tick.mcfunction`.' },
  { id: 'research', name: 'Deep Research', icon: '🔍', description: 'Structured executive reports', systemPrompt: 'Provide structured reports with clear citations and takeaways.' },
  { id: 'analyst', name: 'Data Analyst', icon: '📊', description: 'Tables, metrics & CSV structures', systemPrompt: 'Output clean Markdown tables and statistical insights.' },
  { id: 'creative', name: 'Creative Studio', icon: '✨', description: 'Storytelling & copywriting', systemPrompt: 'Write vivid, engaging prose.' },
  { id: 'video', name: 'Video & SFX', icon: '🎬', description: 'Motion prompts & soundscapes', systemPrompt: 'Provide vivid cinematic video prompts.' },
];

function generateTitle(prompt: string): string {
  const cleaned = prompt.trim().replace(/\s+/g, ' ');
  return cleaned.length <= 50 ? cleaned : cleaned.substring(0, 47) + '...';
}

const EFFORT_TONES: Record<EffortLevel, string> = {
  low: 'border-cyan-500/35 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
  medium: 'border-sky-500/35 bg-sky-500/10 text-sky-600 dark:text-sky-400',
  high: 'border-amber-500/35 bg-amber-500/10 text-amber-600 dark:text-amber-400',
};

export default function Chat() {
  const [searchParams] = useSearchParams();
  const sharedFileSlug = searchParams.get('shared_file');
  const sharedRecord = useMemo(
    () => (sharedFileSlug ? uploadTrackerService.getSharedFile(sharedFileSlug) : null),
    [sharedFileSlug]
  );

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [streamingActivity, setStreamingActivity] = useState('Thinking');
  const [attachedImages, setAttachedImages] = useState<ImageAttachment[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<ModelId>('f1');
  const [selectedEffort, setSelectedEffort] = useState<EffortLevel>('low');
  const [activeMode, setActiveMode] = useState<AiModeId>('general');
  const [showModeMenu, setShowModeMenu] = useState(false);
  const [streamingMode, setStreamingMode] = useState<'stream' | 'instant'>('stream');
  const [showModelMenu, setShowModelMenu] = useState(false);
  const [showEffortMenu, setShowEffortMenu] = useState(false);
  const [showMobileModelSheet, setShowMobileModelSheet] = useState(false);
  const [upgradeModal, setUpgradeModal] = useState<{ open: boolean; feature?: string }>({ open: false });
  const [systemPrompts, setSystemPrompts] = useState<Record<string, string>>(() => {
    try { return JSON.parse(localStorage.getItem('flash_system_prompts') || '{}'); } catch { return {}; }
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();

  const isGuest = guestService.isGuest() || !profile;
  const effectivePlan: PlanType = useMemo(() => {
    if (isGuest) return 'guest';
    const override = localStorage.getItem('flash_active_plan_override') as PlanType | null;
    if (override && DAILY_CREDIT_LIMITS[override]) return override;
    const rawPlan = (profile?.plan || 'free') as string;
    if (rawPlan === 'basic') return 'free';
    return (DAILY_CREDIT_LIMITS[rawPlan as PlanType] ? rawPlan : 'free') as PlanType;
  }, [isGuest, profile?.plan]);

  // Real-Time Credits State
  const [realtimeCredits, setRealtimeCredits] = useState<number>(() => {
    if (isGuest) return guestService.getCredits();
    const saved = localStorage.getItem('flash_realtime_user_credits');
    if (saved !== null) return parseInt(saved, 10);
    return DAILY_CREDIT_LIMITS[effectivePlan] || 11000;
  });

  // Real-Time Upload Bytes State
  const userIdKey = isGuest ? 'guest' : (profile?.id || 'user');
  const [usedUploadBytes, setUsedUploadBytes] = useState<number>(() =>
    uploadTrackerService.getUsedBytes(userIdKey)
  );
  const maxUploadBytes = uploadTrackerService.getLimitBytes(effectivePlan);

  useEffect(() => {
    if (isGuest) {
      setRealtimeCredits(guestService.getCredits());
    } else {
      const saved = localStorage.getItem('flash_realtime_user_credits');
      const planDefault = DAILY_CREDIT_LIMITS[effectivePlan] || 11000;
      setRealtimeCredits(saved !== null ? parseInt(saved, 10) : planDefault);
    }
    setUsedUploadBytes(uploadTrackerService.getUsedBytes(userIdKey));
  }, [isGuest, effectivePlan, userIdKey]);

  useEffect(() => {
    const onCreditsUpdate = (e: Event) => {
      const detail = (e as CustomEvent<number>).detail;
      if (typeof detail === 'number') setRealtimeCredits(detail);
    };
    const onUploadUpdate = (e: Event) => {
      const detail = (e as CustomEvent<number>).detail;
      if (typeof detail === 'number') setUsedUploadBytes(detail);
    };
    window.addEventListener('flash_credits_updated', onCreditsUpdate);
    window.addEventListener('flash_upload_updated', onUploadUpdate);
    return () => {
      window.removeEventListener('flash_credits_updated', onCreditsUpdate);
      window.removeEventListener('flash_upload_updated', onUploadUpdate);
    };
  }, []);

  const deductRealtimeCredits = useCallback((cost: number): boolean => {
    if (profile?.role === 'admin') return true;
    if (isGuest) {
      const ok = guestService.deductCredits(cost);
      setRealtimeCredits(guestService.getCredits());
      return ok;
    }
    if (realtimeCredits < cost) return false;
    const next = Math.max(0, realtimeCredits - cost);
    setRealtimeCredits(next);
    localStorage.setItem('flash_realtime_user_credits', String(next));
    window.dispatchEvent(new CustomEvent('flash_credits_updated', { detail: next }));
    return true;
  }, [isGuest, profile?.role, realtimeCredits]);

  // 42 Personalized Hero Greetings
  const displayName = isGuest ? 'Guest' : (profile?.full_name || profile?.username || 'Creator');
  const heroGreeting = useMemo(() => getRandomGreeting(displayName), [displayName, currentConversationId]);

  const [isVideoStudioOpen, setIsVideoStudioOpen] = useState(false);
  const [videoStudioPrompt, setVideoStudioPrompt] = useState('');
  const [isGameBridgeOpen, setIsGameBridgeOpen] = useState(false);
  const [gameBridgeTopic, setGameBridgeTopic] = useState('Obby Checkpoints');
  const [isPluginCenterOpen, setIsPluginCenterOpen] = useState(false);
  const [isInstallAppOpen, setIsInstallAppOpen] = useState(false);
  const [isBugReportOpen, setIsBugReportOpen] = useState(false);
  const [activePlugins, setActivePlugins] = useState<PluginDefinition[]>(() =>
    pluginService.getActivePlugins()
  );

  const allowedModels = PLAN_MODEL_ACCESS[effectivePlan] ?? PLAN_MODEL_ACCESS.free;
  const allowedEfforts = PLAN_EFFORT_ACCESS[effectivePlan] ?? PLAN_EFFORT_ACCESS.free;
  const selectedModelDef = ALL_MODELS.find(m => m.id === selectedModel) ?? ALL_MODELS[0];
  const isAccureModel = selectedModel === 'accure';
  const currentConv = conversations.find(c => c.id === currentConversationId);
  const tokenCount = Math.ceil(input.length / 4);

  useEffect(() => {
    loadConversations();
  }, [isGuest, profile?.id]);

  useEffect(() => {
    if (currentConversationId) loadMessages(currentConversationId);
  }, [currentConversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  const loadConversations = async () => {
    if (isGuest) {
      const localConvs = guestService.getConversations();
      setConversations(localConvs);
      if (localConvs.length > 0 && !currentConversationId) setCurrentConversationId(localConvs[0].id);
      return;
    }
    const convs = await conversationsApi.getConversations();
    setConversations(convs);
    if (convs.length > 0 && !currentConversationId) setCurrentConversationId(convs[0].id);
  };

  const loadMessages = async (conversationId: string) => {
    if (isGuest) {
      const conv = guestService.getConversations().find((c: any) => c.id === conversationId);
      setMessages(conv?.messages || []);
      return;
    }
    const msgs = await messagesApi.getMessages(conversationId);
    setMessages(
      msgs.map((m) => ({
        id: m.id,
        role: m.role === 'user' ? 'user' : 'model',
        content: m.content,
        timestamp: new Date(m.created_at).getTime(),
        images: m.images || undefined,
      }))
    );
  };

  const handleNewConversation = async () => {
    if (isGuest) {
      const newConv: Conversation = {
        id: crypto.randomUUID(),
        user_id: 'guest',
        title: 'New Chat',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      guestService.saveConversation(newConv);
      setConversations([newConv, ...conversations]);
      setCurrentConversationId(newConv.id);
      setMessages([]);
      setIsSidebarOpen(false);
      return;
    }
    const newConv = await conversationsApi.createConversation('New Chat');
    if (newConv) {
      setConversations([newConv, ...conversations]);
      setCurrentConversationId(newConv.id);
      setMessages([]);
      setIsSidebarOpen(false);
    }
  };

  const handleDeleteConversation = async (id: string) => {
    if (isGuest) {
      const updated = conversations.filter((c) => c.id !== id);
      setConversations(updated);
      localStorage.setItem('flash_guest_conversations', JSON.stringify(updated));
      if (currentConversationId === id) {
        setCurrentConversationId(updated[0]?.id || null);
        setMessages([]);
      }
      return;
    }
    const ok = await conversationsApi.deleteConversation(id);
    if (ok) {
      const updated = conversations.filter((c) => c.id !== id);
      setConversations(updated);
      if (currentConversationId === id) {
        setCurrentConversationId(updated[0]?.id || null);
        setMessages([]);
      }
    }
  };

  const handleRenameConversation = async (id: string, title: string) => {
    if (!isGuest) await conversationsApi.updateConversationTitle(id, title);
    setConversations(prev => prev.map(c => c.id === id ? { ...c, title } : c));
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newImages: ImageAttachment[] = [];
    for (const file of Array.from(files)) {
      const check = uploadTrackerService.canUpload(file.size, userIdKey, effectivePlan);
      if (!check.allowed) {
        toast.error(check.reason || 'Upload limit reached');
        setUpgradeModal({ open: true, feature: 'storage_quota' });
        break;
      }

      try {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => resolve((reader.result as string).split(',')[1]);
          reader.onerror = reject;
        });
        newImages.push({ data: base64, mimeType: file.type || 'application/octet-stream', name: file.name });
        uploadTrackerService.recordUpload(file.size, userIdKey);
      } catch {
        toast.error(`Failed to read ${file.name}`);
      }
    }

    setAttachedImages(curr => [...curr, ...newImages]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || input.trim();
    if (!textToSend && attachedImages.length === 0) return;
    if (isLoading) return;

    const cost = estimateCredits(selectedModel, selectedEffort);
    if (!deductRealtimeCredits(cost)) {
      toast.error(`Insufficient credits (${realtimeCredits} left). Upgrade your plan to continue!`);
      setUpgradeModal({ open: true, feature: 'credits' });
      return;
    }

    const moderation = moderateContent(textToSend);
    if (!moderation.isAppropriate && moderation.category === 'harmful') {
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'model',
        content: moderation.warningMessage || 'Content flagged.',
        timestamp: Date.now(),
      }]);
      setInput('');
      return;
    }

    if (isImageGenerationRequest(textToSend)) {
      if (isGuest) {
        toast.error('Image generation requires an account.');
        return;
      }
      setIsLoading(true);
      try {
        const img = attachedImages.length > 0
          ? await generateImageFromImage(attachedImages[0].data, attachedImages[0].mimeType as any, textToSend)
          : await generateImageFromText(textToSend);
        setMessages(prev => [
          ...prev,
          { id: crypto.randomUUID(), role: 'user', content: textToSend, timestamp: Date.now() },
          {
            id: crypto.randomUUID(),
            role: 'model',
            content: '✨ Generated image ready:',
            timestamp: Date.now(),
            media: { type: 'image', data: img, mimeType: 'image/png', name: 'generated.png' },
          },
        ]);
        setInput('');
      } catch (err: any) {
        toast.error(err?.message || 'Image generation failed');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    let convId = currentConversationId;
    try {
      if (!convId) {
        const title = generateTitle(textToSend || 'Artifact Workspace');
        if (isGuest) {
          const newConv: Conversation = {
            id: crypto.randomUUID(),
            user_id: 'guest',
            title,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          guestService.saveConversation(newConv);
          convId = newConv.id;
          setCurrentConversationId(convId);
          setConversations(prev => [newConv, ...prev]);
        } else {
          const newConv = await conversationsApi.createConversation(title);
          if (newConv) {
            convId = newConv.id;
            setCurrentConversationId(convId);
            setConversations(prev => [newConv, ...prev]);
          }
        }
      }

      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: 'user',
        content: textToSend,
        timestamp: Date.now(),
        images: attachedImages.length > 0 ? attachedImages : undefined,
      };

      const nextMessages = [...messages, userMessage];
      setMessages(nextMessages);
      setInput('');
      setAttachedImages([]);
      setIsLoading(true);
      setStreamingActivity('Thinking');
      setStreamingContent('');

      if (convId && !isGuest) {
        await messagesApi.createMessage(convId, 'user', textToSend, userMessage.images).catch(() => {});
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      const activeModeDef = AI_MODES.find(m => m.id === activeMode);
      const artifactInstruction = 'When outputting code or files, include a filename comment on line 1 (e.g., `// filename: App.tsx` or `<!-- filename: index.html -->`) so the user can open or download it as a Claude-style Artifact.';
      const systemInstruction = [activeModeDef?.systemPrompt, artifactInstruction, convId ? systemPrompts[convId] : ''].filter(Boolean).join('\n\n');

      const apiMessages: ApiContent[] = [
        { role: 'user', parts: [{ text: `[SYSTEM INSTRUCTION: ${systemInstruction}]` }] },
        { role: 'model', parts: [{ text: 'Understood.' }] },
        ...nextMessages.map((msg) => ({
          role: msg.role,
          parts: [
            ...(msg.images?.map(img => ({ inlineData: { mimeType: img.mimeType, data: img.data } })) || []),
            ...(msg.content ? [{ text: msg.content }] : []),
          ],
        })),
      ];

      let fullResponse = '';
      let streamMetrics: StreamMetrics | null = null;

      for await (const chunk of streamChat(apiMessages, selectedModel, selectedEffort, effectivePlan, controller.signal, (m) => { streamMetrics = m; })) {
        if (controller.signal.aborted) break;
        fullResponse += chunk;
        if (streamingMode === 'stream') setStreamingContent(fullResponse);
      }

      if (fullResponse) {
        const assistantMessage: Message = {
          id: crypto.randomUUID(),
          role: 'model',
          content: fullResponse,
          timestamp: Date.now(),
        };
        const updatedAll = [...nextMessages, assistantMessage];
        setMessages(updatedAll);
        setStreamingContent('');

        if (isGuest && convId) {
          guestService.saveConversation({
            id: convId,
            user_id: 'guest',
            title: generateTitle(textToSend),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            messages: updatedAll,
          });
        } else if (convId) {
          await messagesApi.createMessage(convId, 'assistant', fullResponse).catch(() => {});
        }

        if (profile?.id && streamMetrics && !isGuest) {
          const m = streamMetrics as StreamMetrics;
          apiUsageApi.logUsage({
            model: selectedModel,
            inputTokens: m.inputTokens,
            outputTokens: m.outputTokens,
            creditsUsed: cost,
            source: 'chat',
            responseMs: m.durationMs,
          }).catch(() => {});
        }
      }
    } catch (error: any) {
      toast.error(error?.message || 'Connection error');
    } finally {
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  };

  // Shared File Public Web Viewer (when visiting flashai.rf.gd/?shared_file=slug)
  if (sharedRecord) {
    return (
      <div className="min-h-screen bg-background text-foreground p-6 flex flex-col items-center">
        <div className="max-w-4xl w-full space-y-4">
          <div className="flex items-center justify-between p-4 rounded-2xl border bg-card">
            <div>
              <h1 className="text-lg font-bold flex items-center gap-2">
                🌐 Shared File: {sharedRecord.filename}
              </h1>
              <p className="text-xs text-muted-foreground">
                Hosted via Flash AI ({sharedRecord.publicUrl})
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => {
                  const blob = new Blob([sharedRecord.content], { type: sharedRecord.mimeType });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = sharedRecord.filename;
                  a.click();
                }}
              >
                <Download className="w-4 h-4 mr-1.5" /> Download File
              </Button>
              <Button size="sm" variant="outline" onClick={() => navigate('/')}>
                Open Flash AI
              </Button>
            </div>
          </div>
          <pre className="p-5 rounded-2xl bg-slate-950 text-slate-100 text-xs font-mono overflow-x-auto">
            <code>{sharedRecord.content}</code>
          </pre>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen h-[100dvh] min-h-0 overflow-hidden bg-background">
      <ChatHistory
        conversations={conversations}
        currentConversationId={currentConversationId}
        onSelectConversation={(id) => { setCurrentConversationId(id); setIsSidebarOpen(false); }}
        onNewConversation={handleNewConversation}
        onDeleteConversation={handleDeleteConversation}
        onRenameConversation={handleRenameConversation}
        systemPrompts={systemPrompts}
        onSystemPromptChange={(id, p) => {
          const next = { ...systemPrompts, [id]: p };
          setSystemPrompts(next);
          localStorage.setItem('flash_system_prompts', JSON.stringify(next));
        }}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Responsive Header */}
        <header className="border-b border-border/60 bg-card/80 backdrop-blur-md sticky top-0 z-30">
          <div className="container mx-auto px-2.5 sm:px-4 py-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
              <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(true)} className="md:hidden shrink-0 h-8 w-8">
                <Menu className="w-4 h-4" />
              </Button>
              <FlashLogo className="w-7 h-7 rounded-lg shrink-0" />
              <span className="font-semibold text-sm tracking-tight hidden lg:inline-block shrink-0">Flash AI</span>

              {currentConv && (
                <div className="flex items-center gap-1 min-w-0 max-w-[110px] xs:max-w-[150px] sm:max-w-[220px] pl-1.5 border-l border-border/40">
                  <span className="text-xs text-muted-foreground truncate block">
                    {currentConv.title || 'New Chat'}
                  </span>
                </div>
              )}

              {messages.length > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => currentConversationId ? handleDeleteConversation(currentConversationId) : setMessages([])}
                  className="h-7 w-7 sm:w-auto sm:px-2 text-xs text-muted-foreground hover:text-destructive shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline ml-1">Clear</span>
                </Button>
              )}
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {/* Real-Time Credits Badge */}
              <div
                onClick={() => navigate('/plans')}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-[11px] font-semibold cursor-pointer hover:bg-primary/15 transition-colors"
                title="Real-time remaining credits"
              >
                <Zap className="w-3 h-3 shrink-0" />
                <span className="tabular-nums font-mono">{realtimeCredits.toLocaleString()} cr</span>
              </div>

              {/* Real-Time Upload Quota Indicator */}
              <div
                onClick={() => navigate('/media-hub')}
                className="hidden md:flex items-center gap-1 px-2.5 py-1 rounded-full border border-border bg-muted/50 text-muted-foreground text-[11px] cursor-pointer hover:text-foreground"
                title="Real-time upload storage used"
              >
                <HardDrive className="w-3 h-3 text-primary shrink-0" />
                <span>
                  {uploadTrackerService.formatBytes(usedUploadBytes)} / {uploadTrackerService.formatBytes(maxUploadBytes)}
                </span>
              </div>

              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate('/api-keys')}
                className="hidden sm:flex h-7 px-2 text-xs gap-1"
              >
                <Key className="w-3 h-3 text-primary" />
                <span>API Keys</span>
              </Button>

              {(isGuest || effectivePlan === 'free' || effectivePlan === 'plus') && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate('/plans')}
                  className="h-7 px-2 text-[11px] sm:text-xs text-primary border-primary/40 hover:bg-primary/10 shrink-0"
                >
                  <ArrowUp className="w-3 h-3 mr-0.5" />
                  Upgrade
                </Button>
              )}

              <ThemeToggle />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full w-8 h-8 shrink-0">
                    <Avatar className="w-7 h-7">
                      <AvatarImage src={profile?.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/20 text-primary text-[11px] font-semibold">
                        {isGuest ? 'G' : (profile?.username?.[0] || profile?.email?.[0] || 'U').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <p className="text-sm font-semibold">{displayName}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {effectivePlan} Plan · {realtimeCredits.toLocaleString()} credits
                    </p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/plans')}><Crown className="mr-2 h-4 w-4 text-amber-500" />Plans & Credits</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/api-keys')}><Key className="mr-2 h-4 w-4 text-primary" />Real-Time API Keys</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/media-hub')}><FolderOpen className="mr-2 h-4 w-4" />Media & Files Hub</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/settings')}><SettingsIcon className="mr-2 h-4 w-4" />Settings</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setIsInstallAppOpen(true)}><Download className="mr-2 h-4 w-4 text-cyan-500" />Download App</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setIsBugReportOpen(true)}><Bug className="mr-2 h-4 w-4 text-rose-500" />Report a Bug</DropdownMenuItem>
                  {profile?.role === 'admin' && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => navigate('/admin')}><User className="mr-2 h-4 w-4" />Admin Dashboard</DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      if (isGuest) {
                        guestService.exitGuestMode();
                        navigate('/login');
                      } else {
                        signOut();
                      }
                    }}
                    className="text-destructive"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    {isGuest ? 'Exit Guest Mode' : 'Sign Out'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Chat Messages & 42 Hero Greetings */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="container mx-auto px-4 xl:px-6 py-6 max-w-4xl">
            {messages.length === 0 && !streamingContent ? (
              <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                <FlashLogo className="mb-5 h-16 w-16 rounded-2xl shadow-lg" />
                <h2 className="text-2xl sm:text-3xl font-bold mb-2 gradient-text max-w-xl">
                  {heroGreeting}
                </h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Real-time streaming, Claude-style ready-to-open artifacts, and instant web file hosting.
                </p>
                <div className="flex items-center gap-2 mb-6 flex-wrap justify-center text-xs">
                  <span className="px-3 py-1 rounded-full bg-primary/10 text-primary font-medium">
                    ⚡ {realtimeCredits.toLocaleString()} Credits Available
                  </span>
                  <span className="px-3 py-1 rounded-full bg-muted text-muted-foreground font-medium">
                    💾 {uploadTrackerService.formatBytes(maxUploadBytes - usedUploadBytes)} Upload Space Free
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 w-full max-w-2xl">
                  {SUGGESTIONS.map((s, idx) => (
                    <SuggestionCard key={idx} {...s} onClick={() => { setInput(s.prompt); textareaRef.current?.focus(); }} />
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {messages.map((message) => {
                  const artifacts = message.role === 'model' ? extractArtifactsFromContent(message.content) : [];
                  return (
                    <div key={message.id} className="space-y-2">
                      <MessageBubble
                        messageId={message.id}
                        role={message.role}
                        content={message.content}
                        images={message.images}
                        media={message.media}
                        modelName={selectedModelDef.name}
                        timestamp={message.timestamp}
                      />
                      {artifacts.length > 0 && (
                        <ArtifactViewer
                          artifacts={artifacts}
                          userPlan={effectivePlan}
                          userCredits={realtimeCredits}
                          userId={userIdKey}
                        />
                      )}
                    </div>
                  );
                })}
                {(streamingContent || (isLoading && streamingActivity)) && (
                  <MessageBubble
                    messageId="streaming_active"
                    role="model"
                    content={streamingContent}
                    isStreaming
                    modelName={selectedModelDef.name}
                    activityLabel={streamingActivity}
                  />
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>

        {/* Input Composer (Voice Removed) */}
        <div className="border-t border-border/60 bg-card/60 backdrop-blur-md">
          <div className="container mx-auto px-3 sm:px-4 py-2.5 max-w-3xl">
            {attachedImages.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2 p-2 bg-muted/40 rounded-xl border border-border/50">
                {attachedImages.map((image, index) => (
                  <div key={index} className="relative group rounded-lg overflow-hidden border border-border/60">
                    <img src={`data:${image.mimeType};base64,${image.data}`} alt={image.name} className="w-14 h-14 object-cover" />
                    <button
                      onClick={() => setAttachedImages(attachedImages.filter((_, i) => i !== index))}
                      className="absolute top-0.5 right-0.5 bg-destructive text-white rounded-full p-0.5"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="rounded-3xl border border-border bg-background/90 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/15 transition-all shadow-md">
              <div className="relative">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder={`Message ${selectedModelDef.name}…`}
                  disabled={isLoading}
                  rows={1}
                  className="w-full resize-none bg-transparent px-4 pt-3 pb-2 text-sm leading-6 focus:outline-none min-h-[48px]"
                />
                {tokenCount > 0 && (
                  <span className="absolute top-2.5 right-3 text-[10px] text-muted-foreground/50 font-mono">
                    ~{tokenCount}t
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between gap-1.5 px-3 pb-2 pt-1 border-t border-border/30">
                <input ref={fileInputRef} type="file" multiple onChange={handleFileSelect} className="hidden" />

                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                  {/* Model Selector */}
                  <DropdownMenu open={showModelMenu} onOpenChange={setShowModelMenu}>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-xs font-medium border border-primary/30 bg-primary/10 text-primary"
                      >
                        {isAccureModel ? <Brain className="w-3.5 h-3.5" /> : <Zap className="w-3.5 h-3.5" />}
                        <span>{selectedModelDef.name}</span>
                        <ChevronDown className="w-3 h-3" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-60">
                      {ALL_MODELS.map((m) => {
                        const locked = !allowedModels.includes(m.id);
                        return (
                          <DropdownMenuItem
                            key={m.id}
                            onClick={() => {
                              if (locked) {
                                setUpgradeModal({ open: true, feature: m.name });
                              } else {
                                setSelectedModel(m.id);
                              }
                            }}
                            className="text-xs flex items-center justify-between"
                          >
                            <span>{m.icon} {m.name}</span>
                            {locked && <Crown className="w-3.5 h-3.5 text-amber-500" />}
                          </DropdownMenuItem>
                        );
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Effort Selector */}
                  <DropdownMenu open={showEffortMenu} onOpenChange={setShowEffortMenu}>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className={cn('flex items-center gap-1 h-7 px-2 rounded-lg text-xs font-medium border capitalize', EFFORT_TONES[selectedEffort])}
                      >
                        <Gauge className="w-3 h-3" />
                        <span>{selectedEffort}</span>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      {EFFORT_LEVELS.map((e) => (
                        <DropdownMenuItem
                          key={e}
                          onClick={() => {
                            if (!allowedEfforts.includes(e)) {
                              setUpgradeModal({ open: true, feature: `${e} effort` });
                            } else {
                              setSelectedEffort(e);
                            }
                          }}
                          className="text-xs capitalize"
                        >
                          {e} effort
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* File Upload Button */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading}
                    title={`Upload file (${uploadTrackerService.formatBytes(usedUploadBytes)} / ${uploadTrackerService.formatBytes(maxUploadBytes)})`}
                    className="flex items-center justify-center h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                  >
                    <Paperclip className="w-3.5 h-3.5" />
                  </button>

                  <span className="text-[10px] text-muted-foreground hidden sm:inline">
                    -{estimateCredits(selectedModel, selectedEffort)} cr/msg
                  </span>
                </div>

                {/* Send / Stop Button */}
                <button
                  type="button"
                  onClick={isLoading ? () => abortControllerRef.current?.abort() : () => handleSend()}
                  disabled={!isLoading && !input.trim() && attachedImages.length === 0}
                  className={cn(
                    'flex items-center justify-center h-8 w-8 rounded-xl transition-all disabled:opacity-30',
                    isLoading ? 'bg-destructive text-destructive-foreground' : 'bg-primary text-primary-foreground'
                  )}
                >
                  {isLoading ? <Square className="w-3.5 h-3.5 fill-current" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <UpgradeModal
        open={upgradeModal.open}
        onClose={() => setUpgradeModal({ open: false })}
        featureName={upgradeModal.feature}
      />
      <VideoGenerationModal open={isVideoStudioOpen} onOpenChange={setIsVideoStudioOpen} initialPrompt={videoStudioPrompt} />
      <GameBridgeModal open={isGameBridgeOpen} onOpenChange={setIsGameBridgeOpen} initialTopic={gameBridgeTopic} />
      <PluginCenterModal
        open={isPluginCenterOpen}
        onOpenChange={setIsPluginCenterOpen}
        onPluginToggled={() => setActivePlugins(pluginService.getActivePlugins())}
      />
      <AppInstallModal open={isInstallAppOpen} onOpenChange={setIsInstallAppOpen} />
      <BugReportModal open={isBugReportOpen} onOpenChange={setIsBugReportOpen} />
    </div>
  );
}