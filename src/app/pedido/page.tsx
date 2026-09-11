"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCart, type CartItem } from "@/hooks/useCart";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function PedidoPage() {
  const { user } = useAuth();
  const cart = useCart();
  const router = useRouter();
  const [notas, setNotas] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"confirm" | "success">("confirm");
  const [orderId, setOrderId] = useState("");
  const supabase = createClient();

  useEffect(() => {
    if (!user) {
      router.push("/auth/login");
    }
  }, [user, router]);

  if (!user || cart.items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-4xl mb-3">🛒</p>
          <p className="text-muted mb-4">Tu carrito está vacío</p>
          <Link
            href="/menu"
            className="text-primary hover:text-primary-hover text-sm font-medium"
          >
            ← Volver al menú
          </Link>
        </div>
      </div>
    );
  }

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Verificar pedido activo
    const { data: activeOrder } = await supabase.rpc("has_active_order", {
      user_id: user!.id,
    });

    if (activeOrder) {
      setLoading(false);
      setError(
        "Ya tenés un pedido activo. Esperá a que se complete o cancélelo."
      );
      return;
    }

    // Crear pedido directamente (sin OTP)
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        client_id: user!.id,
        total: cart.total,
        notas: notas || null,
      })
      .select()
      .single();

    if (orderError) {
      setLoading(false);
      setError("Error al crear el pedido");
      return;
    }

    // Insertar items del pedido
    const items = cart.items.map((item: CartItem) => ({
      order_id: order.id,
      product_id: item.product_id,
      cantidad: item.cantidad,
      precio_unitario: item.precio,
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(items);

    if (itemsError) {
      setLoading(false);
      setError("Error al guardar los items");
      return;
    }

    // Registrar en audit log
    await supabase.from("audit_log").insert({
      order_id: order.id,
      actor_id: user!.id,
      action: "created",
      new_status: "pendiente",
    });

    setOrderId(order.id);
    setStep("success");
    cart.clearCart();
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="border-b border-card-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center">
          <Link href="/menu" className="flex items-center gap-2">
            <span className="text-muted hover:text-foreground">←</span>
            <span className="text-sm text-muted">Menú</span>
          </Link>
        </div>
      </nav>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6">
        {step === "confirm" && (
          <div className="animate-fade-in">
            <h1 className="text-2xl font-bold mb-6">Tu Pedido</h1>

            <form onSubmit={handleConfirm}>
              <div className="bg-card border border-card-border rounded-xl p-4 mb-6">
                <h2 className="font-semibold mb-3">Resumen</h2>
                <div className="space-y-3">
                  {cart.items.map((item) => (
                    <div
                      key={item.product_id}
                      className="flex justify-between text-sm"
                    >
                      <span className="text-muted">
                        {item.nombre} x{item.cantidad}
                      </span>
                      <span className="font-medium">
                        Q{(item.precio * item.cantidad).toFixed(2)}
                      </span>
                    </div>
                  ))}
                  <div className="border-t border-card-border pt-3 flex justify-between">
                    <span className="font-semibold">Total</span>
                    <span className="text-lg font-bold text-primary">
                      Q{cart.total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <Input
                  label="Notas (opcional)"
                  id="notas"
                  placeholder="Ej: sin hielo, extra salsa..."
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                />
              </div>

              {error && (
                <p className="text-sm text-danger mb-4">{error}</p>
              )}

              <Button
                type="submit"
                loading={loading}
                className="w-full"
                size="lg"
              >
                Confirmar Pedido — Q{cart.total.toFixed(2)}
              </Button>
            </form>
          </div>
        )}

        {step === "success" && (
          <div className="text-center py-12 animate-fade-in">
            <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">✅</span>
            </div>
            <h1 className="text-2xl font-bold mb-2">¡Pedido Creado!</h1>
            <p className="text-muted mb-6">
              Tu pedido fue enviado exitosamente. Seguí su estado en tiempo
              real.
            </p>
            <Link
              href={`/seguimiento/${orderId}`}
              className="inline-flex bg-primary text-primary-foreground px-6 py-3 rounded-xl text-base font-semibold hover:bg-primary-hover transition-colors"
            >
              Seguir Mi Pedido →
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
