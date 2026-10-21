import { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface SuggestionCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  onClick: () => void;
}

export function SuggestionCard({ icon: Icon, title, description, onClick }: SuggestionCardProps) {
  return (
    <Card
      className={cn(
        'p-5 cursor-pointer transition-all hover-lift border-2',
        'bg-gradient-to-br from-card to-card/95 border-border/50 group animate-zoom-in',
        'hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/20',
        'hover:scale-[1.02] active:scale-[0.98]'
      )}
      onClick={onClick}
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center group-hover:from-primary/25 group-hover:to-primary/15 transition-all group-hover:scale-110 group-hover:rotate-6 shadow-md">
          <Icon className="w-6 h-6 text-primary group-hover:animate-pulse" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-[15px] text-foreground mb-1.5 group-hover:text-primary transition-colors tracking-wide">{title}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{description}</p>
        </div>
      </div>
    </Card>
  );
}
