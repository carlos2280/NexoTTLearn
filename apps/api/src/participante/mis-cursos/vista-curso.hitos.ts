// Construccion de hitos del curso: Proyecto Transversal y Entrevista IA.
//
// Doc canonico: vista-curso.md §4.4 (estados + razones de bloqueo §4.4.2).
//
// Reglas:
//   - Solo aparecen los hitos que el curso tiene activos (transversal/entrevista
//     pueden ser nulos: §6.2 MAESTRO).
//   - Bloqueado del transversal: requiere todas las areas OBLIG cumplidas
//     (segun §4.4.2 ejemplo). En MVP simplificamos: todos los modulos
//     OBLIGATORIO completados.
//   - Bloqueado de entrevista: si hay transversal, requiere transversal APROBADO.
//     Si no hay transversal, requiere todas las areas OBLIG cumplidas.

import type {
  VistaArea,
  VistaCursoHitos,
  VistaHitoEntrevista,
  VistaHitoEstado,
  VistaHitoRequisito,
  VistaHitoTransversal,
} from "@nexott-learn/shared-types"
import type { VistaCursoData } from "./vista-curso.query"

export function construirHitos(data: VistaCursoData, areas: VistaArea[]): VistaCursoHitos {
  const transversal = data.transversal ? construirTransversal(data, areas) : null
  const entrevista = data.entrevistaConfig ? construirEntrevista(data, areas, transversal) : null
  return { transversal, entrevista }
}

function construirTransversal(data: VistaCursoData, areas: VistaArea[]): VistaHitoTransversal {
  if (!data.transversal) {
    // biome-ignore lint/nursery/noSecrets: mensaje de error de dominio, no es un secreto
    throw new Error("construirTransversal sin proyecto transversal en data")
  }
  const transversal = data.transversal
  const entregas = data.entregasTransversal
  const ultima = entregas.at(-1)

  const requisitosBloqueo = requisitosTransversal(data, areas)
  const cumplidos = requisitosBloqueo.every((r) => r.cumplido)

  const baseHito = {
    variante: "TRANSVERSAL" as const,
    titulo: transversal.titulo,
    resumen: resumir(transversal.enunciado, 200),
  }

  if (!ultima) {
    if (!cumplidos) {
      return {
        ...baseHito,
        estado: "BLOQUEADO",
        textoEstado: "Bloqueado",
        requisitos: requisitosBloqueo,
        nota: null,
        intentoActual: null,
        intentosMax: null,
        href: null,
      }
    }
    return {
      ...baseHito,
      estado: "DISPONIBLE",
      textoEstado: "Disponible",
      requisitos: [],
      nota: null,
      intentoActual: null,
      intentosMax: null,
      href: `/cursos/${data.curso.slug}/transversal`,
    }
  }

  // Hay entregas. Estado segun la ultima.
  const nota = ultima.notaFinal == null ? null : Math.round(ultima.notaFinal)
  const aprobado = nota != null && nota >= transversal.umbralAprobacion
  const enRevision = ultima.estado === "ENVIADA" || ultima.estado === "EN_REVISION"

  const estado: VistaHitoEstado = enRevision
    ? "EN_REVISION"
    : aprobado
      ? "APROBADO"
      : "REPROBADO_PUEDE_REINTENTAR" // T05 ilimitado en transversal

  return {
    ...baseHito,
    estado,
    textoEstado: textoEstadoHito(estado, nota, ultima.intento, null),
    requisitos: [],
    nota,
    intentoActual: ultima.intento,
    intentosMax: null,
    href: `/cursos/${data.curso.slug}/transversal`,
  }
}

