import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useGaushalas = (activeOnly = true) => {
  return useQuery({
    queryKey: ["gaushalas-list", activeOnly],
    queryFn: async () => {
      let query = supabase
        .from("gaushalas_list")
        .select("*")
        .order("sort_order");

      if (activeOnly) {
        query = query.eq("is_active", true);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
};

export const useVisitReadyGaushalas = () => {
  return useQuery({
    queryKey: ["gaushalas-visit-ready"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gaushalas_list")
        .select("*")
        .eq("is_active", true)
        .eq("is_visit_ready", true)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });
};
