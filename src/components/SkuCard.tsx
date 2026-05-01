import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface SkuCardProps {
  name: string;
  description?: string;
  price: number;
  unit: string;
  quantity: number;
  disabled?: boolean;
  onAdd: () => void;
  onRemove: () => void;
}

const SkuCard = ({ name, description, price, unit, quantity, disabled = false, onAdd, onRemove }: SkuCardProps) => {
  return (
    <div className={cn(
      "flex items-center justify-between rounded-lg border-2 p-3 transition-all",
      quantity > 0 ? "border-primary bg-primary/5" : "border-border bg-card",
      disabled && quantity === 0 && "opacity-70"
    )}>
      <div className="flex-1 min-w-0 mr-3">
        <p className="text-sm font-semibold text-foreground truncate">{name}</p>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{description}</p>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          ₹{price} / {unit}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {quantity > 0 ? (
          <>
            <button
              onClick={onRemove}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-foreground"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="w-5 text-center text-sm font-bold text-primary">{quantity}</span>
            <button
              onClick={onAdd}
              disabled={disabled}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </>
        ) : (
          <button
            onClick={onAdd}
            disabled={disabled}
            className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            Add
          </button>
        )}
      </div>
    </div>
  );
};

export default SkuCard;
