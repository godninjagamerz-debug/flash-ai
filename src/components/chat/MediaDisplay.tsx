import { useState } from 'react';
import { Download, Maximize2, X, Play, Pause, Volume2, VolumeX, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface MediaDisplayProps {
  type: 'image' | 'video';
  src: string;
  alt?: string;
  className?: string;
}

export function MediaDisplay({ type, src, alt = 'Generated media', className }: MediaDisplayProps) {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const { toast } = useToast();

  const handleDownload = async () => {
    try {
      const response = await fetch(src);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `flash-ai-${type}-${Date.now()}.${type === 'image' ? 'png' : 'mp4'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: '✅ Download Started',
        description: `Your ${type} is being downloaded!`,
      });
    } catch (error) {
      toast({
        title: 'Download Failed',
        description: 'Failed to download the file. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleVideoToggle = (e: React.MouseEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    if (video.paused) {
      video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const handleMuteToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    const video = document.querySelector(`video[src="${src}"]`) as HTMLVideoElement;
    if (video) {
      video.muted = !video.muted;
      setIsMuted(video.muted);
    }
  };

  if (hasError) {
    return (
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-destructive/10 to-destructive/5 border-2 border-destructive/30 p-8 text-center">
        <p className="text-destructive font-medium">Failed to load {type}</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.open(src, '_blank')}
          className="mt-4"
        >
          Open in New Tab
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className={cn('relative group', className)}>
        {/* Main Media Container */}
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-card to-card/95 border-2 border-border/50 shadow-2xl hover:shadow-primary/20 transition-all duration-300">
          {/* Loading Overlay */}
          {isLoading && (
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10 backdrop-blur-sm flex items-center justify-center z-10">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <p className="text-sm font-medium text-foreground">Loading {type}...</p>
              </div>
            </div>
          )}

          {/* Media Content */}
          {type === 'image' ? (
            <img
              src={src}
              alt={alt}
              className="w-full h-auto max-h-[500px] object-contain cursor-pointer hover:scale-[1.02] transition-transform duration-300"
              onClick={() => setIsLightboxOpen(true)}
              onLoad={() => setIsLoading(false)}
              onError={() => {
                setIsLoading(false);
                setHasError(true);
              }}
            />
          ) : (
            <div className="relative">
              <video
                src={src}
                className="w-full h-auto max-h-[500px] object-contain cursor-pointer"
                onClick={handleVideoToggle}
                onLoadedData={() => setIsLoading(false)}
                onError={() => {
                  setIsLoading(false);
                  setHasError(true);
                }}
                loop
                playsInline
              />
              
              {/* Video Controls Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-auto">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleMuteToggle}
                    className="bg-black/50 hover:bg-black/70 text-white backdrop-blur-sm rounded-full"
                  >
                    {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  </Button>
                  
                  <div className="flex items-center gap-2">
                    <div className="bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-full">
                      <span className="text-white text-sm font-medium">
                        {isPlaying ? 'Playing' : 'Paused'}
                      </span>
                    </div>
                    {isPlaying ? (
                      <Pause className="w-6 h-6 text-white drop-shadow-lg" />
                    ) : (
                      <Play className="w-6 h-6 text-white drop-shadow-lg" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons Overlay */}
          <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Button
              variant="secondary"
              size="icon"
              onClick={handleDownload}
              className="bg-black/50 hover:bg-black/70 text-white backdrop-blur-sm rounded-full shadow-lg hover:scale-110 transition-transform"
              title="Download"
            >
              <Download className="w-5 h-5" />
            </Button>
            
            {type === 'image' && (
              <Button
                variant="secondary"
                size="icon"
                onClick={() => setIsLightboxOpen(true)}
                className="bg-black/50 hover:bg-black/70 text-white backdrop-blur-sm rounded-full shadow-lg hover:scale-110 transition-transform"
                title="View Fullscreen"
              >
                <Maximize2 className="w-5 h-5" />
              </Button>
            )}
          </div>

          {/* Media Type Badge */}
          <div className="absolute bottom-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground px-4 py-2 rounded-full shadow-lg backdrop-blur-sm">
              <span className="text-sm font-bold tracking-wide">
                {type === 'image' ? '🎨 AI Generated Image' : '🎬 AI Generated Video'}
              </span>
            </div>
          </div>
        </div>

        {/* Download Button Below Media */}
        <div className="mt-4 flex justify-center">
          <Button
            variant="outline"
            onClick={handleDownload}
            className="group/btn bg-gradient-to-r from-primary/10 to-accent/10 hover:from-primary/20 hover:to-accent/20 border-2 border-primary/30 hover:border-primary/50 rounded-full px-6 py-2.5 shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <Download className="w-4 h-4 mr-2 group-hover/btn:animate-bounce" />
            <span className="font-semibold">Download {type === 'image' ? 'Image' : 'Video'}</span>
          </Button>
        </div>
      </div>

      {/* Lightbox Modal for Images */}
      {type === 'image' && isLightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setIsLightboxOpen(false)}
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-full w-12 h-12"
          >
            <X className="w-6 h-6" />
          </Button>
          
          <div className="relative max-w-7xl max-h-[90vh] flex flex-col items-center gap-6">
            <img
              src={src}
              alt={alt}
              className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            
            <Button
              variant="secondary"
              onClick={(e) => {
                e.stopPropagation();
                handleDownload();
              }}
              className="bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm border-2 border-white/30 rounded-full px-8 py-3 shadow-2xl"
            >
              <Download className="w-5 h-5 mr-2" />
              <span className="font-bold">Download Full Resolution</span>
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
