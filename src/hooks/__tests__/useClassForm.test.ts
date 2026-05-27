// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useClassForm } from "@/hooks/useClassForm";

describe("useClassForm", () => {
  it("initializes with empty form and not editing", () => {
    const { result } = renderHook(() => useClassForm());
    expect(result.current.formData).toEqual({
      class_template_id: "",
      coach_id: "",
      date: "",
      start_time: "",
      end_time: "",
      notes: "",
      capacity: "",
    });
    expect(result.current.isEditingClass).toBe(false);
    expect(result.current.editingClassId).toBeNull();
    expect(result.current.isSubmittingClass).toBe(false);
    expect(result.current.isDeletingClass).toBe(false);
  });

  it("setFormData updates form fields", () => {
    const { result } = renderHook(() => useClassForm());
    act(() => {
      result.current.setFormData({ ...result.current.formData, class_template_id: "tpl-1" });
    });
    expect(result.current.formData.class_template_id).toBe("tpl-1");
  });

  it("resetForm resets all fields to initial values", () => {
    const { result } = renderHook(() => useClassForm());
    act(() => {
      result.current.setFormData({
        class_template_id: "tpl-1",
        coach_id: "coach-1",
        date: "2025-06-02",
        start_time: "09:00",
        end_time: "10:00",
        notes: "test",
        capacity: "20",
      });
    });
    act(() => {
      result.current.resetForm();
    });
    expect(result.current.formData).toEqual({
      class_template_id: "",
      coach_id: "",
      date: "",
      start_time: "",
      end_time: "",
      notes: "",
      capacity: "",
    });
  });

  it("toggle editing class state", () => {
    const { result } = renderHook(() => useClassForm());
    act(() => {
      result.current.setIsEditingClass(true);
      result.current.setEditingClassId("cls-1");
    });
    expect(result.current.isEditingClass).toBe(true);
    expect(result.current.editingClassId).toBe("cls-1");
  });

  it("toggle submitting state", () => {
    const { result } = renderHook(() => useClassForm());
    act(() => {
      result.current.setIsSubmittingClass(true);
    });
    expect(result.current.isSubmittingClass).toBe(true);
  });

  it("toggle deleting state", () => {
    const { result } = renderHook(() => useClassForm());
    act(() => {
      result.current.setIsDeletingClass(true);
    });
    expect(result.current.isDeletingClass).toBe(true);
  });

  it("resetForm sets editing back to false and clears editingClassId", () => {
    const { result } = renderHook(() => useClassForm());
    act(() => {
      result.current.setIsEditingClass(true);
      result.current.setEditingClassId("cls-1");
    });
    act(() => {
      result.current.resetForm();
    });
    expect(result.current.formData).toEqual({
      class_template_id: "",
      coach_id: "",
      date: "",
      start_time: "",
      end_time: "",
      notes: "",
      capacity: "",
    });
  });
});
