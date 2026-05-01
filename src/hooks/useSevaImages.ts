import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Default fallback images (bundled desi cow images)
import heroBanner from "@/assets/hero-banner.avif";
import sevaFeeding from "@/assets/seva-feeding.avif";
import sevaMedical from "@/assets/seva-medical.avif";
import sevaRescue from "@/assets/seva-rescue.avif";
import sevaShelter from "@/assets/seva-shelter.avif";

const defaultImages: Record<string, string> = {
  "hero-banner": heroBanner,
  "seva-feeding": sevaFeeding,
  "seva-medical": sevaMedical,
  "seva-rescue": sevaRescue,
  "seva-shelter": sevaShelter,
};

const fetchSevaImages = async (): Promise<Record<string, string>> => {
  const { data, error } = await supabase
    .from("seva_images")
    .select("image_key, storage_path");

  if (error || !data || data.length === 0) {
    return defaultImages;
  }

  const images: Record<string, string> = { ...defaultImages };

  for (const row of data) {
    const { data: urlData } = supabase.storage
      .from("seva-images")
      .getPublicUrl(row.storage_path);

    if (urlData?.publicUrl) {
      images[row.image_key] = urlData.publicUrl;
    }
  }

  return images;
};

export const useSevaImages = () => {
  return useQuery({
    queryKey: ["seva-images"],
    queryFn: fetchSevaImages,
    staleTime: 5 * 60 * 1000, // 5 minutes
    placeholderData: defaultImages,
  });
};

export { defaultImages };
