"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

type Step = "login" | "mfa" | "mfa-setup";

export default function ShopkeeperLoginPage() {
  const [step, setStep] = useState<Step>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [totpUri, setTotpUri] = useState("");
  const [factorId, setFactorId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (loginError) {
      setLoading(false);
      setError("Credenciales incorrectas");
      return;
    }

    const { data: factorsData } = await supabase.auth.mfa.listFactors();
    const totpFactor = factorsData?.totp?.[0];

    if (totpFactor) {
      setFactorId(totpFactor.id);
      setStep("mfa");
      setLoading(false);
    } else {
      const { data: enrollData, error: enrollError } =
        await supabase.auth.mfa.enroll({
          factorType: "totp",
          friendlyName: "Panel Tiendaya",
        });

      if (enrollError) {
        setLoading(false);
        setError("Error al configurar 2FA");
        return;
      }

      setTotpUri(enrollData.totp.uri);
      setFactorId(enrollData.id);
      setStep("mfa-setup");
      setLoading(false);
    }
  };

  const handleVerifyMFA = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { data, error: challengeError } = await supabase.auth.mfa.challenge({
      factorId,
    });

    if (challengeError) {
      setLoading(false);
      setError("Error al verificar código");
      return;
    }

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: data.id,
      code: mfaCode,
    });

    setLoading(false);

    if (verifyError) {
      setError("Código incorrecto");
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("rol")
        .eq("id", user.id)
        .single();

      if (profile?.rol !== "shopkeeper") {
        await supabase.auth.signOut();
        setError("No tienes permisos de tendero");
        return;
      }
    }

    router.push("/panel");
  };

  const handleSetupComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { data, error: challengeError } = await supabase.auth.mfa.challenge({
      factorId,
    });

    if (challengeError) {
      setLoading(false);
      setError("Error al verificar código");
      return;
    }

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: data.id,
      code: mfaCode,
    });

    setLoading(false);

    if (verifyError) {
      setError("Código incorrecto. Intentá de nuevo.");
      return;
    }

    router.push("/panel");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <Link href="/" className="flex items-center gap-2 mb-8">
        <span className="text-2xl">🏪</span>
        <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Tiendaya
        </span>
      </Link>

      <div className="w-full max-w-sm">
        <div className="bg-card border border-card-border rounded-2xl p-6 shadow-lg">
          {step === "login" && (
            <form onSubmit={handleLogin} className="animate-fade-in">
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">🔐</span>
                </div>
                <h1 className="text-xl font-bold">Panel del Tendero</h1>
                <p className="text-sm text-muted mt-1">
                  Iniciá sesión para gestionar pedidos
                </p>
              </div>

              <div className="space-y-4">
                <Input
                  label="Correo Electrónico"
                  id="email"
                  type="email"
                  placeholder="tendero@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Input
                  label="Contraseña"
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {error && (
                <p className="text-sm text-danger mt-4">{error}</p>
              )}

              <Button
                type="submit"
                loading={loading}
                className="w-full mt-6"
                size="lg"
              >
                Iniciar Sesión
              </Button>
            </form>
          )}

          {step === "mfa-setup" && (
            <form onSubmit={handleSetupComplete} className="animate-fade-in">
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">📱</span>
                </div>
                <h1 className="text-xl font-bold">Configurar 2FA</h1>
                <p className="text-sm text-muted mt-1">
                  Escaneá este código QR con Google Authenticator o Authy
                </p>
              </div>

              <div className="bg-secondary rounded-lg p-4 mb-4">
                <p className="text-xs text-muted mb-2 text-center">
                  Si no podés escanear el QR, ingresá este código manualmente:
                </p>
                <code className="block text-xs text-center text-foreground break-all bg-card p-2 rounded">
                  {totpUri}
                </code>
              </div>

              <Input
                label="Código de 6 dígitos"
                id="mfa-setup-code"
                type="text"
                placeholder="000000"
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ""))}
                maxLength={6}
                className="text-center text-2xl tracking-[0.5em] font-mono"
                required
              />

              {error && (
                <p className="text-sm text-danger mt-2 mb-4">{error}</p>
              )}

              <Button
                type="submit"
                loading={loading}
                className="w-full mt-4"
                size="lg"
              >
                Confirmar Configuración
              </Button>
            </form>
          )}

          {step === "mfa" && (
            <form onSubmit={handleVerifyMFA} className="animate-fade-in">
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">🔑</span>
                </div>
                <h1 className="text-xl font-bold">Verificación 2FA</h1>
                <p className="text-sm text-muted mt-1">
                  Ingresá el código de tu app de autenticación
                </p>
              </div>

              <Input
                label="Código de 6 dígitos"
                id="mfa-code"
                type="text"
                placeholder="000000"
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ""))}
                maxLength={6}
                className="text-center text-2xl tracking-[0.5em] font-mono"
                required
              />

              {error && (
                <p className="text-sm text-danger mt-2 mb-4">{error}</p>
              )}

              <Button
                type="submit"
                loading={loading}
                className="w-full mt-4"
                size="lg"
              >
                Verificar
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
