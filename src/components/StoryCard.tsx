import { useRef, useCallback } from "react";
import { Download, Instagram } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StoryCardProps {
  donorName: string;
  amount: number;
  gaushalaName?: string;
  orderId: string;
  evidenceUrl?: string;
}

const StoryCard = ({ donorName, amount, gaushalaName, orderId, evidenceUrl }: StoryCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleDownloadStory = useCallback(async () => {
    if (!cardRef.current) return;
    // Use html2canvas-style approach via canvas API
    const card = cardRef.current;
    const canvas = document.createElement("canvas");
    const scale = 2;
    canvas.width = card.offsetWidth * scale;
    canvas.height = card.offsetHeight * scale;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.scale(scale, scale);

    // Draw gradient background
    const grad = ctx.createLinearGradient(0, 0, 0, card.offsetHeight);
    grad.addColorStop(0, "#1a3a2a");
    grad.addColorStop(1, "#0d1f15");
    ctx.fillStyle = grad;
    ctx.roundRect(0, 0, card.offsetWidth, card.offsetHeight, 24);
    ctx.fill();

    // Draw decorative circle
    ctx.beginPath();
    ctx.arc(card.offsetWidth - 40, 60, 80, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,180,80,0.1)";
    ctx.fill();

    // Text styles
    ctx.fillStyle = "#e8c87a";
    ctx.font = "bold 14px 'Public Sans', sans-serif";
    ctx.fillText("🙏 GAU SEVA COMPLETE", 28, 48);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 32px 'Public Sans', sans-serif";
    ctx.fillText(`₹${amount.toLocaleString("en-IN")}`, 28, 96);

    ctx.fillStyle = "#b0c9b8";
    ctx.font = "500 14px 'Public Sans', sans-serif";
    ctx.fillText(`by ${donorName}`, 28, 122);

    if (gaushalaName) {
      ctx.fillStyle = "#8fa898";
      ctx.font = "400 12px 'Public Sans', sans-serif";
      ctx.fillText(`📍 ${gaushalaName}`, 28, 150);
    }

    // Track link
    const trackY = card.offsetHeight - 44;
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.roundRect(20, trackY - 8, card.offsetWidth - 40, 32, 12);
    ctx.fill();
    ctx.fillStyle = "#8fa898";
    ctx.font = "400 10px 'Public Sans', monospace";
    ctx.fillText(`Track: dhyan-hearth-gift.lovable.app/proof/${orderId.slice(0, 8)}`, 32, trackY + 12);

    // Bottom brand
    ctx.fillStyle = "#e8c87a";
    ctx.font = "bold 11px 'Public Sans', sans-serif";
    ctx.fillText("DHYAN FOUNDATION · dhyanfoundation.com", 28, card.offsetHeight - 14);

    // Download
    const link = document.createElement("a");
    link.download = `seva-story-${orderId.slice(0, 8)}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }, [donorName, amount, gaushalaName, orderId]);

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Share Your Impact</p>

      {/* Preview card */}
      <div
        ref={cardRef}
        className="relative overflow-hidden rounded-2xl p-7"
        style={{
          background: "linear-gradient(165deg, #1a3a2a 0%, #0d1f15 100%)",
          width: "100%",
          aspectRatio: "9/16",
          maxHeight: 320,
        }}
      >
        {/* Decorative */}
        <div className="absolute -top-8 -right-8 h-40 w-40 rounded-full bg-primary/10" />
        <div className="absolute bottom-12 -left-12 h-32 w-32 rounded-full bg-secondary/10" />

        <div className="relative z-10 flex flex-col justify-between h-full">
          <div>
            <p className="text-xs font-bold tracking-widest" style={{ color: "#e8c87a" }}>
              🙏 GAU SEVA COMPLETE
            </p>
            <p className="text-3xl font-bold text-white mt-3">
              ₹{amount.toLocaleString("en-IN")}
            </p>
            <p className="text-sm font-medium text-white/70 mt-1">by {donorName}</p>
            {gaushalaName && (
              <p className="text-xs text-white/50 mt-2">📍 {gaushalaName}</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="rounded-lg bg-white/[0.06] px-3 py-2">
              <p className="text-[10px] font-mono text-white/40">
                Track: dhyan-hearth-gift.lovable.app/proof/{orderId.slice(0, 8)}
              </p>
            </div>
            <p className="text-[10px] font-bold tracking-wider" style={{ color: "#e8c87a" }}>
              DHYAN FOUNDATION · dhyanfoundation.com
            </p>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-2">
        <Button
          onClick={handleDownloadStory}
          variant="outline"
          className="h-11 rounded-lg text-xs font-semibold"
        >
          <Download className="h-3.5 w-3.5 mr-1.5" />
          Save Story
        </Button>
        <Button
          onClick={() => {
            handleDownloadStory();
            // After download, prompt user to share on Instagram
            setTimeout(() => {
              window.open("https://www.instagram.com/", "_blank");
            }, 500);
          }}
          className="h-11 rounded-lg text-xs font-semibold bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0"
        >
          <Instagram className="h-3.5 w-3.5 mr-1.5" />
          Instagram Story
        </Button>
      </div>
    </div>
  );
};

export default StoryCard;
