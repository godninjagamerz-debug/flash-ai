import { useState } from 'react';
import { Image as ImageIcon, Video as VideoIcon, Download, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Message } from '@/types/chat';

interface MediaGalleryProps {
  messages: Message[];
  className?: string;
}

export function MediaGallery({ messages, className }: MediaGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const mediaMessages = messages.filter(msg => msg.media);

  if (mediaMessages.length === 0) {
    return null;
  }

  const handleDownload = async (media: Message['media']) => {
    if (!media) return;

    try {
      const src = media.url || `data:${media.mimeType};base64,${media.data}`;
      const response = await fetch(src);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = media.name || `flash-ai-${media.type}-${Date.now()}.${media.type === 'image' ? 'png' : 'mp4'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const openLightbox = (index: number) => {
    setSelectedIndex(index);
  };

  const closeLightbox = () => {
    setSelectedIndex(null);
  };

  const goToPrevious = () => {
    if (selectedIndex !== null && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
    }
  };

  const goToNext = () => {
    if (selectedIndex !== null && selectedIndex < mediaMessages.length - 1) {
      setSelectedIndex(selectedIndex + 1);
    }
  };

  const selectedMedia = selectedIndex !== null ? mediaMessages[selectedIndex].media : null;

  return (
    <>
      <div className={cn('grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4', className)}>
        {mediaMessages.map((msg, index) => {
          const media = msg.media!;
          const src = media.url || `data:${media.mimeType};base64,${media.data}`;

          return (
            <div
              key={msg.id}
              className="relative group rounded-xl overflow-hidden border-2 border-border hover:border-primary/50 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer aspect-square"
              onClick={() => openLightbox(index)}
            >
              {media.type === 'image' ? (
                <img
                  src={src}
                  alt={media.name || 'Generated image'}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
              ) : (
                <div className="relative w-full h-full">
                  <video
                    src={src}
                    className="w-full h-full object-cover"
                    muted
                    playsInline
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <VideoIcon className="w-12 h-12 text-white drop-shadow-lg" />
                  </div>
                </div>
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 bg-black/50 backdrop-blur-sm px-2 py-1 rounded-full">
                    {media.type === 'image' ? (
                      <ImageIcon className="w-3.5 h-3.5 text-white" />
                    ) : (
                      <VideoIcon className="w-3.5 h-3.5 text-white" />
                    )}
                    <span className="text-xs text-white font-medium">
                      {media.type === 'image' ? 'Image' : 'Video'}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload(media);
                    }}
                    className="h-7 w-7 bg-black/50 hover:bg-black/70 text-white backdrop-blur-sm rounded-full"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {selectedIndex !== null && selectedMedia && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 animate-fade-in"
          onClick={closeLightbox}
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={closeLightbox}
            className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-full w-12 h-12 z-10"
          >
            <X className="w-6 h-6" />
          </Button>

          {selectedIndex > 0 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                goToPrevious();
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 rounded-full w-12 h-12 z-10"
            >
              <ChevronLeft className="w-8 h-8" />
            </Button>
          )}

          {selectedIndex < mediaMessages.length - 1 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                goToNext();
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 rounded-full w-12 h-12 z-10"
            >
              <ChevronRight className="w-8 h-8" />
            </Button>
          )}

          <div className="relative max-w-7xl max-h-[90vh] flex flex-col items-center gap-6">
            {selectedMedia.type === 'image' ? (
              <img
                src={selectedMedia.url || `data:${selectedMedia.mimeType};base64,${selectedMedia.data}`}
                alt={selectedMedia.name || 'Generated image'}
                className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <video
                src={selectedMedia.url || `data:${selectedMedia.mimeType};base64,${selectedMedia.data}`}
                className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl"
                controls
                autoPlay
                loop
                onClick={(e) => e.stopPropagation()}
              />
            )}

            <div className="flex gap-4">
              <Button
                variant="secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownload(selectedMedia);
                }}
                className="bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm border-2 border-white/30 rounded-full px-8 py-3 shadow-2xl"
              >
                <Download className="w-5 h-5 mr-2" />
                <span className="font-bold">Download</span>
              </Button>

              <div className="bg-white/10 backdrop-blur-sm border-2 border-white/30 rounded-full px-6 py-3 text-white font-medium">
                {selectedIndex + 1} / {mediaMessages.length}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
