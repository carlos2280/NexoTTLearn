# Arquitectura

Decisiones tecnicas del proyecto. Por que cada cosa es como es.

---

## Modelo de capas

```
┌─────────────────────────────────────────────────────────┐
│  apps/web              apps/api                         │
│  Vite SPA              NestJS REST                      │
│  React 18              Prisma + Postgres                │
└─────────────────────┬───────────────────┬───────────────┘
                      │                   │
                      ▼                   ▼
            ┌─────────────────────────────────┐
            │  packages/shared-types          │
            │  Zod schemas + tipos TS         │
            └─────────────────────────────────┘
                      ▲
                      │
            ┌─────────┴─────────┐
            │  @carlos2280/      │
            │  nexott-ui         │   ← repo aparte (../nexott-ui)
            │  (consumido por    │
            │   apps/web)        │
            └────────────────────┘
```

---

## Por que Vite SPA (y no Next.js / Remix)

**Toda la app es post-login**: lo primero que ve el usuario es la pantalla de login. No hay landing publica, no hay paginas indexables, no hay links que se compartan en LinkedIn/Slack con preview.

Consecuencias:

- **SEO**: irrelevante. Los buscadores nunca pasan del login.
- **SSR**: aporta poco. Ahorras ~400ms en la primera carga, irrelevante para usuarios autenticados que vienen a una app diaria.
- **Streaming SSR**: redundante. TanStack Query ya hace streaming en cliente — cada componente lanza su query, se rellena cuando llega el dato. El usuario percibe la misma sensacion de "la pagina se llena por trozos".

**Resultado**: Vite SPA es simple, sin magia, y cubre el caso. Cero complejidad de servidor para renderizar.

> Si en el futuro se necesita una landing publica, se hace pre-render estatico aparte (ej. astro o `vite build` con un par de paginas estaticas). NO migrar todo el stack a Next/Remix.

---

## Por que no Tailwind

La app consume `@carlos2280/nexott-ui`, una libreria propia con design system completo. Si la app escribe Tailwind, se duplican decisiones visuales: cada pagina re-decide colores, espacios, sombras. Cuando cambia la marca, hay que tocar 200 sitios.

Filosofia adoptada: **la libreria absorbe el 100% de las decisiones visuales**.

```
ANTES (Tailwind):
<div className="flex items-center justify-between gap-4 p-6 rounded-lg bg-white shadow-sm">
  <h2 className="text-lg font-semibold text-slate-900">Mis cursos</h2>
  <button className="rounded-md bg-blue-600 px-4 py-2 text-white">Ver todos</button>
</div>

DESPUES (libreria):
<NxtCard variant="surface" padding="lg" title="Mis cursos">
  <NxtButton variant="primary">Ver todos</NxtButton>
</NxtCard>

# o si se necesita layout libre:
<Stack direction="row" align="center" justify="between" gap="md">
  <NxtCard ... />
  <NxtButton ... />
</Stack>
```

### Por que `Stack`/`Box`/`Grid` (layout primitives)

Sin Tailwind, hace falta una forma ergonomica de hacer layout. Inspirado en MUI Joy / Mantine / Radix Themes, la libreria expone tres primitives React puros:

- `<Stack gap="lg" direction="row">` — flex container con tokens de spacing.
- `<Box padding="md" surface="card" radius="md">` — div polimorfico con tokens.
- `<Grid columns={3} gap="md">` — CSS Grid con tokens.

Estos tres absorben el ~80% de Tailwind suelto que aparecia en una app tipica (`flex`, `gap-*`, `p-*`, `grid-cols-*`, `rounded-*`, `bg-*` con surfaces).

> Detalle en `../nexott-ui/src/react-primitives/`.

### Excepcion documentada

`Stack`/`Box`/`Grid` son la **unica** parte de la libreria que NO es Web Component. Son React puros porque:

1. No necesitan encapsulacion de estilos (Shadow DOM estorba para layout).
2. No tienen logica interna ni eventos custom.
3. La API responsive (`gap={{ base: "sm", md: "lg" }}`) es naturalmente mas ergonomica con props objeto.

Documentado en `../nexott-ui/docs/02-ARQUITECTURA.md`.

---

## Integracion con la libreria `@carlos2280/nexott-ui`

