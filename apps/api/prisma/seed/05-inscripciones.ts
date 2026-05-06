import type { UsuariosSeedResult } from "./00-usuarios.js"
import type { AreasSeedResult } from "./01-areas.js"
/**
 * Inscripciones, evaluación inicial, asignaciones y entregas para el curso XYZ.
 *
 * Replica la matriz inicial del ESQUEMA.md §218:
 *
 *   Candidato    │ FE(70) │ BE(70) │ BD(70) │ CL(60) │ HE(80) │ SS(80) │ Cobertura
 *   Juan Pérez   │ 85 ✓  │ 45 🔴  │ 50 🔴  │ 40 🔴  │ 90 ✓  │ 85 ✓  │  66%
 *   María Reyes  │ 30 🔴  │ 70 ✓  │ 80 ✓  │ 70 ✓  │ 85 ✓  │ 90 ✓  │  84%
 *   Pedro Soto   │ 80 ✓  │ 85 ✓  │ 75 ✓  │ 75 ✓  │ 90 ✓  │ 90 ✓  │ 100%
 *
 * Asignación derivada (umbralBrechaNoCumple = 10):
 *   Juan:  BE/BD/CL  → OBLIGATORIO
 *   María: FE        → OBLIGATORIO
 *   Pedro: ninguno   → directo a Transversal (todos OPCIONAL para coherencia)
 *
 * Bruno se inscribe LIBRE al curso del catálogo libre (todas OPCIONAL — I9).
 * Ana queda con inscripción ABANDONADA del curso XYZ (estado terminal).
 *
 * Adicionalmente:
 *  - Múltiples EntregaBloque por Juan (3 intentos a 1 quiz, mejor intento → T05).
 *  - EntregaProyecto de Mini Frontend para María (1 intento, EVALUADA).
 *  - EntregaProyecto de Transversal para Pedro (2 intentos, último aprobado).
 */
import type { CursoXyzSeedResult } from "./02-curso-xyz.js"
import type { CursosAuxResult } from "./03-curso-libre.js"
import { diasAtras, horasAtras, prisma, uuidEstable } from "./_lib.js"

export async function seedInscripciones(
  usuarios: UsuariosSeedResult,
  areas: AreasSeedResult,
  cursoXyz: CursoXyzSeedResult,
  cursosAux: CursosAuxResult,
): Promise<void> {
  await inscribirJuan(usuarios, areas, cursoXyz)
  await inscribirMaria(usuarios, areas, cursoXyz)
  await inscribirPedro(usuarios, areas, cursoXyz)
  await inscribirAnaAbandonada(usuarios, cursoXyz)
  await inscribirBrunoLibre(usuarios, cursosAux)
  console.info("  ✓ Inscripciones: 5 (Juan/María/Pedro/Ana/Bruno) con eval inicial y entregas")
}

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────

async function crearInscripcion(opts: {
  key: string
  participanteId: string
  cursoId: string
  tipo: "SOLICITUD" | "LIBRE"
  estado: "ACTIVA" | "COMPLETADA" | "ABANDONADA" | "CERRADO_SIN_COMPLETAR"
  inscritaHaceDias: number
  completadaHaceDias?: number
  abandonadaHaceDias?: number
}): Promise<string> {
  const id = uuidEstable(`inscripcion:${opts.key}`)
  await prisma.inscripcion.upsert({
    where: { id },
    update: { estado: opts.estado },
    create: {
      id,
      participanteId: opts.participanteId,
      cursoId: opts.cursoId,
      tipo: opts.tipo,
      estado: opts.estado,
      inscritaAt: diasAtras(opts.inscritaHaceDias),
      completadaAt: opts.completadaHaceDias != null ? diasAtras(opts.completadaHaceDias) : null,
      abandonadaAt: opts.abandonadaHaceDias != null ? diasAtras(opts.abandonadaHaceDias) : null,
    },
  })
  return id
}

