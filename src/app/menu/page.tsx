"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import ProductCard from "@/components/ProductCard";
import CartDrawer from "@/components/CartDrawer";
import Button from "@/components/ui/Button";
import type { Database } from "@/types/database";

type Product = Database["public"]["Tables"]["products"]["Row"];

const CATEGORIES = ["Todos", "Bebidas", "Snacks", "Abarrotes", "Electrónica"];

export default function MenuPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [category, setCategory] = useState("Todos");
  const [search, setSearch] = useState("");
  const [cartOpen, setCartOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const cart = useCart();
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const fetchProducts = async () => {
      const { data } = await supabase
        .from("products")
        .select("*")
        .eq("activo", true)
        .order("categoria")
        .order("nombre");

      if (data) setProducts(data);
      setLoading(false);
    };

    fetchProducts();
  }, [supabase]);

  const filtered = products.filter((p) => {
    const matchCategory = category === "Todos" || p.categoria === category;
    const matchSearch =
      search === "" ||
      p.nombre.toLowerCase().includes(search.toLowerCase()) ||
      p.descripcion?.toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchSearch;
  });

  const handleCheckout = () => {
    setCartOpen(false);
    if (!user) {
      router.push("/auth/login");
      return;
    }
    router.push("/pedido");
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <nav className="border-b border-card-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏪</span>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Tiendaya
            </span>
          </div>
          <button
            onClick={() => setCartOpen(true)}
            className="relative bg-secondary border border-card-border px-4 py-2 rounded-lg text-sm font-medium hover:bg-secondary-hover transition-colors"
          >
            🛒 Pedido
            {cart.itemCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center animate-pulse-glow">
                {cart.itemCount}
              </span>
            )}
          </button>
        </div>
      </nav>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">
              🔍
            </span>
            <input
              type="text"
              placeholder="Buscar productos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-secondary border border-card-border rounded-xl text-foreground placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                category === cat
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary border border-card-border text-muted hover:text-foreground hover:border-primary/30"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="bg-card border border-card-border rounded-xl p-4 animate-pulse"
              >
                <div className="aspect-square bg-secondary rounded-lg mb-3" />
                <div className="h-4 bg-secondary rounded w-3/4 mb-2" />
                <div className="h-3 bg-secondary rounded w-1/2 mb-3" />
                <div className="h-6 bg-secondary rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">🔍</p>
            <p className="text-muted">No se encontraron productos</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                nombre={product.nombre}
                descripcion={product.descripcion}
                precio={product.precio}
                imagen_url={product.imagen_url}
                categoria={product.categoria}
                onAdd={cart.addItem}
              />
            ))}
          </div>
        )}

        {/* Floating cart summary */}
        {cart.itemCount > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 animate-slide-up">
            <Button
              onClick={() => setCartOpen(true)}
              size="lg"
              className="shadow-lg shadow-primary/25 rounded-full px-6"
            >
              🛒 Ver Pedido — Q{cart.total.toFixed(2)} ({cart.itemCount} items)
            </Button>
          </div>
        )}
      </main>

      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        onCheckout={handleCheckout}
      />
    </div>
  );
}
