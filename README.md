# NexoTT Learn

Plataforma interna de capacitacion de NTT DATA. Web + API en monorepo.

## Stack

| Capa | Tecnologia |
|------|------------|
| **Monorepo** | pnpm workspaces + Turborepo |
| **Web** (`apps/web`) | Vite + React 18 + TypeScript + React Router + TanStack Query + react-hook-form + Zod |
| **API** (`apps/api`) | NestJS 10 + Prisma 6 + PostgreSQL 16 |
| **Auth** | Passport + sesiones HTTP-only en Postgres (`connect-pg-simple`) |
| **UI** | [@carlos2280/nexott-ui](https://github.com/carlos2280/nexott-ui) — design system propio (Web Components Lit + React wrappers + layout primitives) |
| **Tipos compartidos** | `packages/shared-types` (schemas Zod, tipos TS) |
| **Lint/format** | Biome (reglas estrictas — ver `biome.json`) |

> Esta app **no usa Tailwind**. Todo el estilo viene de `@carlos2280/nexott-ui`. Ver [docs/ARQUITECTURA.md](docs/ARQUITECTURA.md#por-que-no-tailwind).

## Quick start

```bash
# 1. Setup completo de cero (instala deps + Postgres en Docker + migra + seed)
make setup

# 2. Levantar todo
make dev
```

Tras eso:

| | URL |
|---|-----|
| Web | http://localhost:5173 (o 5174 si esta ocupado) |
| API | http://localhost:4000/api |
| Postgres | localhost:5434 |

### Credenciales de prueba (seed)

| Email | Password | Rol |
|-------|----------|-----|
| `admin@nexott.local` | `Admin1234!` | ADMIN |
| `participante@nexott.local` | `Participante1234!` | PARTICIPANTE |

## Comandos del dia a dia

Todos via `make`. Ejecuta `make help` para ver la lista completa.

### Mas usados

```bash
make dev            # web + api en paralelo (con kill previo)
make dev-web        # solo frontend
make dev-api        # solo backend
make kill           # detener todos los procesos del proyecto
make status         # que esta corriendo y que puertos estan ocupados
make validate       # typecheck + lint + test (gate de calidad)
```

### Base de datos

```bash
make db-up          # levantar Postgres (Docker)
make db-down        # parar Postgres
make db-migrate     # aplicar migraciones Prisma
make db-seed        # ejecutar seed
make db-studio      # abrir Prisma Studio
make db-reset       # ⚠ destructivo, pide confirmacion
```

### Trabajar con la libreria UI

```bash
make lib-build      # recompilar @carlos2280/nexott-ui (../nexott-ui)
make lib-rebuild    # recompilar + reinstalar (refresca el enlace)
make lib-storybook  # Storybook de la libreria (localhost:6006)
```

### Limpieza

```bash
make clean          # borra node_modules, dist, .turbo
make fresh          # clean + reinstall (sin tocar BD)
```

## Estructura

```
NexoTTLearn/
├── apps/
│   ├── web/                  Vite SPA (React 18)
│   └── api/                  NestJS API
├── packages/
│   └── shared-types/         Schemas Zod + tipos TS (consumido por web y api)
├── docs/
│   ├── DESARROLLO.md         Flujo de desarrollo, libreria local, troubleshooting
│   └── ARQUITECTURA.md       Decisiones tecnicas (stack, ESM/CJS, integracion UI)
├── docker-compose.yml        Postgres local
├── Makefile                  Punto de entrada de comandos
├── biome.json                Lint + format (reglas estrictas)
├── turbo.json                Turborepo
├── pnpm-workspace.yaml       Workspaces
└── tsconfig.base.json        Config TS compartida
```

## Reglas de codigo

- **Idioma**: codigo y commits en espanol (`calcularBrecha`, `obtenerCurso`).
- **TypeScript**: sin `any`, sin `!` (non-null assertion), sin `enum` (usar `as const`). Validar con Zod en boundaries.
- **Sin Tailwind en `apps/web`**. Layout primitives (`Stack`, `Box`, `Grid`) y componentes Lit (`<NxtCard>`, `<NxtButton>`, etc.) cubren todo.
- **Forms con react-hook-form**: usar `NxtInputField` (NO `NxtInput`). Submit con `onNxtButtonClick`, NO `type="submit"`.
- **NestJS**: NUNCA `import type` para `@Injectable()` o cualquier clase que entre por constructor. La DI falla con error confuso (`argument Function at index [0]`).

Detalle completo en [docs/ARQUITECTURA.md](docs/ARQUITECTURA.md).

## Mas informacion

- [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) — GitFlow lite, Conventional Commits en espanol, hooks Husky.
- [docs/DESARROLLO.md](docs/DESARROLLO.md) — flujo de desarrollo, libreria local, debugging, troubleshooting.
- [docs/ARQUITECTURA.md](docs/ARQUITECTURA.md) — decisiones tecnicas y patrones del proyecto.
- [@carlos2280/nexott-ui](https://github.com/carlos2280/nexott-ui) — libreria de UI con su propia documentacion.
