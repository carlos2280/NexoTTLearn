import type { BloqueDetalleResponse, SeccionResponse, TipoBloque } from "@nexott-learn/shared-types"

/**
 * Seed de secciones y bloques para el modo mock. Las secciones se anclan a
 * los modulos sembrados en `seed-catalogo.ts`. Cada modulo activo recibe
 * 2-3 secciones; las secciones reciben bloques que representan al menos una
 * vez cada uno de los 8 tipos del enum `TipoBloque`.
 */

function isoAhora(): string {
  return new Date().toISOString()
}

function uuid(suffix: string): string {
  return `00000000-0000-4000-a000-${suffix.padStart(12, "0")}`
}

const ahora = isoAhora()

// IDs de modulos (deben coincidir con seed-catalogo.ts)
const ID_MOD_TS = uuid("mod1")
const ID_MOD_NEST = uuid("mod2")
const ID_MOD_PRISMA = uuid("mod3")
const ID_MOD_REACT = uuid("mod4")

// IDs de secciones
const ID_SEC_TS_TIPOS = uuid("sec1")
const ID_SEC_TS_GEN = uuid("sec2")
const ID_SEC_NEST_MOD = uuid("sec3")
const ID_SEC_NEST_GUARDS = uuid("sec4")
const ID_SEC_PRISMA_SCHEMA = uuid("sec5")
const ID_SEC_REACT_HOOKS = uuid("sec6")

// IDs de skills (para skillQueMideId en bloques evaluables)
const ID_SKILL_TS = uuid("skill1")
const ID_SKILL_NEST = uuid("skill2")
const ID_SKILL_REACT = uuid("skill4")

export const SEED_SECCIONES: SeccionResponse[] = [
  {
    id: ID_SEC_TS_TIPOS,
    moduloId: ID_MOD_TS,
    titulo: "Tipos y narrowing",
    orden: 1,
    createdAt: ahora,
    updatedAt: ahora,
  },
  {
    id: ID_SEC_TS_GEN,
    moduloId: ID_MOD_TS,
    titulo: "Genericos y utility types",
    orden: 2,
    createdAt: ahora,
    updatedAt: ahora,
  },
  {
    id: ID_SEC_NEST_MOD,
    moduloId: ID_MOD_NEST,
    titulo: "Modulos, providers e inyeccion",
    orden: 1,
    createdAt: ahora,
    updatedAt: ahora,
  },
  {
    id: ID_SEC_NEST_GUARDS,
    moduloId: ID_MOD_NEST,
    titulo: "Guards, pipes e interceptors",
    orden: 2,
    createdAt: ahora,
    updatedAt: ahora,
  },
  {
    id: ID_SEC_PRISMA_SCHEMA,
    moduloId: ID_MOD_PRISMA,
    titulo: "Schema y migraciones",
    orden: 1,
    createdAt: ahora,
    updatedAt: ahora,
  },
  {
    id: ID_SEC_REACT_HOOKS,
    moduloId: ID_MOD_REACT,
    titulo: "Hooks y Tanstack Query",
    orden: 1,
    createdAt: ahora,
    updatedAt: ahora,
  },
]

function nuevoBloque(
  id: string,
  seccionId: string,
  orden: number,
  tipo: TipoBloque,
  contenido: Record<string, unknown>,
  opciones?: { esEvaluable?: boolean; skillQueMideId?: string },
): BloqueDetalleResponse {
  return {
    id,
    seccionId,
    orden,
    tipo,
    esEvaluable: opciones?.esEvaluable ?? false,
    skillQueMideId: opciones?.skillQueMideId ?? null,
    estado: "ACTIVO",
    version: 1,
    contenido,
    createdAt: ahora,
    updatedAt: ahora,
  }
}

