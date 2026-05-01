import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const fallbackSkus: Record<string, Array<{ id: string; name: string; category_id: string; price: number; unit: string; description: string | null; is_active: boolean; sort_order: number; min_qty: number; max_qty: number; image_key: string | null; created_at: string; updated_at: string }>> = {
  annapurna: [
    { id: "fb-anna-1", name: "Gur (Jaggery)", category_id: "annapurna", price: 51, unit: "kg", description: "Pure jaggery for cows", is_active: true, sort_order: 1, min_qty: 1, max_qty: 100, image_key: null, created_at: "", updated_at: "" },
    { id: "fb-anna-2", name: "Hara Chaara", category_id: "annapurna", price: 101, unit: "bundle", description: "Fresh green fodder", is_active: true, sort_order: 2, min_qty: 1, max_qty: 100, image_key: null, created_at: "", updated_at: "" },
    { id: "fb-anna-3", name: "Dalia", category_id: "annapurna", price: 151, unit: "kg", description: "Nutritious porridge grain", is_active: true, sort_order: 3, min_qty: 1, max_qty: 100, image_key: null, created_at: "", updated_at: "" },
    { id: "fb-anna-4", name: "Full Day Meal (1 cow)", category_id: "annapurna", price: 501, unit: "cow/day", description: "Complete daily meal for one cow", is_active: true, sort_order: 4, min_qty: 1, max_qty: 100, image_key: null, created_at: "", updated_at: "" },
    { id: "fb-anna-5", name: "Full Day Meal (10 cows)", category_id: "annapurna", price: 2100, unit: "cow/day", description: "Full day meals for 10 cows", is_active: true, sort_order: 5, min_qty: 1, max_qty: 100, image_key: null, created_at: "", updated_at: "" },
  ],
  dhanwantry: [
    { id: "fb-dhan-1", name: "Basic Medicines", category_id: "dhanwantry", price: 251, unit: "pack", description: "Essential veterinary medicines", is_active: true, sort_order: 1, min_qty: 1, max_qty: 100, image_key: null, created_at: "", updated_at: "" },
    { id: "fb-dhan-2", name: "Vaccination Course", category_id: "dhanwantry", price: 501, unit: "course", description: "Full vaccination for one cow", is_active: true, sort_order: 2, min_qty: 1, max_qty: 100, image_key: null, created_at: "", updated_at: "" },
    { id: "fb-dhan-3", name: "Medical Equipment", category_id: "dhanwantry", price: 1100, unit: "set", description: "Veterinary equipment set", is_active: true, sort_order: 3, min_qty: 1, max_qty: 100, image_key: null, created_at: "", updated_at: "" },
    { id: "fb-dhan-4", name: "Emergency Surgery Fund", category_id: "dhanwantry", price: 5100, unit: "surgery", description: "Fund emergency cow surgeries", is_active: true, sort_order: 4, min_qty: 1, max_qty: 100, image_key: null, created_at: "", updated_at: "" },
    { id: "fb-dhan-5", name: "Monthly Vet Visit", category_id: "dhanwantry", price: 2100, unit: "visit", description: "Monthly veterinarian visit", is_active: true, sort_order: 5, min_qty: 1, max_qty: 100, image_key: null, created_at: "", updated_at: "" },
  ],
  bajrang: [
    { id: "fb-bajr-1", name: "Legal Expenses", category_id: "bajrang", price: 1100, unit: "case", description: "Legal costs for rescue cases", is_active: true, sort_order: 1, min_qty: 1, max_qty: 100, image_key: null, created_at: "", updated_at: "" },
    { id: "fb-bajr-2", name: "Transportation", category_id: "bajrang", price: 501, unit: "trip", description: "Transport rescued cows safely", is_active: true, sort_order: 2, min_qty: 1, max_qty: 100, image_key: null, created_at: "", updated_at: "" },
    { id: "fb-bajr-3", name: "Cow Purchase from Butchers", category_id: "bajrang", price: 15000, unit: "cow", description: "Buy cows from slaughter", is_active: true, sort_order: 3, min_qty: 1, max_qty: 100, image_key: null, created_at: "", updated_at: "" },
    { id: "fb-bajr-4", name: "Rescue Team Kit", category_id: "bajrang", price: 2100, unit: "kit", description: "Equipment for rescue teams", is_active: true, sort_order: 4, min_qty: 1, max_qty: 100, image_key: null, created_at: "", updated_at: "" },
  ],
  vishwakarma: [
    { id: "fb-vish-1", name: "Water Drum", category_id: "vishwakarma", price: 1100, unit: "drum", description: "Large water storage drum", is_active: true, sort_order: 1, min_qty: 1, max_qty: 100, image_key: null, created_at: "", updated_at: "" },
    { id: "fb-vish-2", name: "Small Shed (10x10 ft)", category_id: "vishwakarma", price: 11000, unit: "shed", description: "Shelter for 3-4 cows", is_active: true, sort_order: 2, min_qty: 1, max_qty: 100, image_key: null, created_at: "", updated_at: "" },
    { id: "fb-vish-3", name: "Medium Shed (20x15 ft)", category_id: "vishwakarma", price: 25000, unit: "shed", description: "Shelter for 8-10 cows", is_active: true, sort_order: 3, min_qty: 1, max_qty: 100, image_key: null, created_at: "", updated_at: "" },
    { id: "fb-vish-4", name: "Large Shed (30x20 ft)", category_id: "vishwakarma", price: 51000, unit: "shed", description: "Shelter for 15-20 cows", is_active: true, sort_order: 4, min_qty: 1, max_qty: 100, image_key: null, created_at: "", updated_at: "" },
    { id: "fb-vish-5", name: "Tarpauline Sheet", category_id: "vishwakarma", price: 501, unit: "sheet", description: "Weather protection sheets", is_active: true, sort_order: 5, min_qty: 1, max_qty: 100, image_key: null, created_at: "", updated_at: "" },
  ],
};

