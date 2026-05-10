// Orquestador de la vista del curso. Une hero + areas + hitos.
//
// Doc canonico: vista-curso.md
//
// Pipeline:
//   1. construirAreas → lista areas + modulos + siguienteModuloId
//   2. construirHitos → transversal + entrevista (con requisitos de bloqueo)
//   3. construirHero  → meta del curso + KPIs + CTA "siguiente paso"
//   4. wrap todo en ParticipanteVistaCursoResponse

import type {
  ParticipanteVistaCursoResponse,
  VistaCursoEstado,
  VistaCursoHero,
  VistaCursoKpis,
  VistaCursoSiguientePaso,
} from "@nexott-learn/shared-types"
import {
  descripcionCorta,
  gradienteParaCurso,
  iconoParaCurso,
  nivelParaCurso,
} from "./mis-cursos.types"
import { construirAreas } from "./vista-curso.areas"
import { construirHitos } from "./vista-curso.hitos"
import type { VistaCursoData } from "./vista-curso.query"

const UMBRAL_EXCELENCIA = 90

export function construirVistaCurso(data: VistaCursoData): ParticipanteVistaCursoResponse {
  const estado = clasificarEstadoCurso(data)
  const esCursoTerminal =
    estado === "ABANDONADO" || estado === "CERRADO_SIN_COMPLETAR" || estado === "COMPLETADO"

  const { areas, siguienteModuloId } = construirAreas(data, esCursoTerminal)
  const hitos = construirHitos(data, areas)
  const hero = construirHero(data, estado, areas, hitos, siguienteModuloId)

  return { estado, hero, areas, hitos }
}

function clasificarEstadoCurso(data: VistaCursoData): VistaCursoEstado {
  if (data.estadoInscripcion === "ABANDONADA") {
    return "ABANDONADO"
  }
  if (data.estadoInscripcion === "COMPLETADA") {
    return "COMPLETADO"
  }
  // ACTIVA: ¿es recien inscrito?
  const sinAvance = data.estadosModulo.length === 0
  if (sinAvance) {
    return "RECIEN_INSCRITO"
  }
  return "ACTIVO"
}

function construirHero(
  data: VistaCursoData,
  estado: VistaCursoEstado,
  areas: ReturnType<typeof construirAreas>["areas"],
  hitos: ReturnType<typeof construirHitos>,
  siguienteModuloId: string | null,
): VistaCursoHero {
  const kpis = calcularKpis(data, areas)
  const porcentajeProgreso = calcularProgresoPonderado(data, areas)
  const excelencia =
    estado === "COMPLETADO" && data.notaGlobal != null && data.notaGlobal >= UMBRAL_EXCELENCIA

  const gradiente = excelencia ? "spectral" : gradienteParaCurso(data.curso.slug)
  const siguientePaso = calcularSiguientePaso(data, estado, hitos, siguienteModuloId)

  return {
    cursoId: data.curso.id,
    slug: data.curso.slug,
    titulo: data.curso.titulo,
    descripcion: descripcionCorta(
      data.curso.descripcion,
      `Curso para ${data.curso.empresaCliente}`,
    ),
    empresaCliente: data.curso.empresaCliente,
    fechaInicioIso: data.curso.fechaInicio?.toISOString() ?? null,
    deadlineIso: data.curso.deadline?.toISOString() ?? null,
    fechaCompletadoIso: data.completadaAt?.toISOString() ?? null,
    nivel: nivelParaCurso(data.curso.titulo, data.curso.descripcion),
    cantidadModulos: data.modulos.length,
    tipoInscripcion: data.tipoInscripcion,
    gradiente,
    icono: iconoParaCurso(data.curso.slug),
    porcentajeProgreso,
    excelencia,
    kpis,
    siguientePaso,
    permiteAbandonar: data.tipoInscripcion === "LIBRE" && data.estadoInscripcion === "ACTIVA",
  }
}

function calcularKpis(
  data: VistaCursoData,
  areas: ReturnType<typeof construirAreas>["areas"],
): VistaCursoKpis {
  const todosLosModulos = areas.flatMap((a) => a.modulos)
  const modulosCompletados = todosLosModulos.filter((m) => m.estado === "COMPLETADO").length
  const modulosAsignados = todosLosModulos.length

  const notas = todosLosModulos.flatMap((m) => (m.nota == null ? [] : [m.nota]))
  const notaPromedio =
    notas.length === 0 ? null : Math.round(notas.reduce((s, n) => s + n, 0) / notas.length)

  return {
    modulosCompletados,
    modulosAsignados,
    notaPromedio,
    horasDedicadas: data.horasDedicadas,
    contenidosVistos: data.bloquesInteractuados,
  }
}

