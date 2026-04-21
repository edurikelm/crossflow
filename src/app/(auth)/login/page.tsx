"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { loginSchema, type LoginInput } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/store";
import { Loader2, Dumbbell, Zap } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const { setUser, setGymId } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      if (authData.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*, gyms(*)")
          .eq("id", authData.user.id)
          .single();

        if (profile) {
          setUser(profile);
          setGymId(profile.gym_id);
          router.push("/");
        } else {
          setError("Perfil no encontrado");
        }
      }
    } catch {
      setError("Error al iniciar sesión");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const email = (document.getElementById("email") as HTMLInputElement | null)?.value;
    if (!email) {
      setError("Ingresa tu correo para recuperar la contraseña");
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback`,
    });
    if (!error) {
      setResetSent(true);
      setError(null);
    } else {
      setError(error.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-[#050507]">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full bg-[#22c55e]/5 blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] rounded-full bg-[#3b82f6]/5 blur-[120px]" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzFhMWExYyIgc3Ryb2tlLXdpZHRoPSIxIiBzdHJva2Utb3BhY2l0eT0iMC4wNSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30" />
      </div>

      <div className="relative z-10 w-full max-w-md px-4">
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center relative">
            <div className="absolute inset-0 bg-[#22c55e]/20 blur-xl rounded-full" />
            <div className="relative w-16 h-16 bg-gradient-to-br from-[#22c55e] to-[#16a34a] rounded-2xl flex items-center justify-center shadow-xl shadow-[#22c55e]/30">
              <Dumbbell className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1
            className="text-5xl mt-6 text-white tracking-wider"
            style={{ fontFamily: "var(--font-display)" }}
          >
            CROSSFLOW
          </h1>
          <p className="text-[#8B8B9A] mt-2 text-sm">Gestión de Gimnasios CrossFit</p>
        </div>

        <Card className="relative bg-[#0D0D12]/80 backdrop-blur-xl border border-[#1A1A24] shadow-2xl shadow-black/40 animate-fade-in">
          <div className="absolute inset-0 bg-gradient-to-br from-[#22c55e]/5 to-transparent pointer-events-none rounded-xl" />

          <CardHeader className="relative z-10 space-y-1 text-center pt-8 pb-4">
            <CardTitle className="text-xl text-white" style={{ fontFamily: "var(--font-display)", letterSpacing: "0.05em" }}>
              BIENVENIDO
            </CardTitle>
            <CardDescription className="text-[#8B8B9A] text-sm">
              Ingresa tus credenciales para acceder
            </CardDescription>
          </CardHeader>

          <CardContent className="relative z-10 pb-8 pt-2">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {error && (
                <div className="bg-[#ef4444]/10 border border-[#ef4444]/20 text-[#ef4444] text-sm p-3 rounded-lg">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-[#e5e5e5] text-sm font-medium">
                  Correo electrónico
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  {...register("email")}
                  disabled={isLoading}
                  className="bg-[#1A1A24] border-[#1A1A24] text-white placeholder:text-[#8B8B9A] h-11 rounded-lg focus:ring-[#22c55e]/50 focus:border-[#22c55e] transition-all duration-200"
                />
                {errors.email && (
                  <p className="text-sm text-[#ef4444]">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-[#e5e5e5] text-sm font-medium">
                  Contraseña
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  {...register("password")}
                  disabled={isLoading}
                  className="bg-[#1A1A24] border-[#1A1A24] text-white placeholder:text-[#8B8B9A] h-11 rounded-lg focus:ring-[#22c55e]/50 focus:border-[#22c55e] transition-all duration-200"
                />
                {errors.password && (
                  <p className="text-sm text-[#ef4444]">{errors.password.message}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-gradient-to-r from-[#22c55e] to-[#16a34a] hover:from-[#16a34a] hover:to-[#22c55e] text-white font-medium rounded-lg shadow-lg shadow-[#22c55e]/20 transition-all duration-300"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Ingresando...
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-4 w-4" />
                    Iniciar Sesión
                  </>
                )}
              </Button>

              {resetSent ? (
                <div className="bg-[#22c55e]/10 border border-[#22c55e]/20 text-[#22c55e] text-sm p-3 rounded-lg text-center">
                  Revisa tu correo para restablecer la contraseña
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="w-full text-sm text-[#8B8B9A] hover:text-[#22c55e] transition-colors duration-200"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              )}
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-[#8B8B9A]/50 text-xs mt-6">
          Sistema de gestión deportiva
        </p>
      </div>
    </div>
  );
}
