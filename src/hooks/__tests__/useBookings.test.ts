/* eslint-disable @typescript-eslint/no-explicit-any */
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useBookings } from "@/hooks/useBookings";

const mockBookingData = [
  {
    id: "b-1",
    athlete_id: "a-1",
    status: "confirmed",
    athletes: {
      id: "a-1",
      profile: { id: "p-1", full_name: "John", email: "john@test.com" },
      memberships: [{ status: "active", end_date: "2025-12-31", plan: { name: "Platinum" } }],
    },
  },
];

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useBookings", () => {
  it("initializes with empty attendees and not loading", () => {
    const supabase = { from: vi.fn() } as any;
    const { result } = renderHook(() => useBookings(supabase));
    expect(result.current.attendees).toEqual([]);
    expect(result.current.isLoadingAttendees).toBe(false);
  });

  it("fetchBookings queries supabase and sets attendees", async () => {
    const supabase = { from: vi.fn() } as any;
    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: mockBookingData, error: null }),
    };
    supabase.from.mockReturnValue(mockQuery);

    const { result } = renderHook(() => useBookings(supabase));

    await act(async () => {
      await result.current.fetchBookings("cls-1");
    });

    expect(supabase.from).toHaveBeenCalledWith("bookings");
    expect(result.current.isLoadingAttendees).toBe(false);
    expect(result.current.attendees).toHaveLength(1);
    expect(result.current.attendees[0].athlete_id).toBe("a-1");
  });

  it("handles fetch error gracefully", async () => {
    const supabase = { from: vi.fn() } as any;
    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: null, error: new Error("DB error") }),
    };
    supabase.from.mockReturnValue(mockQuery);

    const { result } = renderHook(() => useBookings(supabase));

    await act(async () => {
      await result.current.fetchBookings("cls-1");
    });

    expect(result.current.attendees).toEqual([]);
  });

  it("sets loading state during fetch", async () => {
    let resolvePromise!: (v: unknown) => void;
    const delayedPromise = new Promise((resolve) => { resolvePromise = resolve; });

    const supabase = { from: vi.fn() } as any;
    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnValue(delayedPromise),
    };
    supabase.from.mockReturnValue(mockQuery);

    const { result } = renderHook(() => useBookings(supabase));

    let fetchPromise: Promise<void>;
    act(() => {
      fetchPromise = result.current.fetchBookings("cls-1");
    });

    expect(result.current.isLoadingAttendees).toBe(true);

    await act(async () => {
      resolvePromise({ data: mockBookingData, error: null });
      await fetchPromise!;
    });

    expect(result.current.isLoadingAttendees).toBe(false);
    expect(result.current.attendees).toHaveLength(1);
  });

  it("setAttendees updates attendees directly", () => {
    const supabase = { from: vi.fn() } as any;
    const { result } = renderHook(() => useBookings(supabase));

    act(() => {
      result.current.setAttendees(mockBookingData as any);
    });

    expect(result.current.attendees).toEqual(mockBookingData);
  });
});
