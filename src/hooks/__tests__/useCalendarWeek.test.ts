// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCalendarWeek } from "@/hooks/useCalendarWeek";

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2025-06-02T12:00:00Z"));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useCalendarWeek", () => {
  it("returns initial week days starting on Monday", () => {
    const { result } = renderHook(() => useCalendarWeek());
    expect(result.current.weekDays).toHaveLength(7);
    expect(result.current.weekDays[0].getDay()).toBe(1);
  });

  it("computes weekStart correctly", () => {
    const { result } = renderHook(() => useCalendarWeek());
    expect(result.current.weekStart.getDay()).toBe(1);
  });

  it("navigates to previous week", () => {
    const { result } = renderHook(() => useCalendarWeek());
    const initialWeek = result.current.weekStart.toISOString();
    act(() => {
      result.current.handlePrevWeek();
    });
    expect(result.current.weekStart.toISOString()).not.toBe(initialWeek);
  });

  it("navigates to next week", () => {
    const { result } = renderHook(() => useCalendarWeek());
    const initialWeek = result.current.weekStart.toISOString();
    act(() => {
      result.current.handleNextWeek();
    });
    expect(result.current.weekStart.toISOString()).not.toBe(initialWeek);
  });

  it("handleToday resets to current week", () => {
    const { result } = renderHook(() => useCalendarWeek());
    act(() => {
      result.current.handleNextWeek();
    });
    const afterNext = result.current.weekStart.toISOString();
    act(() => {
      result.current.handleToday();
    });
    expect(result.current.weekStart.toISOString()).not.toBe(afterNext);
  });

  it("returns monthYear string", () => {
    const { result } = renderHook(() => useCalendarWeek());
    expect(result.current.monthYear).toBeTruthy();
  });

  it("returns currentTime that updates", () => {
    const { result } = renderHook(() => useCalendarWeek());
    expect(result.current.currentTime).toBeInstanceOf(Date);
  });

  it("supports custom initial date", () => {
    const customDate = new Date("2024-01-15");
    const { result } = renderHook(() => useCalendarWeek(customDate));
    expect(result.current.weekStart.getFullYear()).toBe(2024);
    expect(result.current.weekStart.getMonth()).toBe(0);
  });

  it("starts a 60-second interval for live clock", () => {
    const { result } = renderHook(() => useCalendarWeek());
    const initial = result.current.currentTime.getTime();
    vi.advanceTimersByTime(60000);
    const updated = result.current.currentTime.getTime();
    expect(updated).toBeGreaterThanOrEqual(initial);
  });

  it("cleans up interval on unmount", () => {
    const clearSpy = vi.spyOn(globalThis, "clearInterval");
    const { unmount } = renderHook(() => useCalendarWeek());
    unmount();
    expect(clearSpy).toHaveBeenCalled();
    clearSpy.mockRestore();
  });

  it("setCurrentWeek updates the week", () => {
    const { result } = renderHook(() => useCalendarWeek());
    const newDate = new Date("2024-06-01");
    act(() => {
      result.current.setCurrentWeek(newDate);
    });
    expect(result.current.currentWeek).toEqual(newDate);
  });
});
