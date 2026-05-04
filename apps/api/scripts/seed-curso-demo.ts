/**
 * Seeder de curso demo: "Fullstack Junior: Git + Python + React"
 *
 * Genera datos "reales" para poblar la bandeja del administrador:
 *  - 1 curso publicado con 3 modulos (Git, Python, React) y secciones/contenidos variados
 *  - 1 convocatoria EN_CURSO asociada al curso
 *  - Participantes con distintos estados (sin iniciar, en progreso, completado)
 *  - Diagnostico previo que genera asignaciones OBLIGATORIO/RECOMENDADO
 *  - Entregas en distintos estados (PENDIENTE, REVISANDO, APROBADA, REQUIERE_REVISION)
 *  - Progreso de curso/modulo/contenido coherente con las entregas
 *
 * Idempotente: borra y recrea el curso demo y los usuarios @demo.nexott.local.
 * No toca al admin@nexott.local ni participante@nexott.local del seed principal.
 *
 * Ejecucion: pnpm --filter @nexott-learn/api exec tsx scripts/seed-curso-demo.ts
 */

import { type Prisma, PrismaClient } from "@prisma/client"
import bcrypt from "bcrypt"

const prisma = new PrismaClient()

const CURSO_SLUG = "fullstack-junior-git-python-react"
const CONVOCATORIA_TITULO = "Fullstack Junior - TechCorp Q2 2026"
const DEMO_EMAIL_DOMAIN = "@demo.nexott.local"
const DEMO_PASSWORD = "Demo1234!"
const ADMIN_DEMO_EMAIL = `admin-demo${DEMO_EMAIL_DOMAIN}`

type ParticipanteSeed = {
  email: string
  nombre: string
  apellido: string
  estado: "sin_iniciar" | "en_progreso_temprano" | "en_progreso_medio" | "avanzado" | "completado"
}

const PARTICIPANTES: ParticipanteSeed[] = [
  {
    email: `ana.torres${DEMO_EMAIL_DOMAIN}`,
    nombre: "Ana",
    apellido: "Torres",
    estado: "sin_iniciar",
  },
  {
    email: `bruno.diaz${DEMO_EMAIL_DOMAIN}`,
    nombre: "Bruno",
    apellido: "Diaz",
    estado: "en_progreso_temprano",
  },
  {
    email: `camila.soto${DEMO_EMAIL_DOMAIN}`,
    nombre: "Camila",
    apellido: "Soto",
    estado: "en_progreso_medio",
  },
  {
    email: `diego.rojas${DEMO_EMAIL_DOMAIN}`,
    nombre: "Diego",
    apellido: "Rojas",
    estado: "avanzado",
  },
  {
    email: `elena.vega${DEMO_EMAIL_DOMAIN}`,
    nombre: "Elena",
    apellido: "Vega",
    estado: "avanzado",
  },
  {
    email: `felipe.muniz${DEMO_EMAIL_DOMAIN}`,
    nombre: "Felipe",
    apellido: "Muniz",
    estado: "completado",
  },
]

async function limpiarDemoExistente() {
  // Borra curso demo (cascade quita modulos, secciones, contenidos, inscripciones, progreso, entregas)
  // Tambien borra usuarios demo y sus dependencias.
  const cursoExistente = await prisma.curso.findUnique({ where: { slug: CURSO_SLUG } })
  if (cursoExistente) {
    // Borrar entregas y dependencias de inscripciones de este curso
    const inscripciones = await prisma.inscripcion.findMany({
      where: { cursoId: cursoExistente.id },
      select: { id: true },
    })
    const inscripcionIds = inscripciones.map((i) => i.id)
    if (inscripcionIds.length > 0) {
      await prisma.archivoEntrega.deleteMany({
        where: { entrega: { inscripcionId: { in: inscripcionIds } } },
      })
      await prisma.entrega.deleteMany({ where: { inscripcionId: { in: inscripcionIds } } })
      await prisma.entregaDraft.deleteMany({
        where: { usuario: { email: { endsWith: DEMO_EMAIL_DOMAIN } } },
      })
      await prisma.progresoContenido.deleteMany({
        where: { inscripcionId: { in: inscripcionIds } },
      })
      await prisma.progresoModulo.deleteMany({ where: { inscripcionId: { in: inscripcionIds } } })
      await prisma.progresoCurso.deleteMany({ where: { inscripcionId: { in: inscripcionIds } } })
      await prisma.asignacionModulo.deleteMany({ where: { inscripcionId: { in: inscripcionIds } } })
      await prisma.inscripcion.deleteMany({ where: { id: { in: inscripcionIds } } })
    }
    // Diagnosticos del curso
    const diagnosticos = await prisma.diagnostico.findMany({
      where: { cursoId: cursoExistente.id },
      select: { id: true },
    })
    if (diagnosticos.length > 0) {
      await prisma.resultadoDiagnostico.deleteMany({
        where: { diagnosticoId: { in: diagnosticos.map((d) => d.id) } },
      })
      await prisma.diagnostico.deleteMany({ where: { id: { in: diagnosticos.map((d) => d.id) } } })
    }
    await prisma.convocatoria.deleteMany({ where: { cursoId: cursoExistente.id } })
    await prisma.cursoTipoPeso.deleteMany({ where: { cursoId: cursoExistente.id } })
    // Cascade cubre modulos -> secciones -> contenidos
    await prisma.curso.delete({ where: { id: cursoExistente.id } })
  }

  // Borrar usuarios demo (auth eventos en cascada via FK)
  await prisma.authEvento.deleteMany({
    where: { usuario: { email: { endsWith: DEMO_EMAIL_DOMAIN } } },
  })
  await prisma.usuario.deleteMany({ where: { email: { endsWith: DEMO_EMAIL_DOMAIN } } })
}

