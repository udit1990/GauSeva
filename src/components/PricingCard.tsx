import { cn } from "@/lib/utils";

interface PricingCardProps {
  amount: number;
  label: string;
  selected?: boolean;
  onClick?: () => void;
}

const PricingCard = ({ amount, label, selected, onClick }: PricingCardProps) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center rounded-lg border-2 p-4 transition-all duration-200 active:scale-[0.97]",
        selected
          ? "border-primary bg-primary/5 shadow-md"
          : "border-border bg-card hover:border-primary/40"
      )}
    >
      <span className={cn(
        "text-xl font-bold",
        selected ? "text-primary" : "text-foreground"
      )}>
        ₹{amount}
      </span>
      <span className="mt-1 text-xs text-muted-foreground text-center leading-tight">{label}</span>
    </button>
  );
};

export default PricingCard;
