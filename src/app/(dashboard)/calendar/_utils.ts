import { isSameDay, parseISO } from "date-fns";
import type { ScheduledClassWithDetails } from "@/types";

export interface AttendeeRow {
  id: string;
  athlete_id: string;
  status: string;
  athletes?: {
    id?: string;
    profile?: {
      id?: string;
      full_name?: string;
      email?: string;
    };
    memberships?: Array<{
      status: string;
      end_date: string;
      plan: { name?: string } | null;
    }> | null;
  } | null;
}

export type AthleteSearchResult = {
  id: string;
  profile: { full_name: string; email: string; phone: string | null };
  membership: Array<{ plan: { name: string } }>;
};

export const SECTION_LABEL_MAP: Record<string, string> = {
  warmup: "01_WARM_UP",
  warm: "01_WARM_UP",
  strength: "02_STRENGTH_SKILL",
  skill: "02_STRENGTH_SKILL",
  skills: "02_STRENGTH_SKILL",
  wod: "03_METCON",
  metcon: "03_METCON",
  conditioning: "03_METCON",
};

export const HOURS = Array.from({ length: 16 }, (_, i) => i + 6);

export function getSectionLabel(name: string, index: number): string {
  const key = name.toLowerCase();
  return SECTION_LABEL_MAP[key] ?? `${String(index + 1).padStart(2, "0")}_${name.toUpperCase()}`;
}

export function getStatusStyle(status: string): string {
  const s = status.toLowerCase();
  if (s === "checked_in" || s === "confirmed") {
    return "bg-emerald-900/60 text-emerald-400 border border-emerald-800/60";
  }
  if (s === "waiting" || s === "waitlist") {
    return "bg-neutral-800 text-neutral-400";
  }
  if (s === "no_show" || s === "cancelled") {
    return "bg-red-900/60 text-red-400 border border-red-800/60";
  }
  return "bg-neutral-800 text-neutral-400";
}

export function getMembershipStyle(name?: string): string {
  if (!name) return "bg-neutral-800 text-neutral-400";
  const n = name.toLowerCase();
  if (n.includes("platinum") || n.includes("ilimitado") || n.includes("unlimited")) {
    return "bg-amber-900/60 text-amber-400 border border-amber-800/60";
  }
  if (n.includes("premium") || n.includes("gold")) {
    return "bg-orange-900/60 text-orange-400 border border-orange-800/60";
  }
  return "bg-neutral-800 text-neutral-400";
}

export function getInitials(name?: string): string {
  if (!name) return "?";
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export function getClassesForDay(
  day: Date,
  scheduledClasses: ScheduledClassWithDetails[],
): ScheduledClassWithDetails[] {
  return scheduledClasses.filter((cls) => isSameDay(parseISO(cls.date), day));
}

export function isClassActive(cls: ScheduledClassWithDetails, currentTime: Date): boolean {
  const classDate = parseISO(cls.date);
  if (!isSameDay(classDate, currentTime)) return false;
  const [startH, startM] = (cls.start_time || "00:00").split(":").map(Number);
  const [endH, endM] = (cls.end_time || "00:00").split(":").map(Number);
  const classStart = startH * 60 + startM;
  const classEnd = endH * 60 + endM;
  const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
  return currentMinutes >= classStart && currentMinutes < classEnd;
}

export function getAvailabilityBadge(cls: ScheduledClassWithDetails): {
  label: string;
  className: string;
} {
  const remaining = cls.spots_remaining ?? 0;
  if (remaining === 0) {
    return { label: "Completa", className: "bg-error-container/20 text-error" };
  }
  if (remaining <= 3) {
    return { label: "Limitada", className: "bg-tertiary-container/20 text-tertiary" };
  }
  return { label: "Disponible", className: "bg-secondary-container/20 text-secondary" };
}

export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}