function construirEntrevista(
  data: VistaCursoData,
  areas: VistaArea[],
  transversalHito: VistaHitoTransversal | null,
): VistaHitoEntrevista {
  if (!data.entrevistaConfig) {
    // biome-ignore lint/nursery/noSecrets: mensaje de error de dominio, no es un secreto
    throw new Error("construirEntrevista sin entrevista config en data")
  }
  const config = data.entrevistaConfig
  const sesiones = data.sesionesEntrevista
  const ultima = sesiones.at(-1)

  const requisitosBloqueo = requisitosEntrevista(data, areas, transversalHito)
  const cumplidos = requisitosBloqueo.every((r) => r.cumplido)

  const baseHito = {
    variante: "ENTREVISTA" as const,
    titulo: "Entrevista Final IA",
    resumen: "Conversacion con cliente IA para validar tu nivel global del curso.",
  }

  if (!ultima || ultima.estado === "PENDIENTE") {
    if (!cumplidos) {
      return {
        ...baseHito,
        estado: "BLOQUEADO",
        textoEstado: "Bloqueada",
        requisitos: requisitosBloqueo,
        nota: null,
        intentoActual: null,
        intentosMax: config.maxIntentos,
        href: null,
      }
    }
    return {
      ...baseHito,
      estado: "DISPONIBLE",
      textoEstado: "Disponible",
      requisitos: [],
      nota: null,
      intentoActual: null,
      intentosMax: config.maxIntentos,
      href: `/cursos/${data.curso.slug}/entrevista`,
    }
  }

  const score = ultima.scoreGeneral == null ? null : Math.round(ultima.scoreGeneral)
  const aprobada = ultima.estado === "APROBADA" || ultima.estado === "AJUSTADA_MANUAL"

  if (aprobada) {
    return {
      ...baseHito,
      estado: "APROBADO",
      textoEstado: textoEstadoHito("APROBADO", score, ultima.intento, config.maxIntentos),
      requisitos: [],
      nota: score,
      intentoActual: ultima.intento,
      intentosMax: config.maxIntentos,
      href: `/cursos/${data.curso.slug}/entrevista`,
    }
  }

  if (ultima.estado === "EN_CURSO") {
    return {
      ...baseHito,
      estado: "EN_REVISION",
      textoEstado: "En curso",
      requisitos: [],
      nota: null,
      intentoActual: ultima.intento,
      intentosMax: config.maxIntentos,
      href: `/cursos/${data.curso.slug}/entrevista`,
    }
  }

  // NO_APROBADA
  const sinIntentos = ultima.intento >= config.maxIntentos
  const estado: VistaHitoEstado = sinIntentos
    ? "REPROBADO_SIN_INTENTOS"
    : "REPROBADO_PUEDE_REINTENTAR"

  return {
    ...baseHito,
    estado,
    textoEstado: textoEstadoHito(estado, score, ultima.intento, config.maxIntentos),
    requisitos: [],
    nota: score,
    intentoActual: ultima.intento,
    intentosMax: config.maxIntentos,
    href: sinIntentos ? null : `/cursos/${data.curso.slug}/entrevista`,
  }
}

function requisitosTransversal(data: VistaCursoData, areas: VistaArea[]): VistaHitoRequisito[] {
  // Por area: cumplido si su estado es CUMPLIDO. Listamos cada area
  // OBLIG/RECOM como requisito visible (skip SIN_OBLIGACION).
  return areas
    .filter((a) => a.estado !== "SIN_OBLIGACION")
    .map<VistaHitoRequisito>((area) => {
      const cumplido = area.estado === "CUMPLIDO"
      const texto = cumplido
        ? `Completar area ${area.nombre} (cumplido · ${area.notaProyectada ?? "-"})`
        : textoRequisitoArea(area)
      const hrefAccion = cumplido ? null : hrefSugeridoArea(area, data.curso.slug)
      return { cumplido, texto, hrefAccion }
    })
}

function textoRequisitoArea(area: VistaArea): string {
  if (area.estado === "SIN_INICIAR") {
    return `Completar area ${area.nombre} (sin iniciar)`
  }
  if (area.estado === "EN_PROGRESO") {
    const nota = area.notaProyectada
    return nota == null
      ? `Completar area ${area.nombre} (en progreso)`
      : `Completar area ${area.nombre} (proyectado ${nota} de ${area.puntajeObjetivo})`
  }
  if (area.estado === "NO_ALCANZADO") {
    return `Area ${area.nombre} no alcanzo el objetivo (${area.puntajeObjetivo})`
  }
  return `Completar area ${area.nombre}`
}

function hrefSugeridoArea(area: VistaArea, slug: string): string | null {
  // Sugerir el primer modulo no completado del area.
  const pendiente = area.modulos.find((m) => m.estado !== "COMPLETADO")
  return pendiente ? `/cursos/${slug}/modulo/${pendiente.id}` : null
}

function requisitosEntrevista(
  data: VistaCursoData,
  areas: VistaArea[],
  transversalHito: VistaHitoTransversal | null,
): VistaHitoRequisito[] {
  if (transversalHito) {
    const cumplido = transversalHito.estado === "APROBADO"
    return [
      {
        cumplido,
        texto: cumplido ? "Aprobar el Proyecto Transversal" : "Aprobar el Proyecto Transversal",
        hrefAccion: cumplido ? null : `/cursos/${data.curso.slug}/transversal`,
      },
    ]
  }
  // Sin transversal: requisito = todas las areas OBLIG/RECOM cumplidas.
  return requisitosTransversal(data, areas)
}

function textoEstadoHito(
  estado: VistaHitoEstado,
  nota: number | null,
  intento: number,
  maxIntentos: number | null,
): string {
  switch (estado) {
    case "BLOQUEADO":
      return "Bloqueado"
    case "DISPONIBLE":
      return "Disponible"
    case "EN_REVISION":
      return "En revision"
    case "APROBADO":
      return nota == null ? "Aprobado" : `Aprobado · Nota ${nota}`
    case "REPROBADO_PUEDE_REINTENTAR": {
      const total = maxIntentos == null ? "-" : maxIntentos
      return `No aprobado · Intento ${intento}/${total}`
    }
    case "REPROBADO_SIN_INTENTOS":
      return "Sin intentos restantes"
    default: {
      const _exhaustive: never = estado
      return _exhaustive
    }
  }
}

function resumir(texto: string, maxLen: number): string {
  const trimmed = texto.trim()
  if (trimmed.length <= maxLen) {
    return trimmed
  }
  return `${trimmed.slice(0, maxLen - 3).trimEnd()}...`
}
