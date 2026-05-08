import type {
  BloqueDetalleAdmin,
  CursoAreaDetalle,
  CursoAreaIndividualDetalle,
  CursoDetalle,
  CursoListItem,
  EntrevistaIADetalleAdmin,
  MiniProyectoDetalleAdmin,
  ModuloResumen,
  ProyectoTransversalDetalleAdmin,
} from "@nexott-learn/shared-types"
import type { Prisma } from "@prisma/client"

// MAESTRO §6.2 · selecciones reusables Prisma para listado y detalle del curso.
// Centralizar los SELECTs aqui garantiza que el mapper reciba siempre la misma
// forma y que el snapshot del LogActividad use los mismos campos.

// Listado: solo cabecera + 3 contadores (areas / modulos no archivados /
// inscripciones ACTIVA). Sin pesos ni umbrales para no engordar la respuesta
// (lista.md anatomia de tarjeta).
export const CURSO_LIST_SELECT = {
  id: true,
  empresaCliente: true,
  titulo: true,
  slug: true,
  estado: true,
  fechaInicio: true,
  deadline: true,
  imagenUrl: true,
  descripcion: true,
  permiteInscripcionLibre: true,
  createdAt: true,
  updatedAt: true,
  _count: {
    select: {
      cursoAreas: true,
      // archivadoAt null = no archivado.
      modulos: { where: { archivadoAt: null } },
      inscripciones: { where: { estado: "ACTIVA" } },
    },
  },
} satisfies Prisma.CursoSelect

export type CursoListRow = Prisma.CursoGetPayload<{ select: typeof CURSO_LIST_SELECT }>

// Detalle: todo el curso + areas con su area-catalogo embebida + modulosCount
// por area + activacion de transversal/entrevista (sin payloads completos).
export const CURSO_DETALLE_SELECT = {
  id: true,
  empresaCliente: true,
  titulo: true,
  slug: true,
  descripcion: true,
  imagenUrl: true,
  duracionEstimada: true,
  fechaInicio: true,
  deadline: true,
  estado: true,
  permiteInscripcionLibre: true,
  pesoAreas: true,
  pesoProyectoTransversal: true,
  pesoEntrevistaIA: true,
  pesoActividades: true,
  pesoMiniProyecto: true,
  umbralExcelencia: true,
  umbralAprobado: true,
  umbralEnDesarrollo: true,
  umbralBrechaNoCumple: true,
  publicadoAt: true,
  cerradoAt: true,
  duplicadoDeId: true,
  createdAt: true,
  updatedAt: true,
  _count: {
    select: {
      cursoAreas: true,
      modulos: { where: { archivadoAt: null } },
      inscripciones: { where: { estado: "ACTIVA" } },
    },
  },
  cursoAreas: {
    orderBy: { orden: "asc" },
    select: {
      id: true,
      areaId: true,
      peso: true,
      puntajeObjetivo: true,
      orden: true,
      area: { select: { id: true, nombre: true, color: true } },
    },
  },
  proyectoTransversal: { select: { id: true } },
  entrevistaIAConfig: { select: { id: true } },
} satisfies Prisma.CursoSelect

export type CursoDetalleRow = Prisma.CursoGetPayload<{ select: typeof CURSO_DETALLE_SELECT }>

// Cuenta de modulos no archivados por area dentro del curso. La pasamos aparte
// porque Prisma no permite agrupar por areaId dentro del select de cursoAreas.
export type ModulosPorAreaCount = Map<string, number>

function decimalAEntero(value: Prisma.Decimal | number): number {
  // @prisma/client.runtime exporta `Decimal`. Para evitar acoplar a la version
  // exacta y porque tipamos `pesoSchema` como number en el shared-types,
  // convertimos por toString para no perder precision en el sufijo decimal.
  if (typeof value === "number") {
    return value
  }
  return Number(value.toString())
}

