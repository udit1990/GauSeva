import { ShoppingCart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";

const CartBar = () => {
  const { totalItems, totalAmount } = useCart();
  const navigate = useNavigate();

  if (totalItems === 0) return null;

  return (
    <button
      onClick={() => navigate("/cart")}
      className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between bg-primary px-5 py-3 pb-safe text-primary-foreground shadow-lg"
    >
      <div className="flex items-center gap-2">
        <ShoppingCart className="h-5 w-5" />
        <span className="text-sm font-semibold">{totalItems} item{totalItems > 1 ? "s" : ""}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-base font-bold">₹{totalAmount}</span>
        <span className="text-sm">→</span>
      </div>
    </button>
  );
};

export default CartBar;
