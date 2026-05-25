# Flujo de Desarrollo

Guia operativa para trabajar en NexoTT Learn dia a dia.

---

## Arranque desde cero

### Requisitos

- Node 20+
- pnpm 10+
- Docker (para Postgres)
- Acceso al repo `carlos2280/nexott-ui` (libreria de UI)

### Setup inicial

```bash
git clone <este-repo>
cd NexoTTLearn

# 1. Clonar la libreria de UI al lado (mismo nivel)
cd ..
git clone https://github.com/carlos2280/nexott-ui.git
cd nexott-ui && pnpm install && pnpm build
cd ../NexoTTLearn

# 2. Crear .env (basado en .env.example)
cp .env.example .env

# 3. Crear .env.tokens con NODE_AUTH_TOKEN (NO se commitea, esta en .gitignore)
# El token es un Personal Access Token de GitHub con scope read:packages
# (https://github.com/settings/tokens/new). Necesario para instalar @carlos2280/nexott-ui
# desde GitHub Packages cuando NO esta activo el override local.
echo 'export NODE_AUTH_TOKEN=ghp_TU_TOKEN' > .env.tokens

# 4. (OPCIONAL) Crear enlace local a la libreria si vas a iterar sobre nexott-ui en paralelo
# Si no necesitas el dev paralelo, salta este paso. Veras la version publicada de nexott-ui.
# Si lo creas, recuerda: NUNCA commitear el lockfile resultante (ver "Trabajo en paralelo").
cat > .pnpmfile.cjs << 'EOF'
const path = require("path")
const nexottUiPath = path.resolve(__dirname, "../nexott-ui")
function readPackage(pkg) {
  if (pkg.dependencies && pkg.dependencies["@carlos2280/nexott-ui"]) {
    pkg.dependencies["@carlos2280/nexott-ui"] = `file:${nexottUiPath}`
  }
  return pkg
}
module.exports = { hooks: { readPackage } }
EOF

# 5. Setup completo (install + Postgres + migrate + seed)
# Si tienes .pnpmfile.cjs, usa --no-frozen-lockfile la primera vez:
source .env.tokens && pnpm install --no-frozen-lockfile
make setup

# 6. Levantar todo
make dev
```

### Verificar que todo arranco

```bash
make status
```

Debe mostrar procesos `vite` y `nest start --watch`, y los puertos 4000, 5174 (o 5173) y 5434 ocupados.

---

## Trabajar con la libreria de UI (`@carlos2280/nexott-ui`)

La libreria vive en un repo aparte (`../nexott-ui`). En desarrollo local se consume directamente desde ahi via `.pnpmfile.cjs`. En CI/produccion se consume la version publicada en GitHub Packages.

### Modos de trabajo

| Modo | Como se consume | Archivo gatillo |
|------|-----------------|-----------------|
| **Local** | `file:../nexott-ui` (enlace) | `.pnpmfile.cjs` presente |
| **Publicada** | `@carlos2280/nexott-ui: ^X.Y.Z` desde GitHub Packages | `.pnpmfile.cjs` ausente o renombrado |

### ⚠️ Regla critica: lockfile y dev paralelo

El `pnpm-lock.yaml` que se commitea **DEBE apuntar a la version publicada** de `nexott-ui` en GitHub Packages. NUNCA debe contener `file:/home/...` ni `pnpmfileChecksum`.

**Que pasa si commiteo un lockfile contaminado**: CI falla con `ERR_PNPM_LOCKFILE_CONFIG_MISMATCH`, Railway no puede deployar, todo el pipeline se rompe.

**Como se contamina sin querer**: si ejecutas `pnpm install` con `.pnpmfile.cjs` activo, pnpm regenera el lockfile apuntando al path local. Si commiteas, problema.

**Proteccion automatica**: hay un hook `pre-commit` que rechaza commits de `pnpm-lock.yaml` con paths locales o `pnpmfileChecksum`. Si ves el error del hook, sigue las instrucciones de "Regenerar lockfile limpio" mas abajo.

### Workflow recomendado para dev paralelo

#### Caso 1: Solo tocas codigo de la app (no deps)

