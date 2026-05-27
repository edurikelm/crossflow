"use client";

import { format, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import type { ScheduledClassWithDetails } from "@/types";
import {
  HOURS,
  getClassesForDay,
  isClassActive,
  getAvailabilityBadge,
  cn,
} from "../_utils";

interface CalendarGridProps {
  weekDays: Date[];
  scheduledClasses: ScheduledClassWithDetails[];
  currentTime: Date;
  onEventClick: (cls: ScheduledClassWithDetails) => void;
}

export function CalendarGrid({
  weekDays,
  scheduledClasses,
  currentTime,
  onEventClick,
}: CalendarGridProps) {
  return (
    <div className="bg-surface_container_low rounded-lg overflow-hidden font-display">
      <div className="grid grid-cols-8 border-b">
        <div className="border-r p-2" />
        {weekDays.map((day) => (
          <div
            key={day.toISOString()}
            className={cn(
              "border-r p-2 text-center",
              isSameDay(day, new Date()) && "bg-primary/5",
            )}
          >
            <p className="text-xs text-muted-foreground">
              {format(day, "EEE", { locale: es })}
            </p>
            <p
              className={cn(
                "text-lg font-semibold",
                isSameDay(day, new Date()) && "text-primary",
              )}
            >
              {format(day, "d")}
            </p>
          </div>
        ))}
      </div>

      <div className="max-h-150 overflow-y-auto">
        {HOURS.map((hour) => (
          <div key={hour} className="grid grid-cols-8 border-b">
            <div className="border-r p-2 text-xs text-muted-foreground">
              {hour}:00
            </div>
            {weekDays.map((day) => {
              const dayClasses = getClassesForDay(day, scheduledClasses).filter(
                (cls) => parseInt(cls.start_time.split(":")[0]) === hour,
              );
              return (
                <div
                  key={`${day.toISOString()}-${hour}`}
                  className={cn(
                    "border-r min-h-20 p-1 cursor-pointer hover:bg-muted/50 transition-colors",
                    isSameDay(day, new Date()) && "bg-primary/5",
                  )}
                >
                  {dayClasses.map((cls) => {
                    const active = isClassActive(cls, currentTime);
                    const badge = getAvailabilityBadge(cls);
                    return (
                      <div
                        key={cls.id}
                        className={cn(
                          "rounded p-2 text-xs mb-1 cursor-pointer transition-all relative",
                          active
                            ? "bg-primary_container shadow-lg shadow-primary_container/20"
                            : "bg-[rgba(28,27,27,0.7)] hover:bg-[#2a2a2a]",
                        )}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEventClick(cls);
                        }}
                      >
                        {!active && (
                          <div
                            className="absolute left-0 top-0 bottom-0 w-1 rounded-l"
                            style={{
                              backgroundColor:
                                cls.class_templates?.color || "#3B82F6",
                            }}
                          />
                        )}
                        <h4
                          className={cn(
                            "font-display font-black text-xs uppercase tracking-tight leading-none mb-1 truncate",
                            active
                              ? "text-white"
                              : "group-hover:text-primary_container",
                          )}
                          style={
                            !active
                              ? {
                                  color:
                                    cls.class_templates?.color || "#3B82F6",
                                }
                              : undefined
                          }
                        >
                          {cls.class_templates?.name || "Clase"}
                        </h4>
                        <p
                          className={cn(
                            "font-mono text-[10px] mb-1",
                            active ? "text-white/70" : "text-outline",
                          )}
                        >
                          {cls.start_time?.slice(0, 5)} -{" "}
                          {cls.end_time?.slice(0, 5)}
                        </p>
                        {cls.coaches && (
                          <p
                            className={cn(
                              "text-[10px] mb-2 truncate",
                              active ? "text-white/60" : "text-outline/70",
                            )}
                          >
                            {cls.coaches.profile?.full_name}
                          </p>
                        )}
                        <div className="flex items-center justify-between">
                          <span
                            className={cn(
                              "font-mono text-[9px] px-1.5 py-0.5 rounded-sm font-bold uppercase",
                              active
                                ? "bg-white/20 text-white"
                                : "bg-surface_container_lowest text-secondary",
                            )}
                          >
                            {cls.current_bookings ?? 0}/{cls.capacity ?? 0}
                          </span>
                          <span
                            className={cn(
                              "font-mono text-[9px] px-1.5 py-0.5 rounded-sm font-bold uppercase",
                              badge.className,
                              active && "bg-white/20 text-white",
                            )}
                          >
                            {badge.label}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
