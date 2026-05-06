import type {
  ChecklistItemId,
  ChecklistItemResult,
  PublicarResumen,
} from "@nexott-learn/shared-types"
import { TOLERANCIA_PESO, TOTAL_PESO } from "@nexott-learn/shared-types"

// MAESTRO §5.1 + DOC `publicar.md` §3 · evaluador puro del checklist de
// publicacion del curso.
//
// Reglas:
// - Es **puro**: recibe la entidad ya hidratada y devuelve el resultado de
//   evaluar las 10 reglas. No toca Prisma, no lanza, no tiene side-effects.
//   Eso permite testearlo sin DB y reutilizarlo para responder Caso A/B en
//   /publicar y para precomputar el inspector del editor (modo-curso.md §3).
// - Cada regla siempre se devuelve: si `cumplido=false` aporta `ctaTarget`
//   para que el front lleve al admin al sitio exacto donde corregir
//   (publicar.md §3 "Cada faltante tiene CTA").
// - Las reglas opcionales (Transversal y Entrevista IA) se reportan aparte en
//   `opcionales` desde el caller; aqui solo evaluamos las 10 obligatorias.

// Forma minima del curso que el evaluador necesita. Definirla aqui evita
// acoplar el modulo a Prisma; el mapper hidrata estos campos antes de invocar.
// Pesos llegan como `number` ya convertidos desde Decimal.
export interface CursoParaChecklist {
  empresaCliente: string
  titulo: string
  fechaInicio: Date | null
  deadline: Date | null
  pesoAreas: number
  pesoProyectoTransversal: number
  pesoEntrevistaIA: number
  pesoActividades: number
  pesoMiniProyecto: number
  umbralExcelencia: number
  umbralAprobado: number
  umbralEnDesarrollo: number
  cursoAreas: ReadonlyArray<{
    areaId: string
    peso: number
    puntajeObjetivo: number
  }>
  modulos: ReadonlyArray<{
    id: string
    areaId: string
    miniProyectoActivo: boolean
    secciones: ReadonlyArray<{
      id: string
      bloques: ReadonlyArray<{ id: string }>
    }>
  }>
  proyectoTransversalActivo: boolean
  entrevistaIAActiva: boolean
}

export interface ChecklistResultado {
  faltantes: ChecklistItemResult[]
  cumplidos: ChecklistItemResult[]
  opcionales: ChecklistItemResult[]
  todoCumplido: boolean
  resumen: PublicarResumen
}

// Helper interno: clasifica cada item en faltante/cumplido conservando el
// orden original (importante para que el admin lea el checklist como en la
// doc).
function partir(items: ChecklistItemResult[]): {
  faltantes: ChecklistItemResult[]
  cumplidos: ChecklistItemResult[]
} {
  const faltantes: ChecklistItemResult[] = []
  const cumplidos: ChecklistItemResult[] = []
  for (const item of items) {
    if (item.cumplido) {
      cumplidos.push(item)
    } else {
      faltantes.push(item)
    }
  }
  return { faltantes, cumplidos }
}

function evalClienteTitulo(curso: CursoParaChecklist): ChecklistItemResult {
  const cumplido = curso.empresaCliente.trim().length > 0 && curso.titulo.trim().length > 0
  return {
    id: "cliente_titulo",
    label: "Cliente y titulo",
    cumplido,
    ctaTarget: cumplido ? undefined : "identidad",
  }
}

function evalFechas(curso: CursoParaChecklist): ChecklistItemResult {
  const ambas = curso.fechaInicio !== null && curso.deadline !== null
  const ordenadas =
    ambas && (curso.deadline as Date).getTime() > (curso.fechaInicio as Date).getTime()
  return {
    id: "fechas",
    label: "Fechas declaradas (deadline > inicio)",
    cumplido: ordenadas,
    ctaTarget: ordenadas ? undefined : "fechas",
  }
}

function evalAreasMin1(curso: CursoParaChecklist): ChecklistItemResult {
  const cumplido = curso.cursoAreas.length > 0
  return {
    id: "areas_min_1",
    label: "Al menos 1 area",
    cumplido,
    ctaTarget: cumplido ? undefined : "areas",
  }
}

