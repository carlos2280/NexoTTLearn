# Configuracion del repositorio en GitHub

Esta guia documenta la configuracion que debe activarse **manualmente** en GitHub UI. No se puede commitear (es config del servidor de GitHub).

> **Importante**: completa todos los pasos antes del primer merge a `main`. Sin esto, los deploys a produccion son inseguros.

---

## 1. Branch protection rules

### `main` (Settings → Branches → Add rule → `main`)

- ✅ **Require a pull request before merging**
  - ✅ Require approvals: **1** (mientras seas solo, autoaprobacion via review propio)
  - ✅ Dismiss stale pull request approvals when new commits are pushed
  - ✅ Require review from Code Owners
- ✅ **Require status checks to pass before merging**
  - ✅ Require branches to be up to date before merging
  - Required checks (anadir despues del primer CI run):
    - `Lint (Biome)`
    - `Typecheck (tsc)`
    - `Test (vitest + postgres)`
    - `Build (turbo)`
    - `Commitlint (PR title + commits)`
- ✅ **Require linear history** (sin merges sucios)
- ✅ **Do not allow bypassing the above settings**
- ❌ Allow force pushes (NO)
- ❌ Allow deletions (NO)

### `develop` (mismo Settings → Branches → Add rule → `develop`)

Mismo set que `main`, EXCEPTO:
- Require approvals: **0** (puedes mergear features tu mismo).
- Sigue requiriendo CI verde y commitlint.

---

## 2. GitHub Environments (para production approvals)

GitHub permite condicionar workflows a un environment con required reviewers.
Esto blinda el deploy a produccion: aunque alguien mergee a `main`, si quieres
tener un paso humano de aprobacion antes de deploy, lo logras aqui.

> **Nota**: actualmente los deploys son automaticos via Railway watching `main`.
> Si quieres aprobacion manual, necesitas usar GitHub Actions para disparar
> Railway via API (no cubierto en este MVP). El environment de abajo se usa
> para el smoke test y para futuro.

### Crear environments

`Settings → Environments → New environment`

#### `staging`
- ✅ Deployment branches: **Selected branches** → `develop`.
- ⚠️ Sin required reviewers (deploy automatico OK).
- Variables (no secretos):
  - `STAGING_WEB_URL`: `https://web-staging.up.railway.app` (ajustar al dominio real).
  - `STAGING_API_URL`: `https://api-staging.up.railway.app` (ajustar al dominio real).

#### `production`
- ✅ Deployment branches: **Selected branches** → `main`.
- ✅ **Required reviewers**: **1** (tu mismo).
- ✅ Wait timer: **0 min** (no aplica para smoke test).
- Variables (no secretos):
  - `PRODUCTION_WEB_URL`: `https://web-prod.up.railway.app`.
  - `PRODUCTION_API_URL`: `https://api-prod.up.railway.app`.

### Variables Repository-level (alternativa)

Si prefieres no usar Environments, puedes setear las URLs como Repository Variables (`Settings → Secrets and variables → Actions → Variables tab`). Los workflows ya las leen como `vars.STAGING_WEB_URL`, etc.

---

## 3. Secretos

`Settings → Secrets and variables → Actions → Secrets tab`

| Secret | Valor | Uso |
|--------|-------|-----|
| `NODE_AUTH_TOKEN` | PAT GitHub con `read:packages` | Para `pnpm install` en CI (instala `@carlos2280/nexott-ui` desde GitHub Packages) |

> **Sin esto** el CI falla con `401 Unauthorized` al instalar `nexott-ui`.

---

## 4. CODEOWNERS

Ya existe `.github/CODEOWNERS` en el repo. Esto activa "Require review from Code Owners" en branch protection.

Cuando entren mas devs al equipo, editar el archivo para asignar owners por carpeta.

---

## 5. Default branch

`Settings → General → Default branch`

- **Cambiar a `develop`**: la mayoria del trabajo va a `develop`. Tener `develop` como default hace que `git clone` y los PRs se abran contra ahi por defecto.
- `main` solo recibe merges desde `develop` para releases.

---

## 6. Otros ajustes recomendados

### Pull requests (`Settings → General → Pull Requests`)

- ✅ Allow squash merging (default para feature → develop).
- ✅ Allow merge commits (para develop → main, preserva commits convencionales para release-please).
- ❌ Allow rebase merging (mantenerlo simple).
- ✅ Always suggest updating pull request branches.
- ✅ Automatically delete head branches.

### Issues

- ✅ Habilitar Issues (los smoke tests crean issues automaticos en fallos).

---

## 7. Checklist de completitud

Cuando termines la configuracion, verifica:

- [ ] Branch protection en `main` con todos los checks requeridos.
- [ ] Branch protection en `develop`.
- [ ] Environment `staging` creado, deployment branch = `develop`.
- [ ] Environment `production` creado, deployment branch = `main`, required reviewer activado.
- [ ] Variables `STAGING_WEB_URL`, `STAGING_API_URL`, `PRODUCTION_WEB_URL`, `PRODUCTION_API_URL` configuradas.
- [ ] Secret `NODE_AUTH_TOKEN` configurado.
- [ ] Default branch cambiado a `develop`.
- [ ] CODEOWNERS revisado.
- [ ] Pull request settings ajustados (squash + merge commits, sin rebase).
- [ ] Issues habilitados.
- [ ] Primer push a `develop` triggereo CI verde.
- [ ] Primer smoke test contra Railway pasa.

---

## 8. Cuando entren mas devs

Cuando el equipo crezca:

1. Aumentar required approvals en `main` a 2 (y en `develop` a 1).
2. Editar CODEOWNERS para distribuir responsabilidades.
3. Crear teams en GitHub Org y asignar permisos por team.
4. Considerar `auto-merge` en PRs aprobados.
5. Considerar GitHub Actions reusables para reducir duplicacion en `ci.yml`.
