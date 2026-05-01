import { LucideIcon } from "lucide-react";

interface SevaCardProps {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  image: string;
  startingPrice?: number;
  onClick?: () => void;
  isLive?: boolean;
  urgencyText?: string;
  quickAddPrice?: number;
  onQuickAdd?: () => void;
}

const SevaCard = ({
  title, subtitle, icon: Icon, image, startingPrice,
  onClick, isLive, urgencyText, quickAddPrice, onQuickAdd,
}: SevaCardProps) => {
  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-lg bg-card shadow-sm hover:shadow-md transition-all duration-200">
      <button
        onClick={onClick}
        className="relative aspect-[4/3] overflow-hidden active:scale-[0.98] transition-transform"
      >
        <img
          src={image}
          alt={title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        {/* LIVE badge */}
        {isLive && (
          <span className="absolute top-2 left-2 flex items-center gap-1 rounded-full bg-foreground/70 px-2 py-0.5 backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 bg-[hsl(var(--chart-2))]" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[hsl(var(--chart-2))]" />
            </span>
            <span className="text-[10px] font-bold text-white uppercase tracking-wide">Live</span>
          </span>
        )}
        {startingPrice != null && (
          <span className="absolute top-2 right-2 rounded-md bg-primary px-2 py-0.5 text-[11px] font-bold text-primary-foreground shadow">
            From ₹{startingPrice}
          </span>
        )}
      </button>

      <div className="flex flex-1 items-center gap-2 p-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-secondary/10">
          <Icon className="h-4 w-4 text-secondary" />
        </div>
        <div className="flex-1 min-w-0 text-left">
          <p className="text-sm font-semibold text-foreground leading-tight">{title}</p>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
          {urgencyText && (
            <p className="text-[10px] font-semibold text-destructive mt-0.5">{urgencyText}</p>
          )}
        </div>
      </div>

      {/* Quick-add button */}
      {quickAddPrice != null && onQuickAdd && (
        <div className="px-3 pb-3 pt-0 mt-auto">
          <button
            onClick={(e) => { e.stopPropagation(); onQuickAdd(); }}
            className="w-full rounded-md bg-primary py-2 text-xs font-bold text-primary-foreground shadow-sm active:scale-[0.97] transition-transform"
          >
            Quick Daan ₹{quickAddPrice}
          </button>
        </div>
      )}
    </div>
  );
};

export default SevaCard;