async function crearAreasCompetencia() {
  const areas = [
    {
      nombre: "Control de Versiones",
      color: "#F1502F",
      orden: 1,
      descripcion: "Git, GitHub, workflows",
    },
    {
      nombre: "Backend - Python",
      color: "#3776AB",
      orden: 2,
      descripcion: "Fundamentos Python, scripting",
    },
    {
      nombre: "Frontend - React",
      color: "#61DAFB",
      orden: 3,
      descripcion: "React, hooks, componentes",
    },
  ]
  const result: Record<string, string> = {}
  for (const a of areas) {
    const area = await prisma.areaCompetencia.upsert({
      where: { nombre: a.nombre },
      update: {},
      create: a,
    })
    result[a.nombre] = area.id
  }
  return result
}

async function crearAdminDemo(): Promise<string> {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12)
  const admin = await prisma.usuario.create({
    data: {
      email: ADMIN_DEMO_EMAIL,
      nombre: "Admin",
      apellido: "Demo",
      passwordHash,
      rol: "ADMIN",
      activo: true,
      debeCambiarPassword: false,
      passwordCambiadoEn: new Date(),
    },
  })
  return admin.id
}

async function crearParticipantes(): Promise<
  Map<string, { id: string; estado: ParticipanteSeed["estado"] }>
> {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12)
  const map = new Map<string, { id: string; estado: ParticipanteSeed["estado"] }>()
  for (const p of PARTICIPANTES) {
    const u = await prisma.usuario.create({
      data: {
        email: p.email,
        nombre: p.nombre,
        apellido: p.apellido,
        passwordHash,
        rol: "PARTICIPANTE",
        activo: true,
        debeCambiarPassword: false,
        passwordCambiadoEn: new Date(),
      },
    })
    map.set(p.email, { id: u.id, estado: p.estado })
  }
  return map
}

// ──────────────────────────────────────────────────────────────────
// CONTENIDOS POR MODULO
// ──────────────────────────────────────────────────────────────────

function contenidoLectura(_titulo: string, parrafos: string[]): Prisma.InputJsonValue {
  return {
    bloques: parrafos.map((p, i) => ({ id: `b${i}`, tipo: "parrafo", texto: p })),
    tipsInline: [],
  } as Prisma.InputJsonValue
}

function contenidoVideo(_titulo: string, url: string): Prisma.InputJsonValue {
  return { url, proveedor: "youtube", duracionSegundos: 600 } as Prisma.InputJsonValue
}

function contenidoEjemploCodigo(
  lenguaje: string,
  codigo: string,
  preguntas: string[],
): Prisma.InputJsonValue {
  return {
    lenguaje,
    archivos: [
      { path: `ejemplo.${lenguaje === "python" ? "py" : "js"}`, content: codigo, readOnly: true },
    ],
    preguntasComprension: preguntas.map((p, i) => ({
      id: `q${i}`,
      pregunta: p,
      tipo: "abierta",
    })),
  } as Prisma.InputJsonValue
}

function contenidoEjercicio(opts: {
  modo: "guiado" | "reto"
  lenguaje: "python" | "javascript" | "typescript" | "react"
  enunciado: string
  archivosIniciales: { path: string; content: string; readOnly?: boolean }[]
  tests: { nombre: string; codigo: string }[]
  pistas?: string[]
  solucionReferencia?: string
}): Prisma.InputJsonValue {
  return {
    modo: opts.modo,
    lenguaje: opts.lenguaje,
    enunciado: { bloques: [{ id: "b0", tipo: "parrafo", texto: opts.enunciado }] },
    archivosIniciales: opts.archivosIniciales,
    tests: opts.tests,
    pistas: opts.pistas ?? [],
    solucionReferencia: opts.solucionReferencia ?? "",
  } as Prisma.InputJsonValue
}

function contenidoTest(
  preguntas: { texto: string; opciones: string[]; correcta: number }[],
): Prisma.InputJsonValue {
  return {
    preguntas: preguntas.map((p, i) => ({
      id: `q${i}`,
      texto: p.texto,
      tipo: "opcion_unica",
      opciones: p.opciones.map((o, j) => ({ id: `o${j}`, texto: o })),
      respuestaCorrecta: `o${p.correcta}`,
    })),
    politicaIntentos: "mejor_intento",
  } as Prisma.InputJsonValue
}

