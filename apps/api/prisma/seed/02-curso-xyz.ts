/**
 * Curso ACTIVO "Fullstack Developer · Empresa XYZ" (caso real ESQUEMA.md §44).
 *
 *  - 6 áreas con pesos 20/30/20/20/10/10 y puntajes objetivo (suma 100% — I7).
 *  - 6 módulos (uno por área) con secciones y bloques heterogéneos.
 *  - 2 mini-proyectos activos (Frontend, Backend).
 *  - Proyecto Transversal opcional activo.
 *  - Entrevista IA con rúbrica que es subset de áreas (I22, suma 100%).
 *
 * Las reglas que valida este seed:
 *  - I4 pesos en [0, 100].
 *  - I7 sumas 100% ±0.01 (Curso, MiniProyecto, Transversal, CursoArea, Rúbrica).
 *  - I11 cada módulo apunta a un area que está en CursoArea.
 *  - I12 dimensiones CÓDIGO coherentes (inline⇒solo_ver+ninguno; tests⇒editable).
 *
 * El payload JSONB de cada bloque sigue las shapes de ENTIDADES.md §4 (Bloque).
 */
import type { Modulo, Prisma } from "@prisma/client"
import type { AreasSeedResult } from "./01-areas.js"
import { diasAtras, prisma, suma2dec, uuidEstable } from "./_lib.js"

export const MODULO_KEYS_XYZ = [
  "fe_react",
  "be_python",
  "bd_nosql",
  "cl_azure",
  "he_git",
  "ss_comm",
] as const
export type ModuloKeyXyz = (typeof MODULO_KEYS_XYZ)[number]

export type CursoXyzSeedResult = {
  cursoId: string
  modulos: Record<ModuloKeyXyz, Modulo>
  miniProyectoFeId: string
  miniProyectoBeId: string
  transversalId: string
  entrevistaConfigId: string
}

const CURSO_SLUG = "fullstack-empresa-xyz-2026q3"

