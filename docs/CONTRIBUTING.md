# Guia de contribucion — NexoTT Learn

Este proyecto sigue **GitFlow lite** + **Conventional Commits** + hooks automatizados con **Husky**. Lee este documento antes de tu primer commit.

---

## TL;DR (cheat sheet)

```bash
# 1. Crear feature
git checkout develop
git pull
git checkout -b feature/nombre-descriptivo

# 2. Trabajar y commitear (los hooks corren solos)
git add .
git commit -m "feat(auth): agregar pantalla de login"

# 3. Push (corre make validate antes)
git push -u origin feature/nombre-descriptivo

# 4. Abrir PR a develop en GitHub
```

---

## 1. Modelo de ramas — GitFlow lite

```
main          ← solo releases estables, tags semver, lo que va a produccion
  ↑ PR (squash) cuando develop esta listo para release
develop       ← integracion continua, siempre debe compilar y pasar validate
  ↑ PR desde feature/fix
feature/*     ← cada slice vertical (login, vista curso, etc.)
fix/*         ← bugs encontrados en develop
hotfix/*      ← bugs urgentes contra main (raro)
chore/*       ← config, deps, sin cambio de comportamiento
```

### Reglas duras

- **Nunca** se commitea directo a `main` ni a `develop`. Solo via PR.
- `main` siempre debe ser deployable.
- `develop` siempre debe pasar `make validate`.
- Una feature = una rama = un PR = una unidad mergeable.
- Branches viven poco: si una `feature/*` lleva mas de 1 semana abierta, partela.

### Convencion de nombres

```
feature/auth-login                # nueva feature
feature/cursos-listar-admin       # otra feature
fix/cursos-calculo-nota-vacio     # bug fix
hotfix/login-bloqueo-sesion       # urgente contra main
chore/deps-actualizar-prisma      # mantenimiento
docs/contributing                 # solo docs (puede ir tambien como chore)
```

Usa kebab-case y nombres descriptivos en espanol.

---

## 2. Conventional Commits (en espanol)

### Formato

```
<tipo>(<scope>): <descripcion en imperativo, minusculas>

[cuerpo opcional explicando el por que]

[footer opcional con breaking changes o refs a issues]
```

### Tipos permitidos

| Tipo | Cuando usarlo | Ejemplo |
|------|---------------|---------|
| `feat` | Nueva funcionalidad visible al usuario | `feat(catalogo): agregar filtro por nivel` |
| `fix` | Correccion de bug | `fix(evaluacion): corregir division por cero sin entregas` |
| `docs` | Solo documentacion | `docs(arquitectura): explicar conditional exports` |
| `style` | Formato (no afecta logica) | `style: aplicar biome a apps/web` |
| `refactor` | Refactor sin cambio funcional | `refactor(cursos): extraer hook useCurso` |
| `perf` | Mejora de rendimiento | `perf(seguimiento): memoizar calculo de matriz` |
| `test` | Tests nuevos o ajustes | `test(evaluacion): cubrir formula de pesos 2 niveles` |
| `build` | Build system, deps externas | `build(deps): subir vite a 5.4.11` |
| `ci` | CI/CD | `ci: agregar workflow de release-please` |
| `chore` | Mantenimiento, deps internas | `chore(workflow): configurar husky` |
| `revert` | Revertir commit anterior | `revert: feat(catalogo): agregar filtro por nivel` |

### Scopes permitidos

Definidos en `commitlint.config.js`. Usa el que mejor describa el cambio:

**Areas funcionales** (alineadas con MVP):
`auth`, `bandeja`, `cursos`, `modulos`, `secciones`, `contenidos`, `catalogo`, `convocatorias`, `inscripciones`, `diagnostico`, `seguimiento`, `evaluacion`, `entregas`, `proyectos`, `entrevistas`, `personas`, `areas`, `valoraciones`, `notificaciones`, `ide`, `perfil`.

**Capas tecnicas**:
`web`, `api`, `db`, `shared-types`, `ui`.

