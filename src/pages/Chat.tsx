import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Send, Square, Download, Trash2, Zap, Paperclip, X, Code,
  Sparkles, Crown, LogOut, User, Menu, ArrowUp,
  Image as ImageIcon, Settings as SettingsIcon, Smartphone,
  Mic, MicOff, Key, Brain, ChevronDown, Gauge,
  FolderOpen, Video, Box,
  Volume2, AudioLines, Radio, Blocks, Bug,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VideoGenerationModal } from '@/components/media/VideoGenerationModal';
import { GameBridgeModal } from '@/components/bridge/GameBridgeModal';
import { VoiceSettingsModal } from '@/components/voice/VoiceSettingsModal';
import { LiveVoiceModeModal } from '@/components/voice/LiveVoiceModeModal';
import { PluginCenterModal } from '@/components/plugins/PluginCenterModal';
import { AppInstallModal } from '@/components/install/AppInstallModal';
import { BugReportModal } from '@/components/bugs/BugReportModal';
import { pluginService, type PluginDefinition } from '@/services/pluginService';
import { voiceAssistantService } from '@/services/voiceAssistantService';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { SuggestionCard } from '@/components/chat/SuggestionCard';
import { MediaGallery } from '@/components/chat/MediaGallery';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { FlashLogo } from '@/components/common/FlashLogo';
import { ChatHistory } from '@/components/chat/ChatHistory';
import { UpgradeModal } from '@/components/chat/UpgradeModal';
import { streamChat } from '@/services/llm';
import type { StreamMetrics } from '@/services/llm';
import { generateImageFromText, generateImageFromImage, isImageGenerationRequest } from '@/services/imageGeneration';
import { moderateContent, checkFeaturePermission } from '@/services/contentModeration';
import type { Message, ApiContent, ImageAttachment } from '@/types/chat';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import {
  DAILY_CREDIT_LIMITS, CREDIT_COSTS, ALL_MODELS, EFFORT_LEVELS,
  PLAN_MODEL_ACCESS, PLAN_EFFORT_ACCESS, estimateCredits,
} from '@/types/plans';
import type { ModelId, EffortLevel } from '@/types/plans';
import { useAuth } from '@/components/auth/AuthProvider';
import { conversationsApi, messagesApi, sessionsApi, apiUsageApi } from '@/db/api';
import type { Conversation } from '@/types/types';
import { 
  getOrCreateAnonSession, 
  hasAnonCredits, 
  getAnonRemainingCredits,
  trackAnonCredits 
} from '@/services/anonSessionService';
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
    description: 'Create stunning AI-generated images',
    prompt: 'Generate an image of a futuristic city with flying cars at sunset',
  },
  {
    icon: Code,
    title: '💻 Write Code',
    description: 'Get help with programming',
    prompt: 'Can you help me create a React component with TypeScript for a todo list?',
  },
  {
    icon: Brain,
    title: '🧠 Deep Analysis',
    description: 'Reason through complex problems',
    prompt: 'Explain the difference between supervised and unsupervised learning with examples',
  },
  {
    icon: Sparkles,
    title: '✨ Creative Writing',
    description: 'Generate stories and creative content',
    prompt: 'Write a short story about an AI that learns to paint',
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
  {
    id: 'general',
    name: 'General',
    icon: '⚡',
    description: 'Fast, responsive assistant for daily questions and tasks',
    systemPrompt: '',
  },
  {
    id: 'turbo',
    name: 'Turbo Speed',
    icon: '🚀',
    description: 'Blazing fast inference with ultra low latency token streaming',
    systemPrompt: 'You are Flash AI running in Ultra-Fast Turbo mode. Give direct, highly efficient, accurate, zero-fluff responses with instant code snippets and answers.',
  },
  {
    id: 'roblox',
    name: 'Roblox AI Builder',
    icon: '🎮',
    description: 'Build Roblox games (Lemon.gg & Superbullet AI style) with Luau & .rbxmx models',
    systemPrompt: 'You are an elite Roblox AI game builder inspired by platforms like Lemon.gg and Superbullet AI. When asked to create Roblox mechanics (combat, anime battlegrounds, pet simulators, obbies, tycoon droppers), output clean, typed Luau code with filename annotations like `-- filename: src/server/CombatServer.luau` and `-- filename: src/client/CombatClient.luau` so Flash AI automatically bundles them into ready-to-open .zip projects and .rbxmx models. Explain how to import into Roblox Studio via Rojo or Explorer.',
  },
  {
    id: 'minecraft',
    name: 'Minecraft Datapack',
    icon: '⛏️',
    description: '1.21+ Datapacks, .mcfunction loops, custom spells & loot tables',
    systemPrompt: 'You are an expert Minecraft datapack developer. Format all outputs with standard datapack file paths (e.g. `# filename: data/custom/functions/tick.mcfunction` and `pack.mcmeta`) so the user can download a ready-to-open Minecraft datapack ZIP archive and drop it directly into their world folder.',
  },
  {
    id: 'video',
    name: 'Video & SFX',
    icon: '🎬',
    description: 'Generates motion videos with synchronized sound effects & audio track',
    systemPrompt: 'You are an audiovisual media director. When asked to create videos, provide vivid cinematic prompt descriptions, specify audio soundscape genres (cinematic, ambient, sci-fi, nature, action), and recommend camera motions. Inform the user they can also click the Video Studio button in the toolbar to render directly with procedural sound effects.',
  },
  {
    id: 'code',
    name: 'Coding & ZIP Projects',
    icon: '💻',
    description: 'Generates multi-file code artifacts with 1-click ready-to-open ZIP export',
    systemPrompt: 'You are an elite software architect and coding assistant. When generating code, format code in proper markdown blocks with filenames (e.g. `// filename: App.tsx`) so they automatically render as interactive Claude-style Artifact cards with 1-click Ready-to-Open ZIP project download buttons.',
  },
  {
    id: 'research',
    name: 'Deep Research',
    icon: '🔍',
    description: 'Structured reports, cited arguments, and comprehensive summaries',
    systemPrompt: 'You are a meticulous research analyst. Structure your answers with clear executive summaries, detailed analysis, and key takeaways. Be objective, thorough, and precise.',
  },
  {
    id: 'analyst',
    name: 'Data Analyst',
    icon: '📊',
    description: 'Data tables, calculations, statistical metrics, and CSV structures',
    systemPrompt: 'You are an expert data analyst. Whenever dealing with data, output clean Markdown tables, statistical interpretations, step-by-step calculations, and actionable takeaways.',
  },
  {
    id: 'creative',
    name: 'Creative Studio',
    icon: '✨',
    description: 'Engaging storytelling, high-converting copywriting, and scripts',
    systemPrompt: 'You are an award-winning creative writer and copywriter. Write engaging, vivid, evocative prose with natural rhythm, strong emotional resonance, and crisp phrasing.',
  },
];

