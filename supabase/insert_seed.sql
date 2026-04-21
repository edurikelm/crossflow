-- Insertar gym
INSERT INTO gyms (id, name, slug, primary_color, accent_color)
VALUES ('00000000-0000-0000-0000-000000000001', 'CrossFit Box', 'crossfit-box', '#3B82F6', '#10B981')
ON CONFLICT (slug) DO NOTHING;

-- Obtener el gym_id
DO $$
DECLARE
    gym_uuid UUID := '00000000-0000-0000-0000-000000000001';
BEGIN
    -- Insertar planes
    INSERT INTO membership_plans (gym_id, name, description, price, duration_days, classes_per_week, unlimited_classes)
    VALUES
        (gym_uuid, 'Básico', '3 clases por semana', 49.99, 30, 3, false),
        (gym_uuid, 'Premium', '8 clases por semana', 89.99, 30, 8, false),
        (gym_uuid, 'Ilimitado', 'Clases ilimitadas', 129.99, 30, NULL, true)
    ON CONFLICT DO NOTHING;

    -- Insertar clases
    INSERT INTO class_templates (gym_id, name, description, duration_minutes, capacity, level, focus_area, color, sections)
    VALUES
        (gym_uuid, 'WOD General', 'Entrenamiento del día', 60, 20, 'all_levels', ARRAY['crossfit'], '#3B82F6', '[{"name":"warmup","minutes":10},{"name":"wod","minutes":20},{"name":"cooldown","minutes":10}]'),
        (gym_uuid, 'Strength', 'Fuerza y powerlifting', 60, 15, 'intermediate', ARRAY['strength'], '#EF4444', '[{"name":"warmup","minutes":10},{"name":"strength","minutes":30},{"name":"cooldown","minutes":10}]'),
        (gym_uuid, 'Open Gym', 'Uso libre', 90, 10, 'all_levels', ARRAY['free'], '#10B981', '[{"name":"open","minutes":90}]')
    ON CONFLICT DO NOTHING;
END $$;

-- Verificar
SELECT 'Gyms:' as info, COUNT(*) as count FROM gyms
UNION ALL
SELECT 'Plans:', COUNT(*) FROM membership_plans
UNION ALL
SELECT 'Classes:', COUNT(*) FROM class_templates;
