import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

export interface CartItem {
  skuId: string;
  categoryId: string;
  name: string;
  categoryName: string;
  unitPrice: number;
  quantity: number;
  unit: string;
  isCustomAmount?: boolean;
}

interface CartContextType {
  items: CartItem[];
  gaushalaId: string | null;
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  removeItem: (skuId: string) => void;
  updateQuantity: (skuId: string, quantity: number) => void;
  clearCart: () => void;
  setGaushalaId: (id: string) => void;
  totalAmount: number;
  totalItems: number;
  loading: boolean;
}

const CART_STORAGE_KEY = "dhyan-cart";
const GAUSHALA_STORAGE_KEY = "dhyan-gaushala";

const loadLocalCart = (): CartItem[] => {
  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const loadLocalGaushala = (): string | null => {
  try {
    return localStorage.getItem(GAUSHALA_STORAGE_KEY) || null;
  } catch {
    return null;
  }
};

const saveLocalCart = (items: CartItem[]) => {
  try { localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items)); } catch {}
};

const saveLocalGaushala = (id: string | null) => {
  try {
    if (id) localStorage.setItem(GAUSHALA_STORAGE_KEY, id);
    else localStorage.removeItem(GAUSHALA_STORAGE_KEY);
  } catch {}
};

const CartContext = createContext<CartContextType | undefined>(undefined);

// Helper: convert DB row to CartItem
const rowToItem = (r: any): CartItem => ({
  skuId: r.sku_id,
  categoryId: r.category_id,
  name: r.name,
  categoryName: r.category_name,
  unitPrice: Number(r.unit_price),
  quantity: r.quantity,
  unit: r.unit,
  isCustomAmount: r.is_custom_amount,
});

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>(loadLocalCart);
  const [gaushalaId, setGaushalaIdState] = useState<string | null>(loadLocalGaushala);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const syncingRef = useRef(false);

  // Track auth state
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // When user logs in: merge local cart into DB, then load DB cart
  // When user logs out: keep current items in localStorage
  useEffect(() => {
    if (!user) return;

    const syncCartOnLogin = async () => {
      syncingRef.current = true;
      setLoading(true);
      try {
        const localItems = loadLocalCart();
        const localGaushala = loadLocalGaushala();

        // Upsert any local items into DB (merge strategy: local wins on conflict)
        if (localItems.length > 0) {
          const rows = localItems.map((item) => ({
            user_id: user.id,
            sku_id: item.skuId,
            category_id: item.categoryId,
            name: item.name,
            category_name: item.categoryName,
            unit_price: item.unitPrice,
            quantity: item.quantity,
            unit: item.unit,
            is_custom_amount: item.isCustomAmount || false,
            gaushala_id: localGaushala || null,
          }));

          await (supabase.from("cart_items") as any)
            .upsert(rows, { onConflict: "user_id,sku_id" });

          // Clear local storage after merge
          try { localStorage.removeItem(CART_STORAGE_KEY); localStorage.removeItem(GAUSHALA_STORAGE_KEY); } catch {}
        }

        // Load full cart from DB
        const { data } = await supabase
          .from("cart_items")
          .select("*")
          .eq("user_id", user.id);

        if (data && data.length > 0) {
          setItems(data.map(rowToItem));
          setGaushalaIdState((data[0] as any).gaushala_id || null);
        } else if (localItems.length === 0) {
          setItems([]);
          setGaushalaIdState(null);
        }
      } catch (err) {
        console.error("Cart sync failed:", err);
      } finally {
        setLoading(false);
        syncingRef.current = false;
      }
    };

    syncCartOnLogin();
  }, [user?.id]);

  // Persist to localStorage for guests (no user)
  useEffect(() => {
    if (!user && !syncingRef.current) {
      saveLocalCart(items);
    }
  }, [items, user]);

  useEffect(() => {
    if (!user && !syncingRef.current) {
      saveLocalGaushala(gaushalaId);
    }
  }, [gaushalaId, user]);

  // --- DB helpers (fire-and-forget for responsiveness) ---
  const upsertDbItem = useCallback(async (item: CartItem, qty: number) => {
    if (!user) return;
    await (supabase.from("cart_items") as any).upsert({
      user_id: user.id,
      sku_id: item.skuId,
      category_id: item.categoryId,
      name: item.name,
      category_name: item.categoryName,
      unit_price: item.unitPrice,
      quantity: qty,
      unit: item.unit,
      is_custom_amount: item.isCustomAmount || false,
      gaushala_id: gaushalaId,
    }, { onConflict: "user_id,sku_id" });
  }, [user, gaushalaId]);

  const deleteDbItem = useCallback(async (skuId: string) => {
    if (!user) return;
    await supabase.from("cart_items").delete().eq("user_id", user.id).eq("sku_id", skuId);
  }, [user]);

  const clearDbCart = useCallback(async () => {
    if (!user) return;
    await supabase.from("cart_items").delete().eq("user_id", user.id);
  }, [user]);

  // --- Public API ---
  const setGaushalaId = useCallback((id: string) => {
    setGaushalaIdState(id);
    // Update all DB items with new gaushala
    if (user) {
      supabase.from("cart_items").update({ gaushala_id: id } as any).eq("user_id", user.id).then();
    }
  }, [user]);

  const addItem = useCallback((item: Omit<CartItem, "quantity"> & { quantity?: number }) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.skuId === item.skuId);
      const newQty = (existing?.quantity || 0) + (item.quantity || 1);
      const fullItem: CartItem = { ...item, quantity: item.quantity || 1 };

      if (existing) {
        const updated = prev.map((i) =>
          i.skuId === item.skuId ? { ...i, quantity: newQty } : i
        );
        upsertDbItem({ ...existing, ...item, quantity: newQty } as CartItem, newQty);
        return updated;
      }
      upsertDbItem(fullItem, fullItem.quantity);
      return [...prev, fullItem];
    });
  }, [upsertDbItem]);

  const removeItem = useCallback((skuId: string) => {
    setItems((prev) => prev.filter((i) => i.skuId !== skuId));
    deleteDbItem(skuId);
  }, [deleteDbItem]);

  const updateQuantity = useCallback((skuId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.skuId !== skuId));
      deleteDbItem(skuId);
    } else {
      setItems((prev) => {
        const item = prev.find((i) => i.skuId === skuId);
        if (item) upsertDbItem(item, quantity);
        return prev.map((i) => (i.skuId === skuId ? { ...i, quantity } : i));
      });
    }
  }, [deleteDbItem, upsertDbItem]);

  const clearCart = useCallback(() => {
    setItems([]);
    setGaushalaIdState(null);
    clearDbCart();
    try { localStorage.removeItem(CART_STORAGE_KEY); localStorage.removeItem(GAUSHALA_STORAGE_KEY); } catch {}
  }, [clearDbCart]);

  const totalAmount = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, gaushalaId, addItem, removeItem, updateQuantity, clearCart, setGaushalaId, totalAmount, totalItems, loading }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};
