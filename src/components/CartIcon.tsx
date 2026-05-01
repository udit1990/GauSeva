import { ShoppingCart, X } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { useRef, useState, useCallback, useEffect } from "react";

const HIDDEN_ROUTES = ["/cart", "/checkout", "/auth"];
const STORAGE_KEY = "cart-icon-pos";
const DISMISSED_KEY = "cart-icon-dismissed";

const CartIcon = () => {
  const { totalItems, totalAmount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const btnRef = useRef<HTMLButtonElement>(null);
  const dragState = useRef({ dragging: false, startX: 0, startY: 0, startLeft: 0, startTop: 0, moved: false });
  const [dismissed, setDismissed] = useState(() => {
    try { return sessionStorage.getItem(DISMISSED_KEY) === "1"; } catch { return false; }
  });

  const getDefaultPos = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return { right: 16, bottom: 80 };
  };

  const [pos, setPos] = useState<{ right: number; bottom: number }>(getDefaultPos);

  const clamp = useCallback((right: number, bottom: number) => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const btnW = 100, btnH = 44;
    return {
      right: Math.max(4, Math.min(right, w - btnW - 4)),
      bottom: Math.max(70, Math.min(bottom, h - btnH - 50)),
    };
  }, []);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    const el = btnRef.current;
    if (!el) return;
    el.setPointerCapture(e.pointerId);
    dragState.current = {
      dragging: true,
      startX: e.clientX,
      startY: e.clientY,
      startLeft: pos.right,
      startTop: pos.bottom,
      moved: false,
    };
  }, [pos]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const ds = dragState.current;
    if (!ds.dragging) return;
    const dx = ds.startX - e.clientX;
    const dy = ds.startY - e.clientY;
    if (!ds.moved && Math.abs(dx) < 5 && Math.abs(dy) < 5) return;
    ds.moved = true;
    setPos(clamp(ds.startLeft + dx, ds.startTop + dy));
  }, [clamp]);

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    const ds = dragState.current;
    ds.dragging = false;
    if (!ds.moved) {
      navigate("/cart");
    } else {
      // Snap to nearest horizontal edge
      const w = window.innerWidth;
      const btnW = 100;
      const currentLeft = w - pos.right - btnW;
      const snapped = currentLeft < w / 2
        ? { right: w - btnW - 4, bottom: pos.bottom }
        : { right: 4, bottom: pos.bottom };
      const clamped = clamp(snapped.right, snapped.bottom);
      setPos(clamped);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(clamped)); } catch {}
    }
  }, [navigate, pos, clamp]);

  // Reset dismissed when items change
  useEffect(() => {
    if (totalItems > 0) {
      setDismissed(false);
      try { sessionStorage.removeItem(DISMISSED_KEY); } catch {}
    }
  }, [totalItems]);

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDismissed(true);
    try { sessionStorage.setItem(DISMISSED_KEY, "1"); } catch {}
  };

  if (totalItems === 0) return null;
  if (dismissed) return null;
  if (HIDDEN_ROUTES.some((r) => location.pathname.startsWith(r))) return null;

  return (
    <div
      style={{
        position: "fixed",
        right: pos.right,
        bottom: pos.bottom,
        zIndex: 50,
      }}
    >
      {/* Dismiss X — positioned at top-right border */}
      <span
        onClick={handleDismiss}
        className="absolute -top-1.5 -right-1.5 z-[51] flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-md active:scale-90 transition-transform cursor-pointer"
      >
        <X className="h-3 w-3" />
      </span>

      <button
        ref={btnRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        style={{
          touchAction: "none",
          userSelect: "none",
        }}
        className="flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-2.5 text-primary-foreground shadow-xl active:shadow-lg transition-shadow cursor-grab"
        aria-label={`Cart: ${totalItems} items, ₹${totalAmount}`}
      >
        <ShoppingCart className="h-4 w-4" />
        <span className="text-xs font-bold">₹{totalAmount}</span>
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-foreground text-primary text-[10px] font-bold">
          {totalItems}
        </span>
      </button>
    </div>
  );
};

export default CartIcon;