export function mapCursoListItem(row: CursoListRow): CursoListItem {
  return {
    id: row.id,
    empresaCliente: row.empresaCliente,
    titulo: row.titulo,
    slug: row.slug,
    estado: row.estado,
    fechaInicio: row.fechaInicio ? row.fechaInicio.toISOString() : null,
    deadline: row.deadline ? row.deadline.toISOString() : null,
    imagenUrl: row.imagenUrl,
    descripcion: row.descripcion,
    permiteInscripcionLibre: row.permiteInscripcionLibre,
    contadores: {
      areas: row._count.cursoAreas,
      modulos: row._count.modulos,
      inscripcionesActivas: row._count.inscripciones,
    },
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

export function mapCursoDetalle(
  row: CursoDetalleRow,
  modulosPorArea: ModulosPorAreaCount,
  algunModuloConMiniActivo: boolean,
): CursoDetalle {
  const cursoAreas: CursoAreaDetalle[] = row.cursoAreas.map((ca) => ({
    id: ca.id,
    areaId: ca.areaId,
    area: { id: ca.area.id, nombre: ca.area.nombre, color: ca.area.color },
    peso: decimalAEntero(ca.peso),
    puntajeObjetivo: ca.puntajeObjetivo,
    orden: ca.orden,
    modulosCount: modulosPorArea.get(ca.areaId) ?? 0,
  }))

  return {
    id: row.id,
    empresaCliente: row.empresaCliente,
    titulo: row.titulo,
    slug: row.slug,
    estado: row.estado,
    fechaInicio: row.fechaInicio ? row.fechaInicio.toISOString() : null,
    deadline: row.deadline ? row.deadline.toISOString() : null,
    imagenUrl: row.imagenUrl,
    descripcion: row.descripcion,
    permiteInscripcionLibre: row.permiteInscripcionLibre,
    contadores: {
      areas: row._count.cursoAreas,
      modulos: row._count.modulos,
      inscripcionesActivas: row._count.inscripciones,
    },
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    duracionEstimada: row.duracionEstimada,
    pesoAreas: decimalAEntero(row.pesoAreas),
    pesoProyectoTransversal: decimalAEntero(row.pesoProyectoTransversal),
    pesoEntrevistaIA: decimalAEntero(row.pesoEntrevistaIA),
    pesoActividades: decimalAEntero(row.pesoActividades),
    pesoMiniProyecto: decimalAEntero(row.pesoMiniProyecto),
    umbralExcelencia: row.umbralExcelencia,
    umbralAprobado: row.umbralAprobado,
    umbralEnDesarrollo: row.umbralEnDesarrollo,
    umbralBrechaNoCumple: row.umbralBrechaNoCumple,
    publicadoAt: row.publicadoAt ? row.publicadoAt.toISOString() : null,
    cerradoAt: row.cerradoAt ? row.cerradoAt.toISOString() : null,
    duplicadoDeId: row.duplicadoDeId,
    cursoAreas,
    proyectoTransversal: { activo: row.proyectoTransversal !== null },
    entrevistaIAConfig: { activa: row.entrevistaIAConfig !== null },
    algunModuloConMiniActivo,
  }
}

// SELECT para GET /admin/cursos/:cursoId/areas/:cursoAreaId — incluye area con
// descripcion+estado, modulos no archivados y sus secciones+bloques para los
// contadores (seccionesCount, evaluablesCount).
export const CURSO_AREA_DETALLE_SELECT = {
  id: true,
  cursoId: true,
  areaId: true,
  peso: true,
  puntajeObjetivo: true,
  orden: true,
  area: {
    select: {
      id: true,
      nombre: true,
      color: true,
      descripcion: true,
      estado: true,
    },
  },
} satisfies Prisma.CursoAreaSelect

export type CursoAreaDetalleRow = Prisma.CursoAreaGetPayload<{
  select: typeof CURSO_AREA_DETALLE_SELECT
}>

// ─────────────────────────────────────────────────────────────────
// MODULO DETALLE SELECT + MAPPER
// ─────────────────────────────────────────────────────────────────

export const MODULO_DETALLE_SELECT = {
  id: true,
  cursoId: true,
  areaId: true,
  titulo: true,
  descripcion: true,
  orden: true,
  miniProyectoActivo: true,
  umbralMiniOverride: true,
  archivadoAt: true,
  archivadoEstado: true,
  clonadoDeId: true,
  createdAt: true,
  updatedAt: true,
  _count: {
    select: {
      secciones: { where: { archivadoAt: null } },
    },
  },
  secciones: {
    where: { archivadoAt: null },
    select: {
      bloques: {
        where: { archivadoAt: null },
        select: {
          tipo: true,
          codigoEvaluable: true,
        },
      },
    },
  },
  miniProyecto: { select: { id: true } },
} satisfies Prisma.ModuloSelect

export type ModuloDetalleRow = Prisma.ModuloGetPayload<{ select: typeof MODULO_DETALLE_SELECT }>

function calcularEvaluablesModulo(secciones: ModuloDetalleRow["secciones"]): number {
  let count = 0
  for (const sec of secciones) {
    for (const b of sec.bloques) {
      if (b.tipo === "QUIZ") {
        count += 1
      } else if (
        b.tipo === "CODIGO" &&
        b.codigoEvaluable !== null &&
        b.codigoEvaluable !== "NINGUNO"
      ) {
        count += 1
      }
    }
  }
  return count
}

export function mapModuloDetalle(row: ModuloDetalleRow): ModuloDetalleOutput {
  return {
    id: row.id,
    cursoId: row.cursoId,
    areaId: row.areaId,
    titulo: row.titulo,
    descripcion: row.descripcion ?? null,
    orden: row.orden,
    miniProyectoActivo: row.miniProyectoActivo,
    umbralMiniOverride: row.umbralMiniOverride ?? null,
    archivadoAt: row.archivadoAt ? row.archivadoAt.toISOString() : null,
    clonadoDeId: row.clonadoDeId ?? null,
    seccionesCount: row._count.secciones,
    evaluablesCount: calcularEvaluablesModulo(row.secciones),
    tieneEntregas: false,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

export type ModuloDetalleOutput = {
  id: string
  cursoId: string
  areaId: string
  titulo: string
  descripcion: string | null
  orden: number
  miniProyectoActivo: boolean
  umbralMiniOverride: number | null
  archivadoAt: string | null
  clonadoDeId: string | null
  seccionesCount: number
  evaluablesCount: number
  tieneEntregas: boolean
  createdAt: string
  updatedAt: string
}

// Forma intermedia de modulo con secciones y bloques para calcular contadores.
export type ModuloConBloques = {
  id: string
  titulo: string
  secciones: Array<{
    archivadoAt: Date | null
    bloques: Array<{
      archivadoAt: Date | null
      tipo: "PARRAFO" | "TIP" | "VIDEO" | "RECURSO" | "CODIGO" | "QUIZ"
      codigoEvaluable: "NINGUNO" | "PREGUNTAS" | "TESTS" | null
    }>
  }>
}

// Calcula evaluablesCount: bloques no archivados en secciones no archivadas
// con tipo QUIZ, o CODIGO con codigoEvaluable distinto de NINGUNO (y no null).
function calcularEvaluablesCount(modulo: ModuloConBloques): number {
  let count = 0
  for (const sec of modulo.secciones) {
    if (sec.archivadoAt !== null) {
      continue
    }
    for (const bloque of sec.bloques) {
      if (bloque.archivadoAt !== null) {
        continue
      }
      if (bloque.tipo === "QUIZ") {
        count += 1
      } else if (
        bloque.tipo === "CODIGO" &&
        bloque.codigoEvaluable !== null &&
        bloque.codigoEvaluable !== "NINGUNO"
      ) {
        count += 1
      }
    }
  }
  return count
}

export function mapCursoAreaIndividualDetalle(
  row: CursoAreaDetalleRow,
  modulos: ModuloConBloques[],
): CursoAreaIndividualDetalle {
  const modulosMapeados: ModuloResumen[] = modulos.map((mod) => {
    const seccionesCount = mod.secciones.filter((s) => s.archivadoAt === null).length
    const evaluablesCount = calcularEvaluablesCount(mod)
    return { id: mod.id, titulo: mod.titulo, seccionesCount, evaluablesCount }
  })

  return {
    id: row.id,
    areaId: row.areaId,
    area: {
      id: row.area.id,
      nombre: row.area.nombre,
      color: row.area.color,
      descripcion: row.area.descripcion ?? null,
      estado: row.area.estado,
    },
    peso: decimalAEntero(row.peso),
    puntajeObjetivo: row.puntajeObjetivo,
    orden: row.orden,
    modulos: modulosMapeados,
  }
}

// ─────────────────────────────────────────────────────────────────
// SECCION DETALLE SELECT + MAPPER
// ─────────────────────────────────────────────────────────────────

export const SECCION_DETALLE_SELECT = {
  id: true,
  moduloId: true,
  titulo: true,
  orden: true,
  archivadoAt: true,
  archivadoEstado: true,
  createdAt: true,
  updatedAt: true,
  _count: {
    select: {
      bloques: { where: { archivadoAt: null } },
    },
  },
  bloques: {
    where: { archivadoAt: null },
    select: {
      tipo: true,
      codigoEvaluable: true,
    },
  },
} satisfies Prisma.SeccionSelect

export type SeccionDetalleRow = Prisma.SeccionGetPayload<{ select: typeof SECCION_DETALLE_SELECT }>

function calcularEvaluablesSeccion(bloques: SeccionDetalleRow["bloques"]): number {
  let count = 0
  for (const b of bloques) {
    if (b.tipo === "QUIZ") {
      count += 1
    } else if (
      b.tipo === "CODIGO" &&
      b.codigoEvaluable !== null &&
      b.codigoEvaluable !== "NINGUNO"
    ) {
      count += 1
    }
  }
  return count
}

export type SeccionDetalleOutput = {
  id: string
  moduloId: string
  titulo: string
  orden: number
  archivadoAt: string | null
  bloquesCount: number
  evaluablesCount: number
  tieneEntregas: boolean
  createdAt: string
  updatedAt: string
}

export function mapSeccionDetalle(row: SeccionDetalleRow): SeccionDetalleOutput {
  return {
    id: row.id,
    moduloId: row.moduloId,
    titulo: row.titulo,
    orden: row.orden,
    archivadoAt: row.archivadoAt ? row.archivadoAt.toISOString() : null,
    bloquesCount: row._count.bloques,
    evaluablesCount: calcularEvaluablesSeccion(row.bloques),
    tieneEntregas: false,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

// Snapshot JSON-serializable de una sección para LogActividad.
export function snapshotSeccion(row: {
  id: string
  moduloId: string
  titulo: string
  orden: number
  archivadoAt: Date | null
}): Prisma.InputJsonValue {
  return {
    id: row.id,
    moduloId: row.moduloId,
    titulo: row.titulo,
    orden: row.orden,
    archivadoAt: row.archivadoAt ? row.archivadoAt.toISOString() : null,
  }
}

// Snapshot JSON de las areas del curso (subset usado por
// CURSO_AREAS_ACTUALIZADAS — el resto del curso no cambia en ese flujo, asi
// que el log se mantiene esbelto trayendo solo lo que se reescribio).
export function snapshotAreas(row: CursoDetalleRow): Prisma.InputJsonValue {
  return {
    cursoId: row.id,
    cursoAreas: row.cursoAreas.map((ca) => ({
      areaId: ca.areaId,
      peso: decimalAEntero(ca.peso),
      puntajeObjetivo: ca.puntajeObjetivo,
      orden: ca.orden,
    })),
  }
}

// Snapshot JSON-serializable del curso para LogActividad. Como en areas,
// convertimos Decimal/Date a primitivos.
export function snapshotCurso(row: CursoDetalleRow): Prisma.InputJsonValue {
  return {
    id: row.id,
    empresaCliente: row.empresaCliente,
    titulo: row.titulo,
    slug: row.slug,
    estado: row.estado,
    fechaInicio: row.fechaInicio ? row.fechaInicio.toISOString() : null,
    deadline: row.deadline ? row.deadline.toISOString() : null,
    permiteInscripcionLibre: row.permiteInscripcionLibre,
    pesoAreas: decimalAEntero(row.pesoAreas),
    pesoProyectoTransversal: decimalAEntero(row.pesoProyectoTransversal),
    pesoEntrevistaIA: decimalAEntero(row.pesoEntrevistaIA),
    pesoActividades: decimalAEntero(row.pesoActividades),
    pesoMiniProyecto: decimalAEntero(row.pesoMiniProyecto),
    umbralExcelencia: row.umbralExcelencia,
    umbralAprobado: row.umbralAprobado,
    umbralEnDesarrollo: row.umbralEnDesarrollo,
    umbralBrechaNoCumple: row.umbralBrechaNoCumple,
    publicadoAt: row.publicadoAt ? row.publicadoAt.toISOString() : null,
    cerradoAt: row.cerradoAt ? row.cerradoAt.toISOString() : null,
    updatedAt: row.updatedAt.toISOString(),
  }
}

// ─────────────────────────────────────────────────────────────────
// BLOQUE DETALLE SELECT + MAPPER
// ─────────────────────────────────────────────────────────────────

export const BLOQUE_DETALLE_SELECT = {
  id: true,
  seccionId: true,
  tipo: true,
  orden: true,
  codigoUbicacion: true,
  codigoInteractivo: true,
  codigoEvaluable: true,
  codigoLenguaje: true,
  payload: true,
  solucionReferencia: true,
  archivadoAt: true,
  archivadoEstado: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.BloqueSelect

export type BloqueDetalleRow = Prisma.BloqueGetPayload<{ select: typeof BLOQUE_DETALLE_SELECT }>

// MAESTRO §3.4 · admin recibe solucionReferencia, alumno NO. Este mapper se usa
// SOLO en endpoints admin; el modulo alumno deberá tener su propio mapper que
// omita el campo. payload es Json y lo devolvemos opaco al consumidor.
export function mapBloqueDetalle(row: BloqueDetalleRow): BloqueDetalleAdmin {
  return {
    id: row.id,
    seccionId: row.seccionId,
    tipo: row.tipo,
    orden: row.orden,
    codigoUbicacion: row.codigoUbicacion,
    codigoInteractivo: row.codigoInteractivo,
    codigoEvaluable: row.codigoEvaluable,
    codigoLenguaje: row.codigoLenguaje,
    payload: (row.payload ?? {}) as Record<string, unknown>,
    solucionReferencia: row.solucionReferencia,
    archivadoAt: row.archivadoAt ? row.archivadoAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

// Snapshot JSON-serializable del bloque para LogActividad. Igual que en
// snapshotSeccion: convertimos Date a ISO y usamos la forma "ancha" (mismos
// campos del SELECT para que el log refleje exactamente lo persistido).
export function snapshotBloque(row: BloqueDetalleRow): Prisma.InputJsonValue {
  return {
    id: row.id,
    seccionId: row.seccionId,
    tipo: row.tipo,
    orden: row.orden,
    codigoUbicacion: row.codigoUbicacion,
    codigoInteractivo: row.codigoInteractivo,
    codigoEvaluable: row.codigoEvaluable,
    codigoLenguaje: row.codigoLenguaje,
    payload: (row.payload ?? {}) as Prisma.InputJsonValue,
    solucionReferencia: row.solucionReferencia,
    archivadoAt: row.archivadoAt ? row.archivadoAt.toISOString() : null,
  }
}

// =============================================================================
// MINI PROYECTO DETALLE SELECT + MAPPER
// =============================================================================

export const MINIPROYECTO_DETALLE_SELECT = {
  id: true,
  moduloId: true,
  titulo: true,
  enunciado: true,
  pesoCapa1: true,
  pesoCapa2: true,
  pesoCapa3: true,
  createdAt: true,
  updatedAt: true,
  modulo: {
    select: { umbralMiniOverride: true },
  },
} satisfies Prisma.MiniProyectoSelect

export type MiniProyectoDetalleRow = Prisma.MiniProyectoGetPayload<{
  select: typeof MINIPROYECTO_DETALLE_SELECT
}>

export function mapMiniProyectoDetalle(row: MiniProyectoDetalleRow): MiniProyectoDetalleAdmin {
  return {
    id: row.id,
    moduloId: row.moduloId,
    titulo: row.titulo,
    enunciado: row.enunciado,
    pesoCapa1: Number(row.pesoCapa1),
    pesoCapa2: Number(row.pesoCapa2),
    pesoCapa3: Number(row.pesoCapa3),
    umbralMiniOverride: row.modulo.umbralMiniOverride,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

export function snapshotMiniProyecto(row: MiniProyectoDetalleRow): Prisma.InputJsonValue {
  return {
    id: row.id,
    moduloId: row.moduloId,
    titulo: row.titulo,
    enunciado: row.enunciado,
    pesoCapa1: Number(row.pesoCapa1),
    pesoCapa2: Number(row.pesoCapa2),
    pesoCapa3: Number(row.pesoCapa3),
    umbralMiniOverride: row.modulo.umbralMiniOverride,
  }
}

// =============================================================================
// PROYECTO TRANSVERSAL DETALLE SELECT + MAPPER
// MAESTRO §3.6, §10.2, §10.5 · 1-1 opcional con Curso. umbralAprobacion vive
// en el propio modelo (default 70), a diferencia del Mini que hereda del área.
// =============================================================================

export const PROYECTO_TRANSVERSAL_DETALLE_SELECT = {
  id: true,
  cursoId: true,
  titulo: true,
  enunciado: true,
  umbralAprobacion: true,
  pesoCapa1: true,
  pesoCapa2: true,
  pesoCapa3: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ProyectoTransversalSelect

export type ProyectoTransversalDetalleRow = Prisma.ProyectoTransversalGetPayload<{
  select: typeof PROYECTO_TRANSVERSAL_DETALLE_SELECT
}>

export function mapProyectoTransversalDetalle(
  row: ProyectoTransversalDetalleRow,
): ProyectoTransversalDetalleAdmin {
  return {
    id: row.id,
    cursoId: row.cursoId,
    titulo: row.titulo,
    enunciado: row.enunciado,
    umbralAprobacion: row.umbralAprobacion,
    pesoCapa1: Number(row.pesoCapa1),
    pesoCapa2: Number(row.pesoCapa2),
    pesoCapa3: Number(row.pesoCapa3),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

export function snapshotProyectoTransversal(
  row: ProyectoTransversalDetalleRow,
): Prisma.InputJsonValue {
  return {
    id: row.id,
    cursoId: row.cursoId,
    titulo: row.titulo,
    enunciado: row.enunciado,
    umbralAprobacion: row.umbralAprobacion,
    pesoCapa1: Number(row.pesoCapa1),
    pesoCapa2: Number(row.pesoCapa2),
    pesoCapa3: Number(row.pesoCapa3),
  }
}

// =============================================================================
// ENTREVISTA IA CONFIG DETALLE SELECT + MAPPER
// MAESTRO §11.1, §11.2 · 1-1 opcional con Curso. La rúbrica (subset áreas +
// pesos) es sub-recurso aparte y NO se cubre en este iter.
// =============================================================================

export const ENTREVISTA_IA_DETALLE_SELECT = {
  id: true,
  cursoId: true,
  perfilCliente: true,
  contextoNegocio: true,
  umbralAprobacion: true,
  numeroPreguntas: true,
  modo: true,
  maxIntentos: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.EntrevistaIAConfigSelect

export type EntrevistaIADetalleRow = Prisma.EntrevistaIAConfigGetPayload<{
  select: typeof ENTREVISTA_IA_DETALLE_SELECT
}>

export function mapEntrevistaIADetalle(row: EntrevistaIADetalleRow): EntrevistaIADetalleAdmin {
  return {
    id: row.id,
    cursoId: row.cursoId,
    perfilCliente: row.perfilCliente,
    contextoNegocio: row.contextoNegocio,
    umbralAprobacion: row.umbralAprobacion,
    numeroPreguntas: row.numeroPreguntas,
    modo: row.modo,
    maxIntentos: row.maxIntentos,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

export function snapshotEntrevistaIA(row: EntrevistaIADetalleRow): Prisma.InputJsonValue {
  return {
    id: row.id,
    cursoId: row.cursoId,
    perfilCliente: row.perfilCliente,
    contextoNegocio: row.contextoNegocio,
    umbralAprobacion: row.umbralAprobacion,
    numeroPreguntas: row.numeroPreguntas,
    modo: row.modo,
    maxIntentos: row.maxIntentos,
  }
}
