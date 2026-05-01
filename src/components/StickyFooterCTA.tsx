import { Button } from "@/components/ui/button";

interface StickyFooterCTAProps {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
}

const StickyFooterCTA = ({ label, onClick, disabled }: StickyFooterCTAProps) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-sm px-5 py-3 pb-safe">
      <Button
        onClick={onClick}
        disabled={disabled}
        className="w-full h-12 rounded-lg text-base font-semibold shadow-lg"
        size="lg"
      >
        {label}
      </Button>
    </div>
  );
};

export default StickyFooterCTA;
