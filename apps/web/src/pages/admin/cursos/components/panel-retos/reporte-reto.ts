import { detalleDeEstado, etiquetaDeEstado, requiereAccion } from "./estado-reto"
import { ESTADO_PENDIENTE, type EstadoReto, type GrupoModulo } from "./retos.types"

export interface ContextoReto {
  readonly cursoTitulo: string
  readonly moduloTitulo: string
  readonly seccionTitulo: string
  /** Nº de bloque: una sección puede tener varios retos y hay que decir cuál. */
  readonly bloqueOrden: number
}

/**
 * Texto listo para pegar en un chat o un correo. Existe porque quien detecta el
 * problema en esta pantalla rara vez es quien puede arreglarlo: sin esto tiene
 * que redactar a mano qué vio, y lo que llega al creador del contenido suele
 * ser "hay un reto malo en el curso".
 *
 * Va sin jerga y con el "qué hacer" incluido, para que el mensaje se explique
 * solo. Pura: sin fetch, sin DOM, sin portapapeles.
 */
export function construirAvisoReto(contexto: ContextoReto, estado: EstadoReto): string {
  const detalle = detalleDeEstado(estado)
  const lineas = [
    `Reto con problema — ${contexto.cursoTitulo}`,
    `Módulo: ${contexto.moduloTitulo}`,
    `Sección: ${contexto.seccionTitulo}`,
    `Reto: bloque #${contexto.bloqueOrden} de esa sección`,
    `Estado: ${etiquetaDeEstado(estado).texto}`,
  ]
  if (detalle) {
    lineas.push("", `Qué pasó: ${detalle.quePaso}`)
    lineas.push(`Qué significa: ${detalle.queSignifica}`)
    lineas.push(`Qué hacer: ${detalle.queHacer}`)
  }
  lineas.push("", "Detectado desde Cursos → Retos, en el panel de administración.")
  return lineas.join("\n")
}

export interface ResumenCorrida {
  readonly total: number
  readonly ok: number
  readonly aRevisar: number
  readonly sinValidar: number
  /** Retos que la pantalla no sabe correr (lenguaje fuera del runner). */
  readonly noAplica: number
}

/**
 * Cuenta global de la corrida. `aRevisar` agrupa todo lo que pide una acción
 * humana; un reto que solo es "no autocorregible" por su lenguaje cae en
 * `noAplica`, no en `aRevisar` ni en `ok`. Las cuatro categorías suman `total`.
 */
export function resumirCorrida(
  grupos: readonly GrupoModulo[],
  estados: ReadonlyMap<string, EstadoReto>,
): ResumenCorrida {
  let ok = 0
  let aRevisar = 0
  let sinValidar = 0
  let noAplica = 0
  let total = 0

  for (const grupo of grupos) {
    for (const reto of grupo.retos) {
      total += 1
      const estado = estados.get(reto.bloqueId) ?? ESTADO_PENDIENTE
      if (estado.tipo === "ok") {
        ok += 1
      } else if (estado.tipo === "pendiente" || estado.tipo === "validando") {
        sinValidar += 1
      } else if (requiereAccion(estado)) {
        aRevisar += 1
      } else {
        noAplica += 1
      }
    }
  }

  return { total, ok, aRevisar, sinValidar, noAplica }
}

/**
 * Cierre para la región live. La corrida dura minutos y termina en silencio:
 * sin esta frase, quien no ve la pantalla oye "…90% completado" y nada más.
 */
export function mensajeFinalValidacion(resumen: ResumenCorrida): string {
  const revisados = resumen.ok + resumen.aRevisar + resumen.noAplica
  if (revisados === 0) {
    return ""
  }
  return `Validación terminada: ${resumen.ok} sin problemas, ${resumen.aRevisar} a revisar.`
}

/**
 * Informe de toda la corrida, agrupado por módulo y listando SOLO los retos que
 * piden acción: un pantallazo de 92 líneas donde 90 dicen "sin problemas" no lo
 * lee nadie.
 */
export function construirInformeCurso(
  cursoTitulo: string,
  grupos: readonly GrupoModulo[],
  estados: ReadonlyMap<string, EstadoReto>,
): string {
  const resumen = resumirCorrida(grupos, estados)
  const lineas = [
    `Revisión de retos — ${cursoTitulo}`,
    `${resumen.total} retos revisados: ${resumen.ok} sin problemas, ${resumen.aRevisar} a revisar.`,
  ]

  for (const grupo of grupos) {
    const problemas = grupo.retos.filter((reto) => {
      const estado = estados.get(reto.bloqueId)
      return estado ? requiereAccion(estado) : false
    })
    if (problemas.length === 0) {
      continue
    }
    lineas.push("", grupo.titulo)
    for (const reto of problemas) {
      const estado = estados.get(reto.bloqueId)
      if (!estado) {
        continue
      }
      lineas.push(`  · #${reto.orden} ${reto.seccionTitulo} — ${etiquetaDeEstado(estado).texto}`)
      const detalle = detalleDeEstado(estado)
      if (detalle) {
        lineas.push(`    ${detalle.quePaso}`)
      }
    }
  }

  if (resumen.aRevisar === 0) {
    lineas.push("", "No hay retos que necesiten arreglo.")
  }
  lineas.push("", "Detectado desde Cursos → Retos, en el panel de administración.")
  return lineas.join("\n")
}
