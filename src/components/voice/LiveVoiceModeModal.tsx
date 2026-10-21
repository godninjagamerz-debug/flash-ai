import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Mic,
  MicOff,
  Volume2,
  X,
  Sparkles,
  RotateCcw,
  AudioLines,
  ChevronDown,
} from 'lucide-react';
import {
  voiceAssistantService,
  VOICE_PROFILES,
  type VoiceProfile,
} from '@/services/voiceAssistantService';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { streamChat } from '@/services/llm';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Browser SpeechRecognition definition
interface IWindow extends Window {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
}

interface LiveVoiceModeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSendMessage?: (text: string) => void;
}

type ConversationState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'interrupted';

export function LiveVoiceModeModal({
  open,
  onOpenChange,
  onSendMessage,
}: LiveVoiceModeModalProps) {
  const [convState, setConvState] = useState<ConversationState>('idle');
  const [selectedVoice, setSelectedVoice] = useState<VoiceProfile>(() =>
    voiceAssistantService.getCurrentProfile()
  );
  const [userTranscript, setUserTranscript] = useState('');
  const [aiResponseText, setAiResponseText] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [audioOrbScale, setAudioOrbScale] = useState(1);

  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef(false);
  const isSpeakingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Sync selected voice
  const handleSelectVoice = (profile: VoiceProfile) => {
    setSelectedVoice(profile);
    voiceAssistantService.setVoiceProfile(profile.id);
    toast.success(`Voice changed to ${profile.name}`);
  };

  // Fluid visualizer animation loop
  useEffect(() => {
    let phase = 0;
    const animateOrb = () => {
      phase += 0.05;
      if (convState === 'listening') {
        setAudioOrbScale(1 + Math.sin(phase * 2) * 0.12 + Math.random() * 0.08);
      } else if (convState === 'speaking') {
        setAudioOrbScale(1 + Math.cos(phase * 3) * 0.18 + Math.sin(phase * 1.5) * 0.1);
      } else if (convState === 'thinking') {
        setAudioOrbScale(1 + Math.sin(phase * 4) * 0.06);
      } else {
        setAudioOrbScale(1 + Math.sin(phase) * 0.03);
      }
      animFrameRef.current = requestAnimationFrame(animateOrb);
    };

    if (open) {
      animFrameRef.current = requestAnimationFrame(animateOrb);
    }
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [open, convState]);

  // Handle AI answer generation & speaking
  const processUserVoiceInput = useCallback(async (spokenText: string) => {
    if (!spokenText.trim()) return;

    setConvState('thinking');
    setAiResponseText('');
    abortControllerRef.current = new AbortController();

    try {
      const prompt = `[System Instruction: You are in Live Voice Mode. Answer naturally, concisely, and conversationally in 1-3 spoken sentences. Avoid code blocks, markdown tables, or bullet lists so it sounds natural when spoken aloud.]\n\nUser: ${spokenText}`;
      const messages = [
        {
          role: 'user' as const,
          parts: [{ text: prompt }],
        },
      ];

      let fullText = '';
      for await (const chunk of streamChat(
        messages,
        'f1',
        'low',
        'pro',
        abortControllerRef.current.signal
      )) {
        if (abortControllerRef.current.signal.aborted) break;
        fullText += chunk;
        setAiResponseText(fullText);
      }

      if (fullText.trim()) {
        onSendMessage?.(spokenText);
        setConvState('speaking');
        isSpeakingRef.current = true;

        await voiceAssistantService.speak(
          fullText,
          'live_voice',
          selectedVoice.id
        );

        isSpeakingRef.current = false;
        if (open && !isMuted) {
          startListening();
        } else {
          setConvState('idle');
        }
      } else {
        setConvState('idle');
      }
    } catch (err: unknown) {
      console.warn('Live voice chat error:', err);
      setConvState('idle');
    }
  }, [selectedVoice.id, onSendMessage, open, isMuted]);

  // Start speech recognition
  const startListening = useCallback(() => {
    if (typeof window === 'undefined') return;
    const win = window as IWindow;
    const SpeechRecognitionClass =
      win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      toast.info('Speech recognition API not supported in this browser. Tap to speak.');
      return;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }

      const recognition = new SpeechRecognitionClass();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        isListeningRef.current = true;
        setConvState('listening');
      };

      recognition.onresult = (event: any) => {
        // Duplex interruption check: if AI is speaking and user starts talking, interrupt AI!
        if (isSpeakingRef.current) {
          voiceAssistantService.stop();
          abortControllerRef.current?.abort();
          isSpeakingRef.current = false;
          setConvState('interrupted');
        }

        const current = event.resultIndex;
        const transcript = event.results[current][0].transcript;
        setUserTranscript(transcript);

        if (event.results[current].isFinal) {
          recognition.stop();
          processUserVoiceInput(transcript);
        }
      };

      recognition.onerror = (e: any) => {
        console.warn('Speech recognition warning:', e);
        if (e.error !== 'no-speech') {
          setConvState('idle');
        }
      };

      recognition.onend = () => {
        isListeningRef.current = false;
        if (convState === 'listening') {
          setConvState('idle');
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn('Failed to start speech recognition:', err);
      setConvState('idle');
    }
  }, [convState, processUserVoiceInput]);

  const stopAll = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    voiceAssistantService.stop();
    abortControllerRef.current?.abort();
    setConvState('idle');
  }, []);

  // When modal opens/closes
  useEffect(() => {
    if (open) {
      setSelectedVoice(voiceAssistantService.getCurrentProfile());
      setUserTranscript('');
      setAiResponseText('Listening... speak whenever you are ready.');
      startListening();
    } else {
      stopAll();
    }
    return () => {
      stopAll();
    };
  }, [open, startListening, stopAll]);

  const toggleMute = () => {
    if (!isMuted) {
      stopAll();
      setIsMuted(true);
      toast.info('Microphone muted');
    } else {
      setIsMuted(false);
      startListening();
      toast.success('Microphone unmuted');
    }
  };

  const handleInterrupt = () => {
    voiceAssistantService.stop();
    abortControllerRef.current?.abort();
    setConvState('idle');
    startListening();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-2xl h-[85vh] max-h-[750px] rounded-3xl liquid-glass-card border border-white/20 p-6 flex flex-col justify-between overflow-hidden shadow-2xl">
        {/* Top Header Row */}
        <div className="flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-primary flex items-center justify-center shadow-lg">
              <AudioLines className="w-4 h-4 text-white animate-pulse" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                Live Voice Mode
                <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-bold">
                  ChatGPT Style
                </span>
              </h2>
              <p className="text-[10px] text-muted-foreground">
                Continuous duplex voice conversation with hands-free interruption
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Voice Profile Picker Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs rounded-xl border-white/15 bg-background/50 hover:bg-muted gap-1.5 px-2.5"
                >
                  <span className="text-sm">{selectedVoice.avatarIcon}</span>
                  <span className="font-semibold text-foreground max-w-[100px] truncate">
                    {selectedVoice.name}
                  </span>
                  <ChevronDown className="w-3 h-3 text-muted-foreground ml-0.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56 p-1.5 rounded-2xl liquid-glass-card border-white/15"
              >
                <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Select Human Voice (8)
                </div>
                {VOICE_PROFILES.map((profile) => (
                  <DropdownMenuItem
                    key={profile.id}
                    onClick={() => handleSelectVoice(profile)}
                    className={cn(
                      'flex items-center justify-between px-2.5 py-2 rounded-xl text-xs cursor-pointer',
                      selectedVoice.id === profile.id &&
                        'bg-primary/20 text-primary font-bold'
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span>{profile.avatarIcon}</span>
                      <span className="truncate">{profile.name}</span>
                    </div>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-muted-foreground shrink-0">
                      {profile.tag}
                    </span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="rounded-full w-8 h-8 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Central Fluid Liquid Voice Orb */}
        <div className="relative flex-1 flex flex-col items-center justify-center my-4">
          {/* Ambient Glows */}
          <div
            className="absolute w-64 h-64 rounded-full blur-3xl pointer-events-none transition-all duration-700 opacity-40"
            style={{
              backgroundColor: selectedVoice.accentColor,
              transform: `scale(${audioOrbScale * 1.2})`,
            }}
          />

          {/* Animated Fluid Orb Layers */}
          <div
            className="relative w-44 h-44 rounded-full flex items-center justify-center shadow-2xl transition-transform duration-100 ease-out cursor-pointer"
            style={{ transform: `scale(${audioOrbScale})` }}
            onClick={convState === 'speaking' ? handleInterrupt : undefined}
            title={convState === 'speaking' ? 'Click to interrupt' : undefined}
          >
            {/* Outer Ring 1 */}
            <div
              className="absolute inset-0 rounded-full border-2 border-white/20 animate-spin"
              style={{
                borderColor: `${selectedVoice.accentColor}66`,
                animationDuration: '14s',
              }}
            />
            {/* Outer Ring 2 */}
            <div
              className="absolute -inset-3 rounded-full border border-dashed border-white/20 animate-spin"
              style={{
                borderColor: `${selectedVoice.accentColor}40`,
                animationDuration: '22s',
                animationDirection: 'reverse',
              }}
            />

            {/* Core Gradient Sphere */}
            <div
              className="w-36 h-36 rounded-full flex flex-col items-center justify-center shadow-inner relative overflow-hidden"
              style={{
                background: `radial-gradient(circle at 35% 35%, ${selectedVoice.accentColor}, #0F172A 85%)`,
              }}
            >
              <div className="absolute inset-0 bg-white/10 backdrop-blur-sm rounded-full" />
              <div className="relative z-10 flex flex-col items-center gap-1 text-white">
                <span className="text-2xl">{selectedVoice.avatarIcon}</span>
                <span className="text-[10px] font-mono tracking-widest uppercase font-bold text-white/80">
                  {convState}
                </span>
              </div>
            </div>
          </div>

          {/* Transcript / Subtitle Box */}
          <div className="mt-8 max-w-md w-full px-4 text-center space-y-2">
            {userTranscript && (
              <p className="text-xs text-muted-foreground/90 italic truncate">
                &ldquo;{userTranscript}&rdquo;
              </p>
            )}
            <p className="text-sm font-medium text-foreground line-clamp-3 leading-relaxed">
              {aiResponseText || 'Start speaking naturally...'}
            </p>
          </div>
        </div>

        {/* Bottom Control Bar */}
        <div className="flex items-center justify-center gap-4 z-10 pt-2 border-t border-white/10">
          <Button
            variant={isMuted ? 'destructive' : 'outline'}
            size="icon"
            onClick={toggleMute}
            className="w-11 h-11 rounded-2xl shadow-md transition-all active:scale-95"
            title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </Button>

          {convState === 'speaking' && (
            <Button
              variant="secondary"
              onClick={handleInterrupt}
              className="h-11 px-4 rounded-2xl text-xs font-semibold gap-2 border border-white/15 active:scale-95 transition-all shadow-md"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Tap to Interrupt</span>
            </Button>
          )}

          {convState !== 'speaking' && (
            <Button
              variant="default"
              onClick={() => {
                if (convState === 'listening') {
                  setConvState('idle');
                } else {
                  startListening();
                }
              }}
              className="h-11 px-6 rounded-2xl text-xs font-semibold gap-2 bg-gradient-to-r from-emerald-500 to-primary hover:opacity-90 active:scale-95 transition-all shadow-md"
            >
              <Sparkles className="w-4 h-4" />
              <span>{convState === 'listening' ? 'Listening...' : 'Push to Talk'}</span>
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
