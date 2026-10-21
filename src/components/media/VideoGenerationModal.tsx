import { useState } from 'react';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Video, Sparkles, Volume2, VolumeX, Download, Play, Pause,
  RefreshCw, Music2, Wand2, Sliders as SliderIcon, Check,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  videoGenerationService, soundEngine, type GeneratedVideo,
} from '@/services/videoGenerationService';
import { cn } from '@/lib/utils';

interface VideoGenerationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialPrompt?: string;
}

export function VideoGenerationModal({
  open,
  onOpenChange,
  initialPrompt = '',
}: VideoGenerationModalProps) {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedVideo, setGeneratedVideo] = useState<GeneratedVideo | null>(null);
  const [isPlayingSfx, setIsPlayingSfx] = useState(false);
  const [sfxVolume, setSfxVolume] = useState(0.7);
  const [sfxType, setSfxType] = useState<GeneratedVideo['soundEffectType']>('cinematic');
  const [duration, setDuration] = useState(6);
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '1:1'>('16:9');

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a video description');
      return;
    }
    setIsGenerating(true);
    soundEngine.stopSoundEffect();
    setIsPlayingSfx(false);

    try {
      const vid = await videoGenerationService.generateVideo(prompt, {
        duration,
        aspectRatio,
        soundEffects: true,
        sfxType,
      });
      setGeneratedVideo(vid);
      toast.success('🎬 Video and synchronized sound effects generated successfully!');
      // Auto-play sound effect with generated video
      soundEngine.playSoundEffect(vid.soundEffectType, vid.duration, sfxVolume);
      setIsPlayingSfx(true);
    } catch {
      toast.error('Failed to generate video. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleSfxAudio = () => {
    if (!generatedVideo) return;
    if (isPlayingSfx) {
      soundEngine.stopSoundEffect();
      setIsPlayingSfx(false);
    } else {
      soundEngine.playSoundEffect(generatedVideo.soundEffectType, generatedVideo.duration, sfxVolume);
      setIsPlayingSfx(true);
    }
  };

  const handleVolumeChange = (newVol: number) => {
    setSfxVolume(newVol);
    soundEngine.setVolume(newVol);
  };

  const handleDownloadVideo = () => {
    if (!generatedVideo) return;
    const a = document.createElement('a');
    a.href = generatedVideo.videoUrl;
    a.download = `flash_video_${Date.now()}.mp4`;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success('Downloading MP4 video file...');
  };

  const handleDownloadSfx = () => {
    if (!generatedVideo) return;
    const blob = soundEngine.generateWavFile(generatedVideo.soundEffectType, generatedVideo.duration);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flash_sfx_${generatedVideo.soundEffectType}_${Date.now()}.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Downloaded WAV sound effect track!');
  };

  return (
    <Dialog open={open} onOpenChange={(v) => {
      if (!v) {
        soundEngine.stopSoundEffect();
        setIsPlayingSfx(false);
      }
      onOpenChange(v);
    }}>
      <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-2xl rounded-3xl liquid-glass-card border border-white/15 p-6 shadow-2xl max-h-[90dvh] overflow-y-auto">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-md">
              <Video className="w-5 h-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                AI Video & SFX Studio
                <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30 text-[10px] font-bold">
                  Audio-Visual Engine
                </span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Generate motion video clips with synchronized procedural sound effects and audio tracks.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Prompt Input */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground flex items-center justify-between">
              <span>Video Scene Prompt</span>
              <span className="text-[11px] text-muted-foreground font-normal">Includes audio soundscape</span>
            </label>
            <div className="relative">
              <Input
                placeholder="e.g. Glowing cosmic nebula in deep space with stellar pulse..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleGenerate();
                  }
                }}
                disabled={isGenerating}
                className="h-11 rounded-2xl border-white/10 bg-background/50 focus:border-primary/50 text-sm pl-3 pr-24"
              />
              <Button
                type="button"
                size="sm"
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
                className="absolute right-1.5 top-1.5 h-8 px-3 rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold shadow-sm active:scale-95 text-xs"
              >
                {isGenerating ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <>
                    <Wand2 className="w-3.5 h-3.5 mr-1" />
                    Render
                  </>
                )}
              </Button>
            </div>

            {/* Quick Inspiration Prompts */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {[
                { label: 'Deep Space Nebula', sfx: 'scifi' as const },
                { label: 'Ocean Waves Sunset', sfx: 'nature' as const },
                { label: 'Cyber Data Stream', sfx: 'electronic' as const },
                { label: 'Sparks & Fire Impact', sfx: 'action' as const },
              ].map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setPrompt(item.label);
                    setSfxType(item.sfx);
                  }}
                  className="px-2.5 py-1 rounded-xl text-[11px] bg-muted/50 hover:bg-muted text-foreground border border-white/10 transition-colors"
                >
                  ✨ {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Controls: SFX Genre, Duration & Ratio */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-2xl bg-muted/30 border border-white/10">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-muted-foreground">Sound Effects Mode</span>
              <select
                value={sfxType}
                onChange={(e) => setSfxType(e.target.value as GeneratedVideo['soundEffectType'])}
                className="w-full h-8 px-2 rounded-xl text-xs bg-background/80 border border-white/15 text-foreground"
              >
                <option value="cinematic">Cinematic Sub</option>
                <option value="scifi">Sci-Fi Synth Drone</option>
                <option value="nature">Ocean & Nature Waves</option>
                <option value="action">Action Impact & Fire</option>
                <option value="electronic">Cyber Pulse</option>
                <option value="ambient">Ambient Harmonic</option>
              </select>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-muted-foreground">Duration</span>
              <div className="flex gap-1">
                {[3, 6, 10].map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => setDuration(sec)}
                    className={cn(
                      'flex-1 h-8 rounded-xl text-xs font-semibold border transition-all',
                      duration === sec
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background/50 border-white/10 text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {sec}s
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-muted-foreground">Aspect Ratio</span>
              <div className="flex gap-1">
                {(['16:9', '9:16', '1:1'] as const).map((ratio) => (
                  <button
                    key={ratio}
                    type="button"
                    onClick={() => setAspectRatio(ratio)}
                    className={cn(
                      'flex-1 h-8 rounded-xl text-xs font-semibold border transition-all',
                      aspectRatio === ratio
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background/50 border-white/10 text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {ratio}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Generated Video Player & SFX Visualizer */}
          {generatedVideo ? (
            <div className="space-y-3 p-4 rounded-3xl bg-background/60 border border-white/15 shadow-inner">
              <div className="relative rounded-2xl overflow-hidden aspect-video bg-black flex items-center justify-center border border-white/10">
                <video
                  src={generatedVideo.videoUrl}
                  poster={generatedVideo.thumbnailUrl}
                  controls
                  loop
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                {/* Floating SFX badge */}
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-[11px] text-white flex items-center gap-1.5 shadow-lg">
                  <Music2 className="w-3.5 h-3.5 text-primary" />
                  <span>{generatedVideo.sfxDescription}</span>
                </div>
              </div>

              {/* Synchronized Sound Effects Controller */}
              <div className="p-3 rounded-2xl bg-muted/40 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                  <Button
                    type="button"
                    size="sm"
                    variant={isPlayingSfx ? 'default' : 'outline'}
                    onClick={toggleSfxAudio}
                    className="h-8 px-3 rounded-xl text-xs font-medium gap-1.5 shadow-sm"
                  >
                    {isPlayingSfx ? (
                      <>
                        <Volume2 className="w-3.5 h-3.5 text-white" />
                        <span>SFX Playing</span>
                      </>
                    ) : (
                      <>
                        <VolumeX className="w-3.5 h-3.5" />
                        <span>Play Sound Effects</span>
                      </>
                    )}
                  </Button>

                  {/* Volume Slider */}
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={sfxVolume}
                      onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                      className="w-20 accent-primary h-1.5 rounded-lg cursor-pointer"
                    />
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {Math.round(sfxVolume * 100)}%
                    </span>
                  </div>
                </div>

                {/* Download Actions */}
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleDownloadSfx}
                    className="h-8 px-3 text-xs rounded-xl border-white/15 gap-1.5"
                  >
                    <Download className="w-3 h-3" />
                    WAV Audio
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleDownloadVideo}
                    className="h-8 px-3 text-xs rounded-xl bg-primary text-primary-foreground font-semibold gap-1.5 shadow-md"
                  >
                    <Download className="w-3 h-3" />
                    MP4 Video
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-3xl border border-dashed border-white/15 text-center space-y-2 bg-muted/10">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-muted/50 flex items-center justify-center">
                <Video className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-semibold text-foreground">No video generated yet</p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Type a prompt above or pick a preset to render an AI video clip with synchronized sound effects!
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