function evalAreasPesos100(curso: CursoParaChecklist): ChecklistItemResult {
  const suma = curso.cursoAreas.reduce((acc, a) => acc + a.peso, 0)
  const cumplido = curso.cursoAreas.length > 0 && Math.abs(suma - TOTAL_PESO) <= TOLERANCIA_PESO
  return {
    id: "areas_pesos_100",
    label: "Pesos por area suman 100%",
    cumplido,
    ctaTarget: cumplido ? undefined : "areas",
    detalle: cumplido ? undefined : `Suma actual: ${suma}`,
  }
}

function evalAreasObjetivo(curso: CursoParaChecklist): ChecklistItemResult {
  const todasOk =
    curso.cursoAreas.length > 0 &&
    curso.cursoAreas.every((a) => a.puntajeObjetivo >= 1 && a.puntajeObjetivo <= 100)
  return {
    id: "areas_objetivo",
    label: "Cada area tiene puntaje objetivo (1-100)",
    cumplido: todasOk,
    ctaTarget: todasOk ? undefined : "areas",
  }
}

function evalAreaTieneModulo(curso: CursoParaChecklist): ChecklistItemResult {
  if (curso.cursoAreas.length === 0) {
    return {
      id: "area_tiene_modulo",
      label: "Cada area tiene al menos 1 modulo",
      cumplido: false,
      ctaTarget: "areas",
    }
  }
  const modulosPorArea = new Set(curso.modulos.map((m) => m.areaId))
  const faltan = curso.cursoAreas.filter((a) => !modulosPorArea.has(a.areaId))
  const cumplido = faltan.length === 0
  return {
    id: "area_tiene_modulo",
    label: "Cada area tiene al menos 1 modulo",
    cumplido,
    ctaTarget: cumplido ? undefined : "areas",
    detalle: cumplido ? undefined : `Areas sin modulo: ${faltan.map((a) => a.areaId).join(", ")}`,
  }
}

function evalModuloTieneContenido(curso: CursoParaChecklist): ChecklistItemResult {
  if (curso.modulos.length === 0) {
    // Si no hay modulos la regla anterior ya marca el problema; aqui
    // devolvemos cumplido=false sin CTA especifico para no duplicar la
    // mision de "ir a areas".
    return {
      id: "modulo_tiene_contenido",
      label: "Cada modulo tiene secciones con contenido",
      cumplido: false,
      ctaTarget: "areas",
    }
  }
  const moduloProblema = curso.modulos.find((m) => !m.secciones.some((s) => s.bloques.length > 0))
  if (moduloProblema) {
    return {
      id: "modulo_tiene_contenido",
      label: "Cada modulo tiene secciones con contenido",
      cumplido: false,
      ctaTarget: { tipo: "modulo", moduloId: moduloProblema.id },
    }
  }
  return {
    id: "modulo_tiene_contenido",
    label: "Cada modulo tiene secciones con contenido",
    cumplido: true,
  }
}

function evalPesosIntraModulo(curso: CursoParaChecklist): ChecklistItemResult {
  const algunMini = curso.modulos.some((m) => m.miniProyectoActivo)
  const suma = algunMini ? curso.pesoActividades + curso.pesoMiniProyecto : curso.pesoActividades
  // Redondeo a 2 decimales para comparar cercano: §17.5 trabaja en centesimas.
  const sumaRedondeada = Math.round(suma * 100) / 100
  const cumplido = Math.abs(sumaRedondeada - TOTAL_PESO) <= TOLERANCIA_PESO
  return {
    id: "pesos_intra_modulo",
    label: algunMini
      ? "Pesos intra-modulo (Actividades + Mini) suman 100%"
      : "Pesos intra-modulo (Actividades) suman 100%",
    cumplido,
    ctaTarget: cumplido ? undefined : "pesosIntraModulo",
    detalle: cumplido ? undefined : `Suma actual: ${sumaRedondeada}`,
  }
}