### Modo desarrollo local

`.pnpmfile.cjs` (gitignored) redirige la dependencia a `../nexott-ui`:

```js
const path = require("path")
const nexottUiPath = path.resolve(__dirname, "../nexott-ui")
function readPackage(pkg) {
  if (pkg.dependencies && pkg.dependencies["@carlos2280/nexott-ui"]) {
    pkg.dependencies["@carlos2280/nexott-ui"] = `file:${nexottUiPath}`
  }
  return pkg
}
module.exports = { hooks: { readPackage } }
```

Esto crea un symlink en `node_modules/@carlos2280/nexott-ui` → `../nexott-ui`. Cualquier cambio en la libreria se refleja al rebuildarla (`make lib-rebuild`).

### Modo CI/produccion

`.pnpmfile.cjs` no existe (esta gitignored), asi que `pnpm install` resuelve la version publicada en GitHub Packages. Configurado en `.npmrc`.

### Peer deps obligatorias en `apps/web`

Aunque la app no use directamente `<NxtTable>` o `<NxtSortableList>`, el barrel `react.js` resuelve estaticamente todos los wrappers. Vite/Rollup intentan cargar:

- `@lit/react` (siempre)
- `lit` (siempre)
- `@tanstack/table-core` (para `<NxtTable>`)
- `sortablejs` (solo si se usa `/extensions/dnd/react`)

Estan en `apps/web/package.json` como `dependencies`. Sin esto, Vite falla con `Could not resolve ...`.

### `NxtButton` no acepta `type="submit"`

El Web Component `<nxt-button>` siempre renderiza un `<button type="button">` interno. **No participa en submit nativo de forms**.

Patron correcto:

```tsx
<form onSubmit={handleSubmit(onSubmit)}>
  <NxtInputField {...register("email")} />
  <NxtButton onNxtButtonClick={() => { void handleSubmit(onSubmit)() }}>
    Enviar
  </NxtButton>
</form>
```

El `<form onSubmit>` sigue activo para que **Enter** en input dispare submit. El boton dispara explicitamente con `onNxtButtonClick`.

### `NxtInputField` para react-hook-form

`NxtInput` (wrapper directo del Web Component) emite eventos custom (`nxt-input-input`). NO funciona con `register()` de react-hook-form que espera eventos React nativos.

`NxtInputField` (mismo paquete) es un puente que adapta el contrato. Uso:

```tsx
<NxtInputField
  variant="filled"
  label="Email"
  {...register("email")}
  state={errors.email ? "error" : ""}
  helper={errors.email?.message ?? ""}
/>
```

Si necesitas el WC sin RHF (form manual), usa `NxtInput`.

---

## `shared-types` ESM/CJS dual

`apps/web` es ESM (`"type": "module"`, Vite). `apps/api` es NestJS clasico, **CommonJS**. El paquete `packages/shared-types` lo consumen ambos.

Solucion: **conditional exports** en `packages/shared-types/package.json`:

```jsonc
{
  "type": "module"  // ❌ NO usar esto — rompe NestJS
  // o
  "main": "./dist/index.js",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./src/index.ts",     // Vite consume el .ts source directo
      "require": "./dist/index.js",   // NestJS consume el CJS compilado
      "default": "./dist/index.js"
    }
  }
}
```

Vite/Rollup leen el `.ts` y lo compilan al vuelo (no necesitan dist). NestJS resuelve el CJS de `dist/`. Ambos felices.

> Alternativa rechazada: build dual con `tsup` o similar. Mas pesado y resuelve un problema que no tenemos (la API solo importa tipos + Zod schemas, no clases con `instanceof`).

### Por que no migrar todo a ESM

Probado y descartado. Migrar `shared-types` a ESM puro requiere migrar tambien `apps/api` a ESM. NestJS 10 lo soporta pero rompe la metadata de DI: las clases se cargan dos veces (una en CJS de `node_modules`, otra en ESM resuelto), `Reflect.getMetadata` falla, y NestJS no encuentra los providers. **Cirugia mayor para resolver lo que el conditional export resuelve en una linea**.

---

## NestJS DI — trampas conocidas

### NUNCA `import type` para inyectables

