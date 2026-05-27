import { useState, useCallback } from "react";

const INITIAL_FORM = {
  class_template_id: "",
  coach_id: "",
  date: "",
  start_time: "",
  end_time: "",
  notes: "",
  capacity: "",
};

export type ClassFormData = typeof INITIAL_FORM;

export function useClassForm() {
  const [formData, setFormData] = useState<ClassFormData>({ ...INITIAL_FORM });
  const [isEditingClass, setIsEditingClass] = useState(false);
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [isSubmittingClass, setIsSubmittingClass] = useState(false);
  const [isDeletingClass, setIsDeletingClass] = useState(false);

  const resetForm = useCallback(() => {
    setFormData({ ...INITIAL_FORM });
  }, []);

  return {
    formData,
    setFormData,
    isEditingClass,
    setIsEditingClass,
    editingClassId,
    setEditingClassId,
    isSubmittingClass,
    setIsSubmittingClass,
    isDeletingClass,
    setIsDeletingClass,
    resetForm,
  };
}