async function evaluacionInicial(opts: {
  key: string
  inscripcionId: string
  areaId: string
  puntaje: number
  capturadaPorId: string
  observaciones?: string
}): Promise<void> {
  const id = uuidEstable(`evalInicial:${opts.key}`)
  await prisma.evaluacionInicial.upsert({
    where: {
      inscripcionId_areaId: { inscripcionId: opts.inscripcionId, areaId: opts.areaId },
    },
    update: { puntaje: opts.puntaje, observaciones: opts.observaciones ?? null },
    create: {
      id,
      inscripcionId: opts.inscripcionId,
      areaId: opts.areaId,
      puntaje: opts.puntaje,
      observaciones: opts.observaciones ?? null,
      capturadaPorId: opts.capturadaPorId,
      capturadaAt: diasAtras(18),
    },
  })
}

async function asignar(opts: {
  key: string
  inscripcionId: string
  moduloId: string
  tipo: "OBLIGATORIO" | "RECOMENDADO" | "OPCIONAL"
}): Promise<void> {
  const id = uuidEstable(`asignacion:${opts.key}`)
  await prisma.asignacion.upsert({
    where: {
      inscripcionId_moduloId: { inscripcionId: opts.inscripcionId, moduloId: opts.moduloId },
    },
    update: { tipo: opts.tipo },
    create: {
      id,
      inscripcionId: opts.inscripcionId,
      moduloId: opts.moduloId,
      tipo: opts.tipo,
      asignadaAt: diasAtras(17),
    },
  })
}

async function estadoModulo(opts: {
  key: string
  inscripcionId: string
  moduloId: string
  estado: "NO_INICIADO" | "EN_PROGRESO" | "COMPLETADO"
  porcentajeAvance: number
  iniciadoHaceDias?: number
  completadoHaceDias?: number
}): Promise<void> {
  const id = uuidEstable(`estadoModulo:${opts.key}`)
  await prisma.estadoModuloInscripcion.upsert({
    where: {
      inscripcionId_moduloId: { inscripcionId: opts.inscripcionId, moduloId: opts.moduloId },
    },
    update: { estado: opts.estado, porcentajeAvance: opts.porcentajeAvance },
    create: {
      id,
      inscripcionId: opts.inscripcionId,
      moduloId: opts.moduloId,
      estado: opts.estado,
      porcentajeAvance: opts.porcentajeAvance,
      iniciadoAt: opts.iniciadoHaceDias != null ? diasAtras(opts.iniciadoHaceDias) : null,
      completadoAt: opts.completadoHaceDias != null ? diasAtras(opts.completadoHaceDias) : null,
    },
  })
}

// ────────────────────────────────────────────────────────────────────────────
// Juan Pérez · brechas en BE/BD/CL
// ────────────────────────────────────────────────────────────────────────────

