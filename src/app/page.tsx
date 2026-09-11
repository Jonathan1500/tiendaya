"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

export default function HomePage() {
  const { user, profile, loading } = useAuth();

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
          <div className="flex items-center gap-3">
            {loading ? (
              <div className="h-8 w-20 bg-secondary rounded-lg animate-pulse" />
            ) : user ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted hidden sm:block">
                  Hola, {profile?.nombre || "Usuario"}
                </span>
                {profile?.rol === "shopkeeper" ? (
                  <Link
                    href="/panel"
                    className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors"
                  >
                    Panel
                  </Link>
                ) : (
                  <Link
                    href="/menu"
                    className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors"
                  >
                    Ver Menú
                  </Link>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/auth/login"
                  className="text-muted hover:text-foreground px-3 py-2 text-sm transition-colors"
                >
                  Iniciar Sesión
                </Link>
                <Link
                  href="/auth/login"
                  className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors"
                >
                  Pedir Ahora
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1">
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
          <div className="max-w-6xl mx-auto px-4 py-20 sm:py-32 relative">
            <div className="text-center max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 bg-secondary border border-card-border rounded-full px-4 py-1.5 mb-6">
                <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
                <span className="text-xs text-muted">Abierto ahora</span>
              </div>

              <h1 className="text-4xl sm:text-6xl font-bold mb-6 leading-tight">
                Tu miscelánea{" "}
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  favorita
                </span>
                <br />
                en tu bolsillo
              </h1>

              <p className="text-lg text-muted mb-8 max-w-xl mx-auto">
                Pide bebidas, snacks, artículos del hogar y más. Recíbelo rápido
                sin salir de casa.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/auth/login"
                  className="bg-primary text-primary-foreground px-8 py-3.5 rounded-xl text-base font-semibold hover:bg-primary-hover active:scale-[0.98] transition-all"
                >
                  Entrar con Código →
                </Link>
                <Link
                  href="/auth/shopkeeper"
                  className="bg-secondary text-foreground border border-card-border px-8 py-3.5 rounded-xl text-base font-semibold hover:bg-secondary-hover active:scale-[0.98] transition-all"
                >
                  Soy Tendero
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="border-t border-card-border">
          <div className="max-w-6xl mx-auto px-4 py-16">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              <div className="text-center p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">⚡</span>
                </div>
                <h3 className="font-semibold mb-2">Rápido y Fácil</h3>
                <p className="text-sm text-muted">
                  Selecciona lo que quieres, confirma y listo. Sin filas, sin
                  esperas.
                </p>
              </div>

              <div className="text-center p-6">
                <div className="w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📱</span>
                </div>
                <h3 className="font-semibold mb-2">Seguimiento en Vivo</h3>
                <p className="text-sm text-muted">
                  Mira el estado de tu pedido en tiempo real. Cuando está listo,
                  te avisa.
                </p>
              </div>

              <div className="text-center p-6">
                <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🔒</span>
                </div>
                <h3 className="font-semibold mb-2">Seguro y Confiable</h3>
                <p className="text-sm text-muted">
                  Código de acceso personal, protección anti-fraude y datos
                  seguros.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-card-border py-6">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm text-muted">
          Tiendaya © 2026 — Hecho con ❤️ en Guatemala
        </div>
      </footer>
    </div>
  );
}
