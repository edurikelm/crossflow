"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface DashboardErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DashboardError({ error, reset }: DashboardErrorProps) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-md w-full">
        <CardContent className="p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-error-container/20 mb-6">
            <AlertTriangle className="h-8 w-8 text-error" />
          </div>
          <h2 className="text-2xl font-display font-bold text-surface-foreground mb-2">
            Algo salió mal
          </h2>
          <p className="text-on_surface_variant mb-6">
            No se pudo cargar el panel de control. Intenta de nuevo.
          </p>
          {error.digest && (
            <p className="text-xs text-on_surface_variant mb-4 font-mono">
              Error: {error.digest}
            </p>
          )}
          <Button onClick={reset} variant="default">
            Reintentar
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
