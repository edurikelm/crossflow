"use client";

import { Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import type { AthleteSearchResult } from "../_utils";

interface AthleteSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableAthletes: AthleteSearchResult[];
  selectedAthleteIds: string[];
  onToggleAthlete: (id: string) => void;
  athleteSearchQuery: string;
  onSearchQueryChange: (query: string) => void;
  isLoadingAthletes: boolean;
  isAddingAthletes: boolean;
  addAthleteError: string | null;
  spotsRemaining: number;
  onAdd: () => void;
  onSearch: () => void;
}

export function AthleteSelector({
  open,
  onOpenChange,
  availableAthletes,
  selectedAthleteIds,
  onToggleAthlete,
  athleteSearchQuery,
  onSearchQueryChange,
  isLoadingAthletes,
  isAddingAthletes,
  addAthleteError,
  spotsRemaining,
  onAdd,
  onSearch,
}: AthleteSelectorProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-md bg-surface_container_low rounded-md p-0 overflow-hidden">
        <div className="p-6 pb-0">
          <DialogTitle className="text-left uppercase tracking-wide">
            Agregar Atleta
          </DialogTitle>
          <DialogDescription className="text-left mt-1">
            Selecciona los atletas para agregar a la clase
          </DialogDescription>
        </div>
        <div className="px-6 pb-4 space-y-4">
          {spotsRemaining === 0 && (
            <div className="bg-error-container/20 border border-error/30 rounded-md p-3 text-sm text-error">
              Esta clase no tiene cupos disponibles
            </div>
          )}
          {addAthleteError && (
            <div className="bg-error-container/20 border border-error/30 rounded-md p-3 text-sm text-error">
              {addAthleteError}
            </div>
          )}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <Input
              type="text"
              placeholder="Buscar atleta por nombre o email..."
              value={athleteSearchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              className="pl-10 h-11"
              onKeyUp={(e) => {
                if (e.key === "Enter") {
                  onSearch();
                }
              }}
            />
          </div>
          <ScrollArea className="h-75 rounded-md border border-neutral-800">
            {isLoadingAthletes ? (
              <div className="p-4 text-center text-neutral-500 text-sm">
                Cargando atletas...
              </div>
            ) : availableAthletes.length === 0 ? (
              <div className="p-4 text-center text-neutral-500 text-sm">
                No hay atletas disponibles
              </div>
            ) : (
              <div className="p-2">
                {availableAthletes.map((athlete) => (
                  <div
                    key={athlete.id}
                    className="flex items-center gap-3 p-3 hover:bg-surface_container_low rounded cursor-pointer transition-colors"
                    onClick={() => onToggleAthlete(athlete.id)}
                  >
                    <Checkbox
                      checked={selectedAthleteIds.includes(athlete.id)}
                      onCheckedChange={() => onToggleAthlete(athlete.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white truncate">
                        {athlete.profile?.full_name || "Sin nombre"}
                      </p>
                      <p className="text-xs text-neutral-500 truncate">
                        {athlete.profile?.email || "Sin email"}
                      </p>
                    </div>
                    {athlete.membership && athlete.membership[0]?.plan?.name && (
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-neutral-800 text-neutral-400 rounded uppercase">
                        {athlete.membership[0].plan.name}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1 h-11"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              className="flex-1 h-11"
              onClick={onAdd}
              disabled={selectedAthleteIds.length === 0 || isAddingAthletes || spotsRemaining === 0}
            >
              {isAddingAthletes
                ? "Agregando..."
                : `Agregar (${selectedAthleteIds.length})`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