async function inscribirJuan(
  usuarios: UsuariosSeedResult,
  areas: AreasSeedResult,
  cursoXyz: CursoXyzSeedResult,
): Promise<void> {
  const inscripcionId = await crearInscripcion({
    key: "juan:xyz",
    participanteId: usuarios.juan.id,
    cursoId: cursoXyz.cursoId,
    tipo: "SOLICITUD",
    estado: "ACTIVA",
    inscritaHaceDias: 18,
  })

  const evals: Array<{ key: keyof AreasSeedResult; puntaje: number; obs?: string }> = [
    { key: "frontend", puntaje: 85 },
    { key: "backend", puntaje: 45, obs: "Conoce sintaxis pero no ha hecho APIs reales." },
    { key: "bd", puntaje: 50, obs: "Manejo básico SQL, NoSQL débil." },
    { key: "cloud", puntaje: 40, obs: "Sin experiencia en Azure." },
    { key: "herramientas", puntaje: 90 },
    { key: "softskills", puntaje: 85 },
  ]
  for (const e of evals) {
    await evaluacionInicial({
      key: `juan:${e.key}`,
      inscripcionId,
      areaId: areas[e.key].id,
      puntaje: e.puntaje,
      capturadaPorId: usuarios.admin.id,
      observaciones: e.obs,
    })
  }

  // Asignaciones según brecha (objetivo - puntaje >= 10 → OBLIG; < 10 → RECOM/OPC).
  await asignar({
    key: "juan:fe",
    inscripcionId,
    moduloId: cursoXyz.modulos.fe_react.id,
    tipo: "OPCIONAL",
  })
  await asignar({
    key: "juan:be",
    inscripcionId,
    moduloId: cursoXyz.modulos.be_python.id,
    tipo: "OBLIGATORIO",
  })
  await asignar({
    key: "juan:bd",
    inscripcionId,
    moduloId: cursoXyz.modulos.bd_nosql.id,
    tipo: "OBLIGATORIO",
  })
  await asignar({
    key: "juan:cl",
    inscripcionId,
    moduloId: cursoXyz.modulos.cl_azure.id,
    tipo: "OBLIGATORIO",
  })
  await asignar({
    key: "juan:he",
    inscripcionId,
    moduloId: cursoXyz.modulos.he_git.id,
    tipo: "OPCIONAL",
  })
  await asignar({
    key: "juan:ss",
    inscripcionId,
    moduloId: cursoXyz.modulos.ss_comm.id,
    tipo: "OPCIONAL",
  })

  // Estados de módulo: BE EN_PROGRESO, BD EN_PROGRESO, CL NO_INICIADO, resto NO_INICIADO.
  await estadoModulo({
    key: "juan:fe",
    inscripcionId,
    moduloId: cursoXyz.modulos.fe_react.id,
    estado: "EN_PROGRESO",
    porcentajeAvance: 25,
    iniciadoHaceDias: 12,
  })
  await estadoModulo({
    key: "juan:be",
    inscripcionId,
    moduloId: cursoXyz.modulos.be_python.id,
    estado: "EN_PROGRESO",
    porcentajeAvance: 60,
    iniciadoHaceDias: 14,
  })
  await estadoModulo({
    key: "juan:bd",
    inscripcionId,
    moduloId: cursoXyz.modulos.bd_nosql.id,
    estado: "EN_PROGRESO",
    porcentajeAvance: 40,
    iniciadoHaceDias: 8,
  })
  await estadoModulo({
    key: "juan:cl",
    inscripcionId,
    moduloId: cursoXyz.modulos.cl_azure.id,
    estado: "NO_INICIADO",
    porcentajeAvance: 0,
  })
  await estadoModulo({
    key: "juan:he",
    inscripcionId,
    moduloId: cursoXyz.modulos.he_git.id,
    estado: "NO_INICIADO",
    porcentajeAvance: 0,
  })
  await estadoModulo({
    key: "juan:ss",
    inscripcionId,
    moduloId: cursoXyz.modulos.ss_comm.id,
    estado: "NO_INICIADO",
    porcentajeAvance: 0,
  })

  // Entregas: Juan intenta el quiz de FE 3 veces (T05 mejor intento).
  const bloqueQuizFe = uuidEstable("bloque:fe_quiz:0")
  await crearEntregasMultiplesIntentos({
    keyBase: "juan:quiz_fe",
    inscripcionId,
    bloqueId: bloqueQuizFe,
    intentos: [
      { nota: 50, hace: 10 },
      { nota: 65, hace: 7 },
      { nota: 80, hace: 3 }, // mejor intento
    ],
    evaluadorId: null,
  })

  // Entrega de un bloque CÓDIGO con tests (BE) — un intento, evaluada con feedback.
  const bloqueCodTestsBe = uuidEstable("bloque:be_py_avanzado:1")
  await crearEntrega({
    key: "juan:cod_be:1",
    inscripcionId,
    bloqueId: bloqueCodTestsBe,
    intento: 1,
    nota: 75,
    estado: "EVALUADA",
    feedback: "Buena solución. Considera edge case n=0.",
    evaluadoPorId: usuarios.admin.id,
    haceDias: 2,
    contenido: {
      codigo: "def es_par(n):\n    return n % 2 == 0",
      resultadoTests: { pasados: 2, total: 3 },
    },
  })
}

// ────────────────────────────────────────────────────────────────────────────
// María Reyes · brecha en FE
// ────────────────────────────────────────────────────────────────────────────

