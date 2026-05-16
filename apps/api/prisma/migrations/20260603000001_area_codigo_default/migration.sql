-- Catalogo P-CAT-Area-codigo (follow-up) — DEFAULT a nivel BD para `codigo`.
--
-- La whitelist de codigos validos (frontend, backend, cloud, data, mobile,
-- devops, qa, soft) la asegura Zod en `apps/api/src/catalogo/areas/...` para
-- toda creacion/actualizacion via HTTP. El DEFAULT a nivel BD existe
-- exclusivamente para no romper inserts directos en tests e2e que crean areas
-- sintéticas via `prisma.area.create({ data: { nombre, ... } })` sin pasar
-- `codigo`. Esos inserts reciben un UUID truncado de 32 chars (unique).
--
-- En produccion el service nunca cae en este default: AreasService.crear()
-- valida `codigo` contra la whitelist antes de tocar Prisma.

ALTER TABLE "areas"
  ALTER COLUMN "codigo"
  SET DEFAULT substr(replace(gen_random_uuid()::text, '-', ''), 1, 32);
