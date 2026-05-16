---
description: Reglas NestJS específicas de NexoTTLearn (apps/api). Complementa las reglas del paraguas con detalles del proyecto.
paths:
  - "apps/api/src/**/*.ts"
---

# NexoTTLearn — Reglas NestJS

## Convenciones canónicas (autoridad)

Heredadas del paraguas: ver `../../.claude/rules/nestjs-api.md` y los documentos en `../../OLD/CONVENCIONES-ALTA-CALIDAD/NESTJS-PRISMA-TYPESCRIPT/`.

## Específicas del proyecto

- **Paquete**: `@nexott-learn/api`. Filtro pnpm: `pnpm --filter @nexott-learn/api <cmd>`.
- **Puerto dev**: 4000. Prefijo global: `/api/v1`.
- **Auth**: sesiones server-side con `express-session` + `connect-pg-simple` (tabla `sesiones`), cookie `nexott.sid` httpOnly + sameSite lax + `secure` en prod. CSRF doble token (cookie `XSRF-TOKEN` + header `X-XSRF-TOKEN`) con `req.session.csrfToken` como fuente de verdad y comparación `timingSafeEqual`. Bcrypt factor 12. **NO se usa JWT ni Passport** (decisión D83).
- **Validación**: Zod en cada endpoint con `@Body` vía `ZodValidationPipe`.
- **Filtros globales**: `PrismaExceptionFilter` en `main.ts`.
- **Logger**: `Logger` de Nest (no `console.log`).
- **Comandos**:
  - Typecheck: `pnpm --filter @nexott-learn/api typecheck`
  - Tests: `pnpm --filter @nexott-learn/api test`
  - Dev: `make dev-api` o `pnpm dev:api`

## Estructura esperada de un módulo

```
apps/api/src/<dominio>/
├── dto/
├── <dominio>.controller.ts
├── <dominio>.service.ts
├── <dominio>.module.ts
├── <dominio>.types.ts
└── <dominio>.service.spec.ts
```

Para crear uno: skill `/nuevo-modulo-nest <nombre>`.

## Antes de cualquier PR que toque api/

1. `make validate` (= typecheck + lint + test).
2. Invocar agente `nestjs-reviewer`.
3. Si toca auth/datos sensibles: invocar también `owasp-auditor`.