export async function seedCursoXyz(areas: AreasSeedResult): Promise<CursoXyzSeedResult> {
  const cursoId = uuidEstable("curso:xyz")

  // Validar invariantes I7 antes de insertar (defensa en profundidad)
  const sumaNivelCurso = suma2dec([70, 20, 10])
  const sumaIntra = suma2dec([70, 30])
  if (sumaNivelCurso !== 100 || sumaIntra !== 100) {
    throw new Error(`I7 violado en curso XYZ: nivelCurso=${sumaNivelCurso}, intra=${sumaIntra}`)
  }

  const curso = await prisma.curso.upsert({
    where: { slug: CURSO_SLUG },
    update: {
      estado: "ACTIVO",
      publicadoAt: diasAtras(20),
    },
    create: {
      id: cursoId,
      empresaCliente: "Empresa XYZ",
      titulo: "Fullstack Developer · Empresa XYZ",
      slug: CURSO_SLUG,
      descripcion:
        "Programa fullstack para perfiles seleccionados de Empresa XYZ. Cubre Frontend, Backend (Python), BD NoSQL, Cloud Azure, Herramientas y Soft Skills.",
      imagenUrl: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800",
      duracionEstimada: "8 semanas",
      fechaInicio: diasAtras(20),
      deadline: diasAtras(-40),
      estado: "ACTIVO",
      permiteInscripcionLibre: false,
      pesoAreas: 70,
      pesoProyectoTransversal: 20,
      pesoEntrevistaIA: 10,
      pesoActividades: 70,
      pesoMiniProyecto: 30,
      umbralExcelencia: 90,
      umbralAprobado: 70,
      umbralEnDesarrollo: 50,
      umbralBrechaNoCumple: 10,
      publicadoAt: diasAtras(20),
    },
  })

  // ───────── CursoArea (subset del catálogo + pesos + objetivos) ─────────
  // Pesos del ESQUEMA.md §44: 20/30/15/15/10/10 = 100 (I7).
  const cursoAreasSpec = [
    { areaKey: "frontend" as const, peso: 20, puntajeObjetivo: 70, orden: 1 },
    { areaKey: "backend" as const, peso: 30, puntajeObjetivo: 70, orden: 2 },
    { areaKey: "bd" as const, peso: 15, puntajeObjetivo: 70, orden: 3 },
    { areaKey: "cloud" as const, peso: 15, puntajeObjetivo: 60, orden: 4 },
    { areaKey: "herramientas" as const, peso: 10, puntajeObjetivo: 80, orden: 5 },
    { areaKey: "softskills" as const, peso: 10, puntajeObjetivo: 80, orden: 6 },
  ]
  const sumaPesosArea = suma2dec(cursoAreasSpec.map((a) => a.peso))
  if (sumaPesosArea !== 100) {
    throw new Error(`I7 violado en CursoArea XYZ: suma=${sumaPesosArea}`)
  }

  for (const ca of cursoAreasSpec) {
    const area = areas[ca.areaKey]
    await prisma.cursoArea.upsert({
      where: { cursoId_areaId: { cursoId: curso.id, areaId: area.id } },
      update: { peso: ca.peso, puntajeObjetivo: ca.puntajeObjetivo, orden: ca.orden },
      create: {
        id: uuidEstable(`cursoArea:xyz:${ca.areaKey}`),
        cursoId: curso.id,
        areaId: area.id,
        peso: ca.peso,
        puntajeObjetivo: ca.puntajeObjetivo,
        orden: ca.orden,
      },
    })
  }

  // ───────── Módulos ─────────
  const modulosSpec = [
    {
      key: "fe_react" as const,
      areaKey: "frontend" as const,
      titulo: "Frontend (HTML5+CSS3+JS+React+Next)",
      descripcion: "Bases de Frontend hasta React/Next con foco en componentes reutilizables.",
      orden: 1,
      miniProyectoActivo: true,
    },
    {
      key: "be_python" as const,
      areaKey: "backend" as const,
      titulo: "Backend (Python+PySpark+Pandas+APIs)",
      descripcion: "Python, manejo de datos con Pandas/PySpark y construcción de APIs.",
      orden: 2,
      miniProyectoActivo: true,
    },
    {
      key: "bd_nosql" as const,
      areaKey: "bd" as const,
      titulo: "Bases de datos NoSQL",
      descripcion: "MongoDB, CosmosDB y modelado documental.",
      orden: 3,
      miniProyectoActivo: false,
    },
    {
      key: "cl_azure" as const,
      areaKey: "cloud" as const,
      titulo: "Azure + Databricks",
      descripcion: "Azure básico, Azure Data Factory y Databricks.",
      orden: 4,
      miniProyectoActivo: false,
    },
    {
      key: "he_git" as const,
      areaKey: "herramientas" as const,
      titulo: "Git Avanzado",
      descripcion: "Branching, resolución de conflictos y workflows.",
      orden: 5,
      miniProyectoActivo: false,
    },
    {
      key: "ss_comm" as const,
      areaKey: "softskills" as const,
      titulo: "Comunicación y trabajo en equipo",
      descripcion: "Comunicación, feedback y trabajo remoto.",
      orden: 6,
      miniProyectoActivo: false,
    },
  ]

  const modulos = {} as Record<ModuloKeyXyz, Modulo>
  for (const m of modulosSpec) {
    const moduloId = uuidEstable(`modulo:xyz:${m.key}`)
    const modulo = await prisma.modulo.upsert({
      where: { id: moduloId },
      update: {
        titulo: m.titulo,
        descripcion: m.descripcion,
        orden: m.orden,
        miniProyectoActivo: m.miniProyectoActivo,
      },
      create: {
        id: moduloId,
        cursoId: curso.id,
        areaId: areas[m.areaKey].id,
        titulo: m.titulo,
        descripcion: m.descripcion,
        orden: m.orden,
        miniProyectoActivo: m.miniProyectoActivo,
      },
    })
    modulos[m.key] = modulo
  }

  // ───────── Secciones + bloques heterogéneos ─────────
  await seedSeccionesYBloques(modulos)

  // ───────── Mini-proyectos (Frontend + Backend) ─────────
  const miniProyectoFeId = uuidEstable("miniProyecto:xyz:fe")
  await prisma.miniProyecto.upsert({
    where: { moduloId: modulos.fe_react.id },
    update: {},
    create: {
      id: miniProyectoFeId,
      moduloId: modulos.fe_react.id,
      titulo: "Landing page con React + Next",
      enunciado:
        "Construye una landing page responsiva para Empresa XYZ usando Next.js. Debe incluir hero, features, testimonios y CTA. Repo Git con README + tests básicos.",
      pesoCapa1: 40,
      pesoCapa2: 30,
      pesoCapa3: 30,
    },
  })

  const miniProyectoBeId = uuidEstable("miniProyecto:xyz:be")
  await prisma.miniProyecto.upsert({
    where: { moduloId: modulos.be_python.id },
    update: {},
    create: {
      id: miniProyectoBeId,
      moduloId: modulos.be_python.id,
      titulo: "API + análisis con Pandas",
      enunciado:
        "Construye una API REST en Python (FastAPI) que sirva el resultado de un análisis con Pandas sobre un CSV de ventas. Tests con pytest, README, dockerfile.",
      pesoCapa1: 40,
      pesoCapa2: 30,
      pesoCapa3: 30,
    },
  })

  // ───────── Proyecto Transversal ─────────
  const transversalId = uuidEstable("transversal:xyz")
  await prisma.proyectoTransversal.upsert({
    where: { cursoId: curso.id },
    update: {},
    create: {
      id: transversalId,
      cursoId: curso.id,
      titulo: "Aplicación fullstack para Mining",
      enunciado:
        "Sistema fullstack para procesamiento de datos de sensores mineros. Frontend (React/Next) + Backend (Python/FastAPI) + BD (MongoDB) + Pipeline ADF. Repo Git monorepo, CI/CD básico.",
      umbralAprobacion: 70,
      pesoCapa1: 40,
      pesoCapa2: 30,
      pesoCapa3: 30,
    },
  })

  // ───────── Entrevista IA + rúbrica ─────────
  const entrevistaConfigId = uuidEstable("entrevistaConfig:xyz")
  await prisma.entrevistaIAConfig.upsert({
    where: { cursoId: curso.id },
    update: {},
    create: {
      id: entrevistaConfigId,
      cursoId: curso.id,
      perfilCliente:
        "Tech Lead de Empresa XYZ, ingeniero senior, pragmático, valora arquitectura limpia.",
      contextoNegocio: "Procesamiento de datos de sensores mineros en tiempo real.",
      umbralAprobacion: 70,
      numeroPreguntas: 8,
      modo: "TEXTO",
      maxIntentos: 3,
    },
  })

  // Rúbrica subset de áreas del curso (I22). Suma 100% (I7).
  const rubricaSpec = [
    { areaKey: "frontend" as const, peso: 20 },
    { areaKey: "backend" as const, peso: 35 },
    { areaKey: "bd" as const, peso: 20 },
    { areaKey: "cloud" as const, peso: 15 },
    { areaKey: "herramientas" as const, peso: 10 },
  ]
  const sumaRubrica = suma2dec(rubricaSpec.map((r) => r.peso))
  if (sumaRubrica !== 100) {
    throw new Error(`I7 violado en rúbrica XYZ: suma=${sumaRubrica}`)
  }

  for (const r of rubricaSpec) {
    const area = areas[r.areaKey]
    await prisma.rubricaEntrevistaItem.upsert({
      where: { configId_areaId: { configId: entrevistaConfigId, areaId: area.id } },
      update: { peso: r.peso },
      create: {
        id: uuidEstable(`rubrica:xyz:${r.areaKey}`),
        configId: entrevistaConfigId,
        areaId: area.id,
        peso: r.peso,
      },
    })
  }

  console.info("  ✓ Curso XYZ ACTIVO: 6 áreas, 6 módulos, 2 minis, transversal, entrevista IA")

  return {
    cursoId: curso.id,
    modulos,
    miniProyectoFeId,
    miniProyectoBeId,
    transversalId,
    entrevistaConfigId,
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Secciones + bloques (payloads JSONB con shape correcto por tipo).
// ────────────────────────────────────────────────────────────────────────────

async function seedSeccionesYBloques(modulos: Record<ModuloKeyXyz, Modulo>): Promise<void> {
  // FE · React → 4 secciones del ESQUEMA
  await crearSeccionConBloques(modulos.fe_react.id, "fe_concept", "Conceptos básicos", 1, [
    bloqueParrafo("HTML semántico para estructurar contenido con propósito."),
    bloqueTip("info", "Cuidado con divs sin sentido — preferir secciones semánticas."),
    bloqueCodigoSoloVer("<header>\n  <h1>Hola Mundo</h1>\n</header>", "JAVASCRIPT"),
    bloqueParrafo("El flujo básico: estructura HTML → estilos CSS → comportamiento JS."),
    bloqueVideo("HTML en 10 minutos", "https://www.youtube.com/watch?v=xyz-html-10", "youtube"),
  ])

  await crearSeccionConBloques(modulos.fe_react.id, "fe_css", "CSS + Flexbox", 2, [
    bloqueParrafo("Flexbox permite layouts unidimensionales con alineación flexible."),
    bloqueCodigoEditableSinEval(
      ".container { display: flex; gap: 1rem; }",
      "JAVASCRIPT",
      "Experimenta con flex-direction y justify-content.",
    ),
    bloqueTip(
      "warning",
      "El justify-content alinea en el eje principal; align-items en el cruzado.",
    ),
    bloqueCodigoEditablePreguntas(".box { display: flex; }", "JAVASCRIPT", [
      {
        enunciado: "¿Qué propiedad alinea los items en el eje principal?",
        opciones: ["align-items", "justify-content", "flex-wrap", "gap"],
        correcta: 1,
      },
      {
        enunciado: "¿Qué hace `flex-direction: column`?",
        opciones: [
          "Pone los items en horizontal",
          "Pone los items en vertical (eje principal vertical)",
          "Centra el contenedor",
          "Activa wrap",
        ],
        correcta: 1,
      },
      {
        enunciado: "¿`gap` aplica solo a flex?",
        opciones: [
          "Sí, exclusivamente",
          "No, también a grid y multi-column",
          "Solo en grid",
          "Solo en bloques inline",
        ],
        correcta: 1,
      },
    ]),
    bloqueRecurso("Cheat sheet de Flexbox", "https://example.com/flexbox-cheat.pdf", true),
  ])

  await crearSeccionConBloques(modulos.fe_react.id, "fe_quiz", "Quiz de comprensión", 3, [
    bloqueQuiz([
      {
        enunciado: "¿Qué etiqueta es semánticamente más correcta para el menú principal?",
        opciones: ["<div>", "<nav>", "<section>", "<menu>"],
        correcta: 1,
      },
      {
        enunciado: "El selector `.btn:hover` aplica:",
        opciones: [
          "Al cargar la página",
          "Al pasar el cursor encima",
          "Al hacer foco con teclado",
          "Al hacer click",
        ],
        correcta: 1,
      },
      {
        enunciado: "`em` y `rem` son unidades:",
        opciones: [
          "Absolutas",
          "Relativas (em al padre, rem al root)",
          "De pixel exacto",
          "Solo para tipografía móvil",
        ],
        correcta: 1,
      },
      {
        enunciado: "`box-sizing: border-box` significa que:",
        opciones: [
          "El padding y border se SUMAN al width",
          "El padding y border se INCLUYEN dentro del width",
          "Desactiva el padding",
          "Centra el elemento",
        ],
        correcta: 1,
      },
    ]),
  ])

  await crearSeccionConBloques(modulos.fe_react.id, "fe_react_basico", "React básico", 4, [
    bloqueParrafo("React se basa en componentes funcionales con props y hooks."),
    bloqueCodigoEditableTests(
      "function Saludo({ nombre }) {\n  return <h1>Hola, {nombre}</h1>\n}",
      "REACT",
      'expect(render(<Saludo nombre="Mundo" />)).toMatch("Hola, Mundo")',
    ),
  ])

  // BE · Python → 4 secciones (resumidas, sin tanto detalle)
  await crearSeccionConBloques(modulos.be_python.id, "be_py_avanzado", "Python avanzado", 1, [
    bloqueParrafo("List comprehensions, generators y decoradores son herramientas clave."),
    bloqueCodigoEditableTests(
      "def es_par(n):\n    return n % 2 == 0",
      "PYTHON",
      "assert es_par(2) is True\nassert es_par(3) is False",
    ),
  ])
  await crearSeccionConBloques(modulos.be_python.id, "be_py_pyspark", "PySpark", 2, [
    bloqueParrafo("PySpark distribuye computación en cluster usando RDD/DataFrame."),
    bloqueVideo("Intro a PySpark", "https://www.youtube.com/watch?v=xyz-pyspark", "youtube"),
  ])
  await crearSeccionConBloques(modulos.be_python.id, "be_py_pandas", "Pandas", 3, [
    bloqueParrafo("Pandas es la librería estándar para análisis tabular en Python."),
    bloqueCodigoEditableTests(
      "import pandas as pd\n\ndef total(df):\n    return df['monto'].sum()",
      "PYTHON",
      "import pandas as pd\nassert total(pd.DataFrame({'monto':[1,2,3]})) == 6",
    ),
  ])
  await crearSeccionConBloques(modulos.be_python.id, "be_py_apis", "APIs REST", 4, [
    bloqueParrafo("FastAPI permite definir endpoints con type hints + validación Pydantic."),
    bloqueQuiz([
      {
        enunciado: "¿Qué status code es típico para un POST exitoso que crea un recurso?",
        opciones: ["200", "201", "204", "301"],
        correcta: 1,
      },
      {
        enunciado: "¿GET debe ser idempotente?",
        opciones: ["Sí", "No", "Solo con auth", "Solo con cache"],
        correcta: 0,
      },
    ]),
  ])

  // BD NoSQL → 3 secciones
  await crearSeccionConBloques(modulos.bd_nosql.id, "bd_mongo", "MongoDB", 1, [
    bloqueParrafo("MongoDB almacena documentos BSON en colecciones."),
    bloqueQuiz([
      {
        enunciado: "¿Cómo se llama el ID por defecto en MongoDB?",
        opciones: ["_id", "id", "uuid", "primary"],
        correcta: 0,
      },
    ]),
  ])
  await crearSeccionConBloques(modulos.bd_nosql.id, "bd_cosmos", "CosmosDB", 2, [
    bloqueParrafo("CosmosDB ofrece API multi-modelo: SQL, MongoDB, Cassandra, Gremlin."),
  ])
  await crearSeccionConBloques(modulos.bd_nosql.id, "bd_modelado", "Modelado documental", 3, [
    bloqueParrafo("Embed vs reference: depende del patrón de acceso."),
    bloqueTip("best-practice", "Embed cuando los datos se leen siempre juntos y son acotados."),
  ])

  // Cloud → 3 secciones
  await crearSeccionConBloques(modulos.cl_azure.id, "cl_azure_basico", "Azure básico", 1, [
    bloqueParrafo("Resource Group, Tenant y Subscription son los pilares de organización."),
    bloqueRecurso("Diagrama Azure 101", "https://example.com/azure-101.pdf", true),
  ])
  await crearSeccionConBloques(modulos.cl_azure.id, "cl_adf", "ADF", 2, [
    bloqueParrafo("Azure Data Factory permite orquestar pipelines de datos."),
  ])
  await crearSeccionConBloques(modulos.cl_azure.id, "cl_databricks", "Databricks", 3, [
    bloqueParrafo("Databricks unifica engineering, data science y ML sobre Spark."),
    bloqueVideo("Databricks en 5 min", "https://www.youtube.com/watch?v=xyz-dbx", "youtube"),
  ])

  // Herramientas → 3 secciones
  await crearSeccionConBloques(modulos.he_git.id, "he_branching", "Branching", 1, [
    bloqueParrafo("Branches permiten desarrollo paralelo aislado."),
    bloqueCodigoSoloVer("git checkout -b feature/login\ngit commit -m 'feat: login'", "JAVASCRIPT"),
  ])
  await crearSeccionConBloques(modulos.he_git.id, "he_conflictos", "Resolución de conflictos", 2, [
    bloqueParrafo("Los conflictos ocurren cuando dos branches modifican la misma línea."),
    bloqueTip("gotcha", "Nunca dejes los marcadores `<<<` `===` `>>>` en el archivo final."),
  ])
  await crearSeccionConBloques(modulos.he_git.id, "he_workflows", "Workflows", 3, [
    bloqueParrafo("GitFlow, trunk-based y GitHub Flow son los más usados."),
    bloqueQuiz([
      {
        enunciado: "¿Cuál branch es la base estable en GitFlow clásico?",
        opciones: ["main/master", "develop", "release", "hotfix"],
        correcta: 1,
      },
    ]),
  ])

  // Soft Skills → 3 secciones
  await crearSeccionConBloques(modulos.ss_comm.id, "ss_com", "Comunicación", 1, [
    bloqueParrafo("Comunicar con claridad: contexto + acción + impacto."),
    bloqueTip("info", "El silencio en una reunión es información — pregunta antes de asumir."),
  ])
  await crearSeccionConBloques(modulos.ss_comm.id, "ss_feedback", "Feedback", 2, [
    bloqueParrafo("Feedback efectivo es específico, accionable y oportuno."),
    bloqueRecurso("Modelo SBI de feedback", "https://example.com/sbi-feedback.pdf", false),
  ])
  await crearSeccionConBloques(modulos.ss_comm.id, "ss_remoto", "Trabajo remoto", 3, [
    bloqueParrafo("Comunicación asíncrona reduce dependencia de timezone."),
  ])
}

// ────────────────────────────────────────────────────────────────────────────
// Helpers de bloques. Generan payloads con shape correcto por tipo.
// ────────────────────────────────────────────────────────────────────────────

type BloqueSeed = {
  tipo: "PARRAFO" | "TIP" | "VIDEO" | "RECURSO" | "CODIGO" | "QUIZ"
  payload: Prisma.InputJsonValue
  codigoUbicacion?: "INLINE" | "SEPARADO"
  codigoInteractivo?: "SOLO_VER" | "EDITABLE"
  codigoEvaluable?: "NINGUNO" | "PREGUNTAS" | "TESTS"
  codigoLenguaje?: "PYTHON" | "JAVASCRIPT" | "TYPESCRIPT" | "REACT"
  solucionReferencia?: string
}

function bloqueParrafo(texto: string): BloqueSeed {
  return {
    tipo: "PARRAFO",
    payload: {
      contenidoTiptap: {
        type: "doc",
        content: [{ type: "paragraph", content: [{ type: "text", text: texto }] }],
      },
    },
  }
}

function bloqueTip(
  variante: "info" | "warning" | "best-practice" | "gotcha",
  texto: string,
): BloqueSeed {
  return { tipo: "TIP", payload: { variante, texto } }
}

function bloqueVideo(
  _titulo: string,
  url: string,
  proveedor: "youtube" | "vimeo" | "interno",
): BloqueSeed {
  return { tipo: "VIDEO", payload: { url, proveedor } }
}

function bloqueRecurso(descripcion: string, url: string, esDescarga: boolean): BloqueSeed {
  return { tipo: "RECURSO", payload: { url, esDescarga, descripcion } }
}

/** I12: inline ⇒ solo_ver + ninguno. */
function bloqueCodigoSoloVer(
  codigo: string,
  lenguaje: "PYTHON" | "JAVASCRIPT" | "TYPESCRIPT" | "REACT",
): BloqueSeed {
  return {
    tipo: "CODIGO",
    codigoUbicacion: "INLINE",
    codigoInteractivo: "SOLO_VER",
    codigoEvaluable: "NINGUNO",
    codigoLenguaje: lenguaje,
    payload: {
      archivos: [{ path: "snippet.txt", content: codigo, readOnly: true }],
    },
  }
}

function bloqueCodigoEditableSinEval(
  codigo: string,
  lenguaje: "PYTHON" | "JAVASCRIPT" | "TYPESCRIPT" | "REACT",
  pista: string,
): BloqueSeed {
  return {
    tipo: "CODIGO",
    codigoUbicacion: "SEPARADO",
    codigoInteractivo: "EDITABLE",
    codigoEvaluable: "NINGUNO",
    codigoLenguaje: lenguaje,
    payload: {
      archivos: [{ path: "demo.txt", content: codigo, readOnly: false }],
      pistas: [pista],
    },
  }
}

function bloqueCodigoEditablePreguntas(
  codigo: string,
  lenguaje: "PYTHON" | "JAVASCRIPT" | "TYPESCRIPT" | "REACT",
  preguntas: { enunciado: string; opciones: string[]; correcta: number }[],
): BloqueSeed {
  return {
    tipo: "CODIGO",
    codigoUbicacion: "SEPARADO",
    codigoInteractivo: "EDITABLE",
    codigoEvaluable: "PREGUNTAS",
    codigoLenguaje: lenguaje,
    payload: {
      archivos: [{ path: "snippet.txt", content: codigo, readOnly: false }],
      preguntas: preguntas.map((p, i) => ({
        id: `q${i}`,
        enunciado: p.enunciado,
        opciones: p.opciones.map((o, j) => ({ id: `o${j}`, texto: o })),
        correcta: `o${p.correcta}`,
        tipo: "opcion_unica",
      })),
    },
  }
}

/** I12: tests ⇒ requiere editable. */
function bloqueCodigoEditableTests(
  codigo: string,
  lenguaje: "PYTHON" | "JAVASCRIPT" | "TYPESCRIPT" | "REACT",
  tests: string,
): BloqueSeed {
  return {
    tipo: "CODIGO",
    codigoUbicacion: "SEPARADO",
    codigoInteractivo: "EDITABLE",
    codigoEvaluable: "TESTS",
    codigoLenguaje: lenguaje,
    solucionReferencia: codigo,
    payload: {
      archivos: [{ path: "solucion.txt", content: codigo, readOnly: false }],
      tests,
    },
  }
}

function bloqueQuiz(
  preguntas: { enunciado: string; opciones: string[]; correcta: number }[],
): BloqueSeed {
  return {
    tipo: "QUIZ",
    payload: {
      preguntas: preguntas.map((p, i) => ({
        id: `q${i}`,
        enunciado: p.enunciado,
        opciones: p.opciones.map((o, j) => ({ id: `o${j}`, texto: o })),
        correcta: `o${p.correcta}`,
        tipo: "opcion_unica",
      })),
      politicaIntentos: "mejor_intento",
    },
  }
}

async function crearSeccionConBloques(
  moduloId: string,
  seccionKey: string,
  titulo: string,
  orden: number,
  bloques: BloqueSeed[],
): Promise<void> {
  const seccionId = uuidEstable(`seccion:${seccionKey}`)
  await prisma.seccion.upsert({
    where: { id: seccionId },
    update: { titulo, orden },
    create: { id: seccionId, moduloId, titulo, orden },
  })

  let i = 0
  for (const b of bloques) {
    const bloqueId = uuidEstable(`bloque:${seccionKey}:${i}`)
    await prisma.bloque.upsert({
      where: { id: bloqueId },
      update: {
        tipo: b.tipo,
        orden: i + 1,
        payload: b.payload,
        codigoUbicacion: b.codigoUbicacion ?? null,
        codigoInteractivo: b.codigoInteractivo ?? null,
        codigoEvaluable: b.codigoEvaluable ?? null,
        codigoLenguaje: b.codigoLenguaje ?? null,
        solucionReferencia: b.solucionReferencia ?? null,
      },
      create: {
        id: bloqueId,
        seccionId,
        tipo: b.tipo,
        orden: i + 1,
        payload: b.payload,
        codigoUbicacion: b.codigoUbicacion ?? null,
        codigoInteractivo: b.codigoInteractivo ?? null,
        codigoEvaluable: b.codigoEvaluable ?? null,
        codigoLenguaje: b.codigoLenguaje ?? null,
        solucionReferencia: b.solucionReferencia ?? null,
      },
    })
    i++
  }
}
