import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook to fetch signed URLs for evidence files.
 * Uses the evidence-url edge function to generate short-lived signed URLs.
 */
export function useSignedEvidenceUrls() {
  const getSignedUrls = useCallback(
    async (storagePaths: string[]): Promise<Record<string, string>> => {
      if (storagePaths.length === 0) return {};

      try {
        const { data, error } = await supabase.functions.invoke("evidence-url", {
          body: { storage_paths: storagePaths },
        });

        if (error) throw error;
        return (data?.urls as Record<string, string>) || {};
      } catch {
        // Bucket is private — no public URL fallback
        return {};
      }
    },
    []
  );

  return { getSignedUrls };
}
