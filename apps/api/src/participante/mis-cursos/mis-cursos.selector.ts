// Selector puro: convierte InscripcionRow[] -> ParticipanteMisCursosResponse.
//
// Doc canonico: DOCUMENTOS/doc/v2/3-pantallas/participante/mis-cursos/lista.md
//
// Reglas (todas testeadas en mis-cursos.selector.test.ts):
//   - kpis.enCurso = inscripciones ACTIVA con porcentajeAvance > 0 en al menos
//     un modulo (estado EN_PROGRESO; §4.2 KPI 1).
//   - kpis.completados = inscripciones COMPLETADA (§4.2 KPI 2).
//   - kpis.total = inscripciones ACTIVA (incluye sin iniciar; §4.2 KPI 3).
//   - kpis.notaPromedio = promedio entero de notas globales de COMPLETADA;
//     null si no hay completadas (§4.2 KPI 4).
//   - resumen.activos = ACTIVA, resumen.completados = COMPLETADA, total suma.
//   - cards: SOLICITUD ACTIVA/COMPLETADA -> asignados.
//            LIBRE  ACTIVA/COMPLETADA/ABANDONADA -> libres.
//            CERRADO_SIN_COMPLETAR queda fuera (§6.4 README, vive en expediente).
//   - excelencia: nota >= 90 al COMPLETADO. Forzar gradiente "spectral" en card.
//   - recienAsignado (dot rose §6.5): SOLICITUD ACTIVA sin estadosModulo y
//     inscritaAt <= 7 dias.
//   - recienCompletado (glow §6.6): COMPLETADA con completadaAt <= 7 dias.
//   - hint: derivado segun estado (§4.5.3).

import type {
  CursoCard,
  CursoEstado,
  CursoHint,
  GradientePreset,
  ParticipanteMisCursosResponse,
} from "@nexott-learn/shared-types"
import {
  type InscripcionRow,
  descripcionCorta,
  gradienteParaCurso,
  iconoParaCurso,
  nivelParaCurso,
} from "./mis-cursos.types"

const SIETE_DIAS_MS = 7 * 24 * 60 * 60 * 1000
const UMBRAL_EXCELENCIA = 90

export function construirRespuesta(
  inscripciones: InscripcionRow[],
  ahora: Date,
): ParticipanteMisCursosResponse {
  const cards = inscripciones.flatMap((ins) => {
    const card = mapearCard(ins, ahora)
    return card ? [card] : []
  })

  const asignados = cards.filter((c) => c.tipoInscripcion === "SOLICITUD")
  const libres = cards.filter((c) => c.tipoInscripcion === "LIBRE")

  const activas = inscripciones.filter((i) => i.estado === "ACTIVA").length
  const completadas = inscripciones.filter((i) => i.estado === "COMPLETADA").length

  const enCurso = inscripciones.filter(
    (i) =>
      i.estado === "ACTIVA" &&
      i.estadosModulo.some((m) => m.estado === "EN_PROGRESO" || m.porcentajeAvance > 0),
  ).length

  const notas = inscripciones
    .filter((i) => i.estado === "COMPLETADA" && i.notaGlobal != null)
    .map((i) => i.notaGlobal as number)
  const notaPromedio =
    notas.length === 0 ? null : Math.round(notas.reduce((s, n) => s + n, 0) / notas.length)

  return {
    resumen: { activos: activas, completados: completadas, total: activas + completadas },
    kpis: { enCurso, completados: completadas, total: activas, notaPromedio },
    asignados,
    libres,
  }
}

function mapearCard(ins: InscripcionRow, ahora: Date): CursoCard | null {
  if (!debeAparecerEnLista(ins)) {
    return null
  }
  const estado = calcularEstado(ins)
  const excelencia = estado.tipo === "COMPLETADO" && estado.excelencia
  const gradiente: GradientePreset = excelencia ? "spectral" : gradienteParaCurso(ins.curso.slug)

  return {
    id: ins.curso.slug,
    inscripcionId: ins.id,
    titulo: ins.curso.titulo,
    descripcionCorta: descripcionCorta(
      ins.curso.descripcion,
      `Curso para ${ins.curso.empresaCliente}`,
    ),
    gradiente,
    icono: iconoParaCurso(ins.curso.slug),
    nivel: nivelParaCurso(ins.curso.titulo, ins.curso.descripcion),
    cantidadModulos: ins.cantidadModulos,
    tipoInscripcion: ins.tipo,
    estado,
    hint: calcularHint(ins, estado),
    cliente:
      estado.tipo === "COMPLETADO" && ins.tipo === "SOLICITUD" ? ins.curso.empresaCliente : null,
    recienAsignado: esRecienAsignado(ins, ahora),
    recienCompletado: esRecienCompletado(ins, ahora),
    href: `/cursos/${ins.curso.slug}`,
  }
}

function debeAparecerEnLista(ins: InscripcionRow): boolean {
  if (ins.estado === "CERRADO_SIN_COMPLETAR") {
    return false
  }
  if (ins.estado === "ABANDONADA") {
    return ins.tipo === "LIBRE"
  }
  return true
}

