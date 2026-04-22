-- Agregar política RLS para INSERT en profiles
CREATE POLICY "Allow authenticated insert on profiles"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (true);

-- Agregar política RLS para SELECT en profiles (necesaria para leer el perfil actual)
CREATE POLICY "Allow authenticated select on profiles"
ON profiles FOR SELECT
TO authenticated
USING (true);