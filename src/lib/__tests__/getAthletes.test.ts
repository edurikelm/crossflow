import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

import { getAthletes } from "@/lib/queries/athletes";
import { createClient } from "@/lib/supabase/server";

function mockAthleteRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "athlete-1",
    profile_id: "profile-1",
    gym_id: "gym-1",
    emergency_contact: null,
    emergency_phone: null,
    health_notes: null,
    current_level: "beginner",
    total_classes: 10,
    status_override: null,
    trial_ends_at: null,
    created_at: "2025-01-01T00:00:00Z",
    profile: {
      id: "profile-1",
      full_name: "Jane Athlete",
      email: "jane@example.com",
      phone: null,
    },
    membership: [],
    ...overrides,
  };
}

describe("getAthletes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns athletes with profile contact info (no orphan columns needed)", async () => {
    const mockData = [mockAthleteRow()];

    const mockSelect = vi.fn().mockReturnThis();
    const mockEq = vi.fn().mockReturnThis();
    const mockOrder = vi.fn().mockResolvedValue({ data: mockData, error: null });

    const mockSupabase = {
      from: vi.fn(() => ({ select: mockSelect, eq: mockEq, order: mockOrder })),
    };

    vi.mocked(createClient).mockResolvedValue(mockSupabase as never);

    const athletes = await getAthletes("gym-1");

    expect(athletes).toHaveLength(1);
    expect(athletes[0].profile.full_name).toBe("Jane Athlete");
    expect(athletes[0].profile.email).toBe("jane@example.com");
    expect(athletes[0].computed_status).toBeDefined();
  });

  it("returns empty array on error", async () => {
    const mockSelect = vi.fn().mockReturnThis();
    const mockEq = vi.fn().mockReturnThis();
    const mockOrder = vi.fn().mockResolvedValue({ data: null, error: new Error("DB error") });

    const mockSupabase = {
      from: vi.fn(() => ({ select: mockSelect, eq: mockEq, order: mockOrder })),
    };

    vi.mocked(createClient).mockResolvedValue(mockSupabase as never);

    const athletes = await getAthletes("gym-1");
    expect(athletes).toEqual([]);
  });
});