async function inscribirMaria(
  usuarios: UsuariosSeedResult,
  areas: AreasSeedResult,
  cursoXyz: CursoXyzSeedResult,
): Promise<void> {
  const inscripcionId = await crearInscripcion({
    key: "maria:xyz",
    participanteId: usuarios.maria.id,
    cursoId: cursoXyz.cursoId,
    tipo: "SOLICITUD",
    estado: "ACTIVA",
    inscritaHaceDias: 18,
  })

  const evals: Array<{ key: keyof AreasSeedResult; puntaje: number }> = [
    { key: "frontend", puntaje: 30 },
    { key: "backend", puntaje: 70 },
    { key: "bd", puntaje: 80 },
    { key: "cloud", puntaje: 70 },
    { key: "herramientas", puntaje: 85 },
    { key: "softskills", puntaje: 90 },
  ]
  for (const e of evals) {
    await evaluacionInicial({
      key: `maria:${e.key}`,
      inscripcionId,
      areaId: areas[e.key].id,
      puntaje: e.puntaje,
      capturadaPorId: usuarios.admin.id,
    })
  }

  await asignar({
    key: "maria:fe",
    inscripcionId,
    moduloId: cursoXyz.modulos.fe_react.id,
    tipo: "OBLIGATORIO",
  })
  for (const k of ["be_python", "bd_nosql", "cl_azure", "he_git", "ss_comm"] as const) {
    await asignar({
      key: `maria:${k}`,
      inscripcionId,
      moduloId: cursoXyz.modulos[k].id,
      tipo: "OPCIONAL",
    })
  }

  await estadoModulo({
    key: "maria:fe",
    inscripcionId,
    moduloId: cursoXyz.modulos.fe_react.id,
    estado: "COMPLETADO",
    porcentajeAvance: 100,
    iniciadoHaceDias: 17,
    completadoHaceDias: 5,
  })
  for (const k of ["be_python", "bd_nosql", "cl_azure", "he_git", "ss_comm"] as const) {
    await estadoModulo({
      key: `maria:${k}`,
      inscripcionId,
      moduloId: cursoXyz.modulos[k].id,
      estado: "NO_INICIADO",
      porcentajeAvance: 0,
    })
  }

  // Entrega de Mini Proyecto Frontend (1 intento, EVALUADA).
  await crearEntregaProyecto({
    key: "maria:mini_fe:1",
    inscripcionId,
    miniProyectoId: cursoXyz.miniProyectoFeId,
    transversalId: null,
    intento: 1,
    notaCapa1: 80,
    notaCapa2: 75,
    notaCapa3: 78,
    notaFinal: 78,
    estado: "EVALUADA",
    haceDias: 4,
    fortalezas: "Buen uso de hooks y separación de responsabilidades.",
    areasMejora: "Falta cobertura de tests en componentes interactivos.",
  })
}

// ────────────────────────────────────────────────────────────────────────────
// Pedro Soto · cumple todo, va directo a Transversal
// ────────────────────────────────────────────────────────────────────────────

async function inscribirPedro(
  usuarios: UsuariosSeedResult,
  areas: AreasSeedResult,
  cursoXyz: CursoXyzSeedResult,
): Promise<void> {
  const inscripcionId = await crearInscripcion({
    key: "pedro:xyz",
    participanteId: usuarios.pedro.id,
    cursoId: cursoXyz.cursoId,
    tipo: "SOLICITUD",
    estado: "ACTIVA",
    inscritaHaceDias: 18,
  })

  const evals: Array<{ key: keyof AreasSeedResult; puntaje: number }> = [
    { key: "frontend", puntaje: 80 },
    { key: "backend", puntaje: 85 },
    { key: "bd", puntaje: 75 },
    { key: "cloud", puntaje: 75 },
    { key: "herramientas", puntaje: 90 },
    { key: "softskills", puntaje: 90 },
  ]
  for (const e of evals) {
    await evaluacionInicial({
      key: `pedro:${e.key}`,
      inscripcionId,
      areaId: areas[e.key].id,
      puntaje: e.puntaje,
      capturadaPorId: usuarios.admin.id,
    })
  }

  // Pedro: todo OPCIONAL.
  for (const k of ["fe_react", "be_python", "bd_nosql", "cl_azure", "he_git", "ss_comm"] as const) {
    await asignar({
      key: `pedro:${k}`,
      inscripcionId,
      moduloId: cursoXyz.modulos[k].id,
      tipo: "OPCIONAL",
    })
    await estadoModulo({
      key: `pedro:${k}`,
      inscripcionId,
      moduloId: cursoXyz.modulos[k].id,
      estado: "NO_INICIADO",
      porcentajeAvance: 0,
    })
  }

  // Transversal: 2 intentos. El primero NO aprueba (60), el segundo SÍ (78).
  await crearEntregaProyecto({
    key: "pedro:trans:1",
    inscripcionId,
    miniProyectoId: null,
    transversalId: cursoXyz.transversalId,
    intento: 1,
    notaCapa1: 55,
    notaCapa2: 60,
    notaCapa3: 65,
    notaFinal: 60,
    estado: "EVALUADA",
    haceDias: 6,
    fortalezas: "Integración fullstack funcional.",
    areasMejora: "Calidad de tests y cobertura del pipeline.",
  })
  await crearEntregaProyecto({
    key: "pedro:trans:2",
    inscripcionId,
    miniProyectoId: null,
    transversalId: cursoXyz.transversalId,
    intento: 2,
    notaCapa1: 80,
    notaCapa2: 75,
    notaCapa3: 78,
    notaFinal: 78,
    estado: "EVALUADA",
    haceDias: 1,
    fortalezas: "Tests automatizados completos. Buena arquitectura.",
    areasMejora: "Documentación de despliegue podría ser más clara.",
  })
}

