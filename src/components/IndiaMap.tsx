import { MapPin } from "lucide-react";

interface GaushalLocation {
  state: string;
  city: string;
  lat: number;
  lng: number;
}

interface IndiaMapProps {
  locations: GaushalLocation[];
}

const IndiaMap = ({ locations }: IndiaMapProps) => {
  // Map real lat/lng to SVG viewBox coordinates
  // India roughly: lat 8-37, lng 68-97
  const mapPoint = (lat: number, lng: number) => {
    const x = ((lng - 68) / 29) * 280 + 10;
    const y = ((37 - lat) / 29) * 280 + 10;
    return { x, y };
  };

  return (
    <div className="rounded-xl bg-card shadow-sm p-4">
      <div className="relative w-full" style={{ aspectRatio: "1/1" }}>
        <svg viewBox="0 0 300 300" className="w-full h-full">
          {/* More accurate India outline */}
          <path
            d="M95,25 L100,20 L110,22 L120,18 L130,20 L140,15 L150,18 L160,15 L170,20 L180,18 L190,22 L200,20 L210,25 L215,30 L220,28 L225,32 L230,35 L235,38 L240,42 L238,48 L242,55 L240,62 L245,68 L248,75 L250,82 L252,90 L255,98 L258,105 L260,112 L258,120 L255,128 L252,135 L250,142 L248,150 L245,158 L240,165 L235,172 L230,178 L225,185 L220,192 L215,198 L210,205 L205,212 L200,218 L195,225 L190,230 L185,238 L180,245 L175,250 L170,258 L165,262 L160,268 L155,272 L150,278 L148,282 L145,278 L140,272 L135,265 L130,258 L125,250 L120,242 L115,235 L108,228 L102,220 L96,212 L90,205 L85,198 L80,190 L76,182 L72,175 L68,168 L65,160 L62,152 L60,145 L58,138 L56,130 L55,122 L54,115 L55,108 L58,100 L60,92 L63,85 L66,78 L70,70 L75,62 L78,55 L82,48 L86,40 L90,32 Z"
            fill="hsl(var(--primary) / 0.06)"
            stroke="hsl(var(--primary) / 0.25)"
            strokeWidth="1"
            strokeLinejoin="round"
          />

          {/* State region hint for eastern India (where gaushalas are) */}
          <path
            d="M200,60 Q220,65 235,80 Q245,95 248,105 L250,115 Q248,125 240,135 L235,140 Q225,148 215,155 L210,158 Q205,155 200,150 L195,145 Q190,138 188,130 L186,120 Q188,110 192,100 L195,90 Q198,78 200,60 Z"
            fill="hsl(var(--primary) / 0.08)"
            stroke="none"
          />

          {/* Location dots with pulse */}
          {locations.map((g, i) => {
            const { x, y } = mapPoint(g.lat, g.lng);
            return (
              <g key={i}>
                {/* Pulse ring */}
                <circle cx={x} cy={y} r="6" fill="hsl(var(--primary))" opacity="0.15">
                  <animate attributeName="r" from="4" to="14" dur="2s" begin={`${i * 0.2}s`} repeatCount="indefinite" />
                  <animate attributeName="opacity" from="0.25" to="0" dur="2s" begin={`${i * 0.2}s`} repeatCount="indefinite" />
                </circle>
                {/* Dot */}
                <circle cx={x} cy={y} r="4" fill="hsl(var(--primary))" />
                {/* White inner */}
                <circle cx={x} cy={y} r="1.5" fill="hsl(var(--primary-foreground))" />
              </g>
            );
          })}
        </svg>
      </div>

      {/* Location list */}
      <div className="mt-3 grid grid-cols-2 gap-1.5">
        {locations.map((g, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <MapPin className="h-3 w-3 text-primary shrink-0" />
            <span className="text-xs text-foreground font-medium">{g.city}</span>
            <span className="text-[10px] text-muted-foreground">({g.state})</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default IndiaMap;
