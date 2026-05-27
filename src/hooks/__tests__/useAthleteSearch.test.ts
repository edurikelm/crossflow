/* eslint-disable @typescript-eslint/no-explicit-any */
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAthleteSearch } from "@/hooks/useAthleteSearch";

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

const mockAthletes = [
  { id: "a-1", profile: { full_name: "John", email: "john@test.com", phone: null }, membership: [{ plan: { name: "Platinum" } }] },
  { id: "a-2", profile: { full_name: "Jane", email: "jane@test.com", phone: null }, membership: [{ plan: { name: "Premium" } }] },
];

describe("useAthleteSearch", () => {
  it("initializes with empty state", () => {
    const { result } = renderHook(() => useAthleteSearch());
    expect(result.current.availableAthletes).toEqual([]);
    expect(result.current.athleteSearchQuery).toBe("");
    expect(result.current.isLoadingAthletes).toBe(false);
  });

  it("sets search query", () => {
    const { result } = renderHook(() => useAthleteSearch());
    act(() => {
      result.current.setAthleteSearchQuery("John");
    });
    expect(result.current.athleteSearchQuery).toBe("John");
  });

  it("search fetches athletes and sets results", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockAthletes),
    });

    const { result } = renderHook(() => useAthleteSearch());
    await act(async () => {
      await result.current.search("cls-1");
    });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/athletes/available?scheduled_class_id=cls-1"),
    );
    expect(result.current.availableAthletes).toEqual(mockAthletes);
    expect(result.current.isLoadingAthletes).toBe(false);
  });

  it("search includes query param when set", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockAthletes),
    });

    const { result } = renderHook(() => useAthleteSearch());
    act(() => {
      result.current.setAthleteSearchQuery("John");
    });

    await act(async () => {
      await result.current.search("cls-1");
    });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining("search=John"),
    );
  });

  it("handles fetch error gracefully", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
    });
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const { result } = renderHook(() => useAthleteSearch());
    await act(async () => {
      await result.current.search("cls-1");
    });

    expect(result.current.availableAthletes).toEqual([]);
    consoleSpy.mockRestore();
  });

  it("sets loading state and clears it after fetch", async () => {
    let resolveFetch!: (v: Response) => void;
    const delayedFetch = new Promise<Response>((resolve) => { resolveFetch = resolve; });
    globalThis.fetch = vi.fn().mockReturnValue(delayedFetch);

    const { result } = renderHook(() => useAthleteSearch());

    let searchPromise: Promise<void>;
    act(() => {
      searchPromise = result.current.search("cls-1");
    });

    expect(result.current.isLoadingAthletes).toBe(true);

    await act(async () => {
      resolveFetch({ ok: true, json: () => Promise.resolve(mockAthletes) } as Response);
      await searchPromise!;
    });

    expect(result.current.isLoadingAthletes).toBe(false);
    expect(result.current.availableAthletes).toEqual(mockAthletes);
  });

  it("setAvailableAthletes updates athletes directly", () => {
    const { result } = renderHook(() => useAthleteSearch());
    act(() => {
      result.current.setAvailableAthletes(mockAthletes as any);
    });
    expect(result.current.availableAthletes).toEqual(mockAthletes);
  });
});
