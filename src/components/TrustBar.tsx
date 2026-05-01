import { BadgeCheck, Heart, ShieldCheck } from "lucide-react";

const items = [
  { icon: BadgeCheck, label: "80G Tax Receipt" },
  { icon: Heart, label: "100% to Charity" },
  { icon: ShieldCheck, label: "Verified Foundation" },
];

const TrustBar = () => (
  <div className="flex items-center justify-around rounded-lg bg-card shadow-sm px-3 py-3">
    {items.map((item, i) => (
      <div key={i} className="flex items-center gap-1.5">
        <item.icon className="h-3.5 w-3.5 text-secondary" />
        <span className="text-[11px] font-medium text-muted-foreground">{item.label}</span>
      </div>
    ))}
  </div>
);

export default TrustBar;
