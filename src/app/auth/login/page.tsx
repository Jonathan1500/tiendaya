"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function LoginPage() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const trimmedCode = code.trim().toUpperCase();

    // Buscar el código de acceso válido
    const { data: accessCode, error: codeError } = await supabase
      .from("access_codes")
      .select("id, client_name, shopkeeper_id")
      .eq("code", trimmedCode)
      .eq("used", false)
      .gt("expires_at", new Date().toISOString())
      .single();

    if (codeError || !accessCode) {
      setLoading(false);
      setError("Código inválido o vencido. Pedile uno nuevo al tendero.");
      return;
    }

    // Crear usuario temporal para la sesión del cliente
    const tempEmail = `client-${accessCode.id.slice(0, 8)}@tiendaya.local`;
    const tempPassword = `tmp-${Date.now()}-${Math.random().toString(36)}`;

    // Intentar crear el usuario
    const { data: signUpData, error: signUpError } =
      await supabase.auth.signUp({
        email: tempEmail,
        password: tempPassword,
        options: {
          data: {
            nombre: accessCode.client_name,
            rol: "client",
          },
        },
      });

    let userId: string | undefined;
    let sessionCreated = false;

    if (signUpError) {
      // Si el usuario ya existe, hacer login
      const { data: signInData, error: signInError } =
        await supabase.auth.signInWithPassword({
          email: tempEmail,
          password: tempPassword,
        });

      if (signInError) {
        setLoading(false);
        setError("Error al crear sesión. Intentá de nuevo.");
        return;
      }

      userId = signInData.user?.id;
      sessionCreated = true;
    } else {
      userId = signUpData.user?.id;
      sessionCreated = true;
    }

    if (!sessionCreated || !userId) {
      setLoading(false);
      setError("Error al crear sesión.");
      return;
    }

    // Actualizar perfil con el nombre del cliente
    await supabase.from("profiles").upsert({
      id: userId,
      nombre: accessCode.client_name,
      rol: "client",
    });

    // Marcar el código como usado
    await supabase
      .from("access_codes")
      .update({ used: true })
      .eq("id", accessCode.id);

    router.push("/menu");
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
          <form onSubmit={handleLogin} className="animate-fade-in">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">🔑</span>
              </div>
              <h1 className="text-xl font-bold">Entrar a la Tienda</h1>
              <p className="text-sm text-muted mt-1">
                Pedile un código al tendero para identificarte
              </p>
            </div>

            <Input
              label="Tu Código"
              id="code"
              type="text"
              placeholder="Ej: MARIA-4829"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="text-center text-lg tracking-wider font-mono"
              required
            />

            {error && (
              <p className="text-sm text-danger mt-3 mb-4">{error}</p>
            )}

            <Button
              type="submit"
              loading={loading}
              className="w-full mt-4"
              size="lg"
            >
              Entrar
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-muted mt-6">
          ¿Sos el tendero?{" "}
          <Link
            href="/auth/shopkeeper"
            className="text-primary hover:text-primary-hover"
          >
            Iniciar sesión aquí
          </Link>
        </p>
      </div>
    </div>
  );
}
