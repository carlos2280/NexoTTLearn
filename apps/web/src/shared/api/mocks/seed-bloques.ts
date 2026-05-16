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
const ID_SKILL_HTML = uuid("skill9")
const ID_SKILL_PYTHON = uuid("skill10")
const ID_SKILL_GIT = uuid("skill11")
const ID_SKILL_AZURE = uuid("skill12")

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

  // ============================================================
  // Curso "Fundamentos Full-Stack & DevOps" (curso-fullstack-devops)
  // Curso base de referencia: HTML, JS, TS, Python, Git, Azure.
  // CODIGO_PREGUNTAS solo en JS/TS/Python (lenguajes ejecutables
  // por el sandbox del navegador). HTML, Git, Azure usan
  // PARRAFO/CODIGO_ILUSTRATIVO/VIDEO/QUIZ/RECURSO/TIP.
  // ============================================================

  // -- sec-fs-1-1: HTML semantico --
  nuevoBloque(uuid("blqFS1"), "sec-fs-1-1", 1, "PARRAFO", {
    // biome-ignore lint/nursery/noSecrets: contenido literal de seed mock (HTML), no un secreto
    html: '<h2>HTML semantico: el cimiento del frontend</h2><p>Usar la etiqueta correcta no es una decoracion: es el contrato con el navegador, el lector de pantallas y el motor de busqueda. Un <code>&lt;div&gt;</code> con <code>role="button"</code> nunca sera tan accesible como un <code>&lt;button&gt;</code>.</p>',
    textoPlano:
      "HTML semantico es el contrato con navegador, lector de pantallas y SEO. Usa la etiqueta correcta.",
    tiempoLecturaMin: 3,
  }),
  nuevoBloque(uuid("blqFS2"), "sec-fs-1-1", 2, "CODIGO_ILUSTRATIVO", {
    lenguaje: "html",
    codigo:
      // biome-ignore lint/nursery/noSecrets: contenido literal de seed mock (HTML/codigo), no un secreto
      '<!doctype html>\n<html lang="es">\n  <head><title>Mi pagina</title></head>\n  <body>\n    <header>\n      <nav aria-label="Principal">…</nav>\n    </header>\n    <main>\n      <article>\n        <h1>Titulo del articulo</h1>\n        <p>…</p>\n      </article>\n      <aside>Contenido relacionado</aside>\n    </main>\n    <footer>©…</footer>\n  </body>\n</html>',
    descripcion: "Estructura semantica minima: header, nav, main, article, aside, footer.",
  }),
  nuevoBloque(uuid("blqFS3"), "sec-fs-1-1", 3, "TIP", {
    variante: "info",
    html: "<p>Regla simple: <strong>ARIA es el ultimo recurso</strong>. Si existe un elemento HTML nativo que hace lo que necesitas, usalo. Solo aplica <code>role</code> y atributos <code>aria-*</code> cuando no haya alternativa nativa.</p>",
  }),
  nuevoBloque(
    uuid("blqFS4"),
    "sec-fs-1-1",
    4,
    "QUIZ",
    {
      intentosMax: null,
      solucionVisible: "al_aprobar",
      ordenAleatorio: false,
      notaMinima: 60,
      preguntas: [
        {
          id: "fs1p1",
          enunciado: "¿Que etiqueta es la correcta para la navegacion principal de la pagina?",
          opciones: [
            { id: "fs1p1o1", texto: '<div class="nav">', esCorrecta: false },
            { id: "fs1p1o2", texto: "<nav>", esCorrecta: true },
            { id: "fs1p1o3", texto: '<section role="navigation">', esCorrecta: false },
          ],
          explicacion: "<nav> ya implica role=navigation. No hace falta el role explicito.",
        },
      ],
    },
    { esEvaluable: true, skillQueMideId: ID_SKILL_HTML },
  ),

  // -- sec-fs-1-2: JavaScript moderno --
  nuevoBloque(uuid("blqFS5"), "sec-fs-1-2", 1, "PARRAFO", {
    // biome-ignore lint/nursery/noSecrets: contenido literal de seed mock (HTML/JS), no un secreto
    html: "<h2>JavaScript moderno (ES2020+)</h2><p>Las versiones recientes de JavaScript trajeron tres herramientas que reescriben el dia a dia: <strong>optional chaining</strong> (<code>?.</code>), <strong>nullish coalescing</strong> (<code>??</code>) y <strong>destructuring</strong> con valores por defecto.</p>",
    textoPlano:
      "JavaScript moderno: optional chaining, nullish coalescing, destructuring con defaults.",
    tiempoLecturaMin: 3,
  }),
  nuevoBloque(uuid("blqFS6"), "sec-fs-1-2", 2, "CODIGO_ILUSTRATIVO", {
    lenguaje: "javascript",
    codigo:
      "// Optional chaining: nada explota si usuario es undefined\nconst ciudad = usuario?.direccion?.ciudad\n\n// Nullish coalescing: solo cae al default si es null/undefined (no si es 0 o '')\nconst limite = config.limite ?? 100\n\n// Destructuring con default y rename\nconst { nombre: titulo = 'Sin titulo', tags = [] } = articulo",
    descripcion: "Tres patrones cotidianos que evitan bucles de validacion manual.",
  }),
  nuevoBloque(uuid("blqFS7"), "sec-fs-1-2", 3, "TIP", {
    variante: "warning",
    html: "<p><strong>Trampa frecuente</strong>: <code>||</code> y <code>??</code> no son lo mismo. <code>0 || 100</code> devuelve 100; <code>0 ?? 100</code> devuelve 0. Si el valor cero es legitimo, usa <code>??</code>.</p>",
  }),
  nuevoBloque(
    uuid("blqFS8"),
    "sec-fs-1-2",
    4,
    "CODIGO_PREGUNTAS",
    {
      lenguaje: "javascript",
      enunciado:
        // biome-ignore lint/nursery/noSecrets: contenido literal de seed mock (HTML/codigo), no un secreto
        "Implementa `deduplicar(palabras)` que reciba un array de strings y devuelva un nuevo array sin duplicados, conservando el orden de aparicion. Si la entrada es null o undefined, devuelve un array vacio.",
      // biome-ignore lint/nursery/noSecrets: contenido literal de seed mock (HTML/codigo), no un secreto
      esqueletoInicial: "function deduplicar(palabras) {\n  // tu codigo aqui\n  return []\n}",
      tiempoLimiteSeg: 30,
    },
    { esEvaluable: true, skillQueMideId: ID_SKILL_TS },
  ),
  nuevoBloque(
    uuid("blqFS9"),
    "sec-fs-1-2",
    5,
    "CODIGO_TESTS",
    {
      codigoPreguntasId: uuid("blqFS8"),
      solucionReferencia:
        // biome-ignore lint/nursery/noSecrets: contenido literal de seed mock (HTML/codigo), no un secreto
        "function deduplicar(palabras) {\n  if (!palabras) return []\n  return Array.from(new Set(palabras))\n}",
      tests: [
        {
          id: "fs-js-1",
          descripcion: "Quita duplicados conservando orden",
          entrada: "['a', 'b', 'a', 'c', 'b']",
          salidaEsperada: "['a', 'b', 'c']",
          visible: true,
        },
        {
          id: "fs-js-2",
          descripcion: "Array vacio devuelve vacio",
          entrada: "[]",
          salidaEsperada: "[]",
          visible: true,
        },
        {
          id: "fs-js-3",
          descripcion: "null devuelve array vacio",
          entrada: "null",
          salidaEsperada: "[]",
          visible: false,
        },
      ],
    },
    { esEvaluable: true, skillQueMideId: ID_SKILL_TS },
  ),

  // -- sec-fs-1-3: TypeScript esencial --
  nuevoBloque(uuid("blqFS10"), "sec-fs-1-3", 1, "PARRAFO", {
    html: "<h2>TypeScript: el contrato del codigo</h2><p>TypeScript no es JavaScript con anotaciones: es un sistema de tipos que el compilador usa para detectar errores antes de que lleguen a produccion. Las dos herramientas basicas son <code>interface</code> (para formas de objeto extensibles) y <code>type</code> (para uniones, intersecciones y derivados).</p>",
    textoPlano:
      "TypeScript es un sistema de tipos para detectar errores en compilacion. Interface vs type.",
    tiempoLecturaMin: 4,
  }),
  nuevoBloque(uuid("blqFS11"), "sec-fs-1-3", 2, "CODIGO_ILUSTRATIVO", {
    lenguaje: "typescript",
    codigo:
      // biome-ignore lint/nursery/noSecrets: contenido literal de seed mock (HTML/codigo), no un secreto
      "interface Usuario {\n  readonly id: string\n  email: string\n  rol: 'ADMIN' | 'EDITOR' | 'LECTOR'\n}\n\ntype Resultado<T> =\n  | { ok: true; data: T }\n  | { ok: false; error: string }\n\nfunction procesar(u: Usuario): Resultado<string> {\n  if (u.rol === 'LECTOR') return { ok: false, error: 'sin permisos' }\n  return { ok: true, data: `Hola, ${u.email}` }\n}",
    descripcion: "Interface para forma, type para uniones discriminadas y genericos.",
  }),
  nuevoBloque(uuid("blqFS12"), "sec-fs-1-3", 3, "TIP", {
    variante: "info",
    html: "<p>Para acotar tipos dentro de un bloque, usa <strong>narrowing</strong>: <code>typeof x === 'string'</code>, <code>'prop' in obj</code>, o type guards personalizados con la firma <code>(x): x is T</code>. El compilador entiende y reduce el tipo automaticamente.</p>",
  }),
  nuevoBloque(
    uuid("blqFS13"),
    "sec-fs-1-3",
    4,
    "CODIGO_PREGUNTAS",
    {
      lenguaje: "typescript",
      enunciado:
        "Implementa la funcion generica `agruparPor<T, K extends string>(items: T[], clave: (item: T) => K): Record<K, T[]>` que agrupa los items segun la clave devuelta por la funcion.",
      esqueletoInicial:
        "function agruparPor<T, K extends string>(\n  items: T[],\n  clave: (item: T) => K,\n): Record<K, T[]> {\n  // tu codigo aqui\n  return {} as Record<K, T[]>\n}",
      tiempoLimiteSeg: 60,
    },
    { esEvaluable: true, skillQueMideId: ID_SKILL_TS },
  ),
  nuevoBloque(
    uuid("blqFS14"),
    "sec-fs-1-3",
    5,
    "CODIGO_TESTS",
    {
      codigoPreguntasId: uuid("blqFS13"),
      solucionReferencia:
        "function agruparPor<T, K extends string>(items: T[], clave: (item: T) => K): Record<K, T[]> {\n  const acc = {} as Record<K, T[]>\n  for (const item of items) {\n    const k = clave(item)\n    if (!acc[k]) acc[k] = []\n    acc[k].push(item)\n  }\n  return acc\n}",
      tests: [
        {
          id: "fs-ts-1",
          descripcion: "Agrupa numeros por par/impar",
          entrada: "agruparPor([1,2,3,4], n => n % 2 === 0 ? 'par' : 'impar')",
          salidaEsperada: "{ impar: [1,3], par: [2,4] }",
          visible: true,
        },
        {
          id: "fs-ts-2",
          descripcion: "Array vacio devuelve objeto vacio",
          entrada: "agruparPor([], () => 'x')",
          salidaEsperada: "{}",
          visible: false,
        },
      ],
    },
    { esEvaluable: true, skillQueMideId: ID_SKILL_TS },
  ),
  nuevoBloque(
    uuid("blqFS15"),
    "sec-fs-1-3",
    6,
    "QUIZ",
    {
      intentosMax: 3,
      solucionVisible: "tras_intento",
      ordenAleatorio: false,
      notaMinima: 60,
      preguntas: [
        {
          id: "fs-tsp1",
          enunciado: "¿Cual es la diferencia clave entre `interface` y `type` en TypeScript?",
          opciones: [
            { id: "fs-tsp1o1", texto: "No hay diferencia, son sinonimos", esCorrecta: false },
            {
              id: "fs-tsp1o2",
              texto:
                "interface admite declaration merging y se prefiere para contratos extensibles; type admite uniones, intersecciones y mapped types",
              esCorrecta: true,
            },
            { id: "fs-tsp1o3", texto: "type es mas rapido en compilacion", esCorrecta: false },
          ],
          explicacion:
            "Interface se reabre (declaration merging). Type es mas flexible para uniones y derivados.",
        },
      ],
    },
    { esEvaluable: true, skillQueMideId: ID_SKILL_TS },
  ),

  // -- sec-fs-2-1: Python para APIs --
  nuevoBloque(uuid("blqFS16"), "sec-fs-2-1", 1, "PARRAFO", {
    html: "<h2>Python: legibilidad como filosofia</h2><p>Python prioriza que el codigo se lea como una frase. Para APIs hoy hay un estandar de facto: <strong>FastAPI</strong>, que combina type hints con generacion automatica de OpenAPI y validacion con Pydantic.</p>",
    textoPlano:
      "Python prioriza legibilidad. FastAPI combina type hints, OpenAPI y validacion Pydantic.",
    tiempoLecturaMin: 3,
  }),
  nuevoBloque(uuid("blqFS17"), "sec-fs-2-1", 2, "CODIGO_ILUSTRATIVO", {
    lenguaje: "python",
    codigo:
      "from fastapi import FastAPI\nfrom pydantic import BaseModel\n\napp = FastAPI()\n\nclass Usuario(BaseModel):\n    email: str\n    nombre: str\n\n@app.post('/usuarios')\ndef crear(u: Usuario):\n    return {'id': 'u_123', **u.dict()}",
    descripcion: "Endpoint POST minimo. Pydantic valida el body, FastAPI genera la doc OpenAPI.",
  }),
  nuevoBloque(uuid("blqFS18"), "sec-fs-2-1", 3, "VIDEO", {
    url: "https://www.youtube.com/watch?v=7t2alSnE2-I",
    proveedor: "youtube",
    marcarAlPorcentaje: 85,
    notas: "Introduccion a FastAPI por el autor original (Sebastian Ramirez).",
  }),
  nuevoBloque(
    uuid("blqFS19"),
    "sec-fs-2-1",
    4,
    "CODIGO_PREGUNTAS",
    {
      lenguaje: "python",
      enunciado:
        "Implementa `contar_palabras(texto)` que devuelva un dict con la frecuencia de cada palabra (lowercase). Ignora signos de puntuacion basicos (.,;:!?). Si el texto es vacio o None, devuelve {}.",
      esqueletoInicial: "def contar_palabras(texto):\n    # tu codigo aqui\n    return {}",
      tiempoLimiteSeg: 60,
    },
    { esEvaluable: true, skillQueMideId: ID_SKILL_PYTHON },
  ),
  nuevoBloque(
    uuid("blqFS20"),
    "sec-fs-2-1",
    5,
    "CODIGO_TESTS",
    {
      codigoPreguntasId: uuid("blqFS19"),
      solucionReferencia:
        "import re\n\ndef contar_palabras(texto):\n    if not texto:\n        return {}\n    limpio = re.sub(r'[.,;:!?]', ' ', texto.lower())\n    freq = {}\n    for palabra in limpio.split():\n        freq[palabra] = freq.get(palabra, 0) + 1\n    return freq",
      tests: [
        {
          id: "fs-py-1",
          descripcion: "Frase simple, dos palabras repetidas",
          entrada: "'hola mundo hola'",
          salidaEsperada: "{'hola': 2, 'mundo': 1}",
          visible: true,
        },
        {
          id: "fs-py-2",
          descripcion: "Ignora puntuacion y mayusculas",
          entrada: "'Hola, mundo. HOLA!'",
          salidaEsperada: "{'hola': 2, 'mundo': 1}",
          visible: true,
        },
        {
          id: "fs-py-3",
          descripcion: "None devuelve dict vacio",
          entrada: "None",
          salidaEsperada: "{}",
          visible: false,
        },
      ],
    },
    { esEvaluable: true, skillQueMideId: ID_SKILL_PYTHON },
  ),

  // -- sec-fs-3-1: Git workflow basico --
  nuevoBloque(uuid("blqFS21"), "sec-fs-3-1", 1, "PARRAFO", {
    html: "<h2>El ciclo del dia a dia</h2><p>El 90% del trabajo con Git es la misma secuencia: <code>status</code> para ver donde estas, <code>add</code> para preparar cambios, <code>commit</code> para guardarlos con mensaje, y <code>push</code> para publicarlos al remoto.</p>",
    textoPlano: "El ciclo basico de Git: status, add, commit, push. Es el 90% del dia a dia.",
    tiempoLecturaMin: 3,
  }),
  nuevoBloque(uuid("blqFS22"), "sec-fs-3-1", 2, "CODIGO_ILUSTRATIVO", {
    lenguaje: "bash",
    codigo:
      '# ver que cambio\ngit status\n\n# preparar cambios (stage)\ngit add src/nuevo-archivo.ts\ngit add -p   # interactivo: revisa hunk por hunk\n\n# guardar con mensaje\ngit commit -m "feat(login): permitir reset de password"\n\n# publicar al remoto\ngit push origin mi-rama',
    descripcion: "Comandos del flujo basico. `git add -p` es el mejor amigo para commits limpios.",
  }),
  nuevoBloque(uuid("blqFS23"), "sec-fs-3-1", 3, "TIP", {
    variante: "info",
    // biome-ignore lint/nursery/noSecrets: contenido literal de seed mock (HTML/codigo), no un secreto
    html: "<p><strong>Mensajes de commit</strong>: usa el formato <em>Conventional Commits</em> — <code>tipo(scope): descripcion</code>. Tipos comunes: <code>feat</code>, <code>fix</code>, <code>refactor</code>, <code>docs</code>, <code>test</code>, <code>chore</code>. Tu yo del futuro te lo agradecera al hacer <code>git log</code>.</p>",
  }),
  nuevoBloque(
    uuid("blqFS24"),
    "sec-fs-3-1",
    4,
    "QUIZ",
    {
      intentosMax: null,
      solucionVisible: "al_aprobar",
      ordenAleatorio: false,
      notaMinima: 60,
      preguntas: [
        {
          id: "fs-gitp1",
          enunciado: "¿Que hace `git stash`?",
          opciones: [
            { id: "fs-gitp1o1", texto: "Borra los cambios sin guardar", esCorrecta: false },
            {
              id: "fs-gitp1o2",
              texto:
                "Guarda los cambios temporalmente fuera del working tree para recuperarlos despues",
              esCorrecta: true,
            },
            { id: "fs-gitp1o3", texto: "Hace push de los cambios sin commit", esCorrecta: false },
          ],
          explicacion:
            "`git stash` aparca los cambios. Se recuperan con `git stash pop` o `git stash apply`.",
        },
      ],
    },
    { esEvaluable: true, skillQueMideId: ID_SKILL_GIT },
  ),

  // -- sec-fs-3-2: Git ramas y PRs --
  nuevoBloque(uuid("blqFS25"), "sec-fs-3-2", 1, "PARRAFO", {
    html: "<h2>Ramas: trabajo aislado</h2><p>Una rama es un puntero ligero a un commit. Crear una rama es instantaneo y barato. La regla profesional: <strong>una rama por feature o por fix</strong>, fusionada via Pull Request con revision de un compañero.</p>",
    textoPlano:
      "Una rama es un puntero a commit. Regla: una rama por feature/fix, mergeada via PR revisado.",
    tiempoLecturaMin: 4,
  }),
  nuevoBloque(uuid("blqFS26"), "sec-fs-3-2", 2, "VIDEO", {
    // biome-ignore lint/nursery/noSecrets: contenido literal de seed mock (HTML/codigo), no un secreto
    url: "https://www.youtube.com/watch?v=e2IbNHi4uCI",
    proveedor: "youtube",
    marcarAlPorcentaje: 80,
    notas: "Explicacion visual de ramas, merge y rebase.",
  }),
  nuevoBloque(uuid("blqFS27"), "sec-fs-3-2", 3, "TIP", {
    variante: "warning",
    html: "<p><strong>Rebase vs merge</strong>: usa <code>git merge</code> en ramas publicas que otros usan. Usa <code>git rebase</code> en tu rama personal antes de abrir el PR para mantener el historico lineal. <em>Nunca</em> hagas rebase de commits ya empujados a una rama compartida.</p>",
  }),
  nuevoBloque(uuid("blqFS28"), "sec-fs-3-2", 4, "CODIGO_ILUSTRATIVO", {
    lenguaje: "bash",
    codigo:
      '# crear rama desde develop actualizado\ngit checkout develop\ngit pull\ngit checkout -b feat/login-google\n\n# trabajar, commits...\ngit push -u origin feat/login-google\n\n# abrir PR via gh CLI\ngh pr create --title "feat(auth): login con Google" \\\n  --body "Implementa OAuth con provider Google."\n\n# tras aprobacion del review, mergear via UI o:\ngh pr merge --squash --delete-branch',
    descripcion: "Flujo completo: crear rama, push, abrir PR con gh CLI, mergear con squash.",
  }),
  nuevoBloque(
    uuid("blqFS29"),
    "sec-fs-3-2",
    5,
    "QUIZ",
    {
      intentosMax: 3,
      solucionVisible: "tras_intento",
      ordenAleatorio: false,
      notaMinima: 70,
      preguntas: [
        {
          id: "fs-gitp2",
          enunciado: "¿Que es un fast-forward merge?",
          opciones: [
            {
              id: "fs-gitp2o1",
              texto:
                "Cuando Git avanza el puntero de la rama destino sin crear un merge commit porque no hubo divergencia",
              esCorrecta: true,
            },
            {
              id: "fs-gitp2o2",
              texto: "Un merge automatico sin revision humana",
              esCorrecta: false,
            },
            { id: "fs-gitp2o3", texto: "Un alias de rebase", esCorrecta: false },
          ],
          explicacion:
            "Fast-forward solo es posible si la rama destino no ha divergido del origen del branch.",
        },
      ],
    },
    { esEvaluable: true, skillQueMideId: ID_SKILL_GIT },
  ),

  // -- sec-fs-4-1: Azure servicios core --
  nuevoBloque(uuid("blqFS30"), "sec-fs-4-1", 1, "PARRAFO", {
    // biome-ignore lint/nursery/noSecrets: contenido literal de seed mock (HTML/Azure), no un secreto
    html: "<h2>Los 4 servicios de Azure que tienes que conocer</h2><ul><li><strong>App Service</strong> — hosting de apps web y APIs con escalado gestionado.</li><li><strong>Storage Account (Blob)</strong> — almacenamiento de archivos a precio bajo.</li><li><strong>Azure SQL / Cosmos DB</strong> — base de datos relacional o NoSQL gestionada.</li><li><strong>Static Web Apps</strong> — hosting de SPA + Functions integradas, gratis para proyectos pequeños.</li></ul>",
    textoPlano:
      "4 servicios Azure clave: App Service, Storage Blob, Azure SQL/Cosmos, Static Web Apps.",
    tiempoLecturaMin: 4,
  }),
  nuevoBloque(uuid("blqFS31"), "sec-fs-4-1", 2, "RECURSO", {
    subtipo: "enlace",
    url: "https://learn.microsoft.com/es-es/azure/architecture/guide/",
    titulo: "Azure Architecture Center",
    descripcion: "Catalogo oficial de patrones de arquitectura en Azure (Microsoft Learn).",
    abrirNuevaPestana: true,
  }),
  nuevoBloque(uuid("blqFS32"), "sec-fs-4-1", 3, "VIDEO", {
    url: "https://www.youtube.com/watch?v=Tt6_zP7HrR4",
    proveedor: "youtube",
    marcarAlPorcentaje: 80,
    notas: "Recorrido de los servicios fundamentales de Azure en 15 minutos.",
  }),
  nuevoBloque(
    uuid("blqFS33"),
    "sec-fs-4-1",
    4,
    "QUIZ",
    {
      intentosMax: null,
      solucionVisible: "al_aprobar",
      ordenAleatorio: false,
      notaMinima: 60,
      preguntas: [
        {
          id: "fs-azp1",
          enunciado:
            "¿Que servicio de Azure es la opcion mas adecuada para hostear una SPA estatica con backend serverless?",
          opciones: [
            { id: "fs-azp1o1", texto: "Virtual Machines", esCorrecta: false },
            { id: "fs-azp1o2", texto: "Static Web Apps", esCorrecta: true },
            { id: "fs-azp1o3", texto: "Blob Storage solo", esCorrecta: false },
          ],
          explicacion:
            "Static Web Apps combina hosting estatico (CDN global) con Azure Functions integradas y CI/CD desde GitHub.",
        },
      ],
    },
    { esEvaluable: true, skillQueMideId: ID_SKILL_AZURE },
  ),

  // -- sec-fs-4-2: Azure deploy basico --
  nuevoBloque(uuid("blqFS34"), "sec-fs-4-2", 1, "PARRAFO", {
    html: "<h2>Deploy en 4 pasos con la CLI</h2><p>La <code>az</code> CLI es la forma profesional de hablar con Azure: scriptable, versionable y reproducible. Resource group → crear servicio → configurar → desplegar.</p>",
    textoPlano:
      "Deploy basico con az CLI: resource group, servicio, configuracion, push de codigo.",
    tiempoLecturaMin: 3,
  }),
  nuevoBloque(uuid("blqFS35"), "sec-fs-4-2", 2, "CODIGO_ILUSTRATIVO", {
    lenguaje: "bash",
    codigo:
      '# login y seleccionar suscripcion\naz login\naz account set --subscription "Mi Suscripcion"\n\n# crear resource group\naz group create --name rg-demo --location westeurope\n\n# crear App Service (plan + app)\naz appservice plan create --name plan-demo --resource-group rg-demo --sku B1\naz webapp create --name miapp-demo --plan plan-demo --resource-group rg-demo --runtime "NODE:20-lts"\n\n# desplegar codigo desde un zip\naz webapp deploy --resource-group rg-demo --name miapp-demo --src-path ./dist.zip',
    descripcion: "Despliegue minimo de una app Node a Azure App Service.",
  }),
  nuevoBloque(uuid("blqFS36"), "sec-fs-4-2", 3, "TIP", {
    variante: "info",
    // biome-ignore lint/nursery/noSecrets: contenido literal de seed mock (HTML/codigo), no un secreto
    html: "<p><strong>Infraestructura como codigo</strong>: para proyectos serios usa <strong>Bicep</strong> (DSL moderno y legible, oficial de Microsoft) en lugar de ARM templates (JSON verboso). Bicep compila a ARM, asi que el motor es el mismo.</p>",
  }),
  nuevoBloque(
    uuid("blqFS37"),
    "sec-fs-4-2",
    4,
    "QUIZ",
    {
      intentosMax: 3,
      solucionVisible: "tras_intento",
      ordenAleatorio: false,
      notaMinima: 70,
      preguntas: [
        {
          id: "fs-azp2",
          enunciado:
            "¿Cual es el comando correcto para subir un archivo a un contenedor de Blob Storage?",
          opciones: [
            {
              id: "fs-azp2o1",
              texto: "az blob upload --container-name fotos --file ./hola.png",
              esCorrecta: false,
            },
            {
              id: "fs-azp2o2",
              texto:
                "az storage blob upload --container-name fotos --name hola.png --file ./hola.png --account-name micuenta",
              esCorrecta: true,
            },
            { id: "fs-azp2o3", texto: "az upload blob ./hola.png", esCorrecta: false },
          ],
          explicacion:
            "El comando vive bajo `az storage blob`, requiere el nombre destino del blob y la cuenta de storage.",
        },
      ],
    },
    { esEvaluable: true, skillQueMideId: ID_SKILL_AZURE },
  ),
]