function generateTitle(prompt: string): string {
  const cleaned = prompt.trim().replace(/\s+/g, ' ');
  if (cleaned.length <= 50) return cleaned;
  return cleaned.substring(0, 47) + '...';
}

const EFFORT_TONES: Record<EffortLevel, string> = {
  instant: 'border-emerald-500/35 bg-emerald-500/10 text-emerald-400',
  low: 'border-cyan-500/35 bg-cyan-500/10 text-cyan-400',
  medium: 'border-sky-500/35 bg-sky-500/10 text-sky-400',
  high: 'border-amber-500/35 bg-amber-500/10 text-amber-400',
  max: 'border-rose-500/35 bg-rose-500/10 text-rose-400',
};

const CHAT_IMAGE_LIMITS = {
  guest: { count: 3, bytes: 20 * 1024 * 1024, perFile: 10 * 1024 * 1024 },
  account: { count: 10, bytes: 50 * 1024 * 1024, perFile: 20 * 1024 * 1024 },
};

function getTaskStatus(prompt: string, activeMode: AiModeId): string {
  const normalizedPrompt = prompt.toLowerCase();
  if (activeMode === 'research' || /\b(research|sources|citations|evidence)\b/.test(normalizedPrompt)) return 'Researching';
  if (/\b(code|coding|program|script|debug|function|component|website|app)\b/.test(normalizedPrompt)) return 'Writing code';
  if (/\b(analy[sz]e|analysis|compare|reason|calculate|solve|explain why)\b/.test(normalizedPrompt)) return 'Analyzing';
  if (activeMode === 'creative' || /\b(create|write|draft|design|story|poem)\b/.test(normalizedPrompt)) return 'Creating';
  return 'Thinking';
}