export const SEED_BLOQUES: BloqueDetalleResponse[] = [
  // -- Seccion "Tipos y narrowing" (TS) --
  nuevoBloque(uuid("blq1"), ID_SEC_TS_TIPOS, 1, "PARRAFO", {
    html: '<h2>Tipos primitivos y narrowing</h2><p>TypeScript usa <em>narrowing</em> para acotar el tipo de una variable dentro de un bloque.</p><pre><code class="language-ts">function imprimir(valor: string | number) {\n  if (typeof valor === "string") {\n    console.log(valor.toUpperCase())\n  }\n}</code></pre>',
    textoPlano:
      "Tipos primitivos y narrowing. TypeScript usa narrowing para acotar el tipo de una variable dentro de un bloque.",
    tiempoLecturaMin: 4,
  }),
  nuevoBloque(uuid("blq2"), ID_SEC_TS_TIPOS, 2, "TIP", {
    variante: "info",
    html: "<p>Cuando el narrowing no es suficiente, considera <strong>type guards</strong> personalizados con la firma <code>x is T</code>.</p>",
  }),
  nuevoBloque(
    uuid("blq3"),
    ID_SEC_TS_TIPOS,
    3,
    "QUIZ",
    {
      intentosMax: null,
      solucionVisible: "al_aprobar",
      ordenAleatorio: false,
      notaMinima: 60,
      preguntas: [
        {
          id: "p1",
          enunciado: "¿Que retorna typeof null en JavaScript?",
          opciones: [
            { id: "p1o1", texto: '"null"', esCorrecta: false },
            { id: "p1o2", texto: '"object"', esCorrecta: true },
            { id: "p1o3", texto: '"undefined"', esCorrecta: false },
          ],
          explicacion: "Es un bug historico de JS preservado por compatibilidad.",
        },
      ],
    },
    { esEvaluable: true, skillQueMideId: ID_SKILL_TS },
  ),

  // -- Seccion "Genericos" (TS) --
  nuevoBloque(uuid("blq4"), ID_SEC_TS_GEN, 1, "VIDEO", {
    // biome-ignore lint/nursery/noSecrets: URL de YouTube de ejemplo para datos mock, no un secreto
    url: "https://www.youtube.com/watch?v=dLPgQRbVquo",
    proveedor: "youtube",
    duracionSeg: 720,
    marcarAlPorcentaje: 90,
    notas: "Atencion al minuto 6 sobre conditional types.",
  }),
  nuevoBloque(uuid("blq5"), ID_SEC_TS_GEN, 2, "RECURSO", {
    subtipo: "enlace",
    url: "https://www.typescriptlang.org/docs/handbook/2/generics.html",
    titulo: "TypeScript Handbook - Generics",
    descripcion: "Capitulo oficial sobre genericos.",
    abrirNuevaPestana: true,
  }),

  // -- Seccion "Modulos NestJS" --
  nuevoBloque(uuid("blq6"), ID_SEC_NEST_MOD, 1, "PARRAFO", {
    html: "<h2>El contenedor de inyeccion</h2><p>Cada modulo de NestJS expone sus <em>providers</em> al contenedor de DI. Importar un modulo significa heredar sus <code>exports</code>.</p>",
    textoPlano:
      "El contenedor de inyeccion. Cada modulo de NestJS expone sus providers al contenedor de DI.",
    tiempoLecturaMin: 3,
  }),
  nuevoBloque(uuid("blq7"), ID_SEC_NEST_MOD, 2, "CODIGO_ILUSTRATIVO", {
    lenguaje: "typescript",
    codigo:
      "@Module({\n  imports: [PrismaModule],\n  controllers: [UsersController],\n  providers: [UsersService],\n  exports: [UsersService],\n})\nexport class UsersModule {}",
    descripcion: "Modulo tipico con su provider exportado.",
  }),

  // -- Seccion "Guards" (NestJS) --
  nuevoBloque(
    uuid("blq8"),
    ID_SEC_NEST_GUARDS,
    1,
    "CODIGO_PREGUNTAS",
    {
      lenguaje: "typescript",
      enunciado:
        // biome-ignore lint/nursery/noSecrets: texto de enunciado de ejercicio, no un secreto real
        "Implementa un Guard de NestJS que rechace requests sin header `x-tenant-id`. Devuelve `false` o lanza `UnauthorizedException`.",
      esqueletoInicial:
        // biome-ignore lint/nursery/noSecrets: código de ejemplo NestJS para ejercicio, no un secreto real
        "@Injectable()\nexport class TenantGuard implements CanActivate {\n  canActivate(ctx: ExecutionContext): boolean {\n    // tu codigo aqui\n  }\n}",
      tiempoLimiteSeg: 300,
      modoSimple: false,
      rubrica:
        "- Lee el header desde request.headers (40%)\n- Manejo correcto de header ausente (40%)\n- Tipado estricto (20%)",
    },
    { esEvaluable: true, skillQueMideId: ID_SKILL_NEST },
  ),
  nuevoBloque(
    uuid("blq9"),
    ID_SEC_NEST_GUARDS,
    2,
    "CODIGO_TESTS",
    {
      codigoPreguntasId: uuid("blq8"),
      solucionReferencia:
        // biome-ignore lint/nursery/noSecrets: solución de referencia de ejercicio NestJS, no un secreto real
        '@Injectable()\nexport class TenantGuard implements CanActivate {\n  canActivate(ctx: ExecutionContext): boolean {\n    const req = ctx.switchToHttp().getRequest<{ headers: Record<string, string> }>()\n    if (!req.headers["x-tenant-id"]) {\n      throw new UnauthorizedException()\n    }\n    return true\n  }\n}',
      tests: [
        {
          id: "t1",
          descripcion: "Permite pasar si el header existe",
          entrada: "{ headers: { 'x-tenant-id': 'acme' } }",
          salidaEsperada: "true",
          visible: true,
        },
        {
          id: "t2",
          descripcion: "Lanza si el header falta",
          entrada: "{ headers: {} }",
          // biome-ignore lint/nursery/noSecrets: valor de test de ejemplo para datos mock, no un secreto
          salidaEsperada: "throws UnauthorizedException",
          visible: false,
        },
      ],
    },
    { esEvaluable: true, skillQueMideId: ID_SKILL_NEST },
  ),

  // -- Seccion "Prisma" --
  nuevoBloque(uuid("blq10"), ID_SEC_PRISMA_SCHEMA, 1, "PARRAFO", {
    html: "<p>El schema de Prisma es la <strong>fuente unica de verdad</strong>. Las migraciones se derivan de el con <code>prisma migrate dev</code>.</p>",
    textoPlano: "El schema de Prisma es la fuente unica de verdad.",
    tiempoLecturaMin: 2,
  }),

  // -- Seccion "Hooks React" --
  nuevoBloque(uuid("blq11"), ID_SEC_REACT_HOOKS, 1, "PARRAFO", {
    html: "<h2>Tanstack Query y la regla de oro</h2><p>Nunca uses <code>useEffect</code> para fetch en componentes. Tanstack Query gestiona cache, deduplicacion, retry y revalidacion por defecto.</p>",
    textoPlano: "Tanstack Query y la regla de oro. Nunca uses useEffect para fetch en componentes.",
    tiempoLecturaMin: 5,
  }),
  nuevoBloque(
    uuid("blq12"),
    ID_SEC_REACT_HOOKS,
    2,
    "QUIZ",
    {
      intentosMax: 3,
      solucionVisible: "tras_intento",
      ordenAleatorio: true,
      notaMinima: 70,
      preguntas: [
        {
          id: "p1",
          enunciado: "¿Que devuelve `useQuery` cuando esta cargando por primera vez?",
          opciones: [
            { id: "p1o1", texto: "data: undefined, isLoading: true", esCorrecta: true },
            { id: "p1o2", texto: "data: null, isLoading: false", esCorrecta: false },
            { id: "p1o3", texto: "Lanza una excepcion", esCorrecta: false },
          ],
          explicacion:
            "Durante la carga inicial, `data` es undefined y `isLoading` es true hasta que llega la primera respuesta.",
        },
      ],
    },
    { esEvaluable: true, skillQueMideId: ID_SKILL_REACT },
  ),
]