function calcularEstado(ins: InscripcionRow): CursoEstado {
  if (ins.estado === "ABANDONADA") {
    return { tipo: "ABANDONADO" }
  }
  if (ins.estado === "COMPLETADA") {
    const nota = ins.notaGlobal ?? 0
    return {
      tipo: "COMPLETADO",
      nota: Math.round(nota),
      excelencia: nota >= UMBRAL_EXCELENCIA,
      fechaCompletadoIso: (ins.completadaAt ?? new Date(0)).toISOString(),
    }
  }

  // ACTIVA: derivar % global como promedio simple del avance de modulos asignados.
  const modulosAsignados = ins.asignaciones.length
  if (modulosAsignados === 0) {
    return { tipo: "NO_INICIADO" }
  }
  const estadoMap = new Map(ins.estadosModulo.map((e) => [e.moduloId, e]))
  const sumaAvance = ins.asignaciones.reduce((acc, a) => {
    const e = estadoMap.get(a.moduloId)
    return acc + (e?.porcentajeAvance ?? 0)
  }, 0)
  const promedio = Math.round(sumaAvance / modulosAsignados)

  if (promedio <= 0) {
    return { tipo: "NO_INICIADO" }
  }
  if (promedio >= 100) {
    // Avance llegó a 100 pero la inscripcion aun no fue marcada COMPLETADA por
    // el sistema de cierre (§8.7 MAESTRO). Se reporta como EN_PROGRESO 99 para
    // que la card no muestre "completado" antes del sellado.
    return { tipo: "EN_PROGRESO", porcentajeAvance: 99 }
  }
  return { tipo: "EN_PROGRESO", porcentajeAvance: promedio }
}

function calcularHint(ins: InscripcionRow, estado: CursoEstado): CursoHint {
  if (estado.tipo === "ABANDONADO") {
    return { tipo: "ABANDONADO", texto: "Abandonado · puedes inscribirte de nuevo" }
  }
  if (estado.tipo === "COMPLETADO") {
    const sufijo = estado.excelencia ? ` (${estado.nota}) - Excelencia` : `: ${estado.nota}`
    return { tipo: "NOTA_FINAL", texto: `Nota final${sufijo}` }
  }
  if (estado.tipo === "CERRADO_SIN_COMPLETAR") {
    return { tipo: "CERRADO", texto: "Curso cerrado por el cliente" }
  }
  if (estado.tipo === "NO_INICIADO") {
    const primero = primerModuloObligatorio(ins) ?? primerModulo(ins)
    return primero
      ? { tipo: "COMENZAR_POR", texto: `Comienza por: ${primero}` }
      : { tipo: "COMENZAR_POR", texto: "Comienza por el primer modulo" }
  }
  // EN_PROGRESO
  const siguiente = moduloEnProgreso(ins) ?? primerModuloObligatorio(ins) ?? primerModulo(ins)
  return {
    tipo: "SIGUIENTE",
    texto: siguiente ?? "Continua con el siguiente modulo",
  }
}

function primerModuloObligatorio(ins: InscripcionRow): string | null {
  const ordenados = [...ins.asignaciones]
    .filter((a) => a.tipo === "OBLIGATORIO")
    .sort((a, b) => a.orden - b.orden)
  const estadoMap = new Map(ins.estadosModulo.map((e) => [e.moduloId, e]))
  const pendiente = ordenados.find((a) => {
    const e = estadoMap.get(a.moduloId)
    return !e || e.estado !== "COMPLETADO"
  })
  return pendiente?.tituloModulo ?? null
}

function primerModulo(ins: InscripcionRow): string | null {
  const ordenados = [...ins.asignaciones].sort((a, b) => a.orden - b.orden)
  return ordenados[0]?.tituloModulo ?? null
}

function moduloEnProgreso(ins: InscripcionRow): string | null {
  const enProgresoIds = new Set(
    ins.estadosModulo.filter((e) => e.estado === "EN_PROGRESO").map((e) => e.moduloId),
  )
  if (enProgresoIds.size === 0) {
    return null
  }
  const candidatos = ins.asignaciones
    .filter((a) => enProgresoIds.has(a.moduloId))
    .sort((a, b) => a.orden - b.orden)
  return candidatos[0]?.tituloModulo ?? null
}

function esRecienAsignado(ins: InscripcionRow, ahora: Date): boolean {
  if (ins.estado !== "ACTIVA" || ins.tipo !== "SOLICITUD") {
    return false
  }
  if (ins.estadosModulo.length > 0) {
    return false
  }
  return ahora.getTime() - ins.inscritaAt.getTime() <= SIETE_DIAS_MS
}

function esRecienCompletado(ins: InscripcionRow, ahora: Date): boolean {
  if (ins.estado !== "COMPLETADA" || ins.completadaAt == null) {
    return false
  }
  return ahora.getTime() - ins.completadaAt.getTime() <= SIETE_DIAS_MS
}