async function crearCursoCompleto(
  _adminId: string,
  areas: Record<string, string>,
): Promise<string> {
  const curso = await prisma.curso.create({
    data: {
      titulo: "Fullstack Junior: Git + Python + React",
      slug: CURSO_SLUG,
      descripcion:
        "Curso introductorio para perfiles fullstack junior. Cubre control de versiones con Git, fundamentos de Python para backend y construccion de UIs con React.",
      // biome-ignore lint/nursery/noSecrets: URL de imagen pública de Unsplash, no es un secreto
      imagenUrl: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800",
      nivel: "BASICO",
      estado: "PUBLICADO",
      umbralExcelencia: 90,
      umbralAprobado: 70,
      umbralEnDesarrollo: 50,
      umbralDiagnosticoObligatorio: 20,
      umbralDiagnosticoRecomendado: 5,
      // Pesos alineados con la decision P3.1 (MAESTRO-DECISIONES.md):
      // intra-modulo suma 100, nivel curso lleva proyecto+entrevista (lo que
      // sobre lo absorben modulos automaticamente al calcular la nota).
      tipoPesos: {
        create: [
          { tipo: "quiz", peso: 20, nivel: "modulo" },
          { tipo: "ejercicio", peso: 35, nivel: "modulo" },
          { tipo: "codigo", peso: 15, nivel: "modulo" },
          { tipo: "mini_proyecto", peso: 30, nivel: "modulo" },
          { tipo: "proyecto", peso: 20, nivel: "curso" },
          { tipo: "entrevista", peso: 10, nivel: "curso" },
        ],
      },
    },
  })

  // ─── MODULO 1: GIT ───
  const moduloGit = await prisma.modulo.create({
    data: {
      cursoId: curso.id,
      titulo: "Control de versiones con Git",
      slug: "git",
      descripcion: "Fundamentos de Git: commits, branches, merges y workflows colaborativos.",
      orden: 1,
      duracionEstimada: 240,
      estado: "PUBLICADO",
      puntajeObjetivo: 70,
      peso: 30,
      areaId: areas["Control de Versiones"],
    },
  })

  const seccionGit1 = await prisma.seccion.create({
    data: { moduloId: moduloGit.id, titulo: "Primeros pasos con Git", orden: 1 },
  })
  const seccionGit2 = await prisma.seccion.create({
    data: { moduloId: moduloGit.id, titulo: "Branches y colaboracion", orden: 2 },
  })

  await prisma.contenido.createMany({
    data: [
      {
        seccionId: seccionGit1.id,
        tipo: "LECTURA",
        titulo: "Que es Git y por que importa",
        orden: 1,
        contenido: contenidoLectura("Que es Git", [
          "Git es un sistema de control de versiones distribuido creado por Linus Torvalds en 2005.",
          "Permite registrar el historial de cambios de un proyecto, trabajar en paralelo en branches y colaborar de forma segura.",
          "A diferencia de sistemas centralizados, cada clon contiene la historia completa del repositorio.",
        ]),
      },
      {
        seccionId: seccionGit1.id,
        tipo: "VIDEO",
        titulo: "Git en 10 minutos",
        orden: 2,
        contenido: contenidoVideo("Git en 10 minutos", "https://www.youtube.com/watch?v=demo-git"),
      },
      {
        seccionId: seccionGit1.id,
        tipo: "EJEMPLO_CODIGO",
        titulo: "Tu primer commit",
        orden: 3,
        contenido: contenidoEjemploCodigo(
          "bash",
          'git init\ngit add README.md\ngit commit -m "initial commit"',
          ["Que hace `git init`?", "Para que sirve el area de staging?"],
        ),
      },
      {
        seccionId: seccionGit1.id,
        tipo: "TEST",
        titulo: "Quiz: conceptos basicos de Git",
        orden: 4,
        contenido: contenidoTest([
          {
            texto: "Que comando crea un nuevo repositorio Git local?",
            opciones: ["git start", "git init", "git new", "git create"],
            correcta: 1,
          },
          {
            texto: "Que registra un commit?",
            opciones: [
              "Solo el archivo modificado mas reciente",
              "Una instantanea del proyecto en ese momento",
              "El log del sistema operativo",
              "La rama actual unicamente",
            ],
            correcta: 1,
          },
        ]),
      },
    ],
  })

  await prisma.contenido.createMany({
    data: [
      {
        seccionId: seccionGit2.id,
        tipo: "LECTURA",
        titulo: "Branches y merges",
        orden: 1,
        contenido: contenidoLectura("Branches", [
          "Una branch es una linea de desarrollo independiente. Crear y mover branches en Git es barato.",
          "El workflow tipico: feature/x se crea desde develop, se mergea con merge request al terminar la tarea.",
        ]),
      },
      {
        seccionId: seccionGit2.id,
        tipo: "EJERCICIO",
        titulo: "Resolver un merge conflict",
        orden: 2,
        contenido: contenidoEjercicio({
          modo: "guiado",
          lenguaje: "javascript",
          enunciado:
            "Edita el archivo `app.js` para resolver el conflicto entre las branches `main` y `feature/saludo`. Mantener el saludo en espanol.",
          archivosIniciales: [
            {
              path: "app.js",
              content:
                // biome-ignore lint/nursery/noSecrets: contenido de ejemplo para ejercicio de conflictos git
                '<<<<<<< HEAD\nconst saludo = "Hello"\n=======\nconst saludo = "Hola"\n>>>>>>> feature/saludo\n',
            },
          ],
          tests: [
            { nombre: "Saludo en espanol", codigo: 'expect(saludo).toBe("Hola")' },
            {
              nombre: "Sin marcadores de conflicto",
              codigo: "expect(content).not.toMatch(/<<<<<<</)",
            },
          ],
          pistas: [
            "Los marcadores `<<<`, `===` y `>>>` deben eliminarse.",
            "Conserva solo la linea con el saludo en espanol.",
          ],
          solucionReferencia: 'const saludo = "Hola"\n',
        }),
      },
      {
        seccionId: seccionGit2.id,
        tipo: "RECURSO",
        titulo: "Cheat sheet de Git",
        orden: 3,
        contenido: {
          url: "https://education.github.com/git-cheat-sheet-education.pdf",
          tipo: "pdf",
        } as Prisma.InputJsonValue,
      },
    ],
  })

  // ─── MODULO 2: PYTHON ───
  const moduloPy = await prisma.modulo.create({
    data: {
      cursoId: curso.id,
      titulo: "Fundamentos de Python",
      slug: "python",
      descripcion:
        "Sintaxis, tipos, control de flujo, funciones y manipulacion de listas/diccionarios.",
      orden: 2,
      duracionEstimada: 360,
      estado: "PUBLICADO",
      puntajeObjetivo: 70,
      peso: 35,
      areaId: areas["Backend - Python"],
    },
  })

  const seccionPy1 = await prisma.seccion.create({
    data: { moduloId: moduloPy.id, titulo: "Sintaxis y tipos basicos", orden: 1 },
  })
  const seccionPy2 = await prisma.seccion.create({
    data: { moduloId: moduloPy.id, titulo: "Funciones y estructuras", orden: 2 },
  })

  await prisma.contenido.createMany({
    data: [
      {
        seccionId: seccionPy1.id,
        tipo: "LECTURA",
        titulo: "Hola mundo en Python",
        orden: 1,
        contenido: contenidoLectura("Python", [
          "Python es un lenguaje interpretado, dinamico y multiproposito.",
          "Su sintaxis prioriza la legibilidad y usa indentacion para definir bloques.",
        ]),
      },
      {
        seccionId: seccionPy1.id,
        tipo: "EJERCICIO",
        titulo: "Funcion es_par(n)",
        orden: 2,
        contenido: contenidoEjercicio({
          modo: "guiado",
          lenguaje: "python",
          enunciado:
            "Implementa `es_par(n)` que devuelva True si n es par, False en caso contrario.",
          archivosIniciales: [
            { path: "solucion.py", content: "def es_par(n):\n    # tu codigo aqui\n    pass\n" },
          ],
          tests: [
            { nombre: "es_par(2) -> True", codigo: "assert es_par(2) is True" },
            { nombre: "es_par(7) -> False", codigo: "assert es_par(7) is False" },
            { nombre: "es_par(0) -> True", codigo: "assert es_par(0) is True" },
          ],
          pistas: [
            "El operador `%` devuelve el resto de una division.",
            "n % 2 == 0 cuando n es par.",
          ],
          solucionReferencia: "def es_par(n):\n    return n % 2 == 0\n",
        }),
      },
      {
        seccionId: seccionPy1.id,
        tipo: "TEST",
        titulo: "Quiz: tipos basicos",
        orden: 3,
        contenido: contenidoTest([
          {
            texto: "Cual NO es un tipo basico de Python?",
            opciones: ["int", "str", "char", "bool"],
            correcta: 2,
          },
          {
            texto: "Que devuelve `type([])`?",
            opciones: ["<class 'list'>", "<class 'tuple'>", "<class 'dict'>", "<class 'set'>"],
            correcta: 0,
          },
        ]),
      },
    ],
  })

  await prisma.contenido.createMany({
    data: [
      {
        seccionId: seccionPy2.id,
        tipo: "LECTURA",
        titulo: "Funciones, list comprehensions y diccionarios",
        orden: 1,
        contenido: contenidoLectura("Estructuras", [
          "Las funciones se definen con `def`. Pueden tener argumentos posicionales, por defecto y kwargs.",
          "Las list comprehensions permiten construir listas a partir de iterables de forma concisa.",
          "Los diccionarios mapean claves a valores y son la estructura mas usada en Python.",
        ]),
      },
      {
        seccionId: seccionPy2.id,
        tipo: "EJERCICIO",
        titulo: "Reto: agrupar por categoria",
        orden: 2,
        contenido: contenidoEjercicio({
          modo: "reto",
          lenguaje: "python",
          enunciado:
            "Dada una lista de dicts {nombre, categoria}, devuelve un dict {categoria: [nombres]}. Sin usar `itertools.groupby`.",
          archivosIniciales: [
            {
              path: "solucion.py",
              content: "def agrupar(items):\n    # tu codigo aqui\n    pass\n",
            },
          ],
          tests: [{ nombre: "agrupa correctamente", codigo: "# tests internos" }],
        }),
      },
    ],
  })

  // ─── MODULO 3: REACT ───
  const moduloReact = await prisma.modulo.create({
    data: {
      cursoId: curso.id,
      titulo: "Construyendo UIs con React",
      slug: "react",
      descripcion: "Componentes, props, estado, hooks y patrones basicos.",
      orden: 3,
      duracionEstimada: 420,
      estado: "PUBLICADO",
      puntajeObjetivo: 70,
      peso: 35,
      areaId: areas["Frontend - React"],
    },
  })

  const seccionReact1 = await prisma.seccion.create({
    data: { moduloId: moduloReact.id, titulo: "Componentes y props", orden: 1 },
  })
  const seccionReact2 = await prisma.seccion.create({
    data: { moduloId: moduloReact.id, titulo: "Estado y hooks", orden: 2 },
  })

  await prisma.contenido.createMany({
    data: [
      {
        seccionId: seccionReact1.id,
        tipo: "LECTURA",
        titulo: "Que es un componente",
        orden: 1,
        contenido: contenidoLectura("React", [
          "Un componente de React es una funcion que recibe props y devuelve JSX.",
          "Los componentes son la unidad reutilizable basica de la UI.",
        ]),
      },
      {
        seccionId: seccionReact1.id,
        tipo: "EJEMPLO_CODIGO",
        titulo: "Componente Saludo",
        orden: 2,
        contenido: contenidoEjemploCodigo(
          "react",
          "function Saludo({ nombre }) {\n  return <h1>Hola, {nombre}</h1>\n}\n",
          ["Que tipo de retorno tiene un componente?", "Como se reciben datos del padre?"],
        ),
      },
      {
        seccionId: seccionReact1.id,
        tipo: "EJERCICIO",
        titulo: "Crea el componente Boton",
        orden: 3,
        contenido: contenidoEjercicio({
          modo: "guiado",
          lenguaje: "react",
          enunciado:
            "Crea el componente `<Boton label onClick />` que renderice un boton con la label y dispare onClick al hacer click.",
          archivosIniciales: [
            {
              path: "Boton.jsx",
              content: "export function Boton({ label, onClick }) {\n  // tu codigo\n}\n",
            },
          ],
          tests: [
            {
              nombre: "renderiza la label",
              // biome-ignore lint/nursery/noSecrets: código de test de ejemplo para seed
              codigo: 'expect(screen.getByText("OK")).toBeInTheDocument()',
            },
            // biome-ignore lint/nursery/noSecrets: código de test de ejemplo para seed
            { nombre: "dispara onClick", codigo: "expect(handler).toHaveBeenCalled()" },
          ],
          // biome-ignore lint/nursery/noSecrets: código de ejemplo para seed educativo
          pistas: ["Devuelve `<button onClick={onClick}>{label}</button>`."],
          solucionReferencia:
            // biome-ignore lint/nursery/noSecrets: código de solución de ejemplo para seed
            "export function Boton({ label, onClick }) {\n  return <button onClick={onClick}>{label}</button>\n}\n",
        }),
      },
    ],
  })

  await prisma.contenido.createMany({
    data: [
      {
        seccionId: seccionReact2.id,
        tipo: "LECTURA",
        titulo: "useState y useEffect",
        orden: 1,
        contenido: contenidoLectura("Hooks", [
          "useState permite agregar estado local a un componente funcional.",
          "useEffect ejecuta efectos secundarios despues del render (suscripciones, fetch, etc).",
        ]),
      },
      {
        seccionId: seccionReact2.id,
        tipo: "TEST",
        titulo: "Quiz: hooks",
        orden: 2,
        contenido: contenidoTest([
          {
            texto: "Cual es la regla principal de los hooks?",
            opciones: [
              "Llamarlos dentro de loops",
              "Llamarlos siempre en el mismo orden, en el top-level del componente",
              "Llamarlos dentro de condicionales",
              "Llamarlos en clases",
            ],
            correcta: 1,
          },
          {
            texto: "Que hace useEffect con dependencias `[]`?",
            opciones: [
              "Se ejecuta en cada render",
              "Solo se ejecuta una vez (al montar)",
              "Nunca se ejecuta",
              "Se ejecuta al desmontar unicamente",
            ],
            correcta: 1,
          },
        ]),
      },
    ],
  })

  return curso.id
}

