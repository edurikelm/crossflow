import { describe, it, expect } from "vitest";
import { getBadgeVariantForStatus, matchesStatusFilter } from "@/lib/athletes";
import type { AthleteStatus } from "@/types";

describe("getBadgeVariantForStatus", () => {
  it('should return "success" for active status', () => {
    expect(getBadgeVariantForStatus("active")).toBe("success");
  });

  it('should return "warning" for trial status', () => {
    expect(getBadgeVariantForStatus("trial")).toBe("warning");
  });

  it('should return "secondary" for expired status', () => {
    expect(getBadgeVariantForStatus("expired")).toBe("secondary");
  });

  it('should return "secondary" for paused status', () => {
    expect(getBadgeVariantForStatus("paused")).toBe("secondary");
  });

  it('should return "destructive" for suspended status', () => {
    expect(getBadgeVariantForStatus("suspended")).toBe("destructive");
  });

  it('should return "secondary" for inactive status', () => {
    expect(getBadgeVariantForStatus("inactive")).toBe("secondary");
  });
});

describe("matchesStatusFilter", () => {
  const allStatuses: AthleteStatus[] = ["active", "trial", "expired", "paused", "suspended", "inactive"];

  it('should return true for all statuses when filter is "all"', () => {
    for (const s of allStatuses) {
      expect(matchesStatusFilter(s, "all")).toBe(true);
    }
  });

  it('should return true for active and trial when filter is "active"', () => {
    expect(matchesStatusFilter("active", "active")).toBe(true);
    expect(matchesStatusFilter("trial", "active")).toBe(true);
    expect(matchesStatusFilter("expired", "active")).toBe(false);
    expect(matchesStatusFilter("paused", "active")).toBe(false);
    expect(matchesStatusFilter("suspended", "active")).toBe(false);
    expect(matchesStatusFilter("inactive", "active")).toBe(false);
  });

  it('should return true only for trial when filter is "trial"', () => {
    for (const s of allStatuses) {
      expect(matchesStatusFilter(s, "trial")).toBe(s === "trial");
    }
  });

  it('should return true only for paused when filter is "paused"', () => {
    for (const s of allStatuses) {
      expect(matchesStatusFilter(s, "paused")).toBe(s === "paused");
    }
  });

  it('should return true only for suspended when filter is "suspended"', () => {
    for (const s of allStatuses) {
      expect(matchesStatusFilter(s, "suspended")).toBe(s === "suspended");
    }
  });

  it('should return true only for expired when filter is "expired"', () => {
    for (const s of allStatuses) {
      expect(matchesStatusFilter(s, "expired")).toBe(s === "expired");
    }
  });

  it('should return true only for inactive when filter is "inactive"', () => {
    for (const s of allStatuses) {
      expect(matchesStatusFilter(s, "inactive")).toBe(s === "inactive");
    }
  });
});
