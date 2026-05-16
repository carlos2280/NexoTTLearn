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
      tiempoLimiteSeg: 30,
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

  // -- Curso Java Senior · "Sintaxis basica" (sec-j1-1) — lectura + tip + quiz --
  nuevoBloque(uuid("blqJ1"), "sec-j1-1", 1, "PARRAFO", {
    html: '<h2>Sintaxis basica de Java</h2><p>Java es un lenguaje <em>estatico</em>, orientado a objetos y con tipado nominal. Cada archivo <code>.java</code> contiene una unica clase publica con el mismo nombre que el archivo.</p><pre><code class="language-java">public class Hola {\n  public static void main(String[] args) {\n    System.out.println("Hola, mundo");\n  }\n}</code></pre>',
    textoPlano:
      "Sintaxis basica de Java. Java es un lenguaje estatico, orientado a objetos y con tipado nominal.",
    tiempoLecturaMin: 3,
  }),
  nuevoBloque(uuid("blqJ2"), "sec-j1-1", 2, "TIP", {
    variante: "info",
    html: "<p>Usa <strong>var</strong> (Java 10+) para inferencia local de tipos: <code>var nombres = new ArrayList&lt;String&gt;();</code>. Sigue siendo estatico — el tipo se infiere en compilacion.</p>",
  }),
  nuevoBloque(
    uuid("blqJ3"),
    "sec-j1-1",
    3,
    "QUIZ",
    {
      intentosMax: null,
      solucionVisible: "al_aprobar",
      ordenAleatorio: false,
      notaMinima: 60,
      preguntas: [
        {
          id: "j1p1",
          enunciado: "¿Cual es el tipo retornado por el operador `instanceof`?",
          opciones: [
            { id: "j1p1o1", texto: "Class<?>", esCorrecta: false },
            { id: "j1p1o2", texto: "boolean", esCorrecta: true },
            { id: "j1p1o3", texto: "Object", esCorrecta: false },
          ],
          explicacion:
            "`instanceof` evalua si una referencia es de un tipo concreto y devuelve boolean.",
        },
      ],
    },
    { esEvaluable: true, skillQueMideId: ID_SKILL_NEST },
  ),

  // -- Curso Java Senior · "APIs REST con Spring" (sec-j2-2) — lectura + reto de codigo --
  nuevoBloque(uuid("blqJ4"), "sec-j2-2", 1, "PARRAFO", {
    html: "<h2>Endpoints REST con Spring Boot</h2><p>En Spring, un controller se declara con <code>@RestController</code> y mapea HTTP a metodos con <code>@GetMapping</code>, <code>@PostMapping</code>, etc.</p>",
    textoPlano: "Endpoints REST con Spring Boot. Controller con @RestController y mapeos HTTP.",
    tiempoLecturaMin: 4,
  }),
  nuevoBloque(uuid("blqJ5"), "sec-j2-2", 2, "CODIGO_ILUSTRATIVO", {
    lenguaje: "java",
    codigo:
      // biome-ignore lint/nursery/noSecrets: snippet ilustrativo de Spring Boot para datos mock, no un secreto
      '@RestController\n@RequestMapping("/api/usuarios")\npublic class UsuariosController {\n  private final UsuariosService service;\n\n  public UsuariosController(UsuariosService service) {\n    this.service = service;\n  }\n\n  @GetMapping("/{id}")\n  public Usuario obtener(@PathVariable String id) {\n    return service.buscarPorId(id);\n  }\n}',
    descripcion: "Controller tipico con inyeccion por constructor y un endpoint GET.",
  }),
  nuevoBloque(
    uuid("blqJ6"),
    "sec-j2-2",
    3,
    "CODIGO_PREGUNTAS",
    {
      lenguaje: "java",
      enunciado:
        "Implementa el metodo `sumar(int[] valores)` que devuelva la suma de los elementos del arreglo. Si el arreglo es vacio o null, devuelve 0.",
      esqueletoInicial:
        "public class Calculadora {\n  public int sumar(int[] valores) {\n    // tu codigo aqui\n    return 0;\n  }\n}",
      tiempoLimiteSeg: 30,
    },
    { esEvaluable: true, skillQueMideId: ID_SKILL_NEST },
  ),
  nuevoBloque(
    uuid("blqJ7"),
    "sec-j2-2",
    4,
    "CODIGO_TESTS",
    {
      codigoPreguntasId: uuid("blqJ6"),
      solucionReferencia:
        "public class Calculadora {\n  public int sumar(int[] valores) {\n    if (valores == null) return 0;\n    int total = 0;\n    for (int v : valores) total += v;\n    return total;\n  }\n}",
      tests: [
        {
          id: "jt1",
          descripcion: "Suma de un arreglo no vacio",
          entrada: "new int[]{1, 2, 3, 4}",
          salidaEsperada: "10",
          visible: true,
        },
        {
          id: "jt2",
          descripcion: "Arreglo vacio devuelve 0",
          entrada: "new int[]{}",
          salidaEsperada: "0",
          visible: true,
        },
        {
          id: "jt3",
          descripcion: "Arreglo null devuelve 0",
          entrada: "null",
          salidaEsperada: "0",
          visible: false,
        },
      ],
    },
    { esEvaluable: true, skillQueMideId: ID_SKILL_NEST },
  ),
]
