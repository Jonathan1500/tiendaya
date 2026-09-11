"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Button from "@/components/ui/Button";

export default function ConfiguracionPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    if (!authLoading && (!user || profile?.rol !== "shopkeeper")) {
      router.push("/auth/shopkeeper");
    }
  }, [user, profile, authLoading, router]);

  useEffect(() => {
    const checkMFA = async () => {
      const { data } = await supabase.auth.mfa.listFactors();
      setMfaEnabled(!!data?.totp?.length);
      setLoading(false);
    };

    if (user) checkMFA();
  }, [user, supabase]);

  const handleUnenroll = async () => {
    const { data } = await supabase.auth.mfa.listFactors();
    const totpFactor = data?.totp?.[0];

    if (!totpFactor) return;

    const { error: unenrollError } = await supabase.auth.mfa.unenroll({
      factorId: totpFactor.id,
    });

    if (unenrollError) {
      setError("Error al desactivar 2FA");
      return;
    }

    setMfaEnabled(false);
    setSuccess("2FA desactivada correctamente");
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="border-b border-card-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center">
          <Link href="/panel" className="flex items-center gap-2">
            <span className="text-muted hover:text-foreground">←</span>
            <span className="text-sm text-muted">Panel</span>
          </Link>
        </div>
      </nav>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6">
        <div className="animate-fade-in">
          <h1 className="text-2xl font-bold mb-6">Configuración de Seguridad</h1>

          <div className="bg-card border border-card-border rounded-xl p-6">
            <h2 className="font-semibold mb-2">Verificación en Dos Pasos (2FA)</h2>
            <p className="text-sm text-muted mb-4">
              Protege tu cuenta con autenticación de dos factores usando Google
              Authenticator o Authy.
            </p>

            {mfaEnabled ? (
              <div>
                <div className="flex items-center gap-2 bg-success/10 border border-success/20 rounded-lg p-3 mb-4">
                  <span className="text-success">✅</span>
                  <span className="text-sm text-success font-medium">
                    2FA está activa en tu cuenta
                  </span>
                </div>
                <p className="text-xs text-muted mb-4">
                  En cada login, se te pedirá el código de tu app de
                  autenticación después de ingresar tu contraseña.
                </p>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleUnenroll}
                >
                  Desactivar 2FA
                </Button>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-2 bg-warning/10 border border-warning/20 rounded-lg p-3 mb-4">
                  <span className="text-warning">⚠️</span>
                  <span className="text-sm text-warning font-medium">
                    2FA no está configurada
                  </span>
                </div>
                <p className="text-xs text-muted mb-4">
                  Se configurará automáticamente en tu próximo login. Se te
                  mostrará un código QR para escanear con tu app de
                  autenticación.
                </p>
              </div>
            )}

            {error && (
              <p className="text-sm text-danger mt-2">{error}</p>
            )}
            {success && (
              <p className="text-sm text-success mt-2">{success}</p>
            )}
          </div>

          <div className="bg-card border border-card-border rounded-xl p-6 mt-4">
            <h2 className="font-semibold mb-2">Información de Cuenta</h2>
            <div className="space-y-2 text-sm">
              <p className="text-muted">
                <span className="text-foreground font-medium">Nombre:</span>{" "}
                {profile?.nombre || "No definido"}
              </p>
              <p className="text-muted">
                <span className="text-foreground font-medium">Rol:</span>{" "}
                Tendero
              </p>
              <p className="text-muted">
                <span className="text-foreground font-medium">Email:</span>{" "}
                {user?.email}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
