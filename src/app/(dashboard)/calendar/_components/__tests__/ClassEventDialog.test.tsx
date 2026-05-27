/* eslint-disable @typescript-eslint/no-explicit-any */
// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ClassEventDialog } from "../ClassEventDialog";
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

describe("ClassEventDialog", () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    selectedEvent: makeClass(),
    attendees: [] as any[],
    isLoadingAttendees: false,
    onOpenAddAthlete: vi.fn(),
    onRemoveAthlete: vi.fn(),
    onEditClass: vi.fn(),
  };

  it("renders when open", () => {
    render(<ClassEventDialog {...defaultProps} />);
    expect(screen.getByText("INFORMACIÓN DE LA CLASE")).toBeDefined();
  });

  it("shows class name in heading", () => {
    const cls = makeClass({ class_templates: { name: "WOD" } as any });
    render(<ClassEventDialog {...defaultProps} selectedEvent={cls} />);
    const headings = screen.getAllByText("WOD");
    expect(headings.length).toBeGreaterThanOrEqual(1);
  });

  it("shows schedule time", () => {
    render(<ClassEventDialog {...defaultProps} />);
    expect(screen.getByText("09:00 - 10:00")).toBeDefined();
  });

  it("shows loading state when fetching attendees", () => {
    render(<ClassEventDialog {...defaultProps} isLoadingAttendees={true} />);
    expect(screen.getByText("Cargando asistentes...")).toBeDefined();
  });

  it("shows empty state when no attendees", () => {
    render(<ClassEventDialog {...defaultProps} attendees={[]} />);
    expect(screen.getByText("No hay atletas registrados en esta clase")).toBeDefined();
  });

  it("renders attendee table with data", () => {
    const attendees = [
      {
        id: "b-1",
        athlete_id: "a-1",
        status: "confirmed",
        athletes: {
          id: "a-1",
          profile: { id: "p-1", full_name: "John Doe", email: "john@test.com" },
          memberships: [{ status: "active", end_date: "2025-12-31", plan: { name: "Platinum" } }],
        },
      },
    ];
    render(<ClassEventDialog {...defaultProps} attendees={attendees as any} />);
    expect(screen.getByText("John Doe")).toBeDefined();
  });

  it("shows section details when class template has sections", () => {
    const cls = makeClass({
      class_templates: {
        name: "WOD",
        sections: [{ name: "Warmup", minutes: 10, description: "Light cardio" }],
      } as any,
    });
    render(<ClassEventDialog {...defaultProps} selectedEvent={cls} />);
    expect(screen.getByText("Warmup")).toBeDefined();
    expect(screen.getByText("10 MIN")).toBeDefined();
    expect(screen.getByText("Light cardio")).toBeDefined();
  });

  it("shows additional info section when description exists", () => {
    const cls = makeClass({
      class_templates: { name: "WOD", description: "Full body workout" } as any,
    });
    render(<ClassEventDialog {...defaultProps} selectedEvent={cls} />);
    expect(screen.getByText("Full body workout")).toBeDefined();
  });

  it("shows notes when present", () => {
    const cls = makeClass({ notes: "Bring extra water" });
    render(<ClassEventDialog {...defaultProps} selectedEvent={cls} />);
    expect(screen.getByText("Bring extra water")).toBeDefined();
  });
});