/**
 * §4.2.4 progreso general = promedio ponderado de avance de modulos asignados,
 * con peso del area del modulo. Solo se consideran modulos asignados.
 *
 * formula = Σ(% modulo × peso area) / Σ(peso area)
 *
 * Para cursos COMPLETADO retornamos 100, para ABANDONADO/CERRADO_SIN_COMPLETAR
 * retornamos el % al momento del corte (calculo igual que ACTIVA).
 */
function calcularProgresoPonderado(
  data: VistaCursoData,
  areas: ReturnType<typeof construirAreas>["areas"],
): number {
  if (data.estadoInscripcion === "COMPLETADA") {
    return 100
  }
  let sumaPonderada = 0
  let sumaPesos = 0
  for (const area of areas) {
    for (const modulo of area.modulos) {
      sumaPonderada += modulo.porcentajeAvance * area.peso
      sumaPesos += area.peso
    }
  }
  if (sumaPesos === 0) {
    return 0
  }
  return Math.min(100, Math.round(sumaPonderada / sumaPesos))
}

function calcularSiguientePaso(
  data: VistaCursoData,
  estado: VistaCursoEstado,
  hitos: ReturnType<typeof construirHitos>,
  siguienteModuloId: string | null,
): VistaCursoSiguientePaso {
  // Curso COMPLETADO → expediente.
  if (estado === "COMPLETADO") {
    return {
      variante: "EXPEDIENTE",
      hint: "Sellado en tu expediente",
      cta: "Ver expediente",
      href: `/expediente#${data.curso.id}`,
      moduloId: null,
    }
  }
  // Curso ABANDONADO/CERRADO → sin accion.
  if (estado === "ABANDONADO" || estado === "CERRADO_SIN_COMPLETAR") {
    return {
      variante: "NINGUNO",
      hint:
        estado === "ABANDONADO"
          ? "Curso abandonado · puedes inscribirte de nuevo"
          : "El cliente cerró este curso",
      cta: "Sin acciones disponibles",
      href: null,
      moduloId: null,
    }
  }

  // Prio 1-4: hay modulo elegido.
  if (siguienteModuloId) {
    const modulo = data.modulos.find((m) => m.id === siguienteModuloId)
    const estadoMod = data.estadosModulo.find((e) => e.moduloId === siguienteModuloId)
    const cta = estadoMod?.estado === "EN_PROGRESO" ? "Continuar" : "Comenzar"
    return {
      variante: "MODULO",
      hint: `Siguiente paso: ${modulo?.titulo ?? "Modulo"}`,
      cta,
      href: `/cursos/${data.curso.slug}/modulo/${siguienteModuloId}`,
      moduloId: siguienteModuloId,
    }
  }

  // Prio 5: transversal disponible.
  if (
    hitos.transversal &&
    (hitos.transversal.estado === "DISPONIBLE" ||
      hitos.transversal.estado === "REPROBADO_PUEDE_REINTENTAR")
  ) {
    return {
      variante: "TRANSVERSAL",
      hint: `Siguiente paso: ${hitos.transversal.titulo}`,
      cta: "Empezar transversal",
      href: hitos.transversal.href,
      moduloId: null,
    }
  }

  // Prio 6: entrevista disponible.
  if (
    hitos.entrevista &&
    (hitos.entrevista.estado === "DISPONIBLE" ||
      hitos.entrevista.estado === "REPROBADO_PUEDE_REINTENTAR")
  ) {
    return {
      variante: "ENTREVISTA",
      hint: `Siguiente paso: ${hitos.entrevista.titulo}`,
      cta: "Empezar entrevista",
      href: hitos.entrevista.href,
      moduloId: null,
    }
  }

  // Prio 8: sin acciones (todo bloqueado o sin asignaciones).
  return {
    variante: "NINGUNO",
    hint: "No tienes acciones disponibles",
    cta: "Sin acciones",
    href: null,
    moduloId: null,
  }
}