function evalPesosCurso100(curso: CursoParaChecklist): ChecklistItemResult {
  const suma =
    curso.pesoAreas +
    (curso.proyectoTransversalActivo ? curso.pesoProyectoTransversal : 0) +
    (curso.entrevistaIAActiva ? curso.pesoEntrevistaIA : 0)
  const cumplido = Math.abs(suma - TOTAL_PESO) <= TOLERANCIA_PESO
  return {
    id: "pesos_curso_100",
    label: "Pesos a nivel curso suman 100%",
    cumplido,
    ctaTarget: cumplido ? undefined : "pesosCurso",
    detalle: cumplido ? undefined : `Suma actual: ${suma}`,
  }
}

function evalUmbralesLogro(curso: CursoParaChecklist): ChecklistItemResult {
  const enRango = (n: number) => Number.isInteger(n) && n >= 1 && n <= 99
  const todosEnRango =
    enRango(curso.umbralEnDesarrollo) &&
    enRango(curso.umbralAprobado) &&
    enRango(curso.umbralExcelencia)
  const ordenadosEstricto =
    curso.umbralEnDesarrollo < curso.umbralAprobado && curso.umbralAprobado < curso.umbralExcelencia
  const cumplido = todosEnRango && ordenadosEstricto
  return {
    id: "umbrales_logro",
    label: "Umbrales de logro definidos y ordenados",
    cumplido,
    ctaTarget: cumplido ? undefined : "umbralesLogro",
  }
}

const EVALUADORES: ReadonlyArray<{
  id: ChecklistItemId
  fn: (curso: CursoParaChecklist) => ChecklistItemResult
}> = [
  { id: "cliente_titulo", fn: evalClienteTitulo },
  { id: "fechas", fn: evalFechas },
  { id: "areas_min_1", fn: evalAreasMin1 },
  { id: "areas_pesos_100", fn: evalAreasPesos100 },
  { id: "areas_objetivo", fn: evalAreasObjetivo },
  { id: "area_tiene_modulo", fn: evalAreaTieneModulo },
  { id: "modulo_tiene_contenido", fn: evalModuloTieneContenido },
  { id: "pesos_intra_modulo", fn: evalPesosIntraModulo },
  { id: "pesos_curso_100", fn: evalPesosCurso100 },
  { id: "umbrales_logro", fn: evalUmbralesLogro },
]

function calcularResumen(curso: CursoParaChecklist): PublicarResumen {
  const secciones = curso.modulos.reduce((acc, m) => acc + m.secciones.length, 0)
  const bloques = curso.modulos.reduce(
    (acc, m) => acc + m.secciones.reduce((a2, s) => a2 + s.bloques.length, 0),
    0,
  )
  return {
    areas: curso.cursoAreas.length,
    modulos: curso.modulos.length,
    secciones,
    bloques,
    miniActivos: curso.modulos.filter((m) => m.miniProyectoActivo).length,
    transversalActivo: curso.proyectoTransversalActivo,
    entrevistaActiva: curso.entrevistaIAActiva,
  }
}

export function evaluarChecklistPublicacion(curso: CursoParaChecklist): ChecklistResultado {
  const items = EVALUADORES.map(({ fn }) => fn(curso))
  const { faltantes, cumplidos } = partir(items)

  // Opcionales: Transversal y Entrevista IA (no bloquean publicar pero el
  // front los muestra en la lista del modal · publicar.md Caso A "Opcionales").
  const opcionales: ChecklistItemResult[] = [
    {
      id: "pesos_curso_100", // reuso el id porque el toggle de transversal/entrevista vive ahi
      label: curso.proyectoTransversalActivo
        ? "Proyecto Transversal activo"
        : "Proyecto Transversal (no activo)",
      cumplido: curso.proyectoTransversalActivo,
    },
    {
      id: "pesos_curso_100",
      label: curso.entrevistaIAActiva ? "Entrevista IA activa" : "Entrevista IA (no activa)",
      cumplido: curso.entrevistaIAActiva,
    },
  ]

  return {
    faltantes,
    cumplidos,
    opcionales,
    todoCumplido: faltantes.length === 0,
    resumen: calcularResumen(curso),
  }
}