```ts
// ❌ MAL — al compilar TS elimina el import, NestJS ve `Function` y no inyecta
import type { PrismaService } from "../common/prisma/prisma.service"

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}
}
```

Error en runtime:

```
Nest can't resolve dependencies of the AuthService (?).
argument Function at index [0]
```

El `Function` confunde porque parece error de modulos. La causa real es el `import type`.

```ts
// ✅ BIEN
import { PrismaService } from "../common/prisma/prisma.service"
```

Aplica a: services, controllers, guards, pipes, interceptors, custom decorators con `@Injectable()`.

### NO usar `ValidationPipe` global con Zod

NestJS trae `ValidationPipe` de `@nestjs/common`. Pide `class-validator` + `class-transformer` como deps (~30KB runtime).

Este proyecto usa Zod. La validacion va en cada controller via `ZodValidationPipe` custom + `@UsePipes()`:

```ts
@Post("login")
@UsePipes(new ZodValidationPipe(loginSchema))
async login(@Body() input: LoginInput) { ... }
```

`apps/api/src/main.ts` NO debe tener `app.useGlobalPipes(new ValidationPipe(...))`. Si lo tiene, quitarlo.

---

## Reglas de codigo

### TypeScript

- **NUNCA** `any` — usar `unknown` + type guard.
- **NUNCA** `as` (type assertion) — usar Zod o narrowing.
- **NUNCA** `enum` — usar `as const` o union types.
- **NUNCA** `!` (non-null assertion) — validar antes.
- **NUNCA** `@ts-ignore` — usar `@ts-expect-error` con comentario.

### Idioma

- Codigo y commits en **espanol**: `calcularBrecha`, `obtenerCurso`, `feat(cursos): agregar catalogo`.
- Componentes React en PascalCase espanol: `CursoCard`, `RutaProtegida`.
- Tablas BD en snake_case espanol: `usuarios`, `cursos`, `diagnosticos`.

### Forms

- **`NxtInputField`**, no `NxtInput`, para integrar con react-hook-form.
- **`onNxtButtonClick`**, no `type="submit"`, para disparar submit.
- **`<form onSubmit>`** para que Enter siga funcionando.

### Estilos

- **Cero Tailwind**.
- **Cero `style={}` inline con valores hardcodeados** — solo `var(--nx-*)`.
- **Layout** con `Stack`/`Box`/`Grid`, **contenido** con componentes `Nxt*`.
- **Colores semanticos** (error, warning, etc.) via tokens de la libreria.

### NestJS

- `import` normal (no `import type`) para inyectables.
- Validar con Zod via `ZodValidationPipe`.
- Server Actions / endpoints siguen: Auth → Autorizar → Validar → Ejecutar.
- Sesiones HTTP-only en Postgres (no JWT, no localStorage).

### Git

- Branches: `feature/*`, `fix/*` desde `develop`.
- Commits convencionales en espanol.
- `make validate` antes de commit.
- `.pnpmfile.cjs` y `.env` jamas se commitean.

---

## Estructura interna

### `apps/web/src/`

```
apps/web/src/
├── App.tsx                  Rutas (react-router)
├── main.tsx                 Bootstrap + imports CSS de la libreria
├── index.css                Tokens base del body (var(--nx-bg), var(--nx-text))
├── vite-env.d.ts            Declaraciones de modulos CSS para TS
├── pages/                   Paginas (una por ruta)
│   ├── auth/
│   │   └── LoginPage.tsx
│   └── InicioPage.tsx
├── components/              Componentes compartidos
│   └── auth/
│       └── RutaProtegida.tsx
├── hooks/                   Custom hooks (useSesion, useLogin, useLogout)
└── lib/                     Utilidades (api client, etc.)
    └── api.ts
```

### `apps/api/src/`

```
apps/api/src/
├── main.ts                  Bootstrap (helmet, cors, sesion, passport)
├── app.module.ts            Modulo raiz
├── auth/                    Modulo de autenticacion
│   ├── auth.module.ts
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── serializador.usuario.ts  Passport serializer
│   └── tipos.ts             Tipos solo del modulo (UsuarioSesion)
└── common/                  Compartido entre modulos
    ├── prisma/
    │   ├── prisma.module.ts (@Global)
    │   └── prisma.service.ts
    ├── guards/
    │   └── sesion.guard.ts
    ├── decorators/
    │   └── usuario-actual.decorator.ts
    └── zod-validation.pipe.ts
```

