"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useRealtimeOrder } from "@/hooks/useRealtimeOrder";
import OrderStatusBadge from "@/components/OrderStatusBadge";
import type { Database } from "@/types/database";

type Order = Database["public"]["Tables"]["orders"]["Row"];
type OrderItem = Database["public"]["Tables"]["order_items"]["Row"] & {
  products: { nombre: string } | null;
};

const STATUS_STEPS = [
  { key: "pendiente", label: "Recibido", icon: "📥" },
  { key: "en_preparacion", label: "En Preparación", icon: "👨‍🍳" },
  { key: "listo", label: "Listo para Recoger", icon: "✅" },
  { key: "entregado", label: "Entregado", icon: "🎉" },
];

export default function SeguimientoPage() {
  const params = useParams();
  const orderId = params.id as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { status } = useRealtimeOrder(orderId);
  const supabase = createClient();

  useEffect(() => {
    const fetchOrder = async () => {
      const { data: orderData } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();

      if (orderData) setOrder(orderData);

      const { data: itemsData } = await supabase
        .from("order_items")
        .select("*, products(nombre)")
        .eq("order_id", orderId);

      if (itemsData) setItems(itemsData as OrderItem[]);
      setLoading(false);
    };

    fetchOrder();
  }, [orderId, supabase]);

  const currentStatus = status || order?.status || "pendiente";
  const currentStepIndex = STATUS_STEPS.findIndex(
    (s) => s.key === currentStatus
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted">Cargando pedido...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-4xl mb-3">❌</p>
          <p className="text-muted mb-4">Pedido no encontrado</p>
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

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <nav className="border-b border-card-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/menu" className="flex items-center gap-2">
            <span className="text-muted hover:text-foreground">←</span>
            <span className="text-sm text-muted">Menú</span>
          </Link>
          <span className="text-sm text-muted">
            Pedido #{orderId.slice(0, 8)}
          </span>
        </div>
      </nav>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6">
        <div className="animate-fade-in">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Seguimiento</h1>
            <OrderStatusBadge status={currentStatus} />
          </div>

          {/* Status Timeline */}
          <div className="bg-card border border-card-border rounded-xl p-6 mb-6">
            <h2 className="font-semibold mb-4">Estado del Pedido</h2>
            <div className="space-y-0">
              {STATUS_STEPS.map((step, index) => {
                const isCompleted = index <= currentStepIndex;
                const isCurrent = index === currentStepIndex;

                return (
                  <div key={step.key} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm border-2 transition-all ${
                          isCompleted
                            ? "bg-primary/20 border-primary text-primary"
                            : "bg-secondary border-card-border text-muted"
                        } ${isCurrent ? "animate-pulse-glow" : ""}`}
                      >
                        {isCompleted ? "✓" : index + 1}
                      </div>
                      {index < STATUS_STEPS.length - 1 && (
                        <div
                          className={`w-0.5 h-8 ${
                            isCompleted ? "bg-primary" : "bg-card-border"
                          }`}
                        />
                      )}
                    </div>
                    <div className="pb-8">
                      <p
                        className={`font-medium text-sm ${
                          isCompleted ? "text-foreground" : "text-muted"
                        }`}
                      >
                        {step.icon} {step.label}
                      </p>
                      {isCurrent && currentStatus !== "entregado" && (
                        <p className="text-xs text-primary mt-1 animate-pulse">
                          Estado actual...
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {currentStatus === "listo" && (
            <div className="bg-success/10 border border-success/20 rounded-xl p-4 mb-6 text-center animate-slide-up">
              <p className="text-success font-semibold">
                🎉 ¡Tu pedido está listo! Pasá a recogerlo.
              </p>
            </div>
          )}

          {currentStatus === "cancelado" && (
            <div className="bg-danger/10 border border-danger/20 rounded-xl p-4 mb-6 text-center">
              <p className="text-danger font-semibold">
                ❌ Este pedido fue cancelado.
              </p>
            </div>
          )}

          {/* Order Details */}
          <div className="bg-card border border-card-border rounded-xl p-4 mb-6">
            <h2 className="font-semibold mb-3">Detalle del Pedido</h2>
            <div className="space-y-2">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-muted">
                    {item.products?.nombre} x{item.cantidad}
                  </span>
                  <span className="font-medium">
                    Q{(item.precio_unitario * item.cantidad).toFixed(2)}
                  </span>
                </div>
              ))}
              <div className="border-t border-card-border pt-2 mt-2 flex justify-between">
                <span className="font-semibold">Total</span>
                <span className="text-lg font-bold text-primary">
                  Q{order.total.toFixed(2)}
                </span>
              </div>
            </div>

            {order.notas && (
              <div className="mt-4 p-3 bg-secondary rounded-lg">
                <p className="text-xs text-muted mb-1">Notas:</p>
                <p className="text-sm">{order.notas}</p>
              </div>
            )}
          </div>

          <p className="text-xs text-muted text-center">
            Esta página se actualiza automáticamente en tiempo real.
          </p>
        </div>
      </main>
    </div>
  );
}
