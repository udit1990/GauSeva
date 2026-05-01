import { Play } from "lucide-react";

interface MediaCardProps {
  image: string;
  isVideo?: boolean;
  onClick?: () => void;
}

const MediaCard = ({ image, isVideo, onClick }: MediaCardProps) => {
  return (
    <button
      onClick={onClick}
      className="relative aspect-[4/3] overflow-hidden rounded-lg bg-muted active:scale-[0.98] transition-transform"
    >
      <img src={image} alt="Seva proof" className="h-full w-full object-cover" loading="lazy" />
      {isVideo && (
        <div className="absolute inset-0 flex items-center justify-center bg-foreground/20">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-card/90 shadow-lg">
            <Play className="h-5 w-5 text-primary ml-0.5" />
          </div>
        </div>
      )}
    </button>
  );
};

export default MediaCard;
