import { Sparkles, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

export function FlashLogo({ className }: { className?: string }) {
  return (
    <span
      aria-label="Flash AI"
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-cyan-400 via-sky-500 to-blue-700 text-white shadow-md shadow-sky-500/20 ring-1 ring-white/25',
        className
      )}
    >
      <Zap className="h-[58%] w-[58%] fill-current stroke-[2.5]" />
      <Sparkles className="absolute right-[14%] top-[12%] h-[23%] w-[23%] stroke-[2.5]" />
    </span>
  );
}