**Infra / config**:
`deps`, `config`, `docker`, `scripts`, `workflow`, `hooks`, `release`.

### Reglas de formato

- **Idioma**: descripcion en espanol, imperativo, minusculas, sin punto final.
- **Longitud**: header (`<tipo>(<scope>): <desc>`) max 120 chars.
- **Lineas del cuerpo**: max 120 chars.
- Si el commit cambia API publica, marca con `!` o `BREAKING CHANGE:` en footer:

```
feat(api)!: cambiar formato de respuesta de /cursos

BREAKING CHANGE: el endpoint /cursos ahora devuelve { items, total }
en vez de Array<Curso>. Afecta a apps/web/src/hooks/useCursos.ts.
```

### Ejemplos buenos

```
feat(auth): agregar pantalla de login con validacion Zod
feat(cursos): permitir clonado de modulos entre cursos
fix(evaluacion): corregir nota proyectada cuando modulo no tiene evaluables
docs(arquitectura): documentar trampa de import type en NestJS DI
chore(deps): actualizar Prisma a 6.1.0
ci(workflow): agregar release-please para CHANGELOG automatico
refactor(seguimiento): extraer matriz de brechas a componente reutilizable
test(evaluacion): cubrir formula de pesos 2 niveles
```

### Ejemplos malos

```
❌ "Cambios"                              → vacio, sin tipo ni scope
❌ "feat: cosas"                          → falta scope, descripcion vaga
❌ "FIX(Auth): agregar login."            → mayusculas, punto final
❌ "feat(auth): Added login page."        → ingles, pasado, mayuscula
❌ "feat(authentication): ..."            → scope no esta en el enum
```

---

## 3. Hooks automaticos (Husky)

Al instalar (`pnpm install`) se activan 3 hooks:

| Hook | Cuando | Que hace | Tiempo |
|------|--------|----------|--------|
| `pre-commit` | Al `git commit` | `lint-staged` corre Biome solo sobre archivos staged (auto-fix) | ~1-3s |
| `commit-msg` | Al `git commit` | `commitlint` valida el mensaje contra Conventional Commits | <1s |
| `pre-push` | Al `git push` | `make validate` (typecheck + lint + test en los 3 paquetes) | ~10-30s |

### Si un hook falla

- **`pre-commit` falla**: Biome encontro errores no auto-fixables. Revisa el output, corrige, vuelve a commitear.
- **`commit-msg` falla**: tu mensaje no cumple Conventional Commits. Vuelve a commitear con formato correcto (no se pierde nada, el commit no llego a crearse).
- **`pre-push` falla**: hay errores de tipo, lint o tests. **Arregla antes de pushear**. No uses `--no-verify` salvo emergencia documentada.

### Saltar hooks (uso excepcional)

```bash
git commit --no-verify -m "..."   # salta pre-commit y commit-msg
git push --no-verify              # salta pre-push
```

**Solo en emergencias** y con justificacion en el PR. El abuso de `--no-verify` derrota todo el sistema.

---

## 4. Flujo completo de una feature

### Paso 1 — Crear rama desde develop actualizado

```bash
git checkout develop
git pull origin develop
git checkout -b feature/auth-login
```

### Paso 2 — Trabajar en commits pequenos y semanticos

Mejor 5 commits pequenos que 1 commit gigante. Cada uno debe poder leerse solo:

```bash
git add apps/web/src/pages/auth/LoginPage.tsx
git commit -m "feat(auth): agregar componente LoginPage"

git add apps/api/src/auth/
git commit -m "feat(auth): implementar endpoint POST /auth/login"

git add apps/web/src/hooks/useLogin.ts
git commit -m "feat(auth): agregar hook useLogin con TanStack Query"
```

### Paso 3 — Antes de pushear, verifica local

```bash
make validate    # tipo + lint + test (lo que hara el pre-push igual)
```

### Paso 4 — Push y abrir PR

