"use client";

import { Button } from "@/components/ui/button";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";

interface WeekHeaderProps {
  monthYear: string;
  currentWeek: Date;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onToday: () => void;
  onNewClass: () => void;
}

export function WeekHeader({
  monthYear,
  currentWeek,
  onPrevWeek,
  onNextWeek,
  onToday,
  onNewClass,
}: WeekHeaderProps) {
  return (
    <header className="flex flex-col md:flex-row justify-between items-end gap-6 pb-4">
      <div className="space-y-1">
        <h2 className="font-display font-black text-5xl tracking-[-0.04em] text-primary_container uppercase">
          Rendimiento
        </h2>
        <div className="flex items-center gap-4">
          <span className="font-mono text-secondary tracking-widest text-xs uppercase">
            {format(currentWeek, "yyyy.MM")}
          </span>
          <div className="h-px w-16 bg-outline-variant/30" />
          <span className="font-display font-bold text-xl uppercase tracking-tighter">
            {monthYear}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={onPrevWeek} className="hover:bg-surface-container-high">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="outline" onClick={onToday} className="px-4 font-mono text-xs uppercase tracking-widest font-bold hover:text-primary_container">
          Hoy
        </Button>
        <Button variant="outline" size="icon" onClick={onNextWeek} className="hover:bg-surface-container-high">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <Button className="font-display" onClick={onNewClass}>
        <Plus className="mr-2 h-4 w-4" />
        Nueva Clase
      </Button>
    </header>
  );
}
