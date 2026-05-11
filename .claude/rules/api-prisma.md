---
description: Reglas Prisma específicas de NexoTTLearn.
paths:
  - "apps/api/prisma/**"
  - "apps/api/src/**/*.service.ts"
---

# NexoTTLearn — Reglas Prisma

## Convenciones canónicas

Heredadas del paraguas: ver `../../.claude/rules/prisma-schema.md`.

## Específicas del proyecto

- **BD**: PostgreSQL 16 en Docker (`make db-up`).
- **Schema**: `apps/api/prisma/schema.prisma`.
- **Migrations**: `apps/api/prisma/migrations/`.
- **Seed**: `apps/api/prisma/seed.ts` (admin@nexott.local / Admin1234!).
- **Comandos**:
  - Migrar (dev): `make db-migrate`
  - Seed: `make db-seed`
  - Studio: `make db-studio`
  - Reset destructivo: `make db-reset` (CONFIRMAR antes con el usuario).

## Reglas de schema obligatorias

1. Todo modelo: `id String @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid`,
   `createdAt`, `updatedAt @updatedAt`.

   Nota: NexoTTLearn usa `gen_random_uuid()` + `@db.Uuid` (no `cuid()`)
   por coherencia con el modelo físico existente desde la migración
   inicial. La regla `cuid()` del paraguas sigue válida para
   proyectos nuevos; este proyecto la sobreescribe.
2. `@map`/`@@map` en TODOS los campos y modelos (snake_case en BD).
3. Índice en TODA FK: `@@index([campoId])`.
4. `onDelete` explícito en cada relación.
5. Enums Prisma para roles, estados y otros conjuntos cerrados.

## Antes de cambios destructivos

Si el cambio afecta datos en producción, NO hacer `prisma migrate dev` directo. Usar skill `/migracion-segura` (plan expand/contract).

## Antes de PR que toque schema/migrations

1. `make db-migrate` localmente y verificar que pasa.
2. Invocar agente `prisma-architect` para revisión.
3. Verificar que el código del service usa selects explícitos para los campos nuevos.
