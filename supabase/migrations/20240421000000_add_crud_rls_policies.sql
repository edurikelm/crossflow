-- Agregar políticas RLS para CRUD en todas las tablas

-- class_templates: permite INSERT, UPDATE, DELETE a usuarios autenticados
CREATE POLICY "Allow authenticated insert on class_templates"
ON class_templates FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated update on class_templates"
ON class_templates FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated delete on class_templates"
ON class_templates FOR DELETE
TO authenticated
USING (true);

-- coaches: permite INSERT, UPDATE, DELETE
CREATE POLICY "Allow authenticated insert on coaches"
ON coaches FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated update on coaches"
ON coaches FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated delete on coaches"
ON coaches FOR DELETE
TO authenticated
USING (true);

-- athletes: permite INSERT, UPDATE, DELETE
CREATE POLICY "Allow authenticated insert on athletes"
ON athletes FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated update on athletes"
ON athletes FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated delete on athletes"
ON athletes FOR DELETE
TO authenticated
USING (true);

-- membership_plans: permite INSERT, UPDATE, DELETE
CREATE POLICY "Allow authenticated insert on membership_plans"
ON membership_plans FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated update on membership_plans"
ON membership_plans FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated delete on membership_plans"
ON membership_plans FOR DELETE
TO authenticated
USING (true);

-- scheduled_classes: permite INSERT, UPDATE, DELETE
CREATE POLICY "Allow authenticated insert on scheduled_classes"
ON scheduled_classes FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated update on scheduled_classes"
ON scheduled_classes FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated delete on scheduled_classes"
ON scheduled_classes FOR DELETE
TO authenticated
USING (true);

-- tickets: permite INSERT, UPDATE, DELETE
CREATE POLICY "Allow authenticated insert on tickets"
ON tickets FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated update on tickets"
ON tickets FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated delete on tickets"
ON tickets FOR DELETE
TO authenticated
USING (true);

-- notifications: permite INSERT, UPDATE, DELETE
CREATE POLICY "Allow authenticated insert on notifications"
ON notifications FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated update on notifications"
ON notifications FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated delete on notifications"
ON notifications FOR DELETE
TO authenticated
USING (true);