async function crearConvocatoria(cursoId: string, adminId: string): Promise<string> {
  const conv = await prisma.convocatoria.create({
    data: {
      cursoId,
      titulo: CONVOCATORIA_TITULO,
      empresaCliente: "TechCorp",
      descripcion:
        "Programa de capacitacion para nuevos ingresos del area de desarrollo de TechCorp.",
      estado: "EN_CURSO",
      fechaInicio: new Date("2026-04-15T00:00:00Z"),
      fechaLimite: new Date("2026-06-30T23:59:59Z"),
      creadoPorId: adminId,
    },
  })
  return conv.id
}

type ContextoSeed = {
  cursoId: string
  convocatoriaId: string
  adminId: string
  modulos: { id: string; orden: number; titulo: string }[]
  contenidos: {
    id: string
    tipo: string
    titulo: string
    moduloOrden: number
    seccionOrden: number
    orden: number
  }[]
}

async function cargarContexto(
  cursoId: string,
  convocatoriaId: string,
  adminId: string,
): Promise<ContextoSeed> {
  const modulos = await prisma.modulo.findMany({
    where: { cursoId },
    orderBy: { orden: "asc" },
    include: {
      secciones: {
        orderBy: { orden: "asc" },
        include: { contenidos: { orderBy: { orden: "asc" } } },
      },
    },
  })
  const contenidos = modulos.flatMap((m) =>
    m.secciones.flatMap((s) =>
      s.contenidos.map((c) => ({
        id: c.id,
        tipo: c.tipo,
        titulo: c.titulo,
        moduloOrden: m.orden,
        seccionOrden: s.orden,
        orden: c.orden,
      })),
    ),
  )
  return {
    cursoId,
    convocatoriaId,
    adminId,
    modulos: modulos.map((m) => ({ id: m.id, orden: m.orden, titulo: m.titulo })),
    contenidos,
  }
}

