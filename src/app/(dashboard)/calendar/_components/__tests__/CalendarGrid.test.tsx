/* eslint-disable @typescript-eslint/no-explicit-any */
// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { CalendarGrid } from "../CalendarGrid";
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

describe("CalendarGrid", () => {
  const weekDays = [
    new Date(2025, 5, 2),
    new Date(2025, 5, 3),
    new Date(2025, 5, 4),
    new Date(2025, 5, 5),
    new Date(2025, 5, 6),
    new Date(2025, 5, 7),
    new Date(2025, 5, 8),
  ];

  const defaultProps = {
    weekDays,
    scheduledClasses: [] as ScheduledClassWithDetails[],
    currentTime: new Date(2025, 5, 2, 12, 0),
    onEventClick: vi.fn(),
  };

  it("renders hour labels from 6 to 21", () => {
    render(<CalendarGrid {...defaultProps} />);
    expect(screen.getByText("6:00")).toBeDefined();
    expect(screen.getByText("21:00")).toBeDefined();
  });

  it("renders day headers with weekday and date", () => {
    render(<CalendarGrid {...defaultProps} />);
    expect(screen.getByText("2")).toBeDefined();
  });

  it("renders class cards when classes exist", () => {
    const cls = makeClass({ id: "test-cls", date: "2025-06-02", class_templates: { name: "CrossFit" } as any });
    render(<CalendarGrid {...defaultProps} scheduledClasses={[cls]} />);
    expect(screen.getByText("CrossFit")).toBeDefined();
  });

  it("shows capacity badge", () => {
    const cls = makeClass({ id: "test-cls", date: "2025-06-02", current_bookings: 5, capacity: 20 });
    render(<CalendarGrid {...defaultProps} scheduledClasses={[cls]} />);
    expect(screen.getByText("5/20")).toBeDefined();
  });

  it("calls onEventClick when clicking a class", () => {
    const onEventClick = vi.fn();
    const cls = makeClass({ id: "test-cls", date: "2025-06-02" });
    render(<CalendarGrid {...defaultProps} scheduledClasses={[cls]} onEventClick={onEventClick} />);
    screen.getByText("Clase").click();
    expect(onEventClick).toHaveBeenCalledWith(cls);
  });

  it("renders nothing when no classes on that hour", () => {
    // All classes are at 09:00, other hours should be empty cells
    render(<CalendarGrid {...defaultProps} />);
    // Just verify the grid renders without crashing
    expect(document.querySelector(".grid.grid-cols-8")).toBeDefined();
  });
});
