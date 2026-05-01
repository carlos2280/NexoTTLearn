# Deployment — NexoTT Learn (Railway)

Guia completa para desplegar staging y produccion en Railway.

> **Modelo**: `develop` → staging (auto-deploy), `main` → production (auto-deploy con aprobacion).
> **Importante**: cada environment tiene su propia BD Postgres. NUNCA compartir BD entre ambientes.

---

## 1. Arquitectura de despliegue

```
┌──────────────────── PROYECTO Railway: nexott-learn ────────────────────┐
│                                                                          │
│  ┌─────────────────────── ENV: production ───────────────────────────┐  │
│  │                                                                    │  │
│  │   web-prod ──────► api-prod ──────► postgres-prod                  │  │
│  │   (Vite SPA)       (NestJS)         (BD aislada)                   │  │
│  │   sigue main       sigue main       no se conecta a repo          │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  ┌─────────────────────── ENV: staging ──────────────────────────────┐  │
│  │                                                                    │  │
│  │   web-staging ───► api-staging ───► postgres-staging              │  │
│  │   sigue develop    sigue develop    no se conecta a repo          │  │
│  └────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────┘
```

**Decisiones clave**:
- 1 proyecto Railway, 2 environments (staging + production).
- 3 servicios por environment: `web`, `api`, `postgres`.
- Postgres como plugin de Railway (no servicio del repo).
- Cada environment tiene **sus propias env vars** y **su propio dominio**.

---

## 2. Setup inicial (una sola vez)

### 2.1. Crear proyecto Railway