function porcentaje(completados: number, totales: number) {
  return totales === 0 ? 0 : Math.round((completados / totales) * 1000) / 10
}

function etiquetaPorNota(
  nota: number,
): "EXCELENCIA" | "APROBADO" | "EN_DESARROLLO" | "INSUFICIENTE" {
  if (nota >= 90) {
    return "EXCELENCIA"
  }
  if (nota >= 70) {
    return "APROBADO"
  }
  if (nota >= 50) {
    return "EN_DESARROLLO"
  }
  return "INSUFICIENTE"
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: función de seed con múltiples estados de progreso, no se ejecuta en producción
async function inscribirYProgresar(
  participanteId: string,
  estado: ParticipanteSeed["estado"],
  ctx: ContextoSeed,
) {
  const inscripcion = await prisma.inscripcion.create({
    data: {
      usuarioId: participanteId,
      cursoId: ctx.cursoId,
      convocatoriaId: ctx.convocatoriaId,
      tipo: "ASIGNADA",
      estado: estado === "completado" ? "COMPLETADA" : "ACTIVA",
      inscritoPorId: ctx.adminId,
      fechaInscripcion: new Date("2026-04-16T10:00:00Z"),
      fechaCompletado: estado === "completado" ? new Date("2026-05-01T18:30:00Z") : null,
      fechaLimite: new Date("2026-06-30T23:59:59Z"),
    },
  })

  // Cantidad de contenidos a marcar como vistos segun el estado
  const totalContenidos = ctx.contenidos.length
  const totalModulos = ctx.modulos.length

  let contenidosCompletar = 0
  let modulosCompletados = 0
  let notaFinal: number | null = null
  let entregasPlan: { tipo: string; estadoEntrega: string; nota?: number }[] = []

  // biome-ignore lint/style/useDefaultSwitchClause: estados tipados exhaustivamente por ParticipanteSeed
  switch (estado) {
    case "sin_iniciar": {
      contenidosCompletar = 0
      modulosCompletados = 0
      break
    }
    case "en_progreso_temprano": {
      contenidosCompletar = 3
      modulosCompletados = 0
      entregasPlan = [{ tipo: "TEST", estadoEntrega: "APROBADA", nota: 75 }]
      break
    }
    case "en_progreso_medio": {
      contenidosCompletar = Math.ceil(totalContenidos / 2)
      modulosCompletados = 1
      entregasPlan = [
        { tipo: "TEST", estadoEntrega: "APROBADA", nota: 80 },
        { tipo: "EJERCICIO", estadoEntrega: "REVISANDO" },
        { tipo: "EJERCICIO", estadoEntrega: "PENDIENTE" },
      ]
      break
    }
    case "avanzado": {
      contenidosCompletar = Math.ceil(totalContenidos * 0.8)
      modulosCompletados = 2
      entregasPlan = [
        { tipo: "TEST", estadoEntrega: "APROBADA", nota: 90 },
        { tipo: "EJERCICIO", estadoEntrega: "APROBADA", nota: 85 },
        { tipo: "EJERCICIO", estadoEntrega: "REQUIERE_REVISION", nota: 55 },
        { tipo: "TEST", estadoEntrega: "PENDIENTE" },
      ]
      break
    }
    case "completado": {
      contenidosCompletar = totalContenidos
      modulosCompletados = totalModulos
      notaFinal = 88
      entregasPlan = [
        { tipo: "TEST", estadoEntrega: "APROBADA", nota: 95 },
        { tipo: "TEST", estadoEntrega: "APROBADA", nota: 85 },
        { tipo: "EJERCICIO", estadoEntrega: "APROBADA", nota: 90 },
        { tipo: "EJERCICIO", estadoEntrega: "APROBADA", nota: 80 },
      ]
      break
    }
  }

  // Marca contenidos vistos en orden
  const contenidosOrdenados = [...ctx.contenidos].sort(
    (a, b) => a.moduloOrden - b.moduloOrden || a.seccionOrden - b.seccionOrden || a.orden - b.orden,
  )
  for (let i = 0; i < contenidosCompletar; i++) {
    await prisma.progresoContenido.create({
      data: {
        inscripcionId: inscripcion.id,
        usuarioId: participanteId,
        contenidoId: contenidosOrdenados[i].id,
        vistoEn: new Date(Date.now() - (contenidosCompletar - i) * 60_000),
      },
    })
  }

  // ProgresoCurso
  const estadoProgreso =
    estado === "sin_iniciar"
      ? "NO_INICIADO"
      : estado === "completado"
        ? "COMPLETADO"
        : "EN_PROGRESO"

  await prisma.progresoCurso.create({
    data: {
      inscripcionId: inscripcion.id,
      usuarioId: participanteId,
      cursoId: ctx.cursoId,
      estado: estadoProgreso,
      porcentaje: porcentaje(contenidosCompletar, totalContenidos),
      notaFinal,
      etiquetaLogro: notaFinal != null ? etiquetaPorNota(notaFinal) : null,
      modulosCompletados,
      modulosTotales: totalModulos,
      tiempoTotal: contenidosCompletar * 12,
      iniciadoEn: estado === "sin_iniciar" ? null : new Date("2026-04-17T09:00:00Z"),
      completadoEn: estado === "completado" ? new Date("2026-05-01T18:30:00Z") : null,
    },
  })

  // ProgresoModulo: distribuye contenidosCompletar entre modulos en orden
  let restantes = contenidosCompletar
  for (const mod of ctx.modulos) {
    const contenidosDelModulo = ctx.contenidos.filter((c) => c.moduloOrden === mod.orden).length
    const completosDelModulo = Math.min(restantes, contenidosDelModulo)
    restantes -= completosDelModulo

    const estadoMod: "NO_INICIADO" | "EN_PROGRESO" | "COMPLETADO" =
      completosDelModulo === 0
        ? "NO_INICIADO"
        : completosDelModulo === contenidosDelModulo
          ? "COMPLETADO"
          : "EN_PROGRESO"

    const puntajeMod =
      estado === "completado"
        ? 88
        : estado === "avanzado" && estadoMod !== "NO_INICIADO"
          ? 78
          : estado === "en_progreso_medio" && estadoMod === "COMPLETADO"
            ? 72
            : null

    await prisma.progresoModulo.create({
      data: {
        inscripcionId: inscripcion.id,
        usuarioId: participanteId,
        moduloId: mod.id,
        estado: estadoMod,
        porcentaje: porcentaje(completosDelModulo, contenidosDelModulo),
        puntaje: puntajeMod,
        tiempoTotal: completosDelModulo * 12,
        iniciadoEn: estadoMod === "NO_INICIADO" ? null : new Date("2026-04-17T09:30:00Z"),
        completadoEn: estadoMod === "COMPLETADO" ? new Date("2026-04-25T16:00:00Z") : null,
      },
    })
  }

  // Entregas: las asignamos a contenidos del tipo solicitado
  const usados = new Set<string>()
  for (const plan of entregasPlan) {
    const candidato = ctx.contenidos.find((c) => c.tipo === plan.tipo && !usados.has(c.id))
    if (!candidato) {
      continue
    }
    usados.add(candidato.id)

    const esEjercicio = plan.tipo === "EJERCICIO"
    const contenidoEntrega: Prisma.InputJsonValue = esEjercicio
      ? {
          archivos: [{ path: "solucion.py", content: "def es_par(n):\n    return n % 2 == 0\n" }],
        }
      : {
          respuestas: [
            { preguntaId: "q0", respuesta: "o1" },
            { preguntaId: "q1", respuesta: "o1" },
          ],
        }

    const entrega = await prisma.entrega.create({
      data: {
        usuarioId: participanteId,
        contenidoId: candidato.id,
        inscripcionId: inscripcion.id,
        contenido: contenidoEntrega,
        estado: plan.estadoEntrega as
          | "PENDIENTE"
          | "REVISANDO"
          | "APROBADA"
          | "RECHAZADA"
          | "REQUIERE_REVISION",
        puntaje: plan.nota ?? null,
        retroalimentacion:
          plan.estadoEntrega === "APROBADA"
            ? "Buena solucion, cumple los criterios."
            : plan.estadoEntrega === "REQUIERE_REVISION"
              ? "Revisa el caso borde de n=0."
              : null,
        scoreIa: esEjercicio && plan.nota ? plan.nota - 5 : null,
        testsPasados: esEjercicio && plan.nota ? Math.round((plan.nota / 100) * 3) : null,
        testsTotal: esEjercicio ? 3 : null,
        evaluadoEn:
          plan.estadoEntrega === "APROBADA" || plan.estadoEntrega === "REQUIERE_REVISION"
            ? new Date()
            : null,
      },
    })

    if (esEjercicio) {
      await prisma.archivoEntrega.create({
        data: {
          entregaId: entrega.id,
          path: "solucion.py",
          content: "def es_par(n):\n    return n % 2 == 0\n",
          readOnly: false,
        },
      })
    }
  }

  return inscripcion.id
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: función de seed con múltiples casos de diagnóstico, no se ejecuta en producción
async function crearDiagnosticoEjemplo(
  participanteId: string,
  inscripcionId: string,
  ctx: ContextoSeed,
) {
  // Diagnostico para Bruno (en_progreso_temprano): brecha alta en React, brecha media en Python, OK en Git
  const diag = await prisma.diagnostico.create({
    data: {
      usuarioId: participanteId,
      cursoId: ctx.cursoId,
      titulo: "Diagnostico inicial - Entrevista interna",
      notas: "Entrevista realizada por RRHH NTT DATA antes de la inscripcion.",
      fecha: new Date("2026-04-14T10:00:00Z"),
    },
  })

  const objetivo = 70
  const planResultados: { moduloOrden: number; nota: number }[] = [
    { moduloOrden: 1, nota: 75 }, // Git: cumple
    { moduloOrden: 2, nota: 60 }, // Python: cerca (brecha 10 -> recomendado)
    { moduloOrden: 3, nota: 35 }, // React: no cumple (brecha 35 -> obligatorio)
  ]

  for (const r of planResultados) {
    const modulo = ctx.modulos.find((m) => m.orden === r.moduloOrden)
    if (!modulo) {
      continue
    }
    const brecha = objetivo - r.nota
    const estado = brecha <= 0 ? "CUMPLE" : brecha <= 15 ? "CERCA" : "NO_CUMPLE"

    await prisma.resultadoDiagnostico.create({
      data: {
        diagnosticoId: diag.id,
        moduloId: modulo.id,
        puntaje: r.nota,
        brecha,
        estado,
        observaciones:
          estado === "NO_CUMPLE"
            ? "Refuerzo obligatorio antes de proyectos."
            : estado === "CERCA"
              ? "Reforzar conceptos clave."
              : null,
      },
    })

    if (estado !== "CUMPLE") {
      const prioridad = estado === "NO_CUMPLE" ? "OBLIGATORIO" : "RECOMENDADO"
      await prisma.asignacionModulo.create({
        data: {
          inscripcionId,
          moduloId: modulo.id,
          prioridad,
          origen: "ASIGNADA",
          diagnosticoId: diag.id,
          fechaLimite: new Date("2026-06-15T23:59:59Z"),
        },
      })
    }
  }
}

async function main() {
  console.info("→ Limpiando datos demo previos...")
  await limpiarDemoExistente()

  console.info("→ Creando areas de competencia...")
  const areas = await crearAreasCompetencia()

  console.info("→ Creando admin demo y participantes...")
  const adminId = await crearAdminDemo()
  const participantes = await crearParticipantes()

  console.info("→ Creando curso completo (modulos, secciones, contenidos)...")
  const cursoId = await crearCursoCompleto(adminId, areas)

  console.info("→ Creando convocatoria...")
  const convocatoriaId = await crearConvocatoria(cursoId, adminId)

  const ctx = await cargarContexto(cursoId, convocatoriaId, adminId)
  console.info(`  Curso con ${ctx.modulos.length} modulos y ${ctx.contenidos.length} contenidos.`)

  console.info("→ Inscribiendo participantes y generando progreso...")
  let primeraInscripcionTemprano: { uid: string; iid: string } | null = null
  for (const [email, info] of participantes.entries()) {
    const iid = await inscribirYProgresar(info.id, info.estado, ctx)
    if (info.estado === "en_progreso_temprano" && !primeraInscripcionTemprano) {
      primeraInscripcionTemprano = { uid: info.id, iid }
    }
    console.info(`  · ${email} (${info.estado})`)
  }

  if (primeraInscripcionTemprano) {
    console.info("→ Creando diagnostico de ejemplo con asignaciones obligatorias/recomendadas...")
    await crearDiagnosticoEjemplo(
      primeraInscripcionTemprano.uid,
      primeraInscripcionTemprano.iid,
      ctx,
    )
  }

  console.info("\n✓ Seed demo completado.")
  console.info(`  Admin demo:       ${ADMIN_DEMO_EMAIL} / ${DEMO_PASSWORD}`)
  console.info(`  Participantes:    ${PARTICIPANTES.map((p) => p.email).join(", ")}`)
  console.info(`  Password comun:   ${DEMO_PASSWORD}`)
  console.info(`  Curso:            ${CURSO_SLUG}`)
  console.info(`  Convocatoria:     ${CONVOCATORIA_TITULO}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
