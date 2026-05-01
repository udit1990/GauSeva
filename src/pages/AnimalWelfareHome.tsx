import { useNavigate } from "react-router-dom";
import { Utensils, Bone, Cat, Banana, Stethoscope, ShieldCheck, Building2 } from "lucide-react";
import SevaCard from "@/components/SevaCard";
import BottomNav from "@/components/BottomNav";
import HeroMarquee from "@/components/HeroMarquee";
import ActivityTicker from "@/components/ActivityTicker";
import TrustBar from "@/components/TrustBar";
import { useSevaCategories, useSkus } from "@/hooks/useSkus";
import { useSevaImages, defaultImages } from "@/hooks/useSevaImages";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";

const iconMap: Record<string, any> = {
  Utensils,
  Stethoscope,
  ShieldCheck,
  Building2,
  Bone,
  Cat,
  Banana,
};

const QUICK_ADD_PRICE = 501;

const AnimalWelfareHome = () => {
  const navigate = useNavigate();
  const { data: images } = useSevaImages();
  const { data: categories } = useSevaCategories("animal_welfare");
  const { data: allSkus } = useSkus(undefined, "animal_welfare");
  const { addItem } = useCart();

  const minPriceByCategory: Record<string, number> = {};
  if (allSkus) {
    for (const sku of allSkus) {
      const cat = sku.category_id;
      if (!minPriceByCategory[cat] || sku.price < minPriceByCategory[cat]) {
        minPriceByCategory[cat] = sku.price;
      }
    }
  }

  const displayCategories = (categories || []).map((cat: any) => ({
    title: cat.title,
    subtitle: cat.subtitle,
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
      <header className="flex items-center justify-between px-5 pt-10 pb-2">
        <h1 className="text-lg font-bold text-foreground">Animal Welfare</h1>
      </header>

      <div className="px-5 space-y-5 mt-3">
        <HeroMarquee />
        <ActivityTicker />

        <div>
          <h3 className="text-base font-semibold text-foreground mb-3">Help Animals in Need</h3>
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
                quickAddPrice={QUICK_ADD_PRICE}
                onQuickAdd={() => handleQuickAdd(seva)}
                onClick={() => navigate(`/seva/${seva.id}`)}
              />
            ))}
          </div>
        </div>

        <TrustBar />
      </div>

      <BottomNav />
    </div>
  );
};

export default AnimalWelfareHome;
