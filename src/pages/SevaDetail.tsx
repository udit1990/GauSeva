import { useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import SkuCard from "@/components/SkuCard";

import { useSevaImages, defaultImages } from "@/hooks/useSevaImages";
import { useSkus } from "@/hooks/useSkus";
import { useCart } from "@/contexts/CartContext";
import { useGaushalas } from "@/hooks/useGaushalas";
import { usePersona } from "@/hooks/usePersona";

const hardcodedSkus: Record<string, Array<{ id: string; name: string; price: number; unit: string; description: string }>> = {
  annapurna: [
    { id: "hc-anna-1", name: "Gur (Jaggery)", price: 51, unit: "kg", description: "Pure jaggery for cows" },
    { id: "hc-anna-2", name: "Hara Chaara", price: 101, unit: "bundle", description: "Fresh green fodder" },
    { id: "hc-anna-3", name: "Dalia", price: 151, unit: "kg", description: "Nutritious porridge grain" },
    { id: "hc-anna-4", name: "Full Day Meal (1 cow)", price: 501, unit: "cow/day", description: "Complete daily meal for one cow" },
    { id: "hc-anna-5", name: "Full Day Meal (10 cows)", price: 2100, unit: "cow/day", description: "Full day meals for 10 cows" },
  ],
  dhanwantry: [
    { id: "hc-dhan-1", name: "Basic Medicines", price: 251, unit: "pack", description: "Essential veterinary medicines" },
    { id: "hc-dhan-2", name: "Vaccination Course", price: 501, unit: "course", description: "Full vaccination for one cow" },
    { id: "hc-dhan-3", name: "Medical Equipment", price: 1100, unit: "set", description: "Veterinary equipment set" },
    { id: "hc-dhan-4", name: "Emergency Surgery Fund", price: 5100, unit: "surgery", description: "Fund emergency cow surgeries" },
    { id: "hc-dhan-5", name: "Monthly Vet Visit", price: 2100, unit: "visit", description: "Monthly veterinarian visit" },
  ],
  bajrang: [
    { id: "hc-bajr-1", name: "Legal Expenses", price: 1100, unit: "case", description: "Legal costs for rescue cases" },
    { id: "hc-bajr-2", name: "Transportation", price: 501, unit: "trip", description: "Transport rescued cows safely" },
    { id: "hc-bajr-3", name: "Cow Purchase from Butchers", price: 15000, unit: "cow", description: "Buy cows from slaughter" },
    { id: "hc-bajr-4", name: "Rescue Team Kit", price: 2100, unit: "kit", description: "Equipment for rescue teams" },
  ],
  vishwakarma: [
    { id: "hc-vish-1", name: "Water Drum", price: 1100, unit: "drum", description: "Large water storage drum" },
    { id: "hc-vish-2", name: "Small Shed (10x10 ft)", price: 11000, unit: "shed", description: "Shelter for 3-4 cows" },
    { id: "hc-vish-3", name: "Medium Shed (20x15 ft)", price: 25000, unit: "shed", description: "Shelter for 8-10 cows" },
    { id: "hc-vish-4", name: "Large Shed (30x20 ft)", price: 51000, unit: "shed", description: "Shelter for 15-20 cows" },
    { id: "hc-vish-5", name: "Tarpauline Sheet", price: 501, unit: "sheet", description: "Weather protection sheets" },
  ],
};

const SevaDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [customAmount, setCustomAmount] = useState("");
  const [selectedGaushala, setSelectedGaushala] = useState<string>("");
  const { data: images } = useSevaImages();
  const { data: skus, isLoading } = useSkus(id);
  const { items, addItem, updateQuantity, removeItem, setGaushalaId } = useCart();
  const { data: gaushalas } = useGaushalas();
  const { t, isHindi } = usePersona();

  const displaySkus = useMemo(() => {
    if (skus && skus.length > 0) return skus;
    const fallback = hardcodedSkus[id || "annapurna"] || hardcodedSkus.annapurna;
    return fallback.map((s) => ({ ...s, category_id: id || "annapurna", is_active: true, sort_order: 0, min_qty: 1, max_qty: 100, image_key: null, created_at: "", updated_at: "" }));
  }, [skus, id]);

  const categoryMeta: Record<string, { title: string; titleHi?: string; desc: string; descHi?: string; imageKeys: string[] }> = {
    annapurna: {
      title: "Annapurna Daan", titleHi: "अन्नपूर्णा दान",
      desc: "Provide daily nutritious meals to cows at our gaushala.",
      descHi: "गौशाला में गायों को रोज़ पौष्टिक भोजन खिलाएँ।",
      imageKeys: ["seva-feeding", "seva-medical", "seva-rescue"],
    },
    dhanwantry: {
      title: "Dhanwantry Daan", titleHi: "धन्वंतरी दान",
      desc: "Fund veterinary care and medical treatment for injured and sick cows.",
      descHi: "बीमार और घायल गायों के इलाज और देखभाल के लिए दान करें।",
      imageKeys: ["seva-medical", "seva-feeding", "seva-shelter"],
    },
    bajrang: {
      title: "Bajrang Daan", titleHi: "बजरंग दान",
      desc: "Support our cow rescue missions — legal, transport, and purchase from butchers.",
      descHi: "गौ बचाव अभियान में सहायता करें — कानूनी, परिवहन और कसाई से छुड़ाना।",
      imageKeys: ["seva-rescue", "seva-medical", "seva-feeding"],
    },
    vishwakarma: {
      title: "Vishwakarma Daan", titleHi: "विश्वकर्मा दान",
      desc: "Help us build and maintain comfortable shelters for rescued cows.",
      descHi: "बचाई गई गायों के लिए आरामदायक आश्रय बनाने में मदद करें।",
      imageKeys: ["seva-shelter", "seva-rescue", "seva-feeding"],
    },
    "dog-feed": {
      title: "Feed a Dog",
      desc: "Provide meals to street dogs in need of nourishment.",
      imageKeys: ["seva-feeding", "seva-rescue", "seva-medical"],
    },
    "dog-rescue": {
      title: "Rescue Dogs",
      desc: "Support dog rescue operations — medical care, shelter, and rehabilitation.",
      imageKeys: ["seva-rescue", "seva-medical", "seva-feeding"],
    },
    "cat-care": {
      title: "Care for Cats",
      desc: "Medical and food support for stray cats — vaccinations, sterilization, and meals.",
      imageKeys: ["seva-medical", "seva-feeding", "seva-rescue"],
    },
    "monkey-feed": {
      title: "Monkey Feeding",
      desc: "Provide food to monkeys in urban areas — fruits, grains, and seasonal supplies.",
      imageKeys: ["seva-feeding", "seva-medical", "seva-rescue"],
    },
  };

  const sevaMeta = categoryMeta[id || "annapurna"] || categoryMeta.annapurna;
  const sevaTitle = t(sevaMeta.title, sevaMeta.titleHi);
  const sevaDesc = t(sevaMeta.desc, sevaMeta.descHi);
  const sevaImages = sevaMeta.imageKeys.map((key) => images?.[key] || defaultImages[key] || "");
  const requiresGaushalaSelection = (gaushalas?.length || 0) > 0;
  const canAddDonation = !requiresGaushalaSelection || !!selectedGaushala;

  const getItemQuantity = (skuId: string) => {
    return items.find((i) => i.skuId === skuId)?.quantity || 0;
  };

  const handleGaushalaChange = (gaushalaId: string) => {
    setSelectedGaushala(gaushalaId);
    setGaushalaId(gaushalaId);
  };

  const handleAddCustomAmount = () => {
    if (!canAddDonation) return;
    const amount = parseFloat(customAmount);
    if (!amount || amount < 1) return;
    const customId = `custom-${id}-${Date.now()}`;
    addItem({
      skuId: customId,
      categoryId: id || "annapurna",
      name: t("Custom Donation", "कस्टम दान"),
      categoryName: sevaTitle,
      unitPrice: amount,
      unit: "donation",
      isCustomAmount: true,
    });
    setCustomAmount("");
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Image Carousel */}
      <div className="relative">
        <div className="h-[35vh] overflow-hidden">
          <img
            src={sevaImages[currentSlide]}
            alt={sevaTitle}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </div>
        <button
          onClick={() => navigate(-1)}
          className="absolute top-10 left-4 flex h-9 w-9 items-center justify-center rounded-full bg-card/80 backdrop-blur-sm shadow"
        >
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
          {sevaImages.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === currentSlide ? "w-6 bg-primary-foreground" : "w-1.5 bg-primary-foreground/50"
              }`}
            />
          ))}
        </div>
      </div>

      <div className="px-5 pt-5 space-y-5">
        {/* Title & Description */}
        <div {...(isHindi ? { lang: "hi" } : {})}>
          <h1 className="text-xl font-bold text-foreground">{sevaTitle}</h1>
          <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{sevaDesc}</p>
        </div>

        {/* Quick Amount Buttons */}
        <div>
          <h3 className="text-base font-semibold text-foreground mb-2" {...(isHindi ? { lang: "hi" } : {})}>
            {t("Quick Daan", "जल्दी दान")}
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {[
              { amount: 251, desc: t("Basic medicines for 1 cow", "1 गाय के लिए बुनियादी दवाइयाँ") },
              { amount: 501, desc: t("Feed 10 cows for one meal", "10 गायों को एक वक्त का खाना") },
              { amount: 2501, desc: t("Full day care for 5 cows", "5 गायों की पूरे दिन की देखभाल") },
              { amount: 5100, desc: t("Emergency surgery fund", "इमरजेंसी सर्जरी फ़ंड") },
            ].map((preset) => (
              <button
                key={preset.amount}
                disabled={!canAddDonation}
                onClick={() =>
                  addItem({
                    skuId: `quick-${id}-${preset.amount}`,
                    categoryId: id || "annapurna",
                    name: `₹${preset.amount.toLocaleString("en-IN")} ${t("Daan", "दान")}`,
                    categoryName: sevaTitle,
                    unitPrice: preset.amount,
                    unit: "donation",
                    isCustomAmount: true,
                  })
                }
                className="flex flex-col items-start rounded-lg border-2 border-border bg-card p-3 text-left transition-all active:scale-[0.97] hover:border-primary/50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-border"
              >
                <span className="text-base font-bold text-primary">₹{preset.amount.toLocaleString("en-IN")}</span>
                <span className="text-[11px] text-muted-foreground leading-tight mt-0.5">{preset.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Gaushala Selection */}
        {gaushalas && gaushalas.length > 0 && (
          <div>
            <h3 className="text-base font-semibold text-foreground mb-3" {...(isHindi ? { lang: "hi" } : {})}>
              {t("Choose Gaushala", "गौशाला चुनें")}
            </h3>
            <div className="space-y-2">
              {gaushalas.map((g) => (
                <button
                  key={g.id}
                  onClick={() => handleGaushalaChange(g.id)}
                  className={`w-full flex items-center gap-3 rounded-lg border-2 p-3 transition-all text-left ${
                    selectedGaushala === g.id
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card"
                  }`}
                >
                  <MapPin className={`h-4 w-4 shrink-0 ${selectedGaushala === g.id ? "text-primary" : "text-muted-foreground"}`} />
                  <div>
                    <p className="text-sm font-semibold text-foreground">{g.name}</p>
                    <p className="text-xs text-muted-foreground">{g.city}, {g.state}</p>
                  </div>
                </button>
              ))}
            </div>
            {!selectedGaushala && (
              <p className="mt-2 text-xs text-primary" {...(isHindi ? { lang: "hi" } : {})}>
                {t("Select a gaushala to continue with quick daan, item selection, or a custom amount.", "जल्दी दान, सामग्री चयन या कस्टम राशि जारी रखने के लिए गौशाला चुनें।")}
              </p>
            )}
          </div>
        )}

        {/* SKU List */}
        <div>
          <h3 className="text-base font-semibold text-foreground mb-3" {...(isHindi ? { lang: "hi" } : {})}>
            {t("Select Items", "सामग्री चुनें")}
          </h3>
          <div className="space-y-2">
            {displaySkus.map((sku: any) => (
              <SkuCard
                key={sku.id}
                name={t(sku.name, sku.title_hi)}
                description={t(sku.description || "", sku.description_hi) || undefined}
                price={Number(sku.price)}
                unit={sku.unit || "unit"}
                quantity={getItemQuantity(sku.id)}
                disabled={!canAddDonation}
                onAdd={() =>
                  addItem({
                    skuId: sku.id,
                    categoryId: id || "annapurna",
                    name: t(sku.name, sku.title_hi),
                    categoryName: sevaTitle,
                    unitPrice: Number(sku.price),
                    unit: sku.unit || "unit",
                  })
                }
                onRemove={() => {
                  const qty = getItemQuantity(sku.id);
                  if (qty <= 1) removeItem(sku.id);
                  else updateQuantity(sku.id, qty - 1);
                }}
              />
            ))}
          </div>
        </div>

        {/* Custom Amount */}
        <div>
          <h3 className="text-base font-semibold text-foreground mb-3" {...(isHindi ? { lang: "hi" } : {})}>
            {t("Or Enter Custom Amount", "या अपनी राशि दर्ज करें")}
          </h3>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">₹</span>
              <Input
                type="number"
                placeholder={t("Enter amount", "राशि दर्ज करें")}
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                className="h-12 rounded-lg bg-card pl-7"
                min={1}
              />
            </div>
            <Button
              onClick={handleAddCustomAmount}
              disabled={!canAddDonation || !customAmount || parseFloat(customAmount) < 1}
              className="h-12 rounded-lg px-5"
            >
              {t("Add", "जोड़ें")}
            </Button>
          </div>
        </div>
      </div>

      
    </div>
  );
};

export default SevaDetail;