```bash
git push -u origin feature/auth-login
```

Abre PR en GitHub:
- **Base**: `develop`
- **Compare**: tu rama
- **Titulo**: usa formato Conventional Commits (`feat(auth): pantalla de login completa`).
- **Descripcion**: completa la plantilla (`.github/pull_request_template.md`).

### Paso 5 — Tras aprobacion, merge

- **Squash and merge** a develop (mantenemos historia limpia en develop).
- Borra la rama feature.

---

## 5. Releases (develop → main)

Cuando develop esta listo para release:

1. Abre PR `develop` → `main`.
2. Titulo: `release: v0.X.0` (sin scope, tipo `release` opcional).
3. **Merge commit** (NO squash) — preserva la historia de commits semanticos.
4. **release-please** (workflow automatico) detecta los commits convencionales y abre un PR de release con:
   - `CHANGELOG.md` actualizado.
   - Bump de version segun semver:
     - `feat:` → minor (0.1.0 → 0.2.0)
     - `fix:`/`perf:` → patch (0.1.0 → 0.1.1)
     - `feat!:` o `BREAKING CHANGE:` → major (0.1.0 → 1.0.0)
5. Al mergear el PR de release, se crea el tag automaticamente.

---

## 6. Conflictos con `develop`

Si tu rama queda atras:

```bash
git checkout feature/auth-login
git fetch origin
git rebase origin/develop          # preferido (historia limpia)
# o si prefieres merge:
git merge origin/develop
```

Resuelve conflictos manualmente. **Nunca** uses `git checkout --theirs/--ours` sin entender que descarta.

---

## 7. Reglas heredadas del proyecto

Estas no son negociables (estan en `docs/ARQUITECTURA.md`):

- **TypeScript**: sin `any`, sin `!`, sin `as`, sin `enum`, sin `@ts-ignore`.
- **Idioma**: codigo, comentarios, commits y nombres en espanol.
- **NestJS DI**: jamas `import type` para clases inyectables.
- **Forms**: `NxtInputField` (no `NxtInput`), submit via `onNxtButtonClick` (no `type="submit"`).
- **Estilos**: cero Tailwind, cero `style={}` con valores hardcodeados.
- **Validacion**: Zod en boundaries (controllers, parsers de URL, formularios).

---

## 8. FAQ

**¿Por que `pre-push` y no `pre-commit` para `make validate`?**
Porque `make validate` tarda 10-30s. Meterlo en pre-commit hace que cada commit sea doloroso y la gente termina usando `--no-verify`. La division "commit rapido / push completo" balancea velocidad y seguridad.

**¿Por que squash a develop pero merge a main?**
Squash a develop mantiene la historia de develop limpia (1 commit por feature). Merge a main preserva todos los commits convencionales para que release-please pueda generar el CHANGELOG correctamente.

**¿Puedo trabajar en paralelo en 2 features?**
Si. Cada una en su rama. No mezcles cambios de features distintas en un mismo commit ni en una misma rama.

**¿Como nombro el scope si toca varias areas?**
Usa el scope de la capa tecnica (`web`, `api`) si el cambio es transversal, o parte el commit en varios commits con scopes especificos.

**¿Que hago si me olvido del formato y ya commitee?**
Si todavia no pusheaste: `git commit --amend -m "feat(auth): ..."`. Si ya pusheaste y la rama es solo tuya: rebase + force-push (con cuidado). Si la rama es compartida: deja el error, pero no lo repitas.

---

## 9. Referencias

- [Conventional Commits 1.0.0](https://www.conventionalcommits.org/es/v1.0.0/)
- [GitFlow original (Vincent Driessen)](https://nvie.com/posts/a-successful-git-branching-model/)
- [release-please](https://github.com/googleapis/release-please)
- [docs/ARQUITECTURA.md](ARQUITECTURA.md) — decisiones tecnicas
- [docs/DESARROLLO.md](DESARROLLO.md) — flujo de desarrollo diario