```bash
# .pnpmfile.cjs activo, lockfile commiteado limpio
pnpm install --no-frozen-lockfile   # solo la primera vez tras clonar
make dev
# trabajas, commiteas archivos pero NUNCA pnpm-lock.yaml
git add apps/web/src/...
git commit -m "feat(cursos): ..."
```

El lockfile en disco se modifica al usar `--no-frozen-lockfile`, pero **NO lo stageas**. El hook pre-commit te protege si lo intentas.

#### Caso 2: Necesitas agregar/actualizar una dependencia

Cuando quieras hacer `pnpm add <paquete>` o cambiar una version, **DEBES** regenerar el lockfile limpio para poder commitearlo. Sigue "Regenerar lockfile limpio" mas abajo.

#### Caso 3: Iterando sobre nexott-ui

```bash
# Asumes que ya tienes .pnpmfile.cjs activo
# Editas codigo en ../nexott-ui/src/
make lib-rebuild   # rebuild de la libreria + reinstall en NexoTTLearn
# Vite hace HMR, ves los cambios al instante
```

### Regenerar lockfile limpio (solo cuando cambias deps)

Procedimiento documentado y probado:

```bash
# 1. Cargar el token (necesario para resolver nexott-ui desde GH Packages)
source .env.tokens

# 2. Desactivar pnpmfile temporalmente
mv .pnpmfile.cjs .pnpmfile.cjs.bak

# 3. Borrar lockfile y reinstalar limpio
rm -rf pnpm-lock.yaml node_modules apps/*/node_modules packages/*/node_modules
pnpm install
# El postinstall del workspace api genera Prisma Client automaticamente.

# 4. Verificar que el lockfile NO contiene paths locales
grep -c "file:/home" pnpm-lock.yaml          # debe dar 0
grep "pnpmfileChecksum" pnpm-lock.yaml       # no debe imprimir nada

# 5. Commitear pnpm-lock.yaml limpio
git add pnpm-lock.yaml package.json apps/*/package.json
git commit -m "chore(deps): ..."

# 6. Restaurar pnpmfile y volver al flujo dev
mv .pnpmfile.cjs.bak .pnpmfile.cjs
pnpm install --no-frozen-lockfile
```

> **Tip**: si la version de `nexott-ui` que necesitas aun no esta publicada en GH Packages, **publicala primero** desde su repo (`make publish` o el workflow de release-please).

### Ciclo de desarrollo con la libreria

Cuando edites algo en la libreria (`../nexott-ui/src/`):

```bash
# Opcion 1: rebuild manual + refresh
make lib-rebuild

# Opcion 2: ciclo completo paso a paso
cd ../nexott-ui
pnpm build              # compilar
cd ../NexoTTLearn
pnpm install            # refrescar enlace
make dev                # reiniciar (Vite ya recoge cambios HMR)
```

> **Tip**: si solo cambiaste CSS de la libreria, basta `pnpm build` en la libreria. Vite suele recargar solo. Si cambiaste TypeScript de un Web Component, conviene reiniciar `make dev`.

### Storybook de la libreria

```bash
make lib-storybook
# http://localhost:6006
```

### Publicar nueva version de la libreria

Documentado en `../nexott-ui/README.md`. Resumen:

1. Trabajar y commitear en `nexott-ui`.
2. `npm version patch|minor|major` en `nexott-ui`.
3. `git push --tags` → GitHub Actions publica automaticamente.
4. En NexoTT Learn: `pnpm update @carlos2280/nexott-ui` y commit.

---

## Crear una pagina nueva

Ejemplo de pagina autenticada con form:

