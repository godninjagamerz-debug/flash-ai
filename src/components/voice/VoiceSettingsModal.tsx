import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import {
  Volume2,
  VolumeX,
  Play,
  Square,
  Sparkles,
  Check,
  Radio,
  Sliders,
  AudioLines,
} from 'lucide-react';
import {
  voiceAssistantService,
  VOICE_PROFILES,
  type VoiceProfile,
} from '@/services/voiceAssistantService';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface VoiceSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VoiceSettingsModal({ open, onOpenChange }: VoiceSettingsModalProps) {
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>(() =>
    voiceAssistantService.getCurrentProfile().id
  );
  const [speed, setSpeed] = useState<number>(() => voiceAssistantService.getSpeechRate());
  const [autoPlay, setAutoPlay] = useState<boolean>(() => voiceAssistantService.isAutoPlay());
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [speakingVoiceId, setSpeakingVoiceId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = voiceAssistantService.subscribe((speaking, id) => {
      setIsSpeaking(speaking);
      setSpeakingVoiceId(speaking ? id : null);
    });
    return () => unsubscribe();
  }, []);

  const handleSelectVoice = (profile: VoiceProfile) => {
    setSelectedVoiceId(profile.id);
    voiceAssistantService.setVoiceProfile(profile.id);
    toast.success(`Voice set to ${profile.name}`);
  };

  const handlePreviewVoice = (profile: VoiceProfile, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (isSpeaking && speakingVoiceId === profile.id) {
      voiceAssistantService.stop();
      return;
    }
    voiceAssistantService.speak(profile.sampleQuote, profile.id, profile.id);
  };

  const handleSpeedChange = (val: number[]) => {
    const newSpeed = val[0] || 1.0;
    setSpeed(newSpeed);
    voiceAssistantService.setSpeechRate(newSpeed);
  };

  const handleAutoPlayChange = (checked: boolean) => {
    setAutoPlay(checked);
    voiceAssistantService.setAutoPlay(checked);
    toast.info(checked ? 'AI responses will auto-read' : 'Auto-read disabled');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-2xl rounded-3xl liquid-glass-card border border-white/15 p-6 shadow-2xl max-h-[90dvh] overflow-y-auto">
        <DialogHeader className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-primary flex items-center justify-center shadow-md">
              <AudioLines className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                Voice Assistant & Audio Profiles
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                  8 Voices
                </span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Select your preferred AI voice profile, test samples, and configure speech speed.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* 8 Voice Profiles Grid */}
        <div className="space-y-2 mt-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-primary" />
              <span>Available Voice Styles</span>
            </label>
            <span className="text-[11px] text-muted-foreground">Click to select & preview</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {VOICE_PROFILES.map((profile) => {
              const isSelected = selectedVoiceId === profile.id;
              const isThisVoicePlaying = isSpeaking && speakingVoiceId === profile.id;

              return (
                <div
                  key={profile.id}
                  onClick={() => handleSelectVoice(profile)}
                  className={cn(
                    'group relative p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between select-none',
                    isSelected
                      ? 'bg-primary/15 border-primary/50 shadow-md ring-1 ring-primary/40'
                      : 'bg-muted/30 border-white/10 hover:bg-muted/50 hover:border-white/20'
                  )}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-base shrink-0">{profile.avatarIcon}</span>
                        <p className="text-xs font-bold text-foreground truncate">{profile.name}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="px-1.5 py-0.5 rounded-md bg-white/10 text-[9px] font-medium text-muted-foreground">
                          {profile.tag}
                        </span>
                        {isSelected && (
                          <div className="w-4 h-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                      {profile.description}
                    </p>
                  </div>

                  {/* Audio Preview Action */}
                  <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between gap-2">
                    <span className="text-[10px] text-muted-foreground/80 italic truncate max-w-[170px]">
                      &quot;{profile.sampleQuote.slice(0, 32)}...&quot;
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      variant={isThisVoicePlaying ? 'default' : 'outline'}
                      onClick={(e) => handlePreviewVoice(profile, e)}
                      className={cn(
                        'h-6 px-2 text-[10px] rounded-lg gap-1 shrink-0 font-medium',
                        isThisVoicePlaying && 'animate-pulse bg-emerald-500 text-white'
                      )}
                    >
                      {isThisVoicePlaying ? (
                        <>
                          <Square className="w-2.5 h-2.5 fill-current" />
                          <span>Stop</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-2.5 h-2.5 fill-current" />
                          <span>Test</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Audio Playback Controls */}
        <div className="p-4 rounded-2xl bg-muted/30 border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-primary" />
                <span>Speech Speed ({speed.toFixed(2)}x)</span>
              </label>
              <p className="text-[10px] text-muted-foreground">Adjust playback velocity</p>
            </div>
            <span className="text-xs font-mono font-bold text-primary">{speed.toFixed(2)}x</span>
          </div>

          <Slider
            value={[speed]}
            min={0.7}
            max={1.6}
            step={0.05}
            onValueChange={handleSpeedChange}
            className="w-full"
          />

          <div className="pt-2 border-t border-white/10 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-medium text-foreground">Auto-read AI Responses</span>
              <p className="text-[10px] text-muted-foreground">
                Automatically speak incoming assistant answers upon completion
              </p>
            </div>
            <Switch checked={autoPlay} onCheckedChange={handleAutoPlayChange} />
          </div>
        </div>

        {/* Global Stop Button */}
        {isSpeaking && (
          <div className="flex justify-end">
            <Button
              type="button"
              size="sm"
              variant="destructive"
              onClick={() => voiceAssistantService.stop()}
              className="rounded-xl text-xs gap-1.5"
            >
              <VolumeX className="w-3.5 h-3.5" />
              <span>Stop Current Speech</span>
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
