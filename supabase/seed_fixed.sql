-- ============================================
-- CROSSFLOW - Seed Data
-- Ejemplo de datos para pruebas
-- ============================================

-- Insertar planes de membresía de ejemplo
INSERT INTO membership_plans (gym_id, name, description, price, duration_days, classes_per_week, unlimited_classes)
SELECT
  id,
  'Básico',
  '3 clases por semana',
  49.99,
  30,
  3,
  false
FROM gyms LIMIT 1;

INSERT INTO membership_plans (gym_id, name, description, price, duration_days, classes_per_week, unlimited_classes)
SELECT
  id,
  'Premium',
  '8 clases por semana',
  89.99,
  30,
  8,
  false
FROM gyms LIMIT 1;

INSERT INTO membership_plans (gym_id, name, description, price, duration_days, classes_per_week, unlimited_classes)
SELECT
  id,
  'Ilimitado',
  'Clases ilimitadas',
  129.99,
  30,
  NULL,
  true
FROM gyms LIMIT 1;

-- Insertar plantillas de clases de ejemplo
INSERT INTO class_templates (gym_id, name, description, duration_minutes, capacity, level, focus_area, color, sections)
SELECT
  id,
  'WOD General',
  'Entrenamiento del día para todos los niveles',
  60,
  20,
  'all_levels',
  ARRAY['crossfit', 'wod'],
  '#3B82F6',
  '[{"name":"warmup","minutes":10},{"name":"strength","minutes":15},{"name":"wod","minutes":25},{"name":"cooldown","minutes":10}]'::jsonb
FROM gyms LIMIT 1;

INSERT INTO class_templates (gym_id, name, description, duration_minutes, capacity, level, focus_area, color, sections)
SELECT
  id,
  'Strength',
  'Enfoque en fuerza y powerlifting',
  60,
  15,
  'intermediate',
  ARRAY['strength', 'olympic'],
  '#EF4444',
  '[{"name":"warmup","minutes":10},{"name":"strength","minutes":30},{"name":"accessories","minutes":15},{"name":"cooldown","minutes":5}]'::jsonb
FROM gyms LIMIT 1;

INSERT INTO class_templates (gym_id, name, description, duration_minutes, capacity, level, focus_area, color, sections)
SELECT
  id,
  'Open Gym',
  'Uso libre de las instalaciones',
  90,
  10,
  'all_levels',
  ARRAY['free'],
  '#10B981',
  '[{"name":"open","minutes":90}]'::jsonb
FROM gyms LIMIT 1;

INSERT INTO class_templates (gym_id, name, description, duration_minutes, capacity, level, focus_area, color, sections)
SELECT
  id,
  'Gymnastics',
  'Enfoque en habilidades gimnásticas',
  60,
  15,
  'intermediate',
  ARRAY['gymnastics'],
  '#8B5CF6',
  '[{"name":"warmup","minutes":10},{"name":"skills","minutes":25},{"name":"wod","minutes":15},{"name":"cooldown","minutes":10}]'::jsonb
FROM gyms LIMIT 1;