1. Entrar a [railway.app](https://railway.app/dashboard).
2. **New Project** → **Empty Project** → nombrar `nexott-learn`.
3. El proyecto viene con un environment `production` por defecto.
4. **Settings → Environments → New Environment** → `staging` (duplicar de production no, partir vacio).

### 2.2. Conectar a GitHub

1. **Settings → Integrations → GitHub** → autorizar `carlos2280/NexoTTLearn`.
2. Confirmar que tienes acceso al repo.

### 2.3. Crear el secreto `NODE_AUTH_TOKEN` (para GitHub Packages)

`@carlos2280/nexott-ui` se publica en GitHub Packages. Railway necesita autenticarse para instalarlo.

1. En GitHub: **Settings (personal) → Developer settings → Personal access tokens (classic) → Generate new token**.
2. Scope minimo: `read:packages`. Sin expiracion (o renovacion calendarizada).
3. Copiar el token.
4. En Railway: pegarlo como variable `NODE_AUTH_TOKEN` en **ambos environments** (staging + production), en **ambos servicios web y api** (o en environment-level si Railway lo permite).

> **Sin esto**: el build de Railway falla con `401 Unauthorized` al instalar `nexott-ui`.

### 2.4. Crear servicios por environment

**Repetir esto en `production` y luego en `staging`**:

#### Servicio Postgres
1. **+ New Service → Database → PostgreSQL**.
2. Nombre: `postgres-prod` (o `postgres-staging`).
3. Railway expone `DATABASE_URL` automaticamente como variable de referencia.

#### Servicio API
1. **+ New Service → GitHub Repo → carlos2280/NexoTTLearn**.
2. Nombre: `api-prod` (o `api-staging`).
3. **Settings → Source**:
   - Branch: `main` (o `develop` para staging).
   - **Root Directory**: `.` (raiz, NO `apps/api`).
   - **Config Path**: `apps/api/railway.toml` (Railway leera este archivo).
4. **Settings → Networking**: generar dominio publico (ej. `api-prod.up.railway.app`).
5. **Variables**: ver tabla en seccion 3.

#### Servicio Web
1. **+ New Service → GitHub Repo → carlos2280/NexoTTLearn**.
2. Nombre: `web-prod` (o `web-staging`).
3. **Settings → Source**:
   - Branch: `main` (o `develop`).
   - **Root Directory**: `.`.
   - **Config Path**: `apps/web/railway.toml`.
4. **Settings → Networking**: generar dominio publico.
5. **Variables**: ver tabla en seccion 3.

---

## 3. Variables de entorno por servicio

### `api` (NestJS)

| Variable | Staging | Production | Notas |
|----------|---------|------------|-------|
| `NODE_ENV` | `staging` | `production` | Activa cookies `secure` + `sameSite: none` cuando es `production` |
| `PORT` | (auto) | (auto) | Railway la inyecta. NO setear manual. |
| `DATABASE_URL` | `${{ postgres-staging.DATABASE_URL }}` | `${{ postgres-prod.DATABASE_URL }}` | Variable de referencia Railway |
| `SESSION_SECRET` | (generar 32+ chars) | (generar 32+ chars) | `openssl rand -hex 32`. **DISTINTO** entre envs |
| `WEB_ORIGIN` | `https://web-staging.up.railway.app` | `https://web-prod.up.railway.app` | URL publica del web. Para multiples separar por coma. |
| `NODE_AUTH_TOKEN` | (PAT GitHub) | (PAT GitHub) | Para instalar `@carlos2280/nexott-ui` |

### `web` (Vite SPA)

| Variable | Staging | Production | Notas |
|----------|---------|------------|-------|
| `NODE_ENV` | `staging` | `production` | |
| `PORT` | (auto) | (auto) | Railway la inyecta |
| `VITE_API_URL` | `https://api-staging.up.railway.app` | `https://api-prod.up.railway.app` | URL absoluta de la API. Vite la inlinea en build-time |
| `NODE_AUTH_TOKEN` | (PAT GitHub) | (PAT GitHub) | Para instalar `@carlos2280/nexott-ui` |

### `postgres`

Railway expone `DATABASE_URL`, `PGHOST`, `PGPORT`, etc. automaticamente. Usar la variable de referencia `${{ postgres-X.DATABASE_URL }}` desde la api.

---

## 4. Flujo de desarrollo → despliegue

```
LOCAL                           STAGING                   PRODUCTION
─────                           ───────                   ──────────

feature/* ─→ PR a develop ─→ merge develop ─→ deploy auto Railway
                                              ↓
                                       smoke test pasa
                                              ↓
                                       PR develop → main
                                              ↓
                                       review + approve (GitHub)
                                              ↓
                                       merge main ─→ deploy auto Railway
                                              ↓
                                       smoke test pasa
                                              ↓
                                       release-please tag (v0.X.Y)
```

**Reglas**:
- Nunca commit directo a `main` ni `develop`. Solo via PR.
- `develop` deploya automatico a staging al hacer merge.
- `main` deploya automatico a production al hacer merge **(requiere aprobacion en GitHub Environments)**.
- Si staging falla, **el bug se queda en staging**. Nunca subir a main si staging esta roto.

---

## 5. Healthchecks

| Servicio | Endpoint | Verifica |
|----------|----------|----------|
| `api` | `/api/health` | App + BD (query SELECT 1) |
| `web` | `/healthz` | Servidor Express respondiendo |

Railway llama estos endpoints durante el deploy. Si fallan en 30s, marca el deploy como caido y mantiene el deploy anterior.

---

## 6. Migraciones Prisma

El `startCommand` de la api (en `apps/api/railway.toml`) ya incluye:

```
pnpm prisma migrate deploy && node dist/main.js
```

Esto aplica migraciones pendientes ANTES de arrancar. Si una migracion falla, la app no inicia y Railway hace rollback al deploy anterior.

**Para crear migraciones nuevas**: solo en local con `make db-migrate`. Comitear el archivo SQL generado en `apps/api/prisma/migrations/`. En el siguiente deploy, Railway las aplica.

---

## 7. Rollback de produccion

Si un deploy a `main` rompio prod:

### Via Railway UI (mas rapido)
1. **Services → api-prod → Deployments**.
2. Click en un deploy verde anterior → **Redeploy**.
3. Hacer lo mismo en `web-prod`.

### Via Git (mas limpio)
1. `git revert <commit-hash>` en `main`.
2. PR + merge → trigger deploy automatico.

> **Importante**: si el rollback implica revertir migraciones BD, **PARAR**. Las migraciones Prisma no son reversibles automaticamente. Contactar (en este caso, planificar manualmente).

---

## 8. Logs y observabilidad

Railway tiene logs en tiempo real por servicio:
- **Services → [servicio] → Deployments → View Logs**.
- Filtros por nivel (error, warn, info).

Para algo mas avanzado (post-MVP):
- Datadog / Sentry / Logtail conectado a Railway.
- Metricas custom via `/api/metrics` con Prometheus.

---

## 9. Costos esperados (orientativo)

Railway con plan Hobby ($5/mes incluye $5 credit):
- Postgres × 2 envs: ~$5/mes total.
- Web + API × 2 envs (4 servicios): ~$5-15/mes segun uso.

Total estimado: **$10-25/mes** para staging + production con uso bajo.

Si es para una empresa, el plan Pro ($20/mes flat) o usage-based segun volumen.

---

## 10. Troubleshooting

### Build falla con `401 Unauthorized` al instalar `@carlos2280/nexott-ui`
Falta `NODE_AUTH_TOKEN`. Regenerar PAT en GitHub Settings y setearlo en Railway.

### API arranca pero `/api/health` retorna `database: "error"`
1. Verificar que `DATABASE_URL` apunta al postgres del MISMO environment.
2. Verificar que las migraciones se aplicaron (revisar logs del startCommand).
3. Verificar que el servicio postgres esta corriendo (Railway lo apaga si no hay tier).

### Login funciona pero el usuario se desloguea inmediatamente
Cookie no esta llegando. Posibles causas:
1. `WEB_ORIGIN` en api no incluye el dominio del web → CORS bloquea.
2. `NODE_ENV=production` pero `secure: true` falla porque no hay `trust proxy` (ya esta en main.ts:30).
3. Web y API en dominios completamente distintos sin `sameSite: "none"` (ya esta en main.ts:69).

### `make validate` pasa local pero CI falla
1. Lockfile desactualizado: `pnpm install` y commitear `pnpm-lock.yaml`.
2. Variable de entorno usada en build pero no en CI: anadirla a `.github/workflows/ci.yml`.

### Vite build falla con "Cannot find module @nexott-learn/shared-types"
`packages/shared-types` necesita estar buildado antes que `apps/web`. Turbo lo gestiona con `dependsOn: ["^build"]` en `turbo.json`. Si falla, verificar que el `buildCommand` use `pnpm turbo build --filter=...`.

### Cookies no persisten entre web y api en staging/prod
Verificar:
1. `sameSite: "none"` en api (ya esta).
2. `secure: true` en api (ya esta cuando NODE_ENV=production).
3. `credentials: "include"` en cliente web (ya esta en `lib/api.ts`).
4. CORS de api lista el dominio exacto del web (con `https://`, sin trailing slash).

---

## 11. Checklist pre-primer-deploy

- [ ] Proyecto Railway creado, environments `staging` y `production` existen.
- [ ] `NODE_AUTH_TOKEN` (PAT GitHub con `read:packages`) configurado en ambos envs.
- [ ] Postgres creado en cada env, `DATABASE_URL` accesible como variable de referencia.
- [ ] `SESSION_SECRET` generado (`openssl rand -hex 32`) **distinto** para cada env.
- [ ] `WEB_ORIGIN` apunta al dominio publico correcto del web.
- [ ] `VITE_API_URL` apunta al dominio publico correcto de la api.
- [ ] Servicio `api` apunta a la branch correcta (`develop` o `main`) con `apps/api/railway.toml`.
- [ ] Servicio `web` apunta a la branch correcta con `apps/web/railway.toml`.
- [ ] Healthchecks responden 200 desde el navegador (`/api/health` y `/healthz`).
- [ ] Smoke test manual: login con seed user funciona en staging.
- [ ] GitHub Environments configurados con required reviewers para `production` (ver `.github/REPO-SETTINGS.md`).

---

## 12. Referencias

- [Railway Docs — Monorepos](https://docs.railway.com/guides/monorepo)
- [Railway Docs — Variables](https://docs.railway.com/guides/variables)
- [Railway Docs — Healthchecks](https://docs.railway.com/reference/healthchecks)
- [pnpm + Railway](https://docs.railway.com/guides/pnpm)
