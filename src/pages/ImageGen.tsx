import { useState, useRef } from 'react';
import {
  ArrowLeft, Download, Sparkles, Wand2, RotateCcw,
  ZoomIn, Grid3x3, LayoutGrid, Loader2, X, Plus,
  ImageIcon, Settings2, ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  Dialog, DialogContent, DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { generateImageFromText, generateImageFromImage } from '@/services/imageGeneration';

// ─── Types ──────────────────────────────────────────────────────────────────

interface GeneratedImage {
  id: string;
  base64: string;
  prompt: string;
  style: string;
  aspectRatio: string;
  createdAt: number;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const STYLES = [
  { id: 'none',        label: 'No style',      emoji: '✏️' },
  { id: 'photorealistic', label: 'Photorealistic', emoji: '📷' },
  { id: 'anime',       label: 'Anime',          emoji: '🌸' },
  { id: 'oil-painting', label: 'Oil Painting',  emoji: '🎨' },
  { id: 'sketch',      label: 'Sketch',         emoji: '🖊️' },
  { id: 'cyberpunk',   label: 'Cyberpunk',       emoji: '🤖' },
  { id: 'watercolor',  label: 'Watercolor',      emoji: '🌊' },
  { id: '3d-render',   label: '3D Render',       emoji: '💎' },
  { id: 'pixel-art',   label: 'Pixel Art',       emoji: '🕹️' },
  { id: 'fantasy',     label: 'Fantasy',         emoji: '🧙' },
] as const;

const ASPECT_RATIOS = [
  { id: '1:1',   label: 'Square',    dims: '1024×1024', icon: '⬜' },
  { id: '4:3',   label: 'Standard',  dims: '1024×768',  icon: '🖥️' },
  { id: '16:9',  label: 'Landscape', dims: '1344×768',  icon: '📺' },
  { id: '9:16',  label: 'Portrait',  dims: '768×1344',  icon: '📱' },
  { id: '3:4',   label: 'Tall',      dims: '768×1024',  icon: '🪞' },
] as const;

type StyleId = (typeof STYLES)[number]['id'];
type RatioId = (typeof ASPECT_RATIOS)[number]['id'];

// ─── Component ──────────────────────────────────────────────────────────────

export default function ImageGen() {
  const navigate = useNavigate();

  // Form state
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState<StyleId>('none');
  const [ratio, setRatio] = useState<RatioId>('1:1');
  const [count, setCount] = useState(1);

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentImages, setCurrentImages] = useState<GeneratedImage[]>([]);
  const [history, setHistory] = useState<GeneratedImage[]>([]);
  const [referenceImg, setReferenceImg] = useState<{ data: string; mimeType: string } | null>(null);

  // UI state
  const [lightboxImg, setLightboxImg] = useState<GeneratedImage | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'single'>('grid');
  const [showHistory, setShowHistory] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const buildPrompt = () => {
    if (style === 'none') return prompt.trim();
    const styleLabel = STYLES.find(s => s.id === style)?.label || '';
    return `${prompt.trim()}, ${styleLabel} style`;
  };

  const handleGenerate = async () => {
    const text = prompt.trim();
    if (!text) { toast.error('Please enter a prompt'); return; }
    setIsGenerating(true);
    setCurrentImages([]);

    try {
      const fullPrompt = buildPrompt();
      const generated: GeneratedImage[] = [];

      for (let i = 0; i < count; i++) {
        let base64: string;
        if (referenceImg) {
          base64 = await generateImageFromImage(
            referenceImg.data,
            referenceImg.mimeType as 'image/png' | 'image/jpeg' | 'image/webp',
            fullPrompt
          );
        } else {
          base64 = await generateImageFromText(
            count > 1 ? `${fullPrompt}, variation ${i + 1}` : fullPrompt
          );
        }
        const img: GeneratedImage = {
          id: crypto.randomUUID(),
          base64,
          prompt: fullPrompt,
          style,
          aspectRatio: ratio,
          createdAt: Date.now(),
        };
        generated.push(img);
        setCurrentImages(prev => [...prev, img]);
      }

      setHistory(prev => [...generated, ...prev].slice(0, 50));
      toast.success(`${count} image${count > 1 ? 's' : ''} generated!`);
    } catch (err: unknown) {
      const e = err as { message?: string };
      toast.error(e.message || 'Image generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadImage = (img: GeneratedImage) => {
    const a = document.createElement('a');
    a.href = `data:image/png;base64,${img.base64}`;
    a.download = `flash-ai-image-${img.id.slice(0, 8)}.png`;
    a.click();
  };

  const handleVariations = async (img: GeneratedImage) => {
    setPrompt(img.prompt);
    setStyle(img.style as StyleId);
    setRatio(img.aspectRatio as RatioId);
    setCount(4);
    toast.info('Generating variations…');
  };

  const handleRefImg = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      setReferenceImg({ data: base64, mimeType: file.type });
    };
    reader.readAsDataURL(file);
  };

  const styleLabel = STYLES.find(s => s.id === style)?.label ?? 'No style';
  const styleEmoji = STYLES.find(s => s.id === style)?.emoji ?? '✏️';
  const ratioLabel = ASPECT_RATIOS.find(r => r.id === ratio)?.label ?? 'Square';
  const ratioIcon  = ASPECT_RATIOS.find(r => r.id === ratio)?.icon ?? '⬜';
  const ratioDims  = ASPECT_RATIOS.find(r => r.id === ratio)?.dims ?? '1024×1024';

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="text-muted-foreground">
            <ArrowLeft className="w-4 h-4 mr-1.5" /><span className="hidden sm:inline">Back to Chat</span>
          </Button>
          <div className="flex-1 min-w-0 flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
              <Wand2 className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-sm">Image Generation</span>
            <Badge variant="secondary" className="text-[10px]">AI</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowHistory(v => !v)}
              className={cn('text-xs', showHistory && 'bg-muted')}
            >
              <Grid3x3 className="w-3.5 h-3.5 mr-1.5" />History
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col md:flex-row max-w-6xl mx-auto w-full px-4 py-6 gap-6">

        {/* ─── Left Panel: Controls ─────────────────────────────────── */}
        <aside className="w-full md:w-80 shrink-0 space-y-4">

          {/* Prompt */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                Describe your image
              </label>
              <Textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder="A futuristic city at sunset with neon lights and flying cars…"
                className="min-h-[100px] resize-none text-sm"
                disabled={isGenerating}
              />
              {/* Reference image strip */}
              <div className="flex items-center gap-2">
                {referenceImg ? (
                  <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-border flex-shrink-0">
                    <img src={`data:${referenceImg.mimeType};base64,${referenceImg.data}`} alt="ref" className="w-full h-full object-cover" />
                    <button onClick={() => setReferenceImg(null)} className="absolute top-0.5 right-0.5 bg-destructive rounded-full p-0.5">
                      <X className="w-2.5 h-2.5 text-white" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-dashed border-border rounded-lg px-3 py-2 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Reference image
                  </button>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleRefImg} className="hidden" />
              </div>
            </CardContent>
          </Card>

          {/* Settings */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <Settings2 className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Settings</span>
              </div>

              {/* Style */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Style</label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full justify-between h-9 text-sm" disabled={isGenerating}>
                      <span>{styleEmoji} {styleLabel}</span>
                      <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56">
                    <DropdownMenuLabel className="text-xs">Visual Style</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {STYLES.map(s => (
                      <DropdownMenuItem key={s.id} onClick={() => setStyle(s.id)} className={cn('text-sm', style === s.id && 'bg-primary/10 text-primary font-medium')}>
                        {s.emoji} {s.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Aspect Ratio */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Aspect Ratio</label>
                <div className="grid grid-cols-5 gap-1">
                  {ASPECT_RATIOS.map(r => (
                    <button
                      key={r.id}
                      onClick={() => setRatio(r.id)}
                      disabled={isGenerating}
                      className={cn(
                        'flex flex-col items-center gap-0.5 py-2 px-1 rounded-lg border text-xs font-medium transition-all',
                        ratio === r.id
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
                      )}
                      title={`${r.label} (${r.dims})`}
                    >
                      <span>{r.icon}</span>
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground">{ratioIcon} {ratioLabel} · {ratioDims}</p>
              </div>

              {/* Count */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Number of images</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4].map(n => (
                    <button
                      key={n}
                      onClick={() => setCount(n)}
                      disabled={isGenerating}
                      className={cn(
                        'flex-1 h-9 rounded-lg border text-sm font-semibold transition-all',
                        count === n
                          ? 'border-primary bg-primary text-primary-foreground shadow'
                          : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
                      )}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Generate Button */}
          <Button
            className="w-full h-12 text-base font-semibold shadow-lg"
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
          >
            {isGenerating ? (
              <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Generating…</>
            ) : (
              <><Sparkles className="w-5 h-5 mr-2" />Generate {count > 1 ? `${count} Images` : 'Image'}</>
            )}
          </Button>
        </aside>

        {/* ─── Right Panel: Results + History ──────────────────────── */}
        <main className="flex-1 min-w-0 space-y-4">

          {/* View toggle */}
          {currentImages.length > 1 && (
            <div className="flex justify-end gap-1">
              <Button size="sm" variant={viewMode === 'grid' ? 'default' : 'ghost'} onClick={() => setViewMode('grid')}>
                <LayoutGrid className="w-3.5 h-3.5" />
              </Button>
              <Button size="sm" variant={viewMode === 'single' ? 'default' : 'ghost'} onClick={() => setViewMode('single')}>
                <ImageIcon className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}

          {/* Current result grid */}
          {isGenerating && currentImages.length === 0 ? (
            <div className={cn(
              'grid gap-4',
              count === 1 ? 'grid-cols-1' : count === 2 ? 'grid-cols-2' : 'grid-cols-2'
            )}>
              {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="aspect-square rounded-2xl bg-muted animate-pulse flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-muted-foreground/50 animate-spin" />
                </div>
              ))}
            </div>
          ) : currentImages.length > 0 ? (
            <div className={cn(
              'grid gap-4',
              viewMode === 'single' ? 'grid-cols-1 max-w-lg mx-auto' :
              currentImages.length === 1 ? 'grid-cols-1 max-w-lg mx-auto' :
              currentImages.length === 2 ? 'grid-cols-2' :
              'grid-cols-2'
            )}>
              {currentImages.map(img => (
                <ImageCard
                  key={img.id}
                  img={img}
                  onView={() => setLightboxImg(img)}
                  onDownload={() => downloadImage(img)}
                  onVariations={() => handleVariations(img)}
                />
              ))}
              {/* Still generating placeholders */}
              {isGenerating && Array.from({ length: count - currentImages.length }).map((_, i) => (
                <div key={`ph-${i}`} className="aspect-square rounded-2xl bg-muted animate-pulse flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-muted-foreground/50 animate-spin" />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center text-muted-foreground rounded-2xl border-2 border-dashed border-border">
              <Wand2 className="w-12 h-12 mb-4 opacity-30" />
              <p className="text-base font-medium">Your images will appear here</p>
              <p className="text-sm mt-1 opacity-70">Enter a prompt and click Generate</p>
            </div>
          )}

          {/* History */}
          {showHistory && history.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-border">
              <h3 className="text-sm font-semibold text-muted-foreground">History</h3>
              <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                {history.map(img => (
                  <button
                    key={img.id}
                    onClick={() => setCurrentImages([img])}
                    className="aspect-square rounded-xl overflow-hidden border border-border hover:border-primary/50 transition-all hover:scale-105 shadow-sm"
                  >
                    <img src={`data:image/png;base64,${img.base64}`} alt={img.prompt} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Lightbox */}
      <Dialog open={!!lightboxImg} onOpenChange={() => setLightboxImg(null)}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-4xl p-4 bg-background">
          <DialogTitle className="sr-only">Image Preview</DialogTitle>
          {lightboxImg && (
            <div className="space-y-4">
              <img
                src={`data:image/png;base64,${lightboxImg.base64}`}
                alt={lightboxImg.prompt}
                className="w-full rounded-xl object-contain max-h-[70vh]"
              />
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground flex-1 min-w-0 truncate">{lightboxImg.prompt}</p>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button size="sm" variant="outline" onClick={() => handleVariations(lightboxImg)}>
                    <RotateCcw className="w-4 h-4 mr-1.5" />Variations
                  </Button>
                  <Button size="sm" onClick={() => downloadImage(lightboxImg)}>
                    <Download className="w-4 h-4 mr-1.5" />Download
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Image Card ──────────────────────────────────────────────────────────────

function ImageCard({
  img, onView, onDownload, onVariations
}: {
  img: GeneratedImage;
  onView: () => void;
  onDownload: () => void;
  onVariations: () => void;
}) {
  return (
    <div className="group relative rounded-2xl overflow-hidden border border-border shadow-md hover:shadow-xl transition-all hover:scale-[1.01]">
      <img
        src={`data:image/png;base64,${img.base64}`}
        alt={img.prompt}
        className="w-full aspect-square object-cover"
      />
      {/* Hover overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3 gap-2">
        <p className="text-white text-xs line-clamp-2 leading-relaxed">{img.prompt}</p>
        <div className="flex items-center gap-1.5">
          <Button size="sm" variant="ghost" className="h-8 px-2 text-white hover:bg-white/20 text-xs flex-1" onClick={onView}>
            <ZoomIn className="w-3.5 h-3.5 mr-1" />View
          </Button>
          <Button size="sm" variant="ghost" className="h-8 px-2 text-white hover:bg-white/20 text-xs flex-1" onClick={onDownload}>
            <Download className="w-3.5 h-3.5 mr-1" />Save
          </Button>
          <Button size="sm" variant="ghost" className="h-8 px-2 text-white hover:bg-white/20 text-xs flex-1" onClick={onVariations}>
            <RotateCcw className="w-3.5 h-3.5 mr-1" />Vary
          </Button>
        </div>
      </div>
    </div>
  );
}