const fallbackCategories = [
  { id: "annapurna", title: "Annapurna Daan", subtitle: "Feed cows daily", icon_name: "Utensils", image_key: "seva-feeding", description: "Provide daily nutritious meals to cows.", is_active: true, sort_order: 1, created_at: "", updated_at: "" },
  { id: "dhanwantry", title: "Dhanwantry Daan", subtitle: "Medical care", icon_name: "Stethoscope", image_key: "seva-medical", description: "Fund veterinary care for cows.", is_active: true, sort_order: 2, created_at: "", updated_at: "" },
  { id: "bajrang", title: "Bajrang Daan", subtitle: "Rescue missions", icon_name: "ShieldCheck", image_key: "seva-rescue", description: "Support cow rescue missions.", is_active: true, sort_order: 3, created_at: "", updated_at: "" },
  { id: "vishwakarma", title: "Vishwakarma Daan", subtitle: "Build shelters", icon_name: "Building2", image_key: "seva-shelter", description: "Build shelters for rescued cows.", is_active: true, sort_order: 4, created_at: "", updated_at: "" },
];

export const useSkus = (categoryId?: string, persona?: string) => {
  return useQuery({
    queryKey: ["skus", categoryId, persona],
    queryFn: async () => {
      let query = supabase
        .from("skus")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");

      if (categoryId) {
        query = query.eq("category_id", categoryId);
      }

      if (persona) {
        query = (query as any).in("persona_visibility", [persona, "both"]);
      }

      const { data, error } = await query;
      if (error) {
        console.error("SKUs fetch error:", error);
        if (categoryId && fallbackSkus[categoryId]) {
          return fallbackSkus[categoryId];
        }
        return Object.values(fallbackSkus).flat();
      }
      if (!data || data.length === 0) {
        if (categoryId && fallbackSkus[categoryId]) {
          return fallbackSkus[categoryId];
        }
        return Object.values(fallbackSkus).flat();
      }
      return data;
    },
  });
};

export const useSevaCategories = (persona?: string) => {
  return useQuery({
    queryKey: ["seva-categories", persona],
    queryFn: async () => {
      let query = supabase
        .from("seva_categories")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");

      if (persona) {
        query = (query as any).in("persona_visibility", [persona, "both"]);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Categories fetch error:", error);
        return fallbackCategories;
      }
      if (!data || data.length === 0) {
        return fallbackCategories;
      }
      return data;
    },
  });
};
