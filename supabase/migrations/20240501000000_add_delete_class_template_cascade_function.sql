-- Atomic cascade delete for class templates
-- Deletes attendance → scheduled_classes → class_template in a single transaction
CREATE OR REPLACE FUNCTION delete_class_template_cascade(p_class_template_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete attendance records for scheduled classes of this template
  DELETE FROM attendance
  WHERE scheduled_class_id IN (
    SELECT id FROM scheduled_classes WHERE class_template_id = p_class_template_id
  );

  -- Delete scheduled classes of this template
  DELETE FROM scheduled_classes WHERE class_template_id = p_class_template_id;

  -- Delete the class template
  DELETE FROM class_templates WHERE id = p_class_template_id;
END;
$$;