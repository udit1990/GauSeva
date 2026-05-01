import { useNavigate } from "react-router-dom";
import { ArrowLeft, Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";

const Cart = () => {
  const navigate = useNavigate();
  const { items, updateQuantity, removeItem, clearCart, totalAmount } = useCart();

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-5">
        <p className="text-lg font-semibold text-foreground mb-2">Your cart is empty</p>
        <p className="text-sm text-muted-foreground mb-6">Add items from our daan categories</p>
        <Button onClick={() => navigate("/")} className="rounded-lg">Browse Daan</Button>
      </div>
    );
  }

  // Group by category
  const grouped = items.reduce((acc, item) => {
    if (!acc[item.categoryName]) acc[item.categoryName] = [];
    acc[item.categoryName].push(item);
    return acc;
  }, {} as Record<string, typeof items>);

  return (
    <div className="min-h-screen bg-background pb-28">
      <header className="flex items-center justify-between px-5 pt-12 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-card shadow-sm"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <h1 className="text-lg font-bold text-foreground">Your Cart</h1>
        </div>
        <button onClick={clearCart} className="text-xs text-destructive font-medium">
          Clear All
        </button>
      </header>

      <div className="px-5 space-y-4">
        {Object.entries(grouped).map(([category, categoryItems]) => (
          <div key={category}>
            <h3 className="text-sm font-semibold text-muted-foreground mb-2">{category}</h3>
            <div className="space-y-2">
              {categoryItems.map((item) => (
                <div key={item.skuId} className="flex items-center justify-between rounded-lg bg-card p-3 shadow-sm">
                  <div className="flex-1 min-w-0 mr-3">
                    <p className="text-sm font-semibold text-foreground truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground">₹{item.unitPrice} × {item.quantity}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => updateQuantity(item.skuId, item.quantity - 1)}
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-muted"
                    >
                      <Minus className="h-3.5 w-3.5 text-foreground" />
                    </button>
                    <span className="w-5 text-center text-sm font-bold text-foreground">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.skuId, item.quantity + 1)}
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => removeItem(item.skuId)}
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-destructive/10 ml-1"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Total */}
        <div className="rounded-lg bg-card p-4 shadow-sm">
          <div className="flex justify-between text-base font-bold text-foreground">
            <span>Total</span>
            <span className="text-primary">₹{totalAmount}</span>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-sm px-5 py-3 pb-safe">
        <Button
          onClick={() => navigate(`/checkout`)}
          className="w-full h-12 rounded-lg text-base font-semibold shadow-lg"
          size="lg"
        >
          Proceed to Donate — ₹{totalAmount}
        </Button>
      </div>
    </div>
  );
};

export default Cart;
