import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/auth/requireAuth", () => ({
  requireAuth: vi.fn(),
}));

import { GET } from "@/app/api/athletes/available/route";
import { requireAuth } from "@/lib/auth/requireAuth";

function mockRequest(url?: string): NextRequest {
  return {
    url: url ?? "http://localhost:3000/api/athletes/available",
  } as unknown as NextRequest;
}

function createMockSupabase() {
  const mocks: Record<string, vi.Mock | undefined> = {};

  const commonMethods = [
    "select", "eq", "single", "or", "filter",
  ];

  const chain = new Proxy({} as Record<string, unknown>, {
    get(_, prop: string) {
      if (prop === "then") {
        const resolver = mocks["!resolve"];
        if (resolver) return resolver;
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

  const resolveFn = vi.fn((resolve: (v: unknown) => void) => resolve({ data: null, error: null }));
  mocks["!resolve"] = resolveFn;

  return {
    from: vi.fn(() => chain),
    mocks,
    resolve: resolveFn,
  };
}

function makeAthlete(overrides: Record<string, unknown> = {}) {
  return {
    id: "athlete-1",
    gym_id: "gym-1",
    profile_id: "profile-1",
    full_name: "Test Athlete",
    emergency_contact: null,
    emergency_phone: null,
    health_notes: null,
    current_level: "beginner",
    total_classes: 5,
    status_override: null,
    trial_ends_at: null,
    created_at: "2025-01-01T00:00:00Z",
    profile: { id: "profile-1", full_name: "Test Athlete", email: "test@example.com", phone: null },
    membership: [{ id: "mem-1", plan: { id: "plan-1", name: "Monthly" }, end_date: "2027-12-31" }],
    ...overrides,
  };
}

describe("GET /api/athletes/available", () => {
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

  describe("authentication", () => {
    it("rejects unauthenticated requests", async () => {
      vi.mocked(requireAuth).mockResolvedValue(
        NextResponse.json({ error: "No autenticado" }, { status: 401 }),
      );

      const response = await GET(mockRequest());
      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.error).toBe("No autenticado");
    });
  });

  describe("successful response", () => {
    it("returns available athletes with no search filter", async () => {
      setupAuth();

      const athletes = [
        makeAthlete({ id: "athlete-1" }),
        makeAthlete({ id: "athlete-2", status_override: "trial", trial_ends_at: "2027-12-31" }),
      ];

      supabase.mocks.select.mockReturnThis();
      supabase.mocks.eq.mockReturnThis();
      supabase.resolve.mockImplementation((resolve: (v: unknown) => void) =>
        resolve({ data: athletes, error: null })
      );

      const response = await GET(mockRequest());
      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body).toHaveLength(2);
    });

    it("filters by search query on full_name", async () => {
      setupAuth();

      const filteredAthletes = [
        makeAthlete({ id: "athlete-1" }),
      ];

      supabase.mocks.select.mockReturnThis();
      supabase.mocks.eq.mockReturnThis();
      supabase.mocks.or.mockReturnThis();
      supabase.resolve.mockImplementation((resolve: (v: unknown) => void) =>
        resolve({ data: filteredAthletes, error: null })
      );

      const response = await GET(mockRequest("http://localhost:3000/api/athletes/available?search=Test"));
      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body).toHaveLength(1);
    });

    it("excludes athletes with existing bookings for a scheduled_class_id", async () => {
      setupAuth();

      const bookedIds = ["athlete-2"];
      const athletes = [
        makeAthlete({ id: "athlete-1" }),
        makeAthlete({ id: "athlete-2" }),
      ];

      let callCount = 0;
      supabase.resolve.mockImplementation((resolve: (v: unknown) => void) => {
        callCount++;
        if (callCount === 1) {
          return resolve({ data: athletes, error: null });
        }
        return resolve({
          data: bookedIds.map((id) => ({ athlete_id: id })),
          error: null,
        });
      });

      const response = await GET(
        mockRequest("http://localhost:3000/api/athletes/available?scheduled_class_id=class-1"),
      );
      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body).toHaveLength(1);
      expect(body[0].id).toBe("athlete-1");
    });

    it("excludes inactive/expired athletes based on computed status", async () => {
      setupAuth();

      const athletes = [
        makeAthlete({ id: "athlete-active" }),
        makeAthlete({ id: "athlete-expired", status_override: "inactive" }),
      ];

      supabase.mocks.select.mockReturnThis();
      supabase.mocks.eq.mockReturnThis();
      supabase.resolve.mockImplementation((resolve: (v: unknown) => void) =>
        resolve({ data: athletes, error: null })
      );

      const response = await GET(mockRequest());
      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body).toHaveLength(1);
      expect(body[0].id).toBe("athlete-active");
    });
  });

  describe("error handling", () => {
    it("returns 500 when supabase query fails", async () => {
      setupAuth();

      supabase.mocks.select.mockReturnThis();
      supabase.mocks.eq.mockReturnThis();
      supabase.resolve.mockImplementation((resolve: (v: unknown) => void) =>
        resolve({ data: null, error: { message: "DB error" } })
      );

      const response = await GET(mockRequest());
      expect(response.status).toBe(500);

      const body = await response.json();
      expect(body.error).toBe("DB error");
    });
  });
});
