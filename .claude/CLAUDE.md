# NexoTTLearn — Instrucciones del proyecto

Plataforma de e-learning corporativa. Monorepo con backend NestJS + Prisma y frontend React + Vite.

## Stack

| Capa | Tecnología |
|---|---|
| Monorepo | pnpm workspaces + Turborepo |
| Backend | NestJS 11, Prisma 6, PostgreSQL 16, Zod, bcrypt, sesiones server-side (`express-session` + `connect-pg-simple`, NO JWT — ver decisión D83) |
| Frontend | React 18, Vite 5, Tanstack Query, React Router, Zod |
| UI | Componentes propios (no librería externa) |
| Tests | Jest (api) + Vitest + Testing Library (web) |
| Lint/Format | Biome 1.9 |
| Hooks git | Husky + lint-staged + commitlint |
| Releases | release-please |

## Estructura del monorepo

```
NexoTTLearn/
├── apps/
│   ├── api/         ← NestJS + Prisma (puerto 4000)
│   │   ├── src/
│   │   ├── prisma/  ← schema.prisma + migrations + seed.ts
│   │   └── test/
│   └── web/         ← React + Vite (puerto 5173)
│       └── src/
│           ├── app/        ← bootstrap (providers, router)
│           ├── pages/      ← una carpeta por ruta
│           ├── features/   ← lógica de dominio reusable
│           ├── shared/     ← infraestructura genérica
│           └── styles/
├── packages/
│   └── shared-types/  ← tipos compartidos api↔web
├── docker-compose.yml ← Postgres local
├── turbo.json
└── Makefile           ← comandos del día a día
```

## Comandos del día a día (Makefile)

| Comando | Acción |
|---|---|
| `make setup` | Instala + levanta DB + migra + seed (de cero) |
| `make dev` | Levanta web + api en paralelo |
| `make dev-web` | Solo frontend (localhost:5173) |
| `make dev-api` | Solo backend (localhost:4000) |
| `make db-up` / `db-down` | Postgres en Docker |
| `make db-migrate` | `prisma migrate dev` |
| `make db-seed` | Seed (admin@nexott.local / Admin1234!) |
| `make db-studio` | Prisma Studio |
| `make db-reset` | ⚠️ Reset destructivo de la BD |
| `make validate` | typecheck + lint + test (gate de CI) |
| `make kill` | Mata procesos dev colgados |

## Puertos

- 4000 — API NestJS
- 5173 — Web Vite
- 5435 — Postgres (Docker, expuesto en host; container interno 5432)
- 5555 — Prisma Studio (cuando se levanta)

## Convenciones (autoridad y carga automática)

Las convenciones de máxima autoridad viven en `../OLD/CONVENCIONES-ALTA-CALIDAD/`. Las reglas en `.claude/rules/` cargan la convención correspondiente automáticamente según el archivo que abras:

- `apps/api/src/**` → reglas NestJS + SOLID + (si toca auth) seguridad OWASP.
- `apps/api/prisma/**` o `*.service.ts` → reglas Prisma.
- `apps/web/src/**` → reglas React.
- `packages/shared-types/**` → reglas de tipos compartidos.

## Estilo de explicación en el chat

**Toda explicación en el chat debe ser:**
- En español, **simple como para un niño** (sin jerga técnica salvo nombres propios de archivos/comandos).
- **Resumida**: ir al grano, sin párrafos largos.
- **Práctica**: decir qué se hizo y qué hacer ahora, no teoría.
- Usar analogías cotidianas cuando ayuden (ej. "el backend es como el cocinero, el frontend es el mesero").
- Listas cortas mejor que prosa.
- Si algo es complejo, primero la versión simple en 1 frase, luego (solo si hace falta) el detalle.

Esto NO aplica al código ni a los comentarios en archivos — ahí siguen las convenciones técnicas normales.

## Reglas duras del proyecto

