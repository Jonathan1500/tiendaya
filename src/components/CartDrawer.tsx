"use client";

import { useCart } from "@/hooks/useCart";

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
  onCheckout: () => void;
}

export default function CartDrawer({ open, onClose, onCheckout }: CartDrawerProps) {
  const { items, removeItem, updateQuantity, total, itemCount } = useCart();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-card border-l border-card-border animate-slide-up">
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b border-card-border">
            <h2 className="text-lg font-bold">
              Tu Pedido ({itemCount})
            </h2>
            <button
              onClick={onClose}
              className="text-muted hover:text-foreground p-1"
            >
              ✕
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {items.length === 0 ? (
              <div className="text-center text-muted py-12">
                <p className="text-4xl mb-3">🛒</p>
                <p>Tu carrito está vacío</p>
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item) => (
                  <div
                    key={item.product_id}
                    className="bg-secondary border border-card-border rounded-lg p-3"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{item.nombre}</h4>
                        <p className="text-primary text-sm font-semibold">
                          Q{item.precio.toFixed(2)}
                        </p>
                      </div>
                      <button
                        onClick={() => removeItem(item.product_id)}
                        className="text-muted hover:text-danger text-sm"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() =>
                          updateQuantity(item.product_id, item.cantidad - 1)
                        }
                        className="w-7 h-7 rounded bg-card border border-card-border flex items-center justify-center text-sm hover:bg-secondary-hover"
                      >
                        −
                      </button>
                      <span className="text-sm font-medium w-6 text-center">
                        {item.cantidad}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(item.product_id, item.cantidad + 1)
                        }
                        className="w-7 h-7 rounded bg-card border border-card-border flex items-center justify-center text-sm hover:bg-secondary-hover"
                      >
                        +
                      </button>
                      <span className="ml-auto text-sm font-semibold">
                        Q{(item.precio * item.cantidad).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {items.length > 0 && (
            <div className="border-t border-card-border p-4">
              <div className="flex justify-between mb-4">
                <span className="text-muted">Total</span>
                <span className="text-xl font-bold text-primary">
                  Q{total.toFixed(2)}
                </span>
              </div>
              <button
                onClick={onCheckout}
                className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-semibold hover:bg-primary-hover active:scale-[0.98] transition-all"
              >
                Confirmar Pedido
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
