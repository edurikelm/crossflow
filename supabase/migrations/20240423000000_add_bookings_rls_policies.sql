-- Agregar políticas RLS para bookings

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated insert on bookings"
ON bookings FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated update on bookings"
ON bookings FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated delete on bookings"
ON bookings FOR DELETE
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated read on bookings"
ON bookings FOR SELECT
TO authenticated
USING (true);