```tsx
// apps/web/src/pages/MiPagina.tsx
import { NxtButton, NxtCard, NxtInputField } from "@carlos2280/nexott-ui/react"
import { Box, Stack } from "@carlos2280/nexott-ui/react-primitives"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

const schema = z.object({
  titulo: z.string().min(1, "Requerido"),
})
type Input = z.infer<typeof schema>

export function MiPagina() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Input>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: Input) => {
    // ...
  }

  return (
    <Box padding="xl">
      <Stack gap="lg">
        <NxtCard variant="surface" padding="lg" title="Mi pagina" />

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <Stack gap="lg">
            <NxtInputField
              variant="filled"
              label="Titulo"
              {...register("titulo")}
              state={errors.titulo ? "error" : ""}
              helper={errors.titulo?.message ?? ""}
            />

            <NxtButton
              variant="primary"
              full
              loading={isSubmitting}
              onNxtButtonClick={() => { void handleSubmit(onSubmit)() }}
            >
              Guardar
            </NxtButton>
          </Stack>
        </form>
      </Stack>
    </Box>
  )
}
```

Y registrarla en [apps/web/src/App.tsx](../apps/web/src/App.tsx):

```tsx
<Route path="/mi-pagina" element={<RutaProtegida><MiPagina /></RutaProtegida>} />
```

### Reglas al crear paginas

