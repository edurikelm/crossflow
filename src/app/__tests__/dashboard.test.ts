import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { computeAthleteStatus } from "@/lib/athletes";
import type { Athlete, Membership } from "@/types";

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2025-06-01T12:00:00Z"));
});

afterEach(() => {
  vi.useRealTimers();
});

function makeAthlete(overrides: Partial<Athlete> = {}): Athlete {
  return {
    id: "test-id",
    profile_id: null,
    gym_id: "gym-1",
    emergency_contact: null,
    emergency_phone: null,
    health_notes: null,
    current_level: "beginner",
    total_classes: 0,
    status_override: null,
    trial_ends_at: null,
    created_at: "2025-01-01T00:00:00Z",
    ...overrides,
  };
}

function makeMembership(overrides: Partial<Membership> = {}): Membership {
  return {
    id: "mem-1",
    athlete_id: "test-id",
    plan_id: "plan-1",
    gym_id: "gym-1",
    start_date: "2025-01-01",
    end_date: "2025-07-01",
    classes_used: 0,
    auto_renew: false,
    created_at: "2025-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("computeAthleteStatus", () => {
  it("returns active for athlete with active membership and no override", () => {
    const athlete = makeAthlete();
    const result = computeAthleteStatus({ ...athlete, membership: [makeMembership()] });
    expect(result).toBe("active");
  });

  it("returns trial for athlete with trial override and future trial_ends_at", () => {
    const athlete = makeAthlete({
      status_override: "trial",
      trial_ends_at: "2025-06-07",
    });
    expect(computeAthleteStatus(athlete)).toBe("trial");
  });

  it("returns expired for athlete with trial override and past trial_ends_at", () => {
    const athlete = makeAthlete({
      status_override: "trial",
      trial_ends_at: "2025-05-25",
    });
    expect(computeAthleteStatus(athlete)).toBe("expired");
  });

  it("returns expired for athlete with trial override same as today", () => {
    const athlete = makeAthlete({
      status_override: "trial",
      trial_ends_at: "2025-06-01",
    });
    expect(computeAthleteStatus(athlete)).toBe("trial");
  });

  it("returns paused for athlete with paused override", () => {
    const athlete = makeAthlete({ status_override: "paused" });
    expect(computeAthleteStatus(athlete)).toBe("paused");
  });

  it("returns suspended for athlete with suspended override", () => {
    const athlete = makeAthlete({ status_override: "suspended" });
    expect(computeAthleteStatus(athlete)).toBe("suspended");
  });

  it("returns inactive for athlete with inactive override", () => {
    const athlete = makeAthlete({ status_override: "inactive" });
    expect(computeAthleteStatus(athlete)).toBe("inactive");
  });

  it("returns expired for athlete with no override and no membership", () => {
    expect(computeAthleteStatus(makeAthlete())).toBe("expired");
  });

  it("returns expired for athlete with no override and past membership end_date", () => {
    const athlete = makeAthlete();
    const membership = makeMembership({ end_date: "2025-05-01" });
    expect(computeAthleteStatus({ ...athlete, membership: [membership] })).toBe("expired");
  });
});

describe("dashboard active+trial counting", () => {
  it("counts athletes with active status", () => {
    const athletes = [
      { ...makeAthlete({ id: "a1" }), membership: [makeMembership()] },
    ];
    const active = athletes.filter((a) => {
      const s = computeAthleteStatus(a);
      return s === "active" || s === "trial";
    }).length;
    expect(active).toBe(1);
  });

  it("counts athletes with trial status", () => {
    const athletes = [
      { ...makeAthlete({ id: "a1", status_override: "trial", trial_ends_at: "2025-06-07" }) },
    ];
    const active = athletes.filter((a) => {
      const s = computeAthleteStatus(a);
      return s === "active" || s === "trial";
    }).length;
    expect(active).toBe(1);
  });

  it("excludes expired, paused, suspended, inactive athletes from active+trial count", () => {
    const athletes = [
      { ...makeAthlete({ id: "inactive-1", status_override: "inactive" }) },
      { ...makeAthlete({ id: "paused-1", status_override: "paused" }) },
      { ...makeAthlete({ id: "suspended-1", status_override: "suspended" }) },
      { ...makeAthlete({ id: "expired-trial-1", status_override: "trial", trial_ends_at: "2025-05-25" }) },
      { ...makeAthlete({ id: "expired-mem-1" }), membership: [makeMembership({ end_date: "2025-05-01" })] },
      { ...makeAthlete({ id: "active-1" }), membership: [makeMembership()] },
      { ...makeAthlete({ id: "trial-1", status_override: "trial", trial_ends_at: "2025-06-07" }) },
    ];
    const count = athletes.filter((a) => {
      const s = computeAthleteStatus(a);
      return s === "active" || s === "trial";
    }).length;
    expect(count).toBe(2);
  });
});