### `packages/shared-types/`

```
packages/shared-types/
├── src/
│   ├── index.ts             export * from "./auth"
│   └── auth.ts              loginSchema, usuarioPublicoSchema, tipos
└── dist/                    CJS compilado (consumido por apps/api)
```

---

## Decisiones que se tomaron y por que

### Vite SPA y no Next.js (otra vez)

Decision documentada arriba. Resumen: todo es post-login, no se justifica el meta-framework.

### Sesiones en Postgres y no JWT

JWT en `localStorage` es comodo pero:
- Vulnerable a XSS (cualquier script lee el token).
- Imposible invalidar antes de que expire.
- No tiene CSRF protection out-of-the-box.

Sesiones HTTP-only en Postgres con `connect-pg-simple`:
- Cookie `httpOnly` + `secure` + `sameSite: strict` (en prod).
- Server-side session: invalidar es borrar una fila.
- Sin token visible para JS.

Trade-off aceptado: una query a Postgres por request autenticada (la sesion). En este volumen no importa.

### `pnpm` y `Turborepo`

- `pnpm` por workspaces eficientes y `.pnpmfile.cjs` (que es como hacemos el dev local de la libreria).
- Turborepo para orquestar `dev`, `build`, `lint` con cache.

### Biome (no ESLint + Prettier)

Mas rapido, una sola config, cero conflicto entre lint y format. Reglas en estricto en `biome.json`.

#### Excepciones de reglas (justificadas, no relajacion)

Las siguientes excepciones estan **documentadas en `biome.json` como overrides por path**, no como relajacion global. Cada una tiene fundamento tecnico:

| Override | Path | Reglas off | Por que |
|----------|------|-----------|---------|
| `apps/api/src/**` | NestJS source | `useImportType` | NestJS DI rompe con `import type` para inyectables. Ver "NestJS DI — trampas conocidas". |
| `apps/api/src/**` | NestJS source | `noParameterProperties` | `constructor(private readonly x: Service)` es el patron idiomatico de DI en NestJS. Forzar properties explicitas duplica codigo y rompe la convencion del framework. |
| `apps/api/prisma/seed.ts`, `apps/api/scripts/**`, `apps/web/server.js` | Scripts/runtime servidor | `noConsoleLog`, `noConsole`, `noNodejsModules` | Los scripts CLI y el server.js de produccion necesitan stdout para logs y modulos node nativos (path, url, module). |
| Tests | `*.test.{ts,tsx}` | `noExplicitAny`, `noNonNullAssertion` | Los tests aceptan estos atajos para fixtures y mocks puntuales. |
| `useFilenamingConvention` | (global) | acepta `PascalCase` ademas de kebab/camel | Convencion estandar de React: componentes en PascalCase (`LoginPage.tsx`, `RutaProtegida.tsx`). |
| `packages/*/src/index.ts` | API publica del paquete | `noBarrelFile`, `noReExportAll` | El `index.ts` de un paquete es por definicion el barrel publico. Bloquearlo obligaria a importar `@nexott-learn/shared-types/auth` en vez de `@nexott-learn/shared-types`. |

Cualquier supresion **inline** (`// biome-ignore`) requiere comentario explicando el porque.

### Zod en boundaries (no class-validator)

- Mismo schema en cliente y servidor (compartido en `shared-types`).
- Tipos derivados (`z.infer<>`) en vez de duplicar interfaces.
- Sin reflexion ni decoradores extra.

---

## Referencias

- [Filosofia de la libreria UI](../../DOCUMENTOS/NEXOTT-UI/FILOSOFIA%20NEXOTT/01-FILOSOFIA-Y-ADN.md)
- [Arquitectura de la libreria UI](../../DOCUMENTOS/NEXOTT-UI/FILOSOFIA%20NEXOTT/02-ARQUITECTURA.md)
- [Catalogo de componentes](../../DOCUMENTOS/NEXOTT-UI/FILOSOFIA%20NEXOTT/03-CATALOGO-COMPONENTES.md)
- [Flujo de desarrollo](DESARROLLO.md)
