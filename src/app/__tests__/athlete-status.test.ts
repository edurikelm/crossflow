import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/auth/requireAuth", () => ({
  requireAuth: vi.fn(),
}));

import { PATCH } from "@/app/api/athletes/[id]/status/route";
import { requireAuth } from "@/lib/auth/requireAuth";

function mockRequest(body: unknown): NextRequest {
  return { json: vi.fn().mockResolvedValue(body) } as unknown as NextRequest;
}

function mockParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

function createMockSupabase() {
  const mocks: Record<string, vi.Mock> = {};

  const commonMethods = [
    "select", "eq", "single", "in", "update", "insert",
    "order", "gte", "lte", "or",
  ];

  const chain = new Proxy({} as Record<string, unknown>, {
    get(_, prop: string) {
      if (prop === "then") {
        return (resolve: (v: unknown) => void) => resolve({ data: null, error: null });
      }
      if (!mocks[prop]) {
        mocks[prop] = vi.fn(() => chain);
      }
      return mocks[prop];
    },
  });

  for (const method of commonMethods) {
    if (!mocks[method]) {
      mocks[method] = vi.fn(() => chain);
    }
  }

  return {
    from: vi.fn(() => chain),
    mocks,
  };
}

function makeAthlete(overrides: Record<string, unknown> = {}) {
  return {
    id: "athlete-1",
    profile_id: "profile-athlete",
    gym_id: "gym-1",
    emergency_contact: null,
    emergency_phone: null,
    health_notes: null,
    current_level: "beginner",
    total_classes: 10,
    status_override: null,
    trial_ends_at: null,
    created_at: "2025-01-01T00:00:00Z",
    ...overrides,
  };
}

function makeUpdatedAthlete(overrides: Record<string, unknown> = {}) {
  return {
    ...makeAthlete(),
    profile: {
      id: "profile-athlete",
      full_name: "Test Athlete",
      email: "test@example.com",
      phone: null,
    },
    ...overrides,
  };
}

