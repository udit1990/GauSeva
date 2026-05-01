import { useNavigate } from "react-router-dom";
import { Utensils, Stethoscope, ShieldCheck, Building2, Bell, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import SevaCard from "@/components/SevaCard";
import BottomNav from "@/components/BottomNav";
import HeroMarquee from "@/components/HeroMarquee";
import ActivityTicker from "@/components/ActivityTicker";
import TrustBar from "@/components/TrustBar";
import DailySevaSubscription from "@/components/DailySevaSubscription";
import { useSevaImages, defaultImages } from "@/hooks/useSevaImages";
import { useSevaCategories, useSkus } from "@/hooks/useSkus";
import { useAuth } from "@/hooks/useAuth";
import { usePersona } from "@/hooks/usePersona";
import { useCart } from "@/contexts/CartContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import dhyanLogo from "@/assets/dhyan-main-logo.avif";

const iconMap: Record<string, any> = {
  Utensils,
  Stethoscope,
  ShieldCheck,
  Building2,
};

const URGENCY_TEXT: Record<string, string> = {
  annapurna: "38 cows waiting for food",
  dhanwantry: "12 cows need medical care",
  bajrang: "5 active rescue missions",
  vishwakarma: "3 shelters under construction",
};

const QUICK_ADD_PRICE = 501;

const hardcodedCategories = [
  { id: "annapurna", title: "Annapurna Daan", subtitle: "Feed cows daily", icon_name: "Utensils", image_key: "seva-feeding" },
  { id: "dhanwantry", title: "Dhanwantry Daan", subtitle: "Medical care", icon_name: "Stethoscope", image_key: "seva-medical" },
  { id: "bajrang", title: "Bajrang Daan", subtitle: "Rescue missions", icon_name: "ShieldCheck", image_key: "seva-rescue" },
  { id: "vishwakarma", title: "Vishwakarma Daan", subtitle: "Build shelters", icon_name: "Building2", image_key: "seva-shelter" },
];

const Index = () => {
  const navigate = useNavigate();
  const { data: images } = useSevaImages();
  const { data: categories } = useSevaCategories();
  const { data: allSkus } = useSkus();
  const { user, isVolunteer } = useAuth();
  const { t, isHindi } = usePersona();
  const { addItem } = useCart();

  const { data: unreadCount } = useQuery({
    queryKey: ["unread-notifications-count", user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const { count } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("read", false);
      return count || 0;
    },
    enabled: !!user && isVolunteer,
    refetchInterval: 30000,
  });

  // Active order for tracking banner
  const { data: activeOrder } = useQuery({
    queryKey: ["active-order", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("orders")
        .select("id, status, total_amount, created_at")
        .eq("user_id", user.id)
        .in("status", ["paid", "in_progress", "preparing", "assigned"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  // Compute min price per category
  const minPriceByCategory: Record<string, number> = {};
  if (allSkus) {
    for (const sku of allSkus) {
      const cat = sku.category_id;
      if (!minPriceByCategory[cat] || sku.price < minPriceByCategory[cat]) {
        minPriceByCategory[cat] = sku.price;
      }
    }
  }

  const sourceCategories = categories && categories.length > 0 ? categories : hardcodedCategories;

  const displayCategories = sourceCategories.map((cat: any) => ({
    title: t(cat.title, cat.title_hi),
    subtitle: t(cat.subtitle, cat.subtitle_hi),
    icon: iconMap[cat.icon_name] || Utensils,
    image: images?.[cat.image_key] || defaultImages[cat.image_key] || "",
    id: cat.id,
    startingPrice: minPriceByCategory[cat.id],
  }));

  const handleQuickAdd = (cat: typeof displayCategories[0]) => {
    addItem({
      skuId: `quick-${cat.id}`,
      categoryId: cat.id,
      name: `${cat.title} Quick Daan`,
      categoryName: cat.title,
      unitPrice: QUICK_ADD_PRICE,
      unit: "unit",
      isCustomAmount: true,
    });
    toast.success(`₹${QUICK_ADD_PRICE} ${cat.title} added to cart`);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="flex items-center justify-between px-5 pt-10 pb-2">
        <div className="flex items-center">
          <img src={dhyanLogo} alt="Dhyan Foundation" className="h-9 object-contain" />
        </div>
        <div className="flex items-center gap-2">
          {!user ? (
            <Button
              size="sm"
              onClick={() => navigate("/auth")}
              className="rounded-full text-xs h-8 px-5 font-semibold"
            >
              Sign In
            </Button>
          ) : isVolunteer ? (
            <button
              onClick={() => navigate("/alerts")}
              className="relative p-2 rounded-full hover:bg-muted transition-colors"
            >
              <Bell className="h-5 w-5 text-foreground" />
              {(unreadCount || 0) > 0 && (
                <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-destructive-foreground">
                  {(unreadCount || 0) > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
          ) : null}
        </div>
      </header>

      <div className="px-5 space-y-5 mt-3">
        {/* Action Hero */}
        <HeroMarquee />

        {/* Real-Time Activity Ticker */}
        <ActivityTicker />

        {/* Active Order Tracker Banner */}
        {activeOrder && (
          <button
            onClick={() => navigate(`/proof/${activeOrder.id}`)}
            className="w-full flex items-center gap-3 rounded-xl bg-primary/10 border border-primary/20 px-4 py-3 active:scale-[0.98] transition-transform"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/20">
              <Eye className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold text-foreground">Track Your Seva</p>
              <p className="text-xs text-muted-foreground">
                ₹{Number(activeOrder.total_amount).toLocaleString("en-IN")} · {activeOrder.status.replace("_", " ")}
              </p>
            </div>
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
            </span>
          </button>
        )}

        {/* Quote — links to Guru Ji */}
        <button
          onClick={() => navigate("/guru-ji")}
          className="w-full text-center py-1 active:scale-[0.98] transition-transform"
        >
          <p className="text-xs italic text-muted-foreground leading-relaxed">
            "Gau Seva is the fastest route to evolution in present times"
          </p>
          <p className="text-[10px] font-semibold text-primary mt-1">— Ashwini Guru Ji →</p>
        </button>

        {/* Daan Categories with LIVE badges + quick-add */}
        <div>
          <h3 className="text-base font-semibold text-foreground mb-3" {...(isHindi ? { lang: "hi" } : {})}>{t("Choose Your Daan", "अपना दान चुनें")}</h3>
          <div className="grid grid-cols-2 gap-3">
            {displayCategories.map((seva) => (
              <SevaCard
                key={seva.id}
                title={seva.title}
                subtitle={seva.subtitle}
                icon={seva.icon}
                image={seva.image}
                startingPrice={seva.startingPrice}
                isLive
                urgencyText={URGENCY_TEXT[seva.id]}
                quickAddPrice={QUICK_ADD_PRICE}
                onQuickAdd={() => handleQuickAdd(seva)}
                onClick={() => navigate(`/seva/${seva.id}`)}
              />
            ))}
          </div>
        </div>

        {/* Gupt Daan Banner */}
        <button
          onClick={() => navigate("/gupt-daan")}
          className="w-full flex items-center gap-3 rounded-xl bg-muted/60 border border-border px-4 py-3.5 active:scale-[0.98] transition-transform"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <EyeOff className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-semibold text-foreground" {...(isHindi ? { lang: "hi" } : {})}>{t("Gupt Daan", "गुप्त दान")}</p>
            <p className="text-xs text-muted-foreground" {...(isHindi ? { lang: "hi" } : {})}>{t("Anonymous silent seva — no identity recorded", "गुमनाम दान — कोई जानकारी नहीं ली जाएगी")}</p>
          </div>
        </button>

        {/* Trust Bar */}
        <TrustBar />

        {/* Daily Seva Subscription CTA (logged-in only) */}
        {user && <DailySevaSubscription />}
      </div>

      <BottomNav />
    </div>
  );
};

export default Index;
