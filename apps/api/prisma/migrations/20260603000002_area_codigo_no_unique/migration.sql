-- Catalogo P-CAT-Area-codigo (refinement) — `codigo` ya no es UNIQUE.
--
-- El codigo se redefine como TAG VISUAL, no como identificador. Una area
-- mantiene su identidad por `id` (UUID) y `nombre` (UNIQUE), pero el `codigo`
-- (slug de la familia visual: frontend/backend/qa/devops/cloud/data/mobile/
-- soft) puede repetirse entre areas. Ejemplo: "Frontend Web" y "Frontend
-- Mobile" pueden compartir codigo "frontend" y pintar la misma tinta cyan.
--
-- Esto elimina la rigidez "1 area = 1 codigo" y desacopla la presentacion
-- de la taxonomia de areas, que es responsabilidad del admin.

DROP INDEX IF EXISTS "areas_codigo_key";
