"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Dumbbell, ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const supabase = createClient();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordInput) => {
    setIsLoading(true);
    setError(null);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        data.email,
        { redirectTo: `${window.location.origin}/reset-password` }
      );

      if (resetError) {
        setError(resetError.message);
        return;
      }

      setSent(true);
    } catch {
      setError("Error al enviar el correo");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-surface_container_lowest">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] rounded-full bg-secondary/5 blur-[120px]" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzFhMWExYyIgc3Ryb2tlLXdpZHRoPSIxIiBzdHJva2Utb3BhY2l0eT0iMC4wNSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30" />
      </div>

      <div className="relative z-10 w-full max-w-md px-4">
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center relative">
            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
            <div className="relative w-16 h-16 bg-primary_container rounded-md flex items-center justify-center shadow-xl shadow-primary/30 milled-edge">
              <Dumbbell className="w-8 h-8 text-on_primary_container" />
            </div>
          </div>
          <h1
            className="text-5xl mt-6 text-surface-foreground tracking-wider font-display"
            style={{ letterSpacing: "-0.02em" }}
          >
            CROSSFLOW
          </h1>
          <p className="text-on_surface_variant mt-2 text-sm">Recuperar contraseña</p>
        </div>

        <Card className="relative bg-surface_container_low/80 backdrop-blur-xl shadow-2xl ambient-shadow animate-fade-in">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none rounded-md" />

          <CardHeader className="relative z-10 space-y-1 text-center pt-8 pb-4">
            <CardTitle className="text-xl text-surface-foreground font-display" style={{ letterSpacing: "0.02em" }}>
              {sent ? "CORREO ENVIADO" : "¿OLVIDASTE TU CONTRASEÑA?"}
            </CardTitle>
            <CardDescription className="text-on_surface_variant text-sm">
              {sent
                ? "Revisa tu bandeja de entrada para restablecer la contraseña"
                : "Te enviaremos un enlace para restablecerla"}
            </CardDescription>
          </CardHeader>

          <CardContent className="relative z-10 pb-8 pt-2">
            {sent ? (
              <div className="space-y-5">
                <div className="bg-primary_container/20 text-primary text-sm p-4 rounded-md text-center">
                  Si el correo está registrado, recibirás un enlace para restablecer tu contraseña.
                </div>
                <Link href="/login">
                  <Button variant="outline" className="w-full h-11 font-medium rounded-md">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver a Iniciar Sesión
                  </Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {error && (
                  <div className="bg-error_container/50 text-error text-sm p-3 rounded-md">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-surface-foreground text-sm font-medium">
                    Correo electrónico
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    {...register("email")}
                    disabled={isLoading}
                    className="h-11"
                  />
                  {errors.email && (
                    <p className="text-sm text-error">{errors.email.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 font-medium rounded-md"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    "Enviar enlace"
                  )}
                </Button>

                <Link
                  href="/login"
                  className="block w-full text-center text-sm text-on_surface_variant hover:text-primary transition-colors duration-200"
                >
                  Volver a Iniciar Sesión
                </Link>
              </form>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-on_surface_variant/50 text-xs mt-6">
          Sistema de gestión deportiva
        </p>
      </div>
    </div>
  );
}