- **Cero Tailwind**. Layout con `Stack`/`Box`/`Grid`, contenido con componentes `Nxt*`.
- **Forms con `NxtInputField`** (NO `NxtInput`).
- **Submit con `onNxtButtonClick`**, NO `type="submit"` (ver [ARQUITECTURA.md](ARQUITECTURA.md#nxtbutton-no-acepta-typesubmit)).
- **Si necesitas color/tipografia inline**, usar `var(--nx-...)` de tokens, nunca valores hardcodeados.

---

## Crear un endpoint en la API

Ejemplo de modulo con endpoint protegido por sesion:

```ts
// apps/api/src/cursos/cursos.module.ts
import { Module } from "@nestjs/common"
import { CursosController } from "./cursos.controller"
import { CursosService } from "./cursos.service"

@Module({
  controllers: [CursosController],
  providers: [CursosService],
})
export class CursosModule {}
```

```ts
// apps/api/src/cursos/cursos.service.ts
import { Injectable } from "@nestjs/common"
import { PrismaService } from "../common/prisma/prisma.service"
//   ^^^^^^ NO usar `import type` aqui — NestJS DI lo necesita en runtime

@Injectable()
export class CursosService {
  constructor(private readonly prisma: PrismaService) {}

  async listar() {
    return this.prisma.curso.findMany()
  }
}
```

```ts
// apps/api/src/cursos/cursos.controller.ts
import { Controller, Get, UseGuards } from "@nestjs/common"
import { CursosService } from "./cursos.service"
import { SesionGuard } from "../common/guards/sesion.guard"

@Controller("cursos")
@UseGuards(SesionGuard)
export class CursosController {
  constructor(private readonly cursosService: CursosService) {}

  @Get()
  async listar() {
    return this.cursosService.listar()
  }
}
```

Y registrarlo en `apps/api/src/app.module.ts`:

```ts
imports: [..., CursosModule]
```

### Reglas al crear endpoints

- **NUNCA `import type`** para servicios, providers, guards, pipes (cualquier clase con decorador o que entre por constructor). La DI falla con error confuso. Usar `import` normal.
- **Validar con Zod** via `ZodValidationPipe` en `@UsePipes()`. NO usar `class-validator`.
- **Schemas en `packages/shared-types`** si el form vive en web (compartidos entre cliente y servidor).

---

## Trabajar con la BD (Prisma)

### Crear una migracion

```bash
# 1. Editar el schema
$EDITOR apps/api/prisma/schema.prisma

# 2. Crear migracion (interactivo, pide nombre)
cd apps/api
pnpm exec prisma migrate dev --name agregar_tabla_cursos

# 3. Vuelve a generar el client
pnpm exec prisma generate
```

### Inspeccionar datos

```bash
make db-studio
# http://localhost:5555
```

### Reset completo (⚠ destructivo)

```bash
make db-reset
# Pide confirmacion. Borra todo, re-aplica migraciones, ejecuta seed.
```

---

## Tipos compartidos (`packages/shared-types`)

Cualquier schema/tipo que use **web Y api** vive aqui.

```ts
// packages/shared-types/src/cursos.ts
import { z } from "zod"

export const cursoSchema = z.object({
  titulo: z.string().min(1).max(200),
  descripcion: z.string().max(2000).optional(),
})
export type CursoInput = z.infer<typeof cursoSchema>
```

Re-exportar en `packages/shared-types/src/index.ts`:

```ts
export * from "./auth"
export * from "./cursos"
```

> **Importante**: Vite (web) consume el `.ts` source directo. NestJS (api) consume el `dist/index.js` compilado. El `package.json` tiene `conditional exports` que resuelve esto automaticamente. Detalle en [ARQUITECTURA.md](ARQUITECTURA.md#shared-types-esmcjs-dual).

Tras tocar `shared-types/`:

```bash
cd packages/shared-types && pnpm build
```

(El watcher de Nest re-compila solo, pero shared-types no tiene watch — siempre rebuild manual).

---

## Calidad de codigo

### Antes de cada commit

```bash
make validate    # typecheck + lint + test
```

Si algo falla, arreglar antes de commitear. Las reglas de Biome estan en estricto y van a saltar varios checks.

### Auto-fix lo que se pueda

```bash
make lint-fix
```

### Reglas no negociables

Ver [ARQUITECTURA.md](ARQUITECTURA.md#reglas-de-codigo) para la lista completa.

---

## Troubleshooting

### `Could not resolve "@tanstack/table-core"` al levantar web

La libreria importa `@tanstack/table-core` para `<NxtTable>`. Es peer dep — debe estar instalado en `apps/web` aunque no uses tablas. Ya esta en `dependencies`, pero si te falla:

```bash
cd apps/web && pnpm add @tanstack/table-core
```

### `Missing "./react-primitives/primitives.css" specifier`

Caché de Vite obsoleto:

```bash
rm -rf apps/web/node_modules/.vite
make dev
```

### `Nest can't resolve dependencies of X. argument Function at index [0]`

Tienes un `import type` para una clase que NestJS necesita en runtime. Buscalo:

```bash
grep -rn "import type.*Service\|import type.*Module" apps/api/src/
```

Cambia a `import` normal.

### `The "class-validator" package is missing`

Tienes un `app.useGlobalPipes(new ValidationPipe(...))` en `main.ts`. Quitalo — el proyecto usa Zod, no class-validator.

### `pnpm dev` arranca pero el browser no ve cambios de la libreria

```bash
make lib-rebuild   # rebuild + reinstall
# Refrescar el browser con Ctrl+Shift+R
```

### El proceso de la api queda colgado en otro puerto y no muere con make kill

```bash
make ps         # ver pids
kill -9 <pid>   # mano dura
```

### `pnpm-lock.yaml staged contiene paths LOCALES` al hacer commit

El hook pre-commit detecto que tienes el lockfile contaminado por `.pnpmfile.cjs`. Sigue "Regenerar lockfile limpio" en la seccion "Trabajar con la libreria de UI".

### `ERR_PNPM_LOCKFILE_CONFIG_MISMATCH` al hacer pnpm install

El lockfile committeado contiene `pnpmfileChecksum` pero tu shell no tiene `.pnpmfile.cjs` (o viceversa). Soluciones:

- Si quieres dev paralelo: crea `.pnpmfile.cjs` (ver setup inicial) y ejecuta `pnpm install --no-frozen-lockfile`.
- Si NO quieres dev paralelo: borra `.pnpmfile.cjs` si existe, ejecuta `pnpm install` normal.

Si el lockfile committeado es el contaminado (no deberia, hay un hook que lo previene), regenerarlo con el procedimiento documentado.

### Postgres no arranca

```bash
docker compose down
docker compose up -d
make db-migrate
```

Si persiste, verifica que el puerto 5434 no este ocupado:

```bash
make ports
```

---

## Convenciones del repo

- Branches: `feature/*`, `fix/*`, `hotfix/*` desde `develop` (no `main`).
- Commits: convencionales en espanol — `feat(cursos): agregar catalogo`.
- PRs: un PR = un cambio logico. CI debe pasar (`make validate` localmente antes).
- No commitear: `.env`, `.pnpmfile.cjs`, `node_modules/`, `dist/`, `*.log`.

Detalle completo en `.claude/rules/` (heredado del proyecto OLD si aplica).
