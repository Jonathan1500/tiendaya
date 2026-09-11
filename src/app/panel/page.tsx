"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import OrderStatusBadge from "@/components/OrderStatusBadge";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import type { Database } from "@/types/database";
import type { RealtimeChannel } from "@supabase/supabase-js";

type Order = Database["public"]["Tables"]["orders"]["Row"] & {
  profiles: { nombre: string; telefono: string } | null;
};

type AccessCode = Database["public"]["Tables"]["access_codes"]["Row"];

const STATUS_OPTIONS = [
  { value: "pendiente", label: "Pendiente" },
  { value: "en_preparacion", label: "En Preparación" },
  { value: "listo", label: "Listo" },
  { value: "entregado", label: "Entregado" },
  { value: "cancelado", label: "Cancelado" },
];

function generateCode(): string {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const letter = letters[Math.floor(Math.random() * letters.length)];
  const nums = Math.floor(1000 + Math.random() * 9000);
  return `${letter}${nums}`;
}

export default function PanelPage() {
  const { user, profile, loading: authLoading, signOut } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [accessCodes, setAccessCodes] = useState<AccessCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [filter, setFilter] = useState("activos");
  const [clientName, setClientName] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [codeLoading, setCodeLoading] = useState(false);
  const [codeError, setCodeError] = useState("");
  const [activeTab, setActiveTab] = useState<"pedidos" | "codigos">("pedidos");
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    if (!authLoading && (!user || profile?.rol !== "shopkeeper")) {
      router.push("/auth/shopkeeper");
    }
  }, [user, profile, authLoading, router]);

  useEffect(() => {
    const fetchOrders = async () => {
      const { data } = await supabase
        .from("orders")
        .select("*, profiles(nombre, telefono)")
        .order("created_at", { ascending: false });

      if (data) setOrders(data as Order[]);
      setLoading(false);
    };

    const fetchCodes = async () => {
      const { data } = await supabase
        .from("access_codes")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

      if (data) setAccessCodes(data as AccessCode[]);
    };

    fetchOrders();
    fetchCodes();

    const channel: RealtimeChannel = supabase
      .channel("orders-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        async () => {
          const { data } = await supabase
            .from("orders")
            .select("*, profiles(nombre, telefono)")
            .order("created_at", { ascending: false });
          if (data) setOrders(data as Order[]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const handleGenerateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setCodeError("");
    setCodeLoading(true);

    const code = generateCode();

    const { error } = await supabase.from("access_codes").insert({
      shopkeeper_id: user!.id,
      code,
      client_name: clientName.trim(),
    });

    if (error) {
      setCodeLoading(false);
      setCodeError("Error al generar código");
      return;
    }

    setGeneratedCode(code);
    setCodeLoading(false);

    // Refrescar lista de códigos
    const { data } = await supabase
      .from("access_codes")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);
    if (data) setAccessCodes(data as AccessCode[]);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(generatedCode);
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);

    const order = orders.find((o) => o.id === orderId);
    const oldStatus = order?.status;

    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", orderId);

    if (!error) {
      await supabase.from("audit_log").insert({
        order_id: orderId,
        actor_id: user!.id,
        action: "status_changed",
        old_status: oldStatus,
        new_status: newStatus,
      });

      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? { ...o, status: newStatus as Order["status"] }
            : o
        )
      );
    }

    setUpdatingId(null);
  };

  const handleLogout = async () => {
    await signOut();
    router.push("/auth/shopkeeper");
  };

  const filteredOrders = orders.filter((o) => {
    if (filter === "activos")
      return ["pendiente", "en_preparacion", "listo"].includes(o.status);
    if (filter === "completados") return o.status === "entregado";
    if (filter === "cancelados") return o.status === "cancelado";
    return true;
  });

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted">Cargando panel...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <nav className="border-b border-card-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏪</span>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Panel
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-sm text-muted hover:text-foreground">
              Inicio
            </Link>
            <button
              onClick={handleLogout}
              className="text-sm text-muted hover:text-danger transition-colors"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab("pedidos")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === "pedidos"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary border border-card-border text-muted hover:text-foreground"
            }`}
          >
            📦 Pedidos
          </button>
          <button
            onClick={() => setActiveTab("codigos")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === "codigos"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary border border-card-border text-muted hover:text-foreground"
            }`}
          >
            🔑 Generar Código
          </button>
        </div>

        {/* Tab: Códigos */}
        {activeTab === "codigos" && (
          <div className="animate-fade-in">
            <div className="bg-card border border-card-border rounded-xl p-6 mb-6">
              <h2 className="font-semibold mb-4">
                Generar Código de Acceso
              </h2>
              <p className="text-sm text-muted mb-4">
                Creá un código para que el cliente se identifique en la tienda.
                El código dura 30 minutos.
              </p>

              {!generatedCode ? (
                <form onSubmit={handleGenerateCode} className="flex gap-3">
                  <div className="flex-1">
                    <Input
                      id="clientName"
                      placeholder="Nombre del cliente"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" loading={codeLoading}>
                    Generar
                  </Button>
                </form>
              ) : (
                <div className="bg-success/10 border border-success/20 rounded-lg p-4 text-center animate-fade-in">
                  <p className="text-sm text-success mb-2">
                    ✅ Código generado para {clientName}
                  </p>
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-3xl font-mono font-bold tracking-wider text-foreground">
                      {generatedCode}
                    </span>
                    <button
                      onClick={handleCopyCode}
                      className="text-sm text-primary hover:text-primary-hover"
                    >
                      📋 Copiar
                    </button>
                  </div>
                  <button
                    onClick={() => {
                      setGeneratedCode("");
                      setClientName("");
                    }}
                    className="text-sm text-muted hover:text-foreground mt-3"
                  >
                    Generar otro código
                  </button>
                </div>
              )}

              {codeError && (
                <p className="text-sm text-danger mt-2">{codeError}</p>
              )}
            </div>

            {/* Códigos recientes */}
            <div className="bg-card border border-card-border rounded-xl p-4">
              <h3 className="font-semibold text-sm mb-3">
                Códigos Recientes
              </h3>
              {accessCodes.length === 0 ? (
                <p className="text-sm text-muted text-center py-4">
                  No hay códigos generados todavía
                </p>
              ) : (
                <div className="space-y-2">
                  {accessCodes.map((ac) => (
                    <div
                      key={ac.id}
                      className="flex items-center justify-between bg-secondary rounded-lg p-3"
                    >
                      <div>
                        <p className="font-medium text-sm">
                          {ac.client_name}
                        </p>
                        <p className="text-xs text-muted font-mono">
                          {ac.code}
                        </p>
                      </div>
                      <div className="text-right">
                        {ac.used ? (
                          <span className="text-xs text-muted">Usado</span>
                        ) : new Date(ac.expires_at) < new Date() ? (
                          <span className="text-xs text-danger">Vencido</span>
                        ) : (
                          <span className="text-xs text-success">Activo</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab: Pedidos */}
        {activeTab === "pedidos" && (
          <div className="animate-fade-in">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {[
                {
                  label: "Pendientes",
                  count: orders.filter((o) => o.status === "pendiente").length,
                },
                {
                  label: "En Preparación",
                  count: orders.filter((o) => o.status === "en_preparacion")
                    .length,
                },
                {
                  label: "Listos",
                  count: orders.filter((o) => o.status === "listo").length,
                },
                {
                  label: "Hoy",
                  count: orders.filter(
                    (o) =>
                      new Date(o.created_at).toDateString() ===
                      new Date().toDateString()
                  ).length,
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="bg-card border border-card-border rounded-xl p-4"
                >
                  <p className="text-2xl font-bold">{stat.count}</p>
                  <p className="text-xs text-muted">{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="flex gap-2 mb-6">
              {[
                { key: "activos", label: "Activos" },
                { key: "todos", label: "Todos" },
                { key: "completados", label: "Completados" },
                { key: "cancelados", label: "Cancelados" },
              ].map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    filter === f.key
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary border border-card-border text-muted hover:text-foreground"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {filteredOrders.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-4xl mb-3">📦</p>
                <p className="text-muted">No hay pedidos {filter}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredOrders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-card border border-card-border rounded-xl p-4 animate-fade-in"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold text-sm">
                          {order.profiles?.nombre || "Cliente"}
                        </p>
                        <p className="text-xs text-muted">
                          {new Date(order.created_at).toLocaleTimeString(
                            "es-GT",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </p>
                      </div>
                      <OrderStatusBadge status={order.status} size="sm" />
                    </div>

                    <div className="bg-secondary rounded-lg p-3 mb-3">
                      <p className="text-sm font-medium mb-1">
                        Q{order.total.toFixed(2)}
                      </p>
                      {order.notas && (
                        <p className="text-xs text-muted">
                          📝 {order.notas}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {STATUS_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() =>
                            handleStatusChange(order.id, opt.value)
                          }
                          disabled={
                            updatingId === order.id ||
                            order.status === opt.value
                          }
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-30 ${
                            order.status === opt.value
                              ? "bg-primary text-primary-foreground"
                              : "bg-secondary border border-card-border text-muted hover:text-foreground hover:border-primary/30"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
