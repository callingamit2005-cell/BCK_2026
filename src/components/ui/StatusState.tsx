import React from 'react';
import { 
  Loader2, 
  Wallet, 
  Search, 
  AlertCircle, 
  WifiOff, 
  Inbox,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';

/**
 * StatusState - Enterprise UI Feedback Component
 * Unified handling for Loading, Empty, and Error states.
 */

type StateType = 'loading' | 'empty' | 'error' | 'offline' | 'search';

interface StatusStateProps {
  type: StateType;
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
  variant?: 'card' | 'inline' | 'fullscreen';
  icon?: React.ReactNode;
}

const config: Record<StateType, { icon: any; color: string; defaultTitle: string }> = {
  loading: {
    icon: Loader2,
    color: 'text-primary',
    defaultTitle: 'Auditing Data',
  },
  empty: {
    icon: Inbox,
    color: 'text-muted-foreground/40',
    defaultTitle: 'No Records Found',
  },
  error: {
    icon: AlertCircle,
    color: 'text-expense',
    defaultTitle: 'System Alert',
  },
  offline: {
    icon: WifiOff,
    color: 'text-muted-foreground/60',
    defaultTitle: 'Connection Interrupted',
  },
  search: {
    icon: Search,
    color: 'text-muted-foreground/40',
    defaultTitle: 'No Matching Results',
  }
};

export const StatusState: React.FC<StatusStateProps> = ({
  type,
  title,
  message,
  actionLabel,
  onAction,
  className,
  variant = 'card',
  icon: customIcon
}) => {
  const { icon: DefaultIcon, color, defaultTitle } = config[type];
  const Icon = customIcon || <DefaultIcon className={cn("h-10 w-10", color, type === 'loading' && "animate-spin")} />;

  const containerClasses = cn(
    "flex flex-col items-center justify-center text-center animate-in fade-in duration-500",
    variant === 'card' && "p-12 bg-card border border-border/40 rounded-3xl shadow-sm",
    variant === 'inline' && "py-8",
    variant === 'fullscreen' && "min-h-[60vh] w-full",
    className
  );

  return (
    <div className={containerClasses}>
      <div className={cn(
        "mb-6 p-5 rounded-2xl border bg-muted/20 shadow-inner",
        type === 'error' ? "border-expense/10" : "border-border/40"
      )}>
        {Icon}
      </div>

      <h3 className="text-lg font-extrabold text-foreground tracking-tight uppercase mb-2">
        {title || defaultTitle}
      </h3>

      {message && (
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] leading-relaxed max-w-[280px] mb-8">
          {message}
        </p>
      )}

      {actionLabel && onAction && (
        <Button
          onClick={onAction}
          variant="outline"
          className="h-12 px-8 rounded-xl font-bold uppercase text-[10px] tracking-widest border-border/60 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all active:scale-95"
        >
          {actionLabel}
        </Button>
      )}
      
      {type === 'loading' && !message && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/5 border border-primary/10 rounded-full">
          <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
          <span className="text-[9px] font-black text-primary uppercase tracking-widest">Global Intelligence Active</span>
        </div>
      )}
    </div>
  );
};
