-- Catalogo P-CAT-Area-codigo — slug estable de Area (decision D-CAT-AREA-1)
--
-- Añade columna `codigo` (slug lowercase, max 32 chars, UNIQUE) a `areas`.
-- Este codigo es la clave de la identidad visual: las cards y skill-chips del
-- producto pintan tinta de area resolviendo `--color-area-<codigo>` en CSS.
-- Desacopla la presentacion del `nombre` (libre para que admin renombre).
--
-- Whitelist de codigos validos a nivel aplicacion (Zod): frontend, backend,
-- cloud, data, mobile, devops, qa, soft. La columna queda como VARCHAR(32)
-- para permitir expansion futura sin migration.
--
-- Estrategia: expand atomico (no expand/contract) porque:
--  - El producto aun no esta en produccion (entornos dev/seed).
--  - Las areas reales del seed AMSA son 4 conocidas, mapeables por nombre.
--  - Fallback `lower(split_part(nombre, ' ', 1))` cubre cualquier otra fila
--    huerfana que pueda existir en BDs locales heterogeneas.

-- 1) Añadir columna NULLABLE para poder backfillear.
ALTER TABLE "areas" ADD COLUMN "codigo" VARCHAR(32);

-- 2) Backfill por mapping conocido del seed canonical y AMSA + fallback.
UPDATE "areas" SET "codigo" = CASE
  WHEN "nombre" = 'Frontend Web'      THEN 'frontend'
  WHEN "nombre" = 'Frontend'          THEN 'frontend'
  WHEN "nombre" = 'Backend Python'    THEN 'backend'
  WHEN "nombre" = 'Backend'           THEN 'backend'
  WHEN "nombre" = 'Calidad y Testing' THEN 'qa'
  WHEN "nombre" = 'QA'                THEN 'qa'
  WHEN "nombre" = 'QA / Testing'      THEN 'qa'
  WHEN "nombre" = 'DevOps Azure'      THEN 'devops'
  WHEN "nombre" = 'DevOps'            THEN 'devops'
  WHEN "nombre" = 'Cloud'             THEN 'cloud'
  WHEN "nombre" = 'Data'              THEN 'data'
  WHEN "nombre" = 'Mobile'            THEN 'mobile'
  WHEN "nombre" = 'Soft Skills'       THEN 'soft'
  WHEN "nombre" = 'Soft'              THEN 'soft'
  ELSE LOWER(REGEXP_REPLACE(SPLIT_PART("nombre", ' ', 1), '[^a-zA-Z0-9]', '', 'g'))
END
WHERE "codigo" IS NULL;

-- 3) Garantizar que no quedan nulos antes de set not null + unique.
--    Si el fallback colisiona, se sufija con id corto para no romper unique.
UPDATE "areas" a
SET "codigo" = a."codigo" || '-' || SUBSTRING(a."id"::text, 1, 4)
WHERE a."codigo" IN (
  SELECT "codigo" FROM "areas" GROUP BY "codigo" HAVING COUNT(*) > 1
)
AND a."id" NOT IN (
  SELECT DISTINCT ON ("codigo") "id" FROM "areas" ORDER BY "codigo", "created_at"
);

-- 4) Set NOT NULL + UNIQUE (Prisma usa indice nombrado).
ALTER TABLE "areas" ALTER COLUMN "codigo" SET NOT NULL;
CREATE UNIQUE INDEX "areas_codigo_key" ON "areas" ("codigo");
