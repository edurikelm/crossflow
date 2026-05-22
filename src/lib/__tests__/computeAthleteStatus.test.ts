import { describe, it, expect } from "vitest";
import { computeAthleteStatus } from "../athletes";

const futureDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
const pastDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();
const todayStr = new Date().toISOString();

describe("computeAthleteStatus", () => {
  it("should return active when no override and membership end_date is today", () => {
    const result = computeAthleteStatus(
      { status_override: null, trial_ends_at: null },
      { end_date: todayStr }
    );
    expect(result).toBe("active");
  });

  it("should return active when no override and membership end_date is in the future", () => {
    const result = computeAthleteStatus(
      { status_override: null, trial_ends_at: null },
      { end_date: futureDate }
    );
    expect(result).toBe("active");
  });

  it("should return expired when no override and membership end_date is in the past", () => {
    const result = computeAthleteStatus(
      { status_override: null, trial_ends_at: null },
      { end_date: pastDate }
    );
    expect(result).toBe("expired");
  });

  it("should return expired when no override and no membership", () => {
    const result = computeAthleteStatus(
      { status_override: null, trial_ends_at: null },
      null
    );
    expect(result).toBe("expired");
  });

  it("should return paused when override is paused (even with active membership)", () => {
    const result = computeAthleteStatus(
      { status_override: "paused", trial_ends_at: null },
      { end_date: futureDate }
    );
    expect(result).toBe("paused");
  });

  it("should return suspended when override is suspended", () => {
    const result = computeAthleteStatus(
      { status_override: "suspended", trial_ends_at: null },
      { end_date: futureDate }
    );
    expect(result).toBe("suspended");
  });

  it("should return inactive when override is inactive", () => {
    const result = computeAthleteStatus(
      { status_override: "inactive", trial_ends_at: null },
      { end_date: futureDate }
    );
    expect(result).toBe("inactive");
  });

  it("should return trial when override is trial and trial_ends_at is in the future", () => {
    const result = computeAthleteStatus(
      { status_override: "trial", trial_ends_at: futureDate },
      null
    );
    expect(result).toBe("trial");
  });

  it("should return expired when override is trial and trial_ends_at is in the past", () => {
    const result = computeAthleteStatus(
      { status_override: "trial", trial_ends_at: pastDate },
      null
    );
    expect(result).toBe("expired");
  });

  it("should return trial when override is trial and no trial_ends_at (indefinite)", () => {
    const result = computeAthleteStatus(
      { status_override: "trial", trial_ends_at: null },
      null
    );
    expect(result).toBe("trial");
  });
});
