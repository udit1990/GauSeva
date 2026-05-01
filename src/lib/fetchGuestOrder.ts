import { supabase } from "@/integrations/supabase/client";

/**
 * Fetch a guest order via the secure get_guest_order RPC.
 * Returns { order, order_items, order_evidence } or null if token is invalid.
 */
export const fetchGuestOrder = async (
  orderId: string,
  guestToken: string
): Promise<{
  order: Record<string, unknown>;
  order_items: Record<string, unknown>[];
  order_evidence: Record<string, unknown>[];
} | null> => {
  const { data, error } = await supabase.rpc("get_guest_order", {
    _order_id: orderId,
    _guest_token: guestToken,
  });

  if (error || !data) return null;

  // data is jsonb returned as a parsed object
  const result = typeof data === "string" ? JSON.parse(data) : data;
  return result as {
    order: Record<string, unknown>;
    order_items: Record<string, unknown>[];
    order_evidence: Record<string, unknown>[];
  };
};
