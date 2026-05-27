import { describe, it, expect } from "vitest";
import {
  getSectionLabel,
  getStatusStyle,
  getMembershipStyle,
  getInitials,
  getClassesForDay,
  isClassActive,
  getAvailabilityBadge,
  cn,
  HOURS,
} from "@/app/(dashboard)/calendar/_utils";
import type { ScheduledClassWithDetails } from "@/types";

function makeClass(overrides: Partial<ScheduledClassWithDetails> = {}): ScheduledClassWithDetails {
  return {
    id: "cls-1",
    class_template_id: "tpl-1",
    gym_id: "gym-1",
    profile_id: "prof-1",
    coach_id: "coach-1",
    date: "2025-06-02",
    start_time: "09:00",
    end_time: "10:00",
    capacity: 20,
    current_bookings: 10,
    is_cancelled: false,
    notes: null,
    created_at: "2025-06-01T00:00:00Z",
    spots_remaining: 10,
    ...overrides,
  };
}

describe("getSectionLabel", () => {
  it("maps warmup to WARM_UP", () => {
    expect(getSectionLabel("warmup", 0)).toBe("01_WARM_UP");
  });
  it("maps strength to STRENGTH_SKILL", () => {
    expect(getSectionLabel("strength", 1)).toBe("02_STRENGTH_SKILL");
  });
  it("maps wod to METCON", () => {
    expect(getSectionLabel("wod", 2)).toBe("03_METCON");
  });
  it("falls back to indexed label for unknown names", () => {
    expect(getSectionLabel("cooldown", 3)).toBe("04_COOLDOWN");
  });
});

describe("getStatusStyle", () => {
  it("returns green style for confirmed", () => {
    const result = getStatusStyle("confirmed");
    expect(result).toContain("emerald");
  });
  it("returns green style for checked_in", () => {
    expect(getStatusStyle("checked_in")).toContain("emerald");
  });
  it("returns neutral style for waiting", () => {
    expect(getStatusStyle("waiting")).toContain("neutral");
  });
  it("returns red style for no_show", () => {
    expect(getStatusStyle("no_show")).toContain("red");
  });
  it("returns red style for cancelled", () => {
    expect(getStatusStyle("cancelled")).toContain("red");
  });
  it("returns neutral style for unknown status", () => {
    expect(getStatusStyle("pending")).toContain("neutral");
  });
});

describe("getMembershipStyle", () => {
  it("returns amber for platinum", () => {
    expect(getMembershipStyle("Platinum Unlimited")).toContain("amber");
  });
  it("returns amber for ilimitado", () => {
    expect(getMembershipStyle("Plan Ilimitado")).toContain("amber");
  });
  it("returns orange for premium", () => {
    expect(getMembershipStyle("Premium Gold")).toContain("orange");
  });
  it("returns neutral for standard", () => {
    expect(getMembershipStyle("Basico")).toContain("neutral");
  });
  it("returns neutral for undefined", () => {
    expect(getMembershipStyle(undefined)).toContain("neutral");
  });
});

describe("getInitials", () => {
  it("returns initials from full name", () => {
    expect(getInitials("John Doe")).toBe("JD");
  });
  it("handles single name", () => {
    expect(getInitials("John")).toBe("J");
  });
  it("returns ? for undefined", () => {
    expect(getInitials(undefined)).toBe("?");
  });
  it("returns ? for empty string", () => {
    expect(getInitials("")).toBe("?");
  });
});

describe("getClassesForDay", () => {
  it("filters classes matching the given day", () => {
    const day = new Date(2025, 5, 2);
    const classes = [
      makeClass({ id: "1", date: "2025-06-02" }),
      makeClass({ id: "2", date: "2025-06-03" }),
    ];
    const result = getClassesForDay(day, classes);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("1");
  });
  it("returns empty array when no classes match", () => {
    const day = new Date(2025, 5, 5);
    const classes = [makeClass({ date: "2025-06-02" })];
    expect(getClassesForDay(day, classes)).toEqual([]);
  });
});

describe("isClassActive", () => {
  it("returns true when current time is within class time on same day", () => {
    const cls = makeClass({ date: "2025-06-02", start_time: "09:00", end_time: "10:00" });
    const now = new Date(2025, 5, 2, 9, 30);
    expect(isClassActive(cls, now)).toBe(true);
  });
  it("returns false when current time is before class", () => {
    const cls = makeClass({ date: "2025-06-02", start_time: "09:00", end_time: "10:00" });
    const now = new Date(2025, 5, 2, 8, 0);
    expect(isClassActive(cls, now)).toBe(false);
  });
  it("returns false when current time is after class", () => {
    const cls = makeClass({ date: "2025-06-02", start_time: "09:00", end_time: "10:00" });
    const now = new Date(2025, 5, 2, 10, 30);
    expect(isClassActive(cls, now)).toBe(false);
  });
  it("returns false on a different day", () => {
    const cls = makeClass({ date: "2025-06-02", start_time: "09:00", end_time: "10:00" });
    const now = new Date(2025, 5, 3, 9, 30);
    expect(isClassActive(cls, now)).toBe(false);
  });
});

describe("getAvailabilityBadge", () => {
  it("returns Completa when spots_remaining is 0", () => {
    expect(getAvailabilityBadge(makeClass({ spots_remaining: 0 })).label).toBe("Completa");
  });
  it("returns Limitada when spots_remaining is 1-3", () => {
    expect(getAvailabilityBadge(makeClass({ spots_remaining: 2 })).label).toBe("Limitada");
  });
  it("returns Disponible when spots_remaining > 3", () => {
    expect(getAvailabilityBadge(makeClass({ spots_remaining: 10 })).label).toBe("Disponible");
  });
});

describe("cn", () => {
  it("joins truthy class names", () => {
    expect(cn("a", "b", "c")).toBe("a b c");
  });
  it("filters falsy values", () => {
    expect(cn("a", false, undefined, null, "b")).toBe("a b");
  });
  it("returns empty string for all falsy", () => {
    expect(cn(false, undefined, null)).toBe("");
  });
});

describe("HOURS", () => {
  it("contains hours from 6 to 21", () => {
    expect(HOURS).toHaveLength(16);
    expect(HOURS[0]).toBe(6);
    expect(HOURS[15]).toBe(21);
  });
});