describe("PATCH /api/athletes/[id]/status", () => {
  let supabase: ReturnType<typeof createMockSupabase>;

  beforeEach(() => {
    vi.clearAllMocks();
    supabase = createMockSupabase();
  });

  function setupAuth() {
    vi.mocked(requireAuth).mockResolvedValue({
      profile: { id: "profile-1", gym_id: "gym-1" },
      supabase,
    } as never);
  }

  describe("validation", () => {
    it("rejects invalid status_override values", async () => {
      setupAuth();

      const response = await PATCH(
        mockRequest({ status_override: "invalid_status" }),
        mockParams("athlete-1"),
      );
      expect(response.status).toBe(400);
    });

    it("rejects empty body", async () => {
      setupAuth();

      const response = await PATCH(
        mockRequest({}),
        mockParams("athlete-1"),
      );
      expect(response.status).toBe(400);
    });

    it("accepts valid status_override values", async () => {
      setupAuth();
      supabase.mocks.single
        .mockResolvedValueOnce({ data: makeAthlete(), error: null })
        .mockResolvedValueOnce({ data: makeUpdatedAthlete({ status_override: "paused" }), error: null });

      const response = await PATCH(
        mockRequest({ status_override: "paused", reason: "test" }),
        mockParams("athlete-1"),
      );
      expect(response.status).toBe(200);
    });

    it("accepts null to clear the override", async () => {
      setupAuth();
      supabase.mocks.single
        .mockResolvedValueOnce({ data: makeAthlete({ status_override: "paused" }), error: null })
        .mockResolvedValueOnce({ data: makeUpdatedAthlete({ status_override: null }), error: null });

      const response = await PATCH(
        mockRequest({ status_override: null }),
        mockParams("athlete-1"),
      );
      expect(response.status).toBe(200);
    });
  });

  describe("authentication", () => {
    it("rejects unauthenticated requests", async () => {
      vi.mocked(requireAuth).mockResolvedValue(
        NextResponse.json({ error: "No autenticado" }, { status: 401 }),
      );

      const response = await PATCH(
        mockRequest({ status_override: "paused" }),
        mockParams("athlete-1"),
      );
      expect(response.status).toBe(401);
    });
  });

  describe("athlete existence", () => {
    it("rejects requests for non-existent athletes", async () => {
      setupAuth();
      supabase.mocks.single.mockResolvedValueOnce({ data: null, error: { code: "PGRST116" } });

      const response = await PATCH(
        mockRequest({ status_override: "inactive" }),
        mockParams("nonexistent"),
      );
      expect(response.status).toBe(404);
      const body = await response.json();
      expect(body.error).toBe("Atleta no encontrado");
    });
  });

  describe("business rules", () => {
    it("paused cancels future bookings", async () => {
      setupAuth();
      supabase.mocks.single
        .mockResolvedValueOnce({ data: makeAthlete(), error: null })
        .mockResolvedValueOnce({ data: makeUpdatedAthlete({ status_override: "paused" }), error: null });

      let inCallCount = 0;
      supabase.mocks.in.mockImplementation(() => {
        inCallCount++;
        if (inCallCount === 1) {
          return {
            then: (resolve: (v: unknown) => void) => resolve({
              data: [
                { id: "booking-1", scheduled_class_id: "class-1" },
                { id: "booking-2", scheduled_class_id: "class-2" },
              ],
              error: null,
            }),
          } as never;
        }
        return {
          then: (resolve: (v: unknown) => void) => resolve({ data: null, error: null }),
        } as never;
      });

      const response = await PATCH(
        mockRequest({ status_override: "paused", reason: "test" }),
        mockParams("athlete-1"),
      );
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.cancelled_bookings).toBe(2);
      expect(body.athlete.status_override).toBe("paused");
    });

    it("suspended cancels future bookings", async () => {
      setupAuth();
      supabase.mocks.single
        .mockResolvedValueOnce({ data: makeAthlete(), error: null })
        .mockResolvedValueOnce({ data: makeUpdatedAthlete({ status_override: "suspended" }), error: null });

      let inCallCount = 0;
      supabase.mocks.in.mockImplementation(() => {
        inCallCount++;
        if (inCallCount === 1) {
          return {
            then: (resolve: (v: unknown) => void) => resolve({
              data: [{ id: "booking-1", scheduled_class_id: "class-1" }],
              error: null,
            }),
          } as never;
        }
        return {
          then: (resolve: (v: unknown) => void) => resolve({ data: null, error: null }),
        } as never;
      });

      const response = await PATCH(
        mockRequest({ status_override: "suspended", reason: "test" }),
        mockParams("athlete-1"),
      );
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.cancelled_bookings).toBe(1);
    });

    it("inactive does NOT cancel bookings", async () => {
      setupAuth();
      supabase.mocks.single
        .mockResolvedValueOnce({ data: makeAthlete(), error: null })
        .mockResolvedValueOnce({ data: makeUpdatedAthlete({ status_override: "inactive" }), error: null });

      const response = await PATCH(
        mockRequest({ status_override: "inactive" }),
        mockParams("athlete-1"),
      );
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.cancelled_bookings).toBe(0);
      expect(supabase.from).not.toHaveBeenCalledWith("bookings");
    });

    it("trial updates trial_ends_at", async () => {
      setupAuth();
      supabase.mocks.single
        .mockResolvedValueOnce({ data: makeAthlete(), error: null })
        .mockResolvedValueOnce({
          data: makeUpdatedAthlete({
            status_override: "trial",
            trial_ends_at: "2026-06-15T00:00:00Z",
          }),
          error: null,
        });

      const response = await PATCH(
        mockRequest({
          status_override: "trial",
          trial_ends_at: "2026-06-15T00:00:00Z",
        }),
        mockParams("athlete-1"),
      );
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.athlete.status_override).toBe("trial");
    });

    it("null clears the override", async () => {
      setupAuth();
      supabase.mocks.single
        .mockResolvedValueOnce({ data: makeAthlete({ status_override: "suspended" }), error: null })
        .mockResolvedValueOnce({ data: makeUpdatedAthlete({ status_override: null, trial_ends_at: null }), error: null });

      const response = await PATCH(
        mockRequest({ status_override: null }),
        mockParams("athlete-1"),
      );
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.athlete.status_override).toBeNull();
    });
  });

  describe("status log", () => {
    it("inserts a row into athlete_status_log", async () => {
      setupAuth();
      supabase.mocks.single
        .mockResolvedValueOnce({ data: makeAthlete(), error: null })
        .mockResolvedValueOnce({ data: makeUpdatedAthlete({ status_override: "paused" }), error: null });

      await PATCH(
        mockRequest({ status_override: "paused", reason: "Member requested pause" }),
        mockParams("athlete-1"),
      );

      expect(supabase.from).toHaveBeenCalledWith("athlete_status_log");

      const insertCalls = supabase.mocks.insert.mock.calls;
      const insertData = insertCalls[insertCalls.length - 1][0];
      expect(insertData.athlete_id).toBe("athlete-1");
      expect(insertData.profile_id).toBe("profile-1");
      expect(insertData.old_override).toBeNull();
      expect(insertData.new_override).toBe("paused");
      expect(insertData.reason).toBe("Member requested pause");
    });

    it("includes reason when provided", async () => {
      setupAuth();
      supabase.mocks.single
        .mockResolvedValueOnce({ data: makeAthlete(), error: null })
        .mockResolvedValueOnce({ data: makeUpdatedAthlete({ status_override: "suspended" }), error: null });

      await PATCH(
        mockRequest({ status_override: "suspended", reason: "Violation of gym rules" }),
        mockParams("athlete-1"),
      );

      const insertCalls = supabase.mocks.insert.mock.calls;
      const insertData = insertCalls[insertCalls.length - 1][0];
      expect(insertData.reason).toBe("Violation of gym rules");
    });
  });
});