// ────────────────────────────────────────────────────────────────────────────
// Ana · inscripción ABANDONADA
// ────────────────────────────────────────────────────────────────────────────

async function inscribirAnaAbandonada(
  usuarios: UsuariosSeedResult,
  cursoXyz: CursoXyzSeedResult,
): Promise<void> {
  await crearInscripcion({
    key: "ana:xyz",
    participanteId: usuarios.ana_bloqueada.id,
    cursoId: cursoXyz.cursoId,
    tipo: "SOLICITUD",
    estado: "ABANDONADA",
    inscritaHaceDias: 30,
    abandonadaHaceDias: 12,
  })
}

// ────────────────────────────────────────────────────────────────────────────
// Bruno · inscripción LIBRE al curso del catálogo libre
// ────────────────────────────────────────────────────────────────────────────

async function inscribirBrunoLibre(
  usuarios: UsuariosSeedResult,
  cursosAux: CursosAuxResult,
): Promise<void> {
  const inscripcionId = await crearInscripcion({
    key: "bruno:libre",
    participanteId: usuarios.bruno_libre.id,
    cursoId: cursosAux.cursoLibre.id,
    tipo: "LIBRE",
    estado: "ACTIVA",
    inscritaHaceDias: 5,
  })

  // I9 · LIBRE → todas las asignaciones OPCIONAL.
  const moduloLibreId = uuidEstable("modulo:libre:react")
  await asignar({
    key: "bruno:libre:react",
    inscripcionId,
    moduloId: moduloLibreId,
    tipo: "OPCIONAL",
  })
  await estadoModulo({
    key: "bruno:libre:react",
    inscripcionId,
    moduloId: moduloLibreId,
    estado: "EN_PROGRESO",
    porcentajeAvance: 50,
    iniciadoHaceDias: 4,
  })
}

// ────────────────────────────────────────────────────────────────────────────
// Helpers de entregas
// ────────────────────────────────────────────────────────────────────────────

async function crearEntrega(opts: {
  key: string
  inscripcionId: string
  bloqueId: string
  intento: number
  nota: number | null
  estado: "ENVIADA" | "EVALUADA_AUTOMATICAMENTE" | "PENDIENTE_REVISION" | "EVALUADA"
  feedback?: string | null
  evaluadoPorId?: string | null
  haceDias: number
  contenido: Record<string, unknown>
}): Promise<void> {
  const id = uuidEstable(`entregaBloque:${opts.key}`)
  await prisma.entregaBloque.upsert({
    where: { id },
    update: {},
    create: {
      id,
      inscripcionId: opts.inscripcionId,
      bloqueId: opts.bloqueId,
      intento: opts.intento,
      contenido: opts.contenido as Parameters<
        typeof prisma.entregaBloque.create
      >[0]["data"]["contenido"],
      nota: opts.nota,
      feedback: opts.feedback ?? null,
      estado: opts.estado,
      evaluadaPorId: opts.evaluadoPorId ?? null,
      enviadaAt: diasAtras(opts.haceDias),
      evaluadaAt:
        opts.estado === "EVALUADA" || opts.estado === "EVALUADA_AUTOMATICAMENTE"
          ? horasAtras(opts.haceDias * 24 - 2)
          : null,
    },
  })
}

