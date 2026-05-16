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

  // -- Curso Java Senior · "POO con Java" (sec-j1-2) --
  nuevoBloque(uuid("blqJ8"), "sec-j1-2", 1, "PARRAFO", {
    // biome-ignore lint/nursery/noSecrets: contenido literal de seed mock (HTML/codigo Java), no un secreto
    html: '<h2>Orientacion a objetos en Java</h2><p>Java se construye sobre cuatro pilares: <strong>encapsulacion</strong>, <strong>herencia</strong>, <strong>polimorfismo</strong> y <strong>abstraccion</strong>. Una clase encapsula datos (campos) y comportamiento (metodos) detras de un contrato publico.</p><pre><code class="language-java">public class Cuenta {\n  private BigDecimal saldo;\n\n  public Cuenta(BigDecimal saldoInicial) {\n    this.saldo = saldoInicial;\n  }\n\n  public void depositar(BigDecimal monto) {\n    if (monto.signum() <= 0) throw new IllegalArgumentException();\n    this.saldo = this.saldo.add(monto);\n  }\n\n  public BigDecimal getSaldo() {\n    return saldo;\n  }\n}</code></pre>',
    textoPlano:
      "Orientacion a objetos en Java. Cuatro pilares: encapsulacion, herencia, polimorfismo y abstraccion.",
    tiempoLecturaMin: 5,
  }),
  nuevoBloque(uuid("blqJ9"), "sec-j1-2", 2, "CODIGO_ILUSTRATIVO", {
    lenguaje: "java",
    codigo:
      "public abstract class Empleado {\n  protected final String nombre;\n\n  protected Empleado(String nombre) {\n    this.nombre = nombre;\n  }\n\n  public abstract BigDecimal calcularSalario();\n}\n\npublic class Asalariado extends Empleado {\n  private final BigDecimal salarioFijo;\n\n  public Asalariado(String nombre, BigDecimal salarioFijo) {\n    super(nombre);\n    this.salarioFijo = salarioFijo;\n  }\n\n  @Override\n  public BigDecimal calcularSalario() {\n    return salarioFijo;\n  }\n}",
    descripcion: "Herencia y polimorfismo: la subclase implementa el contrato abstracto del padre.",
  }),
  nuevoBloque(uuid("blqJ10"), "sec-j1-2", 3, "TIP", {
    variante: "info",
    html: "<p>Prefiere <strong>composicion sobre herencia</strong>. La herencia acopla rigidamente al padre; la composicion deja libre cambiar la implementacion. Solo extiende cuando la subclase es realmente un <em>tipo de</em> el padre (Liskov).</p>",
  }),
  nuevoBloque(
    uuid("blqJ11"),
    "sec-j1-2",
    4,
    "QUIZ",
    {
      intentosMax: null,
      solucionVisible: "al_aprobar",
      ordenAleatorio: false,
      notaMinima: 60,
      preguntas: [
        {
          id: "j2p1",
          enunciado:
            "¿Que modificador permite acceder a un miembro desde la misma clase y desde clases hijas, pero NO desde otras clases del mismo paquete?",
          opciones: [
            { id: "j2p1o1", texto: "private", esCorrecta: false },
            { id: "j2p1o2", texto: "protected", esCorrecta: false },
            {
              id: "j2p1o3",
              texto: "Ninguno: protected siempre permite acceso desde el mismo paquete",
              esCorrecta: true,
            },
          ],
          explicacion:
            "En Java `protected` permite acceso desde hijas Y desde el mismo paquete. No existe un modificador para solo-hijas.",
        },
      ],
    },
    { esEvaluable: true, skillQueMideId: ID_SKILL_NEST },
  ),

  // -- Curso Java Senior · "Streams y lambdas" (sec-j1-3) --
  nuevoBloque(uuid("blqJ12"), "sec-j1-3", 1, "PARRAFO", {
    html: "<h2>Streams: procesar colecciones de forma declarativa</h2><p>La Stream API (Java 8+) permite encadenar operaciones sobre colecciones: <code>filter</code>, <code>map</code>, <code>reduce</code>, <code>collect</code>. Es perezosa: nada se ejecuta hasta una operacion terminal.</p>",
    textoPlano:
      "Streams API permite procesar colecciones de forma declarativa con filter, map, reduce y collect.",
    tiempoLecturaMin: 4,
  }),
  nuevoBloque(uuid("blqJ13"), "sec-j1-3", 2, "CODIGO_ILUSTRATIVO", {
    lenguaje: "java",
    codigo:
      "List<String> nombresActivos = usuarios.stream()\n  .filter(u -> u.isActivo())\n  .map(Usuario::getNombre)\n  .sorted()\n  .collect(Collectors.toList());\n\n// Reducir a un total\nBigDecimal total = facturas.stream()\n  .map(Factura::getMonto)\n  .reduce(BigDecimal.ZERO, BigDecimal::add);",
    descripcion: "Pipeline tipico: filter -> map -> sorted -> collect. Method references con `::`.",
  }),
  nuevoBloque(uuid("blqJ14"), "sec-j1-3", 3, "VIDEO", {
    url: "https://www.youtube.com/watch?v=t1-YZ6bF-g0",
    proveedor: "youtube",
    marcarAlPorcentaje: 85,
    notas: "Atencion al ejemplo de groupingBy en el minuto 8.",
  }),
  nuevoBloque(
    uuid("blqJ15"),
    "sec-j1-3",
    4,
    "CODIGO_PREGUNTAS",
    {
      lenguaje: "java",
      enunciado:
        // biome-ignore lint/nursery/noSecrets: contenido literal de seed mock (HTML/codigo Java), no un secreto
        "Implementa `promedioEdades(List<Persona> personas)` que devuelva la edad media de las personas mayores de edad (>= 18). Si no hay ninguna, devuelve 0.0. Usa la Stream API.",
      esqueletoInicial:
        // biome-ignore lint/nursery/noSecrets: contenido literal de seed mock (HTML/codigo Java), no un secreto
        "public class Estadisticas {\n  public double promedioEdades(List<Persona> personas) {\n    // tu codigo aqui\n    return 0.0;\n  }\n}",
      tiempoLimiteSeg: 60,
    },
    { esEvaluable: true, skillQueMideId: ID_SKILL_NEST },
  ),
  nuevoBloque(
    uuid("blqJ16"),
    "sec-j1-3",
    5,
    "CODIGO_TESTS",
    {
      codigoPreguntasId: uuid("blqJ15"),
      solucionReferencia:
        // biome-ignore lint/nursery/noSecrets: contenido literal de seed mock (HTML/codigo Java), no un secreto
        "public class Estadisticas {\n  public double promedioEdades(List<Persona> personas) {\n    return personas.stream()\n      .filter(p -> p.getEdad() >= 18)\n      .mapToInt(Persona::getEdad)\n      .average()\n      .orElse(0.0);\n  }\n}",
      tests: [
        {
          id: "jt-streams-1",
          descripcion: "Promedio de 20 y 40",
          entrada: "List.of(new Persona(20), new Persona(40))",
          salidaEsperada: "30.0",
          visible: true,
        },
        {
          id: "jt-streams-2",
          descripcion: "Filtra menores: 10, 20, 30 -> media de 20 y 30",
          entrada: "List.of(new Persona(10), new Persona(20), new Persona(30))",
          salidaEsperada: "25.0",
          visible: true,
        },
        {
          id: "jt-streams-3",
          descripcion: "Lista vacia devuelve 0.0",
          entrada: "List.of()",
          salidaEsperada: "0.0",
          visible: false,
        },
      ],
    },
    { esEvaluable: true, skillQueMideId: ID_SKILL_NEST },
  ),

  // -- Curso Java Senior · "Sintaxis Spring" (sec-j2-1) --
  nuevoBloque(uuid("blqJ17"), "sec-j2-1", 1, "PARRAFO", {
    // biome-ignore lint/nursery/noSecrets: contenido literal de seed mock (HTML/codigo Java), no un secreto
    html: "<h2>Anotaciones nucleares de Spring</h2><p>Spring se basa en <strong>inyeccion de dependencias por anotaciones</strong>. Los componentes se descubren por classpath scanning y se registran en el <em>ApplicationContext</em>.</p><ul><li><code>@Component</code> — generico</li><li><code>@Service</code> — logica de negocio</li><li><code>@Repository</code> — acceso a datos</li><li><code>@Controller</code> / <code>@RestController</code> — endpoints HTTP</li></ul>",
    textoPlano:
      "Anotaciones nucleares de Spring: Component, Service, Repository, Controller, RestController.",
    tiempoLecturaMin: 4,
  }),
  nuevoBloque(uuid("blqJ18"), "sec-j2-1", 2, "CODIGO_ILUSTRATIVO", {
    lenguaje: "java",
    codigo:
      // biome-ignore lint/nursery/noSecrets: contenido literal de seed mock (HTML/codigo Java), no un secreto
      "@Service\npublic class FacturasService {\n  private final FacturasRepository repo;\n  private final EmailService email;\n\n  // Inyeccion por constructor — la forma preferida desde Spring 4.3\n  public FacturasService(FacturasRepository repo, EmailService email) {\n    this.repo = repo;\n    this.email = email;\n  }\n\n  public Factura emitir(Factura nueva) {\n    Factura guardada = repo.save(nueva);\n    email.notificarEmision(guardada);\n    return guardada;\n  }\n}",
    descripcion:
      "Inyeccion por constructor: testeable, inmutable y sin reflexion en campos privados.",
  }),
  nuevoBloque(uuid("blqJ19"), "sec-j2-1", 3, "TIP", {
    variante: "warning",
    html: "<p>Evita la <strong>inyeccion por campo</strong> (<code>@Autowired</code> sobre un atributo). Es comoda pero rompe la inmutabilidad, dificulta los tests y oculta dependencias circulares. <em>Siempre por constructor</em>.</p>",
  }),
  nuevoBloque(
    uuid("blqJ20"),
    "sec-j2-1",
    4,
    "QUIZ",
    {
      intentosMax: null,
      solucionVisible: "al_aprobar",
      ordenAleatorio: false,
      notaMinima: 60,
      preguntas: [
        {
          id: "j2-1p1",
          enunciado: "¿Cual es el scope por defecto de un bean Spring?",
          opciones: [
            { id: "j2-1p1o1", texto: "prototype (una instancia por inyeccion)", esCorrecta: false },
            { id: "j2-1p1o2", texto: "singleton (una instancia por contexto)", esCorrecta: true },
            { id: "j2-1p1o3", texto: "request (una por peticion HTTP)", esCorrecta: false },
          ],
          explicacion:
            "Por defecto los beans son singleton: una unica instancia compartida en el ApplicationContext.",
        },
      ],
    },
    { esEvaluable: true, skillQueMideId: ID_SKILL_NEST },
  ),

  // -- Curso Java Senior · "Spring Security" (sec-j2-3) --
  nuevoBloque(uuid("blqJ21"), "sec-j2-3", 1, "PARRAFO", {
    html: "<h2>Spring Security: filtros, autenticacion y autorizacion</h2><p>Spring Security se inserta como una <strong>cadena de filtros</strong> delante de tus controllers. Cada peticion pasa por filtros que autentican (¿quien eres?), autorizan (¿que puedes hacer?) y manejan sesion/CSRF.</p>",
    textoPlano:
      "Spring Security se inserta como cadena de filtros: autentican, autorizan y manejan sesion/CSRF.",
    tiempoLecturaMin: 5,
  }),
  nuevoBloque(uuid("blqJ22"), "sec-j2-3", 2, "CODIGO_ILUSTRATIVO", {
    lenguaje: "java",
    codigo:
      // biome-ignore lint/nursery/noSecrets: contenido literal de seed mock (HTML/codigo Java), no un secreto
      '@Configuration\n@EnableWebSecurity\npublic class SeguridadConfig {\n  @Bean\n  SecurityFilterChain filterChain(HttpSecurity http) throws Exception {\n    return http\n      .authorizeHttpRequests(auth -> auth\n        .requestMatchers("/api/publico/**").permitAll()\n        .requestMatchers("/api/admin/**").hasRole("ADMIN")\n        .anyRequest().authenticated())\n      .formLogin(form -> form.loginPage("/login").permitAll())\n      .logout(logout -> logout.logoutSuccessUrl("/"))\n      .build();\n  }\n\n  @Bean\n  PasswordEncoder passwordEncoder() {\n    return new BCryptPasswordEncoder(12);\n  }\n}',
    descripcion:
      "Configuracion minima: rutas publicas, rol admin, resto autenticado, bcrypt factor 12.",
  }),
  nuevoBloque(uuid("blqJ23"), "sec-j2-3", 3, "RECURSO", {
    subtipo: "enlace",
    url: "https://docs.spring.io/spring-security/reference/servlet/authorization/index.html",
    titulo: "Spring Security - Authorization",
    descripcion: "Capitulo oficial sobre autorizacion en aplicaciones servlet.",
    abrirNuevaPestana: true,
  }),
  nuevoBloque(
    uuid("blqJ24"),
    "sec-j2-3",
    4,
    "QUIZ",
    {
      intentosMax: 3,
      solucionVisible: "tras_intento",
      ordenAleatorio: false,
      notaMinima: 70,
      preguntas: [
        {
          id: "j2-3p1",
          enunciado:
            "¿Que factor de coste minimo recomienda OWASP para BCryptPasswordEncoder en hardware moderno?",
          opciones: [
            { id: "j2-3p1o1", texto: "4", esCorrecta: false },
            { id: "j2-3p1o2", texto: "10", esCorrecta: false },
            { id: "j2-3p1o3", texto: "12 o superior", esCorrecta: true },
          ],
          explicacion:
            "Factor 12 toma ~300ms en hardware moderno: aceptable para login, lento para ataques de diccionario.",
        },
      ],
    },
    { esEvaluable: true, skillQueMideId: ID_SKILL_NEST },
  ),

  // -- Curso Java Senior · "Spring Data" (sec-j2-4) --
  nuevoBloque(uuid("blqJ25"), "sec-j2-4", 1, "PARRAFO", {
    html: "<h2>Spring Data JPA: repositorios sin implementacion</h2><p>Spring Data genera implementaciones de repositorios en tiempo de arranque a partir de interfaces. Solo declaras los metodos siguiendo una convencion de nombres y Spring sintetiza las queries.</p>",
    textoPlano:
      "Spring Data genera implementaciones de repositorios a partir de interfaces siguiendo convencion de nombres.",
    tiempoLecturaMin: 4,
  }),
  nuevoBloque(uuid("blqJ26"), "sec-j2-4", 2, "TIP", {
    variante: "info",
    html: "<p>Para queries que no encajan en la convencion de nombres, usa <code>@Query</code> con JPQL o SQL nativo. Pero antes pregunta: ¿el problema esta en el repositorio o en un modelo mal disenado?</p>",
  }),
  nuevoBloque(uuid("blqJ27"), "sec-j2-4", 3, "CODIGO_ILUSTRATIVO", {
    lenguaje: "java",
    codigo:
      // biome-ignore lint/nursery/noSecrets: contenido literal de seed mock (HTML/codigo Java), no un secreto
      'public interface FacturasRepository extends JpaRepository<Factura, Long> {\n  // Query derivada del nombre del metodo\n  List<Factura> findByClienteIdAndEstadoOrderByFechaDesc(Long clienteId, EstadoFactura estado);\n\n  // Query explicita con JPQL\n  @Query("SELECT f FROM Factura f WHERE f.monto > :umbral AND f.fecha >= :desde")\n  List<Factura> buscarGrandesDesde(@Param("umbral") BigDecimal umbral, @Param("desde") LocalDate desde);\n}',
    descripcion: "Dos formas: convencion de nombre y @Query con JPQL parametrizado.",
  }),
  nuevoBloque(
    uuid("blqJ28"),
    "sec-j2-4",
    4,
    "CODIGO_PREGUNTAS",
    {
      lenguaje: "java",
      enunciado:
        // biome-ignore lint/nursery/noSecrets: contenido literal de seed mock (HTML/codigo Java), no un secreto
        "Declara el metodo en la interfaz `ProductosRepository` que devuelva todos los productos cuyo `precio` este entre `min` y `max` (inclusive), ordenados por precio ascendente. Usa la convencion de nombres de Spring Data.",
      esqueletoInicial:
        // biome-ignore lint/nursery/noSecrets: contenido literal de seed mock (HTML/codigo Java), no un secreto
        "public interface ProductosRepository extends JpaRepository<Producto, Long> {\n  // declara aqui el metodo\n}",
      tiempoLimiteSeg: 45,
    },
    { esEvaluable: true, skillQueMideId: ID_SKILL_NEST },
  ),
  nuevoBloque(
    uuid("blqJ29"),
    "sec-j2-4",
    5,
    "CODIGO_TESTS",
    {
      codigoPreguntasId: uuid("blqJ28"),
      solucionReferencia:
        // biome-ignore lint/nursery/noSecrets: contenido literal de seed mock (HTML/codigo Java), no un secreto
        "public interface ProductosRepository extends JpaRepository<Producto, Long> {\n  List<Producto> findByPrecioBetweenOrderByPrecioAsc(BigDecimal min, BigDecimal max);\n}",
      tests: [
        {
          id: "jt-spd-1",
          // biome-ignore lint/nursery/noSecrets: contenido literal de seed mock (HTML/codigo Java), no un secreto
          descripcion: "El metodo se llama findByPrecioBetweenOrderByPrecioAsc",
          entrada: "metodo.getName()",
          // biome-ignore lint/nursery/noSecrets: contenido literal de seed mock (HTML/codigo Java), no un secreto
          salidaEsperada: '"findByPrecioBetweenOrderByPrecioAsc"',
          visible: true,
        },
        {
          id: "jt-spd-2",
          descripcion: "Devuelve List<Producto>",
          entrada: "metodo.getReturnType().getSimpleName()",
          salidaEsperada: '"List"',
          visible: false,
        },
      ],
    },
    { esEvaluable: true, skillQueMideId: ID_SKILL_NEST },
  ),

  // -- Curso Java Senior · "JPA basico" (sec-j3-1) --
  nuevoBloque(uuid("blqJ30"), "sec-j3-1", 1, "PARRAFO", {
    html: "<h2>JPA: mapear objetos a tablas</h2><p>JPA (Java Persistence API) define como mapear entidades Java a tablas relacionales. Las anotaciones <code>@Entity</code>, <code>@Id</code>, <code>@Column</code> y las relaciones <code>@OneToMany</code> / <code>@ManyToOne</code> son el ABC.</p>",
    textoPlano:
      "JPA mapea entidades Java a tablas relacionales con @Entity, @Id, @Column y relaciones.",
    tiempoLecturaMin: 5,
  }),
  nuevoBloque(uuid("blqJ31"), "sec-j3-1", 2, "CODIGO_ILUSTRATIVO", {
    lenguaje: "java",
    codigo:
      // biome-ignore lint/nursery/noSecrets: contenido literal de seed mock (HTML/codigo Java), no un secreto
      '@Entity\n@Table(name = "facturas")\npublic class Factura {\n  @Id\n  @GeneratedValue(strategy = GenerationType.IDENTITY)\n  private Long id;\n\n  @Column(nullable = false, precision = 12, scale = 2)\n  private BigDecimal monto;\n\n  @ManyToOne(fetch = FetchType.LAZY)\n  @JoinColumn(name = "cliente_id", nullable = false)\n  private Cliente cliente;\n\n  @OneToMany(mappedBy = "factura", cascade = CascadeType.ALL, orphanRemoval = true)\n  private List<LineaFactura> lineas = new ArrayList<>();\n}',
    descripcion:
      "FetchType.LAZY por defecto en ManyToOne — evita cargar el cliente si no se accede.",
  }),
  nuevoBloque(uuid("blqJ32"), "sec-j3-1", 3, "VIDEO", {
    // biome-ignore lint/nursery/noSecrets: URL de YouTube de ejemplo para datos mock, no un secreto
    url: "https://www.youtube.com/watch?v=W9KMSDS3o3o",
    proveedor: "youtube",
    marcarAlPorcentaje: 80,
    notas: "El bloque sobre LazyInitializationException es clave (minuto 12).",
  }),
  nuevoBloque(
    uuid("blqJ33"),
    "sec-j3-1",
    4,
    "QUIZ",
    {
      intentosMax: null,
      solucionVisible: "al_aprobar",
      ordenAleatorio: false,
      notaMinima: 60,
      preguntas: [
        {
          id: "j3-1p1",
          enunciado: "¿Cual es el FetchType por defecto en una relacion @OneToMany?",
          opciones: [
            { id: "j3-1p1o1", texto: "EAGER", esCorrecta: false },
            { id: "j3-1p1o2", texto: "LAZY", esCorrecta: true },
            {
              id: "j3-1p1o3",
              texto: "No tiene default, hay que declararlo siempre",
              esCorrecta: false,
            },
          ],
          explicacion:
            "@OneToMany y @ManyToMany son LAZY por defecto. @ManyToOne y @OneToOne son EAGER (pero conviene cambiarlas a LAZY).",
        },
      ],
    },
    { esEvaluable: true, skillQueMideId: ID_SKILL_NEST },
  ),

  // -- Curso Java Senior · "Transacciones" (sec-j3-2) --
  nuevoBloque(uuid("blqJ34"), "sec-j3-2", 1, "PARRAFO", {
    // biome-ignore lint/nursery/noSecrets: contenido literal de seed mock (HTML/codigo Java), no un secreto
    html: "<h2>@Transactional: el contrato ACID de Spring</h2><p>Anotar un metodo con <code>@Transactional</code> envuelve su ejecucion en una transaccion. Si el metodo lanza una <em>RuntimeException</em>, Spring hace <strong>rollback</strong>. Si termina normalmente, hace <strong>commit</strong>.</p>",
    textoPlano:
      "@Transactional envuelve la ejecucion en una transaccion: rollback en RuntimeException, commit si todo va bien.",
    tiempoLecturaMin: 5,
  }),
  nuevoBloque(uuid("blqJ35"), "sec-j3-2", 2, "TIP", {
    variante: "warning",
    // biome-ignore lint/nursery/noSecrets: contenido literal de seed mock (HTML/codigo Java), no un secreto
    html: "<p><strong>Trampa clasica</strong>: por defecto Spring solo hace rollback ante <em>RuntimeException</em>, no ante excepciones <em>checked</em>. Si quieres rollback en una checked, usa <code>@Transactional(rollbackFor = Exception.class)</code>.</p>",
  }),
  nuevoBloque(uuid("blqJ36"), "sec-j3-2", 3, "CODIGO_ILUSTRATIVO", {
    lenguaje: "java",
    codigo:
      // biome-ignore lint/nursery/noSecrets: contenido literal de seed mock (HTML/codigo Java), no un secreto
      "@Service\npublic class TransferenciasService {\n  private final CuentasRepository cuentas;\n\n  public TransferenciasService(CuentasRepository cuentas) {\n    this.cuentas = cuentas;\n  }\n\n  @Transactional\n  public void transferir(Long origenId, Long destinoId, BigDecimal monto) {\n    Cuenta origen = cuentas.findById(origenId).orElseThrow();\n    Cuenta destino = cuentas.findById(destinoId).orElseThrow();\n\n    origen.retirar(monto);   // puede lanzar SaldoInsuficiente (RuntimeException)\n    destino.depositar(monto);\n\n    cuentas.save(origen);\n    cuentas.save(destino);\n  }\n}",
    descripcion: "Si retirar() lanza SaldoInsuficiente, ni origen ni destino quedan modificados.",
  }),
  nuevoBloque(
    uuid("blqJ37"),
    "sec-j3-2",
    4,
    "QUIZ",
    {
      intentosMax: 3,
      solucionVisible: "tras_intento",
      ordenAleatorio: false,
      notaMinima: 70,
      preguntas: [
        {
          id: "j3-2p1",
          enunciado:
            "Llamas a un metodo @Transactional desde otro metodo de la MISMA clase. ¿Que pasa con la transaccion?",
          opciones: [
            {
              id: "j3-2p1o1",
              texto: "Se crea una nueva transaccion normalmente",
              esCorrecta: false,
            },
            {
              id: "j3-2p1o2",
              texto: "El @Transactional es ignorado: no hay proxy intermedio",
              esCorrecta: true,
            },
            { id: "j3-2p1o3", texto: "Spring lanza una excepcion en arranque", esCorrecta: false },
          ],
          explicacion:
            "@Transactional funciona via proxy. Una llamada interna no pasa por el proxy, asi que la anotacion no aplica. Hay que extraer el metodo a otro bean.",
        },
      ],
    },
    { esEvaluable: true, skillQueMideId: ID_SKILL_NEST },
  ),

  // -- Curso Java Senior · "Tuning de queries" (sec-j3-3, OPCIONAL) --
  nuevoBloque(uuid("blqJ38"), "sec-j3-3", 1, "PARRAFO", {
    html: '<h2>El problema N+1 y como detectarlo</h2><p>El sintoma mas comun de bajo rendimiento en JPA es el <strong>N+1</strong>: una query para cargar la lista padre, mas N queries para cargar la coleccion de cada hijo. Aparece cuando iteras sobre una relacion LAZY sin haber hecho <code>JOIN FETCH</code>.</p><pre><code class="language-java">// 1 + N queries — antipatron\nList&lt;Factura&gt; facturas = repo.findAll();\nfor (Factura f : facturas) {\n  f.getLineas().size(); // N queries adicionales\n}</code></pre>',
    textoPlano:
      "El problema N+1 en JPA: una query para el padre, N queries para los hijos al iterar relacion LAZY.",
    tiempoLecturaMin: 6,
  }),
  nuevoBloque(uuid("blqJ39"), "sec-j3-3", 2, "RECURSO", {
    subtipo: "enlace",
    url: "https://vladmihalcea.com/n-plus-1-query-problem/",
    titulo: "Vlad Mihalcea - The N+1 query problem",
    descripcion: "Articulo de referencia con ejemplos de JOIN FETCH y EntityGraph.",
    abrirNuevaPestana: true,
  }),
  nuevoBloque(uuid("blqJ40"), "sec-j3-3", 3, "TIP", {
    variante: "info",
    html: "<p>Para diagnosticar N+1 en desarrollo, activa <code>spring.jpa.show-sql=true</code> y <code>logging.level.org.hibernate.SQL=DEBUG</code>. En produccion, usa una herramienta como <strong>p6spy</strong> que cuenta queries por request.</p>",
  }),
  nuevoBloque(
    uuid("blqJ41"),
    "sec-j3-3",
    4,
    "QUIZ",
    {
      intentosMax: null,
      solucionVisible: "al_aprobar",
      ordenAleatorio: false,
      notaMinima: 60,
      preguntas: [
        {
          id: "j3-3p1",
          enunciado:
            "¿Cual es la forma idiomatica en JPQL de evitar el N+1 al cargar facturas con sus lineas?",
          opciones: [
            {
              id: "j3-3p1o1",
              texto: "SELECT f FROM Factura f JOIN FETCH f.lineas",
              esCorrecta: true,
            },
            {
              id: "j3-3p1o2",
              texto: "SELECT f, l FROM Factura f, LineaFactura l WHERE l.factura = f",
              esCorrecta: false,
            },
            { id: "j3-3p1o3", texto: "Marcar la relacion como EAGER y rezar", esCorrecta: false },
          ],
          explicacion:
            "JOIN FETCH carga el padre y la coleccion hija en una sola query. EntityGraph es la alternativa declarativa.",
        },
      ],
    },
    { esEvaluable: true, skillQueMideId: ID_SKILL_NEST },
  ),
]
