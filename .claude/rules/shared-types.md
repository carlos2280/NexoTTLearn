---
description: Reglas para tipos compartidos entre api y web.
paths:
  - "packages/shared-types/**/*.ts"
---

# NexoTTLearn — Tipos compartidos

`@nexott-learn/shared-types` es la frontera de contratos entre `api` y `web`.

## Reglas

1. **Solo tipos**. Ninguna lógica, ninguna dependencia de runtime (sin Prisma client, sin React, sin Nest).
2. **Tipos puros de TS**: `interface`, `type`, `enum` literal con `as const`. Nada de clases.
3. **Sin imports de `@prisma/client`** — los tipos de respuesta del API se definen aquí explícitamente, no se reexportan desde Prisma.
4. **Schemas Zod permitidos** si el contrato debe validarse en ambos lados (`api` parsea entrada, `web` parsea respuesta).
5. **Versionado**: cambios incompatibles requieren coordinación entre api y web. Documentar en el commit.
6. **Build**: el paquete debe poder compilar standalone (`pnpm --filter @nexott-learn/shared-types build`).

## Anti-patrones

- Reexportar `Prisma.User` directamente. Eso fuerza al frontend a depender de Prisma.
- Tipos con generics complejos que solo el backend usa.
- Constantes de configuración (esas viven en cada app).