async function crearEntregasMultiplesIntentos(opts: {
  keyBase: string
  inscripcionId: string
  bloqueId: string
  intentos: { nota: number; hace: number }[]
  evaluadorId: string | null
}): Promise<void> {
  let i = 0
  for (const intento of opts.intentos) {
    await crearEntrega({
      key: `${opts.keyBase}:${i + 1}`,
      inscripcionId: opts.inscripcionId,
      bloqueId: opts.bloqueId,
      intento: i + 1,
      nota: intento.nota,
      estado: "EVALUADA_AUTOMATICAMENTE",
      evaluadoPorId: opts.evaluadorId,
      haceDias: intento.hace,
      contenido: { respuestas: [{ preguntaId: "q0", respuesta: "o1" }] },
    })
    i++
  }
}

async function crearEntregaProyecto(opts: {
  key: string
  inscripcionId: string
  miniProyectoId: string | null
  transversalId: string | null
  intento: number
  notaCapa1: number
  notaCapa2: number
  notaCapa3: number
  notaFinal: number
  estado: "ENVIADA" | "EN_REVISION" | "EVALUADA"
  haceDias: number
  fortalezas?: string
  areasMejora?: string
}): Promise<void> {
  const id = uuidEstable(`entregaProyecto:${opts.key}`)
  await prisma.entregaProyecto.upsert({
    where: { id },
    update: {},
    create: {
      id,
      inscripcionId: opts.inscripcionId,
      miniProyectoId: opts.miniProyectoId,
      transversalId: opts.transversalId,
      intento: opts.intento,
      urlRepo: `https://github.com/nexott-demo/${opts.key.replace(/:/g, "-")}`,
      rama: "main",
      pesoCapa1Aplicado: 40,
      pesoCapa2Aplicado: 30,
      pesoCapa3Aplicado: 30,
      notaCapa1: opts.notaCapa1,
      notaCapa2: opts.notaCapa2,
      notaCapa3: opts.notaCapa3,
      notaFinal: opts.notaFinal,
      estado: opts.estado,
      enviadaAt: diasAtras(opts.haceDias + 1),
      evaluadaAt: opts.estado === "EVALUADA" ? diasAtras(opts.haceDias) : null,
      fortalezas: opts.fortalezas ?? null,
      areasMejora: opts.areasMejora ?? null,
    },
  })

  // Detalle por capa cuando está EVALUADA.
  if (opts.estado === "EVALUADA") {
    for (const capa of [
      "CAPA_1_OBJETIVA",
      "CAPA_2_CUALITATIVA_IA",
      "CAPA_3_COMPRENSION_IA",
    ] as const) {
      const detalleId = uuidEstable(`detalleCapa:${opts.key}:${capa}`)
      await prisma.detalleCapaEvaluacion.upsert({
        where: { entregaProyectoId_capa: { entregaProyectoId: id, capa } },
        update: {},
        create: {
          id: detalleId,
          entregaProyectoId: id,
          capa,
          detalle:
            capa === "CAPA_1_OBJETIVA"
              ? {
                  tests: { pasados: 18, total: 20 },
                  linter: { errores: 0, warnings: 2 },
                  commits: { total: 14, autores: 1 },
                }
              : capa === "CAPA_2_CUALITATIVA_IA"
                ? {
                    codigoAnalisis: { legibilidad: 80, tipado: 85 },
                    arquitectura: { capas: "claras", coupling: "bajo" },
                  }
                : {
                    preguntas: ["¿Por qué decidiste usar X aquí?", "¿Cómo manejas errores?"],
                    respuestas: ["Justificación clara.", "Estrategia razonable."],
                  },
        },
      })
    }
  }
}