export default function Chat() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [streamingActivity, setStreamingActivity] = useState('Thinking');
  const [attachedImages, setAttachedImages] = useState<ImageAttachment[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
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
  const [isAnonMode, setIsAnonMode] = useState(false);
  const [anonCreditsRemaining, setAnonCreditsRemaining] = useState(5);
  
  const tokenCount = Math.ceil(input.length / 4);

  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();

  useEffect(() => {
    const isAnon = !profile || profile.id.startsWith('guest_') || profile.id.startsWith('anon_');
    setIsAnonMode(isAnon);
    if (isAnon) {
      getOrCreateAnonSession();
      setAnonCreditsRemaining(getAnonRemainingCredits());
    }
  }, [profile]);

  const [isVideoStudioOpen, setIsVideoStudioOpen] = useState(false);
  const [videoStudioPrompt, setVideoStudioPrompt] = useState('');
  const [isGameBridgeOpen, setIsGameBridgeOpen] = useState(false);
  const [gameBridgeTopic, setGameBridgeTopic] = useState('Obby Checkpoints');
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isLiveVoiceOpen, setIsLiveVoiceOpen] = useState(false);
  const [isPluginCenterOpen, setIsPluginCenterOpen] = useState(false);
  const [isInstallAppOpen, setIsInstallAppOpen] = useState(false);
  const [isBugReportOpen, setIsBugReportOpen] = useState(false);
  const [activePlugins, setActivePlugins] = useState<PluginDefinition[]>(() =>
    pluginService.getActivePlugins()
  );

  const maxFileSize = (profile?.upload_limit_mb || 100) * 1024 * 1024;
  const planKey = (profile?.role === 'admin' ? 'admin' : profile?.plan ?? 'free') as keyof typeof PLAN_MODEL_ACCESS;
  const allowedModels = PLAN_MODEL_ACCESS[planKey] ?? PLAN_MODEL_ACCESS['free'];
  const allowedEfforts = PLAN_EFFORT_ACCESS[planKey] ?? PLAN_EFFORT_ACCESS['free'];
  const selectedModelDef = ALL_MODELS.find(m => m.id === selectedModel) ?? ALL_MODELS[0];
  const selectedEffortDef = EFFORT_LEVELS.find(e => e.id === selectedEffort) ?? EFFORT_LEVELS[2];
  const isAccureModel = selectedModelDef.family === 'accure';
  const currentConv = conversations.find(c => c.id === currentConversationId);

  const dailyLimit =
    profile?.role === 'admin'
      ? -1
      : DAILY_CREDIT_LIMITS[profile?.plan as keyof typeof DAILY_CREDIT_LIMITS] ?? 50;
  const isUnlimited = dailyLimit === -1;

  const checkDailyLimit = useCallback(
    (cost: number): boolean => {
      if (isUnlimited) return false;
      const used = parseInt(sessionStorage.getItem('flash_daily_used') || '0', 10);
      if (used + cost > dailyLimit) {
        const planName = profile?.plan === 'hero' ? 'Plus' : (profile?.plan ?? 'Free');
        toast.error(
          `Daily limit reached (${dailyLimit} credits). ` +
          (profile?.plan === 'free' || profile?.plan === 'hero'
            ? `Upgrade to Pro for unlimited credits.`
            : `${planName} plan: ${dailyLimit} credits/day.`)
        );
        return true;
      }
      return false;
    },
    [isUnlimited, dailyLimit, profile?.plan]
  );

  const recordCreditUse = useCallback((cost: number) => {
    if (isUnlimited) return;
    const used = parseInt(sessionStorage.getItem('flash_daily_used') || '0', 10);
    sessionStorage.setItem('flash_daily_used', String(used + cost));
  }, [isUnlimited]);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    const lineHeight = parseInt(getComputedStyle(ta).lineHeight || '24', 10);
    const maxH = lineHeight * 6 + 24;
    ta.style.height = Math.min(ta.scrollHeight, maxH) + 'px';
    ta.style.overflowY = ta.scrollHeight > maxH ? 'auto' : 'hidden';
  }, [input]);

  useEffect(() => {
    if (input.trimStart().startsWith('/imagine') && selectedModel !== 'f6') {
      setSelectedModel('f6');
      toast.info('Switched to F6 Vision Fast for image generation');
    }
  }, [input, selectedModel]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === '/') {
        e.preventDefault();
        textareaRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleRenameConversation = async (id: string, title: string) => {
    await conversationsApi.updateConversationTitle(id, title);
    setConversations(prev => prev.map(c => c.id === id ? { ...c, title } : c));
  };

  const handleSystemPromptChange = (id: string, prompt: string) => {
    const updated = { ...systemPrompts, [id]: prompt };
    setSystemPrompts(updated);
    try { localStorage.setItem('flash_system_prompts', JSON.stringify(updated)); } catch {}
  };

  const handleEditMessage = useCallback((messageId: string, newContent: string) => {
    const idx = messages.findIndex(m => m.id === messageId);
    if (idx === -1) return;
    setMessages(prev => prev.slice(0, idx));
    handleSend(newContent);
  }, [messages]);

  const handleStopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
    setStreamingContent('');
  }, []);

  const handleModelSelect = (modelId: ModelId) => {
    if (!allowedModels.includes(modelId)) {
      setUpgradeModal({ open: true, feature: 'this model' });
      return;
    }
    setSelectedModel(modelId);
    setShowModelMenu(false);
    setShowMobileModelSheet(false);
    const model = ALL_MODELS.find(m => m.id === modelId);
    if (model?.family === 'accure' && !allowedEfforts.includes(selectedEffort)) {
      setSelectedEffort('medium');
    }
  };

  const handleEffortSelect = (effort: EffortLevel) => {
    if (!allowedEfforts.includes(effort)) {
      setUpgradeModal({ open: true, feature: 'this effort level' });
      return;
    }
    setSelectedEffort(effort);
    setShowEffortMenu(false);
    setShowMobileModelSheet(false);
  };

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (currentConversationId) {
      loadMessages(currentConversationId);
    }
  }, [currentConversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  const loadConversations = async () => {
    const convs = await conversationsApi.getConversations();
    setConversations(convs);
    if (convs.length > 0 && !currentConversationId) {
      setCurrentConversationId(convs[0].id);
    }
  };

  const loadMessages = async (conversationId: string) => {
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
    const newConv = await conversationsApi.createConversation('New Chat');
    if (newConv) {
      setConversations([newConv, ...conversations]);
      setCurrentConversationId(newConv.id);
      setMessages([]);
      setIsSidebarOpen(false);
    }
  };

  const handleSelectConversation = (id: string) => {
    setCurrentConversationId(id);
    setIsSidebarOpen(false);
  };

  const handleDeleteConversation = async (id: string) => {
    const success = await conversationsApi.deleteConversation(id);
    if (success) {
      const updatedConvs = conversations.filter((c) => c.id !== id);
      setConversations(updatedConvs);
      if (currentConversationId === id) {
        if (updatedConvs.length > 0) {
          setCurrentConversationId(updatedConvs[0].id);
        } else {
          setCurrentConversationId(null);
          setMessages([]);
        }
      }
      toast.success('The conversation has been removed.');
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = reader.result as string;
        const base64Data = base64.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const limits = profile?.id.startsWith('guest_') ? CHAT_IMAGE_LIMITS.guest : CHAT_IMAGE_LIMITS.account;
    let pendingCount = attachedImages.length;
    let pendingBytes = attachedImages.reduce((total, image) => total + Math.floor(image.data.length * 0.75), 0);
    const newImages: ImageAttachment[] = [];

    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload only image files (PNG, JPEG, GIF, WebP)');
        continue;
      }

      if (pendingCount >= limits.count) {
        toast.error(`You can attach up to ${limits.count} images per message.`);
        break;
      }

      if (file.size > Math.min(maxFileSize, limits.perFile)) {
        const limitMB = Math.floor(Math.min(maxFileSize, limits.perFile) / (1024 * 1024));
        toast.error(`${file.name} is larger than the ${limitMB}MB per-image limit.`);
        continue;
      }

      if (pendingBytes + file.size > limits.bytes) {
        toast.error(`Attachments are limited to ${Math.floor(limits.bytes / (1024 * 1024))}MB per message.`);
        continue;
      }

      try {
        const base64 = await fileToBase64(file);
        newImages.push({
          data: base64,
          mimeType: file.type,
          name: file.name,
        });
        pendingCount += 1;
        pendingBytes += file.size;
      } catch (error) {
        toast.error(`Failed to read ${file.name}`);
      }
    }

    setAttachedImages(current => [...current, ...newImages]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    setAttachedImages(attachedImages.filter((_, i) => i !== index));
  };

  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || input.trim();
    console.log('[Flash AI] Send triggered. Input text:', textToSend);

    if (!textToSend && attachedImages.length === 0) return;
    if (isLoading) return;

    if (isAnonMode && !hasAnonCredits(1)) {
      toast.error('Daily limit reached. Sign up for free to continue chatting.');
      setUpgradeModal({ open: true, feature: 'unlimited_messages' });
      return;
    }

    const moderation = moderateContent(textToSend);
    if (!moderation.isAppropriate && moderation.category === 'harmful') {
      toast.success('⚠️ Content Notice');
      const helpfulMessage: Message = {
        id: crypto.randomUUID(),
        role: 'model',
        content: moderation.warningMessage || '',
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, helpfulMessage]);
      setInput('');
      return;
    }

    if (isImageGenerationRequest(textToSend)) {
      if (isAnonMode) {
        toast.error('Image generation requires a free account. Sign up to use this feature.');
        setUpgradeModal({ open: true, feature: 'image_generation' });
        return;
      }
      const permission = checkFeaturePermission('image_generation', profile?.plan || 'free');
      if (!permission.allowed) {
        toast.error('Image generation requires Plus plan or higher. Upgrade to use this feature.');
        return;
      }
      if (checkDailyLimit(CREDIT_COSTS.image_generation)) return;
      await handleImageGeneration(textToSend);
      return;
    }

    const chatCost = estimateCredits(selectedModel, selectedEffort);
    if (checkDailyLimit(chatCost)) return;

    let convId = currentConversationId;

    try {
      if (!convId) {
        const title = generateTitle(textToSend || 'Image conversation');
        const newConv = await conversationsApi.createConversation(title);
        if (newConv) {
          convId = newConv.id;
          setCurrentConversationId(convId);
          setConversations(prev => [newConv, ...prev]);
        }
      } else {
        const existingConv = conversations.find((c) => c.id === convId);
        if (existingConv && existingConv.title === 'New Chat' && textToSend) {
          const title = generateTitle(textToSend);
          await conversationsApi.updateConversationTitle(convId, title);
          setConversations(prev =>
            prev.map((c) => (c.id === convId ? { ...c, title } : c))
          );
        }
      }

      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: 'user',
        content: textToSend,
        timestamp: Date.now(),
        images: attachedImages.length > 0 ? attachedImages : undefined,
      };

      setMessages((prev) => [...prev, userMessage]);
      setInput('');
      setAttachedImages([]);
      setIsLoading(true);
      setStreamingActivity(getTaskStatus(textToSend, activeMode));
      setStreamingContent('');

      if (convId) {
        await messagesApi.createMessage(
          convId,
          'user',
          textToSend,
          attachedImages.length > 0 ? attachedImages : undefined
        ).catch((e) => console.warn('Could not save user message to DB:', e));
      }

      if (isAnonMode) {
        trackAnonCredits(1);
        setAnonCreditsRemaining(getAnonRemainingCredits());
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      const activeModeDef = AI_MODES.find(m => m.id === activeMode);
      const systemInstruction = [
        activeModeDef?.systemPrompt,
        convId && systemPrompts[convId] ? systemPrompts[convId] : ''
      ].filter(Boolean).join('\n\n');

      const apiMessages: ApiContent[] = [
        ...(systemInstruction ? [{
          role: 'user' as const,
          parts: [{ text: `[SYSTEM INSTRUCTION: ${systemInstruction}]` }]
        }, {
          role: 'model' as const,
          parts: [{ text: 'Understood. I will follow these instructions.' }]
        }] : []),
        ...messages.map((msg) => {
          const parts: ApiContent['parts'] = [];
          if (msg.images && msg.images.length > 0) {
            msg.images.forEach((img) => {
              parts.push({
                inlineData: {
                  mimeType: img.mimeType,
                  data: img.data,
                },
              });
            });
          }
          if (msg.content) {
            parts.push({ text: msg.content });
          }
          return {
            role: msg.role,
            parts,
          };
        }),
        {
          role: 'user' as const,
          parts: [
            ...(userMessage.images?.map((img) => ({
              inlineData: {
                mimeType: img.mimeType,
                data: img.data,
              },
            })) || []),
            ...(userMessage.content ? [{ text: userMessage.content }] : []),
          ],
        },
      ];

      let fullResponse = '';
      let streamMetrics: StreamMetrics | null = null;
      let lastPaintAt = 0;

      if (streamingMode === 'stream') {
        for await (const chunk of streamChat(apiMessages, selectedModel, selectedEffort, profile?.plan || 'free', controller.signal, (m) => { streamMetrics = m; })) {
          if (controller.signal.aborted) break;
          fullResponse += chunk;
          const now = performance.now();
          if (now - lastPaintAt >= 32) {
            setStreamingContent(fullResponse);
            lastPaintAt = now;
          }
        }
        if (fullResponse) setStreamingContent(fullResponse);
      } else {
        for await (const chunk of streamChat(apiMessages, selectedModel, selectedEffort, profile?.plan || 'free', controller.signal, (m) => { streamMetrics = m; })) {
          if (controller.signal.aborted) break;
          fullResponse += chunk;
        }
        if (fullResponse) setStreamingContent(fullResponse);
      }

      if (fullResponse) {
        const assistantMessage: Message = {
          id: crypto.randomUUID(),
          role: 'model',
          content: fullResponse,
          timestamp: Date.now(),
        };

        setMessages((prev) => [...prev, assistantMessage]);
        setStreamingContent('');

        if (profile?.id && streamMetrics) {
          const m = streamMetrics as StreamMetrics;
          apiUsageApi.logUsage({
            model: selectedModel,
            inputTokens: m.inputTokens,
            outputTokens: m.outputTokens,
            creditsUsed: estimateCredits(selectedModel, selectedEffort),
            source: 'chat',
            responseMs: m.durationMs,
          }).catch(() => {});
        }

        if (convId) {
          await messagesApi.createMessage(convId, 'assistant', fullResponse).catch(() => {});
        }
        recordCreditUse(estimateCredits(selectedModel, selectedEffort));

        if (voiceAssistantService.isAutoPlay()) {
          voiceAssistantService.speak(fullResponse, assistantMessage.id);
        }
      } else {
        setStreamingContent('');
        const emptyReply: Message = {
          id: crypto.randomUUID(),
          role: 'model',
          content: '⚠️ The AI stream returned an empty response. Please check `src/lib/sse.ts` and your `.env.local` keys.',
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, emptyReply]);
      }
    } catch (error: unknown) {
      console.error('[Flash AI ERROR in handleSend]:', error);
      const err = error as { message?: string };
      if (!abortControllerRef.current?.signal.aborted) {
        const errorText = err.message || 'Unknown LLM connection error.';
        toast.error(errorText);
        const errorReply: Message = {
          id: crypto.randomUUID(),
          role: 'model',
          content: `❌ **AI Connection Error:** ${errorText}`,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, errorReply]);
      }
      setStreamingContent('');
    } finally {
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  };

  const handleImageGeneration = async (prompt: string) => {
    setIsLoading(true);
    setStreamingActivity('Creating image');
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: prompt,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    try {
      toast.info('Generating image… this may take up to 30 seconds.');
      let base64Image: string;
      if (attachedImages.length > 0) {
        base64Image = await generateImageFromImage(
          attachedImages[0].data,
          attachedImages[0].mimeType as 'image/png' | 'image/jpeg' | 'image/webp',
          prompt
        );
      } else {
        base64Image = await generateImageFromText(prompt);
      }
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'model',
        content: "✨ Here's your AI-generated image! Click to view fullscreen or download it.",
        timestamp: Date.now(),
        media: { type: 'image', data: base64Image, mimeType: 'image/png', name: 'ai-generated-image.png' },
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setAttachedImages([]);
      recordCreditUse(CREDIT_COSTS.image_generation);
      toast.success('Image ready!');
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast.error(err.message || 'Image generation failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (prompt: string) => {
    setInput(prompt);
    textareaRef.current?.focus();
  };

  const handleExport = () => {
    const activeConversation = conversations.find((c) => c.id === currentConversationId);
    const title = activeConversation?.title || 'conversation';
    const text = messages
      .map((msg) => `${msg.role === 'user' ? 'You' : 'Flash'}:\n${msg.content}\n`)
      .join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);

      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        
        try {
          const recognition = new (window as any).webkitSpeechRecognition() || new (window as any).SpeechRecognition();
          recognition.lang = 'en-US';
          recognition.continuous = false;
          recognition.interimResults = false;

          recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setInput((prev) => prev + (prev ? ' ' : '') + transcript);
          };

          recognition.onerror = () => {
            toast.error('Could not convert speech to text. Please try again.');
          };

          recognition.start();
        } catch (error) {
          toast.error('Your browser does not support voice recognition.');
        }
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      
      toast.success('Speak now...');
    } catch (error) {
      toast.error('Please allow microphone access to use voice-to-text.');
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);
      
      toast.success('Converting speech to text...');
    }
  };

  const toggleVoiceRecording = () => {
    if (isRecording) {
      stopVoiceRecording();
    } else {
      startVoiceRecording();
    }
  };

  const handleClear = async () => {
    if (currentConversationId) {
      await handleDeleteConversation(currentConversationId);
    } else {
      setMessages([]);
    }
  };

  const handleSignOutAllDevices = async () => {
    if (!confirm('Sign out from all other devices? You will remain signed in on this device.')) return;

    try {
      const sessions = await sessionsApi.getMySessions();
      const currentSessionId = sessions[0]?.id;

      if (!currentSessionId) {
        toast.error('Could not identify current session.');
        return;
      }

      const success = await sessionsApi.signOutOtherSessions(currentSessionId);
      if (success) {
        toast.success('You have been signed out from all other devices.');
      } else {
        toast.error('Failed to sign out other devices.');
      }
    } catch (error) {
      toast.error('An error occurred while signing out devices.');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-screen h-[100dvh] min-h-0 overflow-hidden bg-background">
      <ChatHistory
        conversations={conversations}
        currentConversationId={currentConversationId}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
        onDeleteConversation={handleDeleteConversation}
        onRenameConversation={handleRenameConversation}
        systemPrompts={systemPrompts}
        onSystemPromptChange={handleSystemPromptChange}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="border-b border-border/60 bg-card/80 backdrop-blur-md">
          <div className="container mx-auto px-3 sm:px-4 py-2 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(true)} className="md:hidden shrink-0 h-8 w-8">
                <Menu className="w-4 h-4" />
              </Button>
              <FlashLogo className="w-7 h-7 rounded-lg" />
              <span className="font-semibold text-sm tracking-tight hidden sm:inline-block">Flash AI</span>
              
              {currentConv && (
                <div className="flex items-center gap-1.5 pl-2 border-l border-border/50 max-w-[180px] sm:max-w-[260px]">
                  <span className="text-xs text-muted-foreground truncate font-normal">
                    {currentConv.title || 'New Chat'}
                  </span>
                </div>
              )}

              {messages.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClear}
                  className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors gap-1 ml-1"
                  title="Clear conversation"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Clear</span>
                </Button>
              )}
            </div>

            <div className="flex items-center gap-1.5 shrink-0 overflow-x-auto max-w-[65vw] sm:max-w-none no-scrollbar">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/media-hub')}
                className="h-7 px-2 text-xs hidden md:flex items-center gap-1 text-muted-foreground hover:text-foreground shrink-0"
                title="View uploaded files, generated images, and artifacts"
              >
                <FolderOpen className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>Media Hub</span>
              </Button>

              {profile?.role === 'admin' && (
                <Button variant="ghost" size="sm" onClick={() => navigate('/beta')} className="h-7 px-2 text-xs hidden sm:flex items-center gap-1 text-primary hover:text-primary shrink-0">
                  <Zap className="w-3 h-3 shrink-0" />Beta
                </Button>
              )}
              
              {!isUnlimited && (
                <div
                  className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-md border border-border/60 text-[11px] text-muted-foreground cursor-pointer hover:bg-muted/50 transition-colors shrink-0"
                  onClick={() => navigate('/plans')}
                  title="Remaining daily messages"
                >
                  <span className="tabular-nums font-mono">
                    {Math.max(0, dailyLimit - parseInt(sessionStorage.getItem('flash_daily_used') || '0', 10))}/{dailyLimit}
                  </span>
                </div>
              )}

              {profile?.plan === 'free' && (
                <Button size="sm" variant="outline" onClick={() => setUpgradeModal({ open: true })} className="h-7 shrink-0 bg-transparent px-2 text-xs text-primary border-primary/40 hover:bg-primary/10">
                  <ArrowUp className="w-3 h-3 mr-1 shrink-0" />Upgrade
                </Button>
              )}

              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setVideoStudioPrompt(input.trim() || 'Cosmic nebula drifting in deep space');
                  setIsVideoStudioOpen(true);
                }}
                className="hidden lg:flex h-7 px-2 text-xs rounded-xl border-white/15 bg-background/50 hover:bg-muted text-foreground items-center gap-1.5 shadow-sm shrink-0"
                title="AI Video & SFX Studio"
              >
                <Video className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="hidden md:inline font-medium">Video</span>
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setGameBridgeTopic(input.trim() || 'Roblox Battlegrounds Combat');
                  setIsGameBridgeOpen(true);
                }}
                className="hidden xl:flex h-7 px-2 text-xs rounded-xl border-white/15 bg-background/50 hover:bg-muted text-foreground items-center gap-1.5 shadow-sm shrink-0"
                title="Roblox & Game Building Developer Bridge"
              >
                <Box className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span className="hidden md:inline font-medium">Roblox</span>
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsLiveVoiceOpen(true)}
                className="hidden md:flex h-7 px-2.5 text-xs rounded-xl border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 items-center gap-1.5 shadow-sm shrink-0"
                title="ChatGPT Style Interactive Live Voice Mode"
              >
                <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse shrink-0" />
                <span className="font-semibold hidden sm:inline">Live Voice</span>
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsPluginCenterOpen(true)}
                className="hidden md:flex h-7 px-2 text-xs rounded-xl border-white/15 bg-background/50 hover:bg-muted text-foreground items-center gap-1.5 shadow-sm shrink-0"
                title="ChatGPT & DeepSeek Style Plugins Ecosystem"
              >
                <Blocks className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span className="hidden md:inline font-medium">Plugins</span>
                <span className="px-1.5 py-0.2 rounded-full bg-primary/20 text-primary text-[9px] font-bold">
                  {activePlugins.length}
                </span>
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsInstallAppOpen(true)}
                className="hidden lg:flex h-7 px-2 text-xs rounded-xl border-white/15 bg-background/50 hover:bg-muted text-foreground items-center gap-1.5 shadow-sm shrink-0"
                title="Download / Install Flash AI (Windows, Mac, Linux, Android)"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="hidden md:inline font-medium">Get App</span>
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsVoiceModalOpen(true)}
                className="hidden xl:flex h-7 px-2 text-xs rounded-xl border-white/15 bg-background/50 hover:bg-muted text-foreground items-center gap-1.5 shadow-sm shrink-0"
                title="Voice Assistant (8 Distinct Voice Profiles)"
              >
                <AudioLines className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="hidden md:inline font-medium">Voices (8)</span>
              </Button>

              <ThemeToggle />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full w-8 h-8">
                    <Avatar className="w-7 h-7">
                      <AvatarImage src={profile?.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/20 text-primary text-[11px] font-medium">
                        {profile?.username?.[0]?.toUpperCase() || profile?.email?.[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <p className="text-sm font-medium">{profile?.username || profile?.full_name || 'User'}</p>
                    <p className="text-xs text-muted-foreground">{profile?.email || ''}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/settings')}><SettingsIcon className="mr-2 h-4 w-4" />Settings</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/plans')}><Crown className="mr-2 h-4 w-4" />Manage Plan</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setIsVoiceModalOpen(true)}><AudioLines className="mr-2 h-4 w-4" />Voice Settings</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setIsLiveVoiceOpen(true)}><Radio className="mr-2 h-4 w-4" />Live Voice</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStreamingMode(mode => mode === 'stream' ? 'instant' : 'stream')}>
                    <AudioLines className="mr-2 h-4 w-4" />
                    {streamingMode === 'stream' ? 'Switch to instant responses' : 'Switch to word-by-word'}
                  </DropdownMenuItem>
                  {messages.length > 0 && (
                    <DropdownMenuItem onClick={handleExport}><Download className="mr-2 h-4 w-4" />Export chat</DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => setIsInstallAppOpen(true)}>
                    <Download className="mr-2 h-4 w-4 text-cyan-400" />Download App
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setIsBugReportOpen(true)} className="text-rose-400">
                    <Bug className="mr-2 h-4 w-4 text-rose-400" />Report a Bug
                  </DropdownMenuItem>
                  {(profile?.api_enabled || profile?.plan === 'pro' || profile?.plan === 'business') && (
                    <DropdownMenuItem onClick={() => navigate('/api-keys')}><Key className="mr-2 h-4 w-4" />API Keys</DropdownMenuItem>
                  )}
                  {profile?.role === 'admin' && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => navigate('/admin')}><User className="mr-2 h-4 w-4" />Admin Dashboard</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/beta')}><Zap className="mr-2 h-4 w-4 text-orange-500" />Beta Mode</DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOutAllDevices} className="text-orange-500">
                    <Smartphone className="mr-2 h-4 w-4" />Sign Out All Devices
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={signOut} className="text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="container mx-auto px-4 xl:px-6 py-6 max-w-4xl">
            {messages.length === 0 && !streamingContent ? (
              <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                <FlashLogo className="mb-6 h-20 w-20 rounded-2xl" />
                <h2 className="text-3xl font-bold mb-2 gradient-text">
                  Hi {profile?.full_name || profile?.username || 'there'}! 👋
                </h2>
                <p className="text-muted-foreground mb-2">Your AI assistant — text, code, images, and more.</p>
                <div className="flex items-center gap-2 mb-6 flex-wrap justify-center text-xs">
                  <span className="px-3 py-1.5 rounded-full bg-primary/10 text-primary font-medium flex items-center gap-1.5">
                    {isAccureModel ? <Brain className="w-3.5 h-3.5" /> : <Zap className="w-3.5 h-3.5" />}
                    {selectedModelDef.name}
                  </span>
                  <span className="px-3 py-1.5 rounded-full bg-muted text-muted-foreground font-medium flex items-center gap-1.5">
                    <Gauge className="w-3.5 h-3.5" />
                    {selectedEffortDef.label} effort
                  </span>
                  <span className="px-3 py-1.5 rounded-full bg-muted text-muted-foreground font-medium flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    {streamingMode === 'stream' ? 'Word-by-word' : 'Instant'} mode
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
                  {SUGGESTIONS.map((suggestion, index) => (
                    <SuggestionCard key={index} {...suggestion} onClick={() => handleSuggestionClick(suggestion.prompt)} />
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {messages.map((message) => (
                  <MessageBubble
                    key={message.id}
                    messageId={message.id}
                    role={message.role}
                    content={message.content}
                    images={message.images}
                    media={message.media}
                    modelName={selectedModelDef.name}
                    timestamp={message.timestamp}
                    onEdit={message.role === 'user' ? (newContent) => handleEditMessage(message.id, newContent) : undefined}
                    onRegenerate={message.role === 'model' ? () => {
                      const lastUser = [...messages].reverse().find(m => m.role === 'user');
                      if (lastUser) handleSend(lastUser.content);
                    } : undefined}
                  />
                ))}
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

        <div
          className="border-t border-border/60 bg-card/60 backdrop-blur-md"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <div className="container mx-auto px-3 sm:px-4 py-2.5 max-w-3xl">
            {attachedImages.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2 p-2 bg-muted/40 rounded-xl border border-border/50">
                {attachedImages.map((image, index) => (
                  <div key={index} className="relative group rounded-lg overflow-hidden border border-border/60">
                    <img src={`data:${image.mimeType};base64,${image.data}`} alt={image.name} className="w-14 h-14 object-cover" />
                    <button
                      onClick={() => removeImage(index)}
                      className="absolute top-0.5 right-0.5 bg-destructive text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="rounded-3xl liquid-glass border border-white/15 bg-background/70 backdrop-blur-2xl focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/15 transition-all shadow-xl">
              {activePlugins.length > 0 && (
                <div className="flex items-center gap-1.5 px-3.5 pt-2 pb-1 overflow-x-auto no-scrollbar border-b border-border/20">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider shrink-0 flex items-center gap-1">
                    <Blocks className="w-2.5 h-2.5 text-indigo-400" /> Plugins:
                  </span>
                  {activePlugins.map((plugin) => (
                    <span
                      key={plugin.id}
                      onClick={() => setIsPluginCenterOpen(true)}
                      className="px-2 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[10px] font-medium flex items-center gap-1 cursor-pointer hover:bg-indigo-500/20 transition-all shrink-0"
                      title={plugin.description}
                    >
                      <span>{plugin.icon}</span>
                      <span>{plugin.name}</span>
                    </span>
                  ))}
                  <button
                    type="button"
                    onClick={() => setIsPluginCenterOpen(true)}
                    className="text-[10px] text-muted-foreground hover:text-foreground px-1.5 py-0.5 rounded border border-dashed border-border/60 shrink-0"
                  >
                    + Edit
                  </button>
                </div>
              )}

              <div className="relative">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`Message ${selectedModelDef.name}…`}
                  disabled={isLoading}
                  rows={1}
                  spellCheck
                  autoCorrect="on"
                  autoCapitalize="sentences"
                  className={cn(
                    'w-full resize-none bg-transparent px-3.5 pt-3 pb-2',
                    'text-sm leading-6 placeholder:text-muted-foreground/45',
                    'focus:outline-none focus:ring-0',
                    'disabled:opacity-50 transition-colors',
                    'min-h-[48px]'
                  )}
                  style={{ overflow: 'hidden' }}
                />
                {tokenCount > 0 && (
                  <span className="absolute top-2.5 right-3 text-[10px] text-muted-foreground/35 pointer-events-none select-none font-mono">
                    ~{tokenCount}t
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between gap-1.5 px-2.5 pb-2 pt-0.5 border-t border-border/30">
                <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileSelect} className="hidden" />

                <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto no-scrollbar">
                  <div className="hidden sm:block">
                    <DropdownMenu open={showModelMenu} onOpenChange={setShowModelMenu}>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className={cn(
                            'flex items-center gap-1.5 h-7 px-2 rounded-lg text-xs font-medium border transition-colors max-w-[140px] truncate',
                            isAccureModel
                              ? 'border-amber-500/35 bg-amber-500/10 text-amber-300 hover:bg-amber-500/15'
                              : 'border-sky-500/35 bg-sky-500/10 text-sky-300 hover:bg-sky-500/15'
                          )}
                          title={`${selectedModelDef.name}: ${selectedModelDef.description}`}
                        >
                          {isAccureModel ? (
                            <Brain className="w-3 h-3 text-amber-500 shrink-0" />
                          ) : (
                            <Zap className="w-3 h-3 text-primary shrink-0" />
                          )}
                          <span className="truncate">{selectedModelDef.name}</span>
                          <ChevronDown className="w-2.5 h-2.5 text-muted-foreground shrink-0" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-[min(18rem,calc(100vw-2rem))] mb-1">
                        <DropdownMenuLabel className="text-[11px] font-semibold text-sky-400">⚡ Flash · Fast responses</DropdownMenuLabel>
                        {ALL_MODELS.filter(m => m.family === 'flash').map(m => {
                          const locked = !allowedModels.includes(m.id);
                          return (
                            <DropdownMenuItem key={m.id} onClick={() => handleModelSelect(m.id)}
                              className={cn('text-xs gap-2', selectedModel === m.id && 'bg-sky-500/10 text-sky-300 font-semibold', locked && 'opacity-60')}>
                              <span className="text-sm">{m.icon}</span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1">
                                  <span className="truncate">{m.name}</span>
                                  {locked && <Crown className="w-3 h-3 text-amber-500 shrink-0" />}
                                </div>
                                <p className="text-[10px] text-muted-foreground truncate">{m.description}</p>
                              </div>
                              <span className="text-[10px] text-sky-400 shrink-0">{m.baseCost}cr</span>
                            </DropdownMenuItem>
                          );
                        })}
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel className="text-[11px] font-semibold text-amber-400">🧠 Accure · Deep reasoning</DropdownMenuLabel>
                        {ALL_MODELS.filter(m => m.family === 'accure').map(m => {
                          const locked = !allowedModels.includes(m.id);
                          return (
                            <DropdownMenuItem key={m.id} onClick={() => handleModelSelect(m.id)}
                              className={cn('text-xs gap-2', selectedModel === m.id && 'bg-amber-500/10 text-amber-300 font-semibold', locked && 'opacity-60')}>
                              <span className="text-sm">{m.icon}</span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1">
                                  <span className="truncate">{m.name}</span>
                                  {locked && <Crown className="w-3 h-3 text-amber-500 shrink-0" />}
                                </div>
                                <p className="text-[10px] text-muted-foreground truncate">{m.description}</p>
                              </div>
                              <span className="text-[10px] text-amber-400 shrink-0">{m.baseCost}cr</span>
                            </DropdownMenuItem>
                          );
                        })}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowMobileModelSheet(true)}
                    className={cn(
                      'sm:hidden flex h-7 w-[7rem] shrink-0 items-center justify-center gap-1 rounded-lg border px-2 text-xs font-medium transition-colors',
                      isAccureModel
                        ? 'border-amber-500/35 bg-amber-500/10 text-amber-300'
                        : 'border-sky-500/35 bg-sky-500/10 text-sky-300'
                    )}
                  >
                    {isAccureModel ? (
                      <Brain className="w-3 h-3 text-amber-500 shrink-0" />
                    ) : (
                      <Zap className="w-3 h-3 text-primary shrink-0" />
                    )}
                    <span className="truncate">{selectedModelDef.name}</span>
                  </button>

                  <div className="hidden sm:block">
                    <DropdownMenu open={showEffortMenu} onOpenChange={setShowEffortMenu}>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className={cn(
                            'flex items-center gap-1 h-7 px-2 rounded-lg text-xs font-medium border transition-colors max-w-[95px] truncate',
                            EFFORT_TONES[selectedEffort]
                          )}
                          title={`${selectedEffortDef.label}: ${selectedEffortDef.description}`}
                        >
                          <Gauge className="w-3 h-3 text-muted-foreground shrink-0" />
                          <span className="truncate capitalize">{selectedEffortDef.label}</span>
                          <ChevronDown className="w-2.5 h-2.5 text-muted-foreground shrink-0" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-[min(16rem,calc(100vw-2rem))] mb-1">
                        <DropdownMenuLabel className="text-[11px] text-muted-foreground font-normal">Response depth · higher uses more credits</DropdownMenuLabel>
                        {EFFORT_LEVELS.map(e => {
                          const locked = !allowedEfforts.includes(e.id);
                          return (
                            <DropdownMenuItem key={e.id} onClick={() => handleEffortSelect(e.id)}
                              className={cn('text-xs gap-2', selectedEffort === e.id && cn(EFFORT_TONES[e.id], 'font-semibold'), locked && 'opacity-60')}>
                              <Gauge className={cn('w-4 h-4 shrink-0', EFFORT_TONES[e.id].split(' ')[2])} />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1">
                                  <span>{e.label}</span>
                                  {locked && <Crown className="w-3 h-3 text-amber-500 shrink-0" />}
                                </div>
                                <p className="text-[10px] text-muted-foreground">{e.description}</p>
                              </div>
                              <span className={cn('text-[10px] font-semibold shrink-0', EFFORT_TONES[e.id].split(' ')[2])}>{e.multiplier}×</span>
                            </DropdownMenuItem>
                          );
                        })}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <DropdownMenu open={showModeMenu} onOpenChange={setShowModeMenu}>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="hidden md:flex items-center gap-1 h-7 px-2 rounded-lg text-xs font-medium bg-muted/60 hover:bg-muted text-foreground border border-border/40 transition-colors max-w-[125px] truncate"
                        title="AI Mode & Plugin"
                      >
                        <span className="text-xs">{AI_MODES.find(m => m.id === activeMode)?.icon}</span>
                        <span className="truncate">{AI_MODES.find(m => m.id === activeMode)?.name}</span>
                        <ChevronDown className="w-2.5 h-2.5 text-muted-foreground shrink-0" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56 mb-1">
                      <DropdownMenuLabel className="text-[11px] text-muted-foreground font-normal">AI Mode & Capabilities</DropdownMenuLabel>
                      {AI_MODES.map((mode) => (
                        <DropdownMenuItem
                          key={mode.id}
                          onClick={() => {
                            setActiveMode(mode.id);
                            toast.info(`Switched to ${mode.name} mode`);
                          }}
                          className={cn('text-xs gap-2 py-1.5', activeMode === mode.id && 'bg-primary/10 font-semibold')}
                        >
                          <span className="text-sm">{mode.icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className="truncate font-medium">{mode.name}</p>
                            <p className="text-[10px] text-muted-foreground line-clamp-1">{mode.description}</p>
                          </div>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading}
                    title="Attach image"
                    className="flex items-center justify-center h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors disabled:opacity-40 shrink-0"
                  >
                    <Paperclip className="w-3.5 h-3.5 shrink-0" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setVideoStudioPrompt(input.trim() || 'Cinematic futuristic city with sound effects');
                      setIsVideoStudioOpen(true);
                    }}
                    title="Generate Video with Sound Effects"
                    className="flex lg:hidden items-center justify-center h-7 w-7 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors shrink-0"
                  >
                    <Video className="w-3.5 h-3.5 text-primary shrink-0" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setGameBridgeTopic(input.trim() || 'Obby System');
                      setIsGameBridgeOpen(true);
                    }}
                    title="Roblox Studio & Game Building Bridge"
                    className="flex xl:hidden items-center justify-center h-7 w-7 rounded-lg text-muted-foreground hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors shrink-0"
                  >
                    <Box className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsVoiceModalOpen(true)}
                    title={`AI Voice Profile: ${voiceAssistantService.getCurrentProfile().name}`}
                    className="hidden xl:flex items-center justify-center h-7 px-1.5 rounded-lg text-muted-foreground hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors shrink-0 gap-1"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="text-[10px] font-medium hidden sm:inline text-muted-foreground truncate max-w-[70px]">
                      {voiceAssistantService.getCurrentProfile().name.split(' ')[0]}
                    </span>
                  </button>

                  <span className="text-[10px] text-muted-foreground/40 hidden md:inline-block pl-0.5">
                    ~{estimateCredits(selectedModel, selectedEffort)}cr
                  </span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={toggleVoiceRecording}
                    disabled={isLoading}
                    title={isRecording ? 'Stop recording' : 'Voice input'}
                    className={cn(
                      'flex items-center justify-center h-7 w-7 rounded-lg transition-colors disabled:opacity-40',
                      isRecording
                        ? 'bg-destructive text-destructive-foreground animate-pulse'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/80'
                    )}
                  >
                    {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    type="button"
                    onClick={isLoading ? handleStopGeneration : () => handleSend()}
                    disabled={isLoading || (!input.trim() && attachedImages.length === 0)}
                    className={cn(
                      'flex items-center justify-center h-7 w-7 rounded-lg transition-all disabled:opacity-30 shadow-sm',
                      isLoading
                        ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                        : 'bg-primary text-primary-foreground hover:bg-primary/90'
                    )}
                  >
                    {isLoading ? (
                      <Square className="w-3 h-3 fill-current" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Sheet open={showMobileModelSheet} onOpenChange={setShowMobileModelSheet}>
        <SheetContent side="bottom" className="rounded-t-2xl max-h-[80dvh] overflow-y-auto pb-safe">
          <SheetHeader className="mb-4">
            <SheetTitle className="text-base">Select Model</SheetTitle>
          </SheetHeader>
          <div className="space-y-1 pb-4">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-sky-400 px-1 mb-2">⚡ Flash · Fast</p>
            {ALL_MODELS.filter(m => m.family === 'flash').map(m => {
              const locked = !allowedModels.includes(m.id);
              return (
                <button key={m.id} onClick={() => handleModelSelect(m.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3.5 rounded-xl min-h-[56px] transition-colors text-left',
                    selectedModel === m.id ? 'bg-primary/10 border border-primary/25' : 'hover:bg-muted',
                    locked && 'opacity-60'
                  )}>
                  <span className="text-2xl shrink-0">{m.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{m.name}</span>
                      {locked && <Crown className="w-3.5 h-3.5 text-amber-500" />}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{m.description}</p>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">{m.baseCost}cr/1K</span>
                </button>
              );
            })}
            <p className="text-[11px] font-semibold uppercase tracking-widest text-amber-400 px-1 mt-4 mb-2">🧠 Accure · Reasoning</p>
            {ALL_MODELS.filter(m => m.family === 'accure').map(m => {
              const locked = !allowedModels.includes(m.id);
              return (
                <button key={m.id} onClick={() => handleModelSelect(m.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3.5 rounded-xl min-h-[56px] transition-colors text-left',
                    selectedModel === m.id ? 'bg-amber-500/10 border border-amber-500/25' : 'hover:bg-muted',
                    locked && 'opacity-60'
                  )}>
                  <span className="text-2xl shrink-0">{m.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{m.name}</span>
                      {locked && <Crown className="w-3.5 h-3.5 text-amber-500" />}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{m.description}</p>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">{m.baseCost}cr/1K</span>
                </button>
              );
            })}
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground px-1 mt-5 mb-2">⚙️ Effort Level</p>
            {EFFORT_LEVELS.map(e => {
              const locked = !allowedEfforts.includes(e.id);
              return (
                <button key={e.id} onClick={() => handleEffortSelect(e.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 rounded-xl min-h-[52px] transition-colors text-left border',
                    selectedEffort === e.id ? EFFORT_TONES[e.id] : 'border-transparent hover:bg-muted',
                    locked && 'opacity-60'
                  )}>
                  <Gauge className={cn('w-4 h-4 shrink-0', EFFORT_TONES[e.id].split(' ')[2])} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm capitalize">{e.label}</span>
                      {locked && <Crown className="w-3.5 h-3.5 text-amber-500" />}
                    </div>
                    <p className="text-xs text-muted-foreground">{e.description}</p>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">{e.multiplier}×</span>
                </button>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>

      <UpgradeModal
        open={upgradeModal.open}
        onClose={() => setUpgradeModal({ open: false })}
        featureName={upgradeModal.feature}
      />

      {isGalleryOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col p-6 overflow-y-auto"
          onClick={() => setIsGalleryOpen(false)}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Media Gallery</h2>
            <Button variant="ghost" size="icon" onClick={() => setIsGalleryOpen(false)} className="text-white hover:bg-white/20 rounded-full h-10 w-10">
              <X className="w-6 h-6" />
            </Button>
          </div>
          <div onClick={(e) => e.stopPropagation()}>
            <MediaGallery messages={messages} />
          </div>
        </div>
      )}

      <VideoGenerationModal
        open={isVideoStudioOpen}
        onOpenChange={setIsVideoStudioOpen}
        initialPrompt={videoStudioPrompt}
      />
      <GameBridgeModal
        open={isGameBridgeOpen}
        onOpenChange={setIsGameBridgeOpen}
        initialTopic={gameBridgeTopic}
      />
      <VoiceSettingsModal
        open={isVoiceModalOpen}
        onOpenChange={setIsVoiceModalOpen}
      />
      <LiveVoiceModeModal
        open={isLiveVoiceOpen}
        onOpenChange={setIsLiveVoiceOpen}
        onSendMessage={(text) => {
          setInput(text);
        }}
      />
      <PluginCenterModal
        open={isPluginCenterOpen}
        onOpenChange={setIsPluginCenterOpen}
        onPluginToggled={() => setActivePlugins(pluginService.getActivePlugins())}
      />
      <AppInstallModal
        open={isInstallAppOpen}
        onOpenChange={setIsInstallAppOpen}
      />
      <BugReportModal
        open={isBugReportOpen}
        onOpenChange={setIsBugReportOpen}
      />
    </div>
  );
}