1. **Idioma**: respuestas en español. Identificadores de código en inglés salvo dominio ya establecido en español.
2. **Commits**: Conventional Commits en español. **Nunca añadir `Co-Authored-By`**.
3. **Biome**: en hooks/automatización usar `pnpm format` o `biome format --write`. El bug histórico de `className` → `class` (regla `suspicious/noReactSpecificProps`) está neutralizado en `apps/web/**/*.{tsx,jsx}` por override en `biome.json`. Igual se mantiene el `deny` de `biome check --fix` en `.claude/settings.json` y `format --write` (no `check --write`) en `lint-staged` para `.tsx` como defensa en profundidad. Si necesitas correr `biome check --write` puntualmente fuera de `apps/web`, pide permiso.
4. **0 `any` explícito**. `unknown` + Zod para input no confiable.
5. **NestJS DI**: jamás `import type` para inyectables. Jamás `new XService()`.
6. **Prisma**: selects explícitos en datos sensibles, índice en cada FK, P2002/P2025 manejados.
7. **React**: componentes ≤150 líneas, hooks ≤80, sin `React.FC`, Tanstack Query para servidor.
8. **Una página = una carpeta** en `apps/web/src/pages/`.
9. **Auth**: sesiones server-side (cookie `nexott.sid` + store `connect-pg-simple` en tabla `sesiones`). Identidad del usuario SIEMPRE de `req.session` (vía `@CurrentUser`), jamás del body ni de headers. Rutas privadas por defecto, públicas marcadas con `@Public()`. Anti-CSRF doble token (`XSRF-TOKEN` cookie + `X-XSRF-TOKEN` header) con la sesión como fuente de verdad y comparación `timingSafeEqual`. NO se usa JWT ni Passport.
10. **Tests**: añadir/actualizar tests con cada cambio funcional. Usar `nestjs-reviewer` / `react-reviewer` antes de commit en cambios no triviales.

## Antes de un PR

Ejecutar `make validate` y luego invocar la skill `/pre-pr` (heredada del paraguas).

## Blindaje del pipeline (capas de defensa)

Nada con errores debe llegar a `develop` o `main`. Capas activas:

1. **Pre-commit** (husky + lint-staged) → `biome check --write` sobre archivos staged.
2. **Commit-msg** (commitlint) → bloquea commits que no sigan Conventional Commits.
3. **Pre-push** (husky) → corre `make validate` (typecheck + lint + test).
4. **CI** → lint + typecheck + test + workflow `biome-no-relax.yml` que bloquea PRs que bajen severidades en `biome.json`.
5. **CI security** → workflow `security.yml` corre `pnpm audit --audit-level=high --prod` en cada PR/push a `develop`/`main`. Bloquea si hay CVE high/critical en deps de producción. `pnpm.overrides` en el `package.json` raíz fuerza versiones parcheadas de transitivas (lodash, multer, path-to-regexp, tar, @remix-run/router).
6. **Permisos Claude** → deny de `--no-verify`, `HUSKY=0`, `biome check --fix`. Ask para tocar `biome.json`, `.husky/*`, `commitlint.config.js`, `turbo.json`, `tsconfig*.json`, `Makefile`, workflows.

Reglas inviolables documentadas en `../.claude/rules/blindaje.md`. Lectura obligatoria.

**Las reglas de Biome NUNCA se relajan**. Si una bloquea trabajo legítimo, se hace `override` por archivo o `// biome-ignore <regla>: <razón>`, nunca bajando severidad global.

## Gotchas conocidas

- Caches de Vite a veces quedan colgados → `make dev-fresh` o `make vite-cache-clear`.
- Procesos dev huérfanos bloqueando puertos → `make kill` o `make ports`.
- Cambios en `schema.prisma` requieren `make db-migrate` para regenerar el client.

## Skills disponibles (heredadas del paraguas)

`/pre-pr`, `/commit-conv`, `/migracion-segura`, `/nuevo-modulo-nest`, `/nueva-pagina-react`.

## Agentes disponibles (heredados)

`nestjs-reviewer`, `react-reviewer`, `prisma-architect`, `owasp-auditor`, `test-writer`.
