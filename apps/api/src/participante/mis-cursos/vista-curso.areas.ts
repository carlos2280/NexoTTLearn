// Construccion de la lista de areas con sus modulos.
//
// Doc canonico: vista-curso.md §4.3 (modulos por area).
//
// Reglas:
//   - Solo aparecen areas con al menos 1 modulo asignado al participante (§4.3.2).
//   - Estado del area se calcula a partir de las notas y avances de los
//     modulos OBLIG/RECOM (los OPCIONAL no afectan al cumplimiento).
//   - Modulos se ordenan por `orden` asc dentro del area.

import type {
  VistaArea,
  VistaAreaEstado,
  VistaMiniProyecto,
  VistaMiniProyectoEstado,
  VistaModulo,
  VistaModuloTagAsignacion,
} from "@nexott-learn/shared-types"
import type { VistaCursoData } from "./vista-curso.query"

const UMBRAL_EXCELENCIA = 90

export interface ConstruirAreasResult {
  readonly areas: VistaArea[]
  /** Id del modulo elegido como "siguiente paso" (subraya su breathing ring). */
  readonly siguienteModuloId: string | null
}

export function construirAreas(
  data: VistaCursoData,
  esCursoTerminal: boolean,
): ConstruirAreasResult {
  const moduloMap = new Map(data.modulos.map((m) => [m.id, m]))
  const asignacionMap = new Map(data.asignaciones.map((a) => [a.moduloId, a]))
  const estadoMap = new Map(data.estadosModulo.map((e) => [e.moduloId, e]))

  const moduloIdsAsignados = data.asignaciones.flatMap((a) => {
    const m = moduloMap.get(a.moduloId)
    return m ? [a.moduloId] : []
  })

  // Numeracion: orden global del modulo dentro del curso (1-indexed).
  const ordenGlobal = new Map(
    [...data.modulos].sort((a, b) => a.orden - b.orden).map((m, idx) => [m.id, idx + 1] as const),
  )

  const siguienteModuloId = elegirSiguienteModulo(
    data,
    moduloIdsAsignados,
    asignacionMap,
    estadoMap,
  )

  const areas: VistaArea[] = data.areas.flatMap((area) => {
    const modulosDelArea = data.modulos
      .filter((m) => m.areaId === area.id && asignacionMap.has(m.id))
      .sort((a, b) => a.orden - b.orden)
    if (modulosDelArea.length === 0) {
      return []
    }

    const modulos: VistaModulo[] = modulosDelArea.map((m) => {
      const asignacion = asignacionMap.get(m.id)
      const estadoMod = estadoMap.get(m.id)
      const tag = mapearTag(asignacion?.tipo ?? "OPCIONAL", data.tipoInscripcion)
      const estadoModulo = estadoMod?.estado ?? "NO_INICIADO"
      const porcentaje = estadoMod?.porcentajeAvance ?? 0
      const notaModulo = calcularNotaModulo(m.id, data)
      const excelenciaMod = notaModulo != null && notaModulo >= UMBRAL_EXCELENCIA

      return {
        id: m.id,
        titulo: m.titulo,
        numero: ordenGlobal.get(m.id) ?? m.orden + 1,
        estado: estadoModulo,
        porcentajeAvance: porcentaje,
        tagAsignacion: tag,
        cantidadSecciones: m.cantidadSecciones,
        cantidadContenidos: m.cantidadBloques,
        nota: estadoModulo === "COMPLETADO" ? notaModulo : null,
        excelencia: estadoModulo === "COMPLETADO" && excelenciaMod,
        esSiguientePaso: !esCursoTerminal && m.id === siguienteModuloId,
        href: `/cursos/${data.curso.slug}/modulo/${m.id}`,
        miniProyecto: m.miniProyecto
          ? construirMiniProyecto(m.miniProyecto, m.id, estadoModulo, data)
          : null,
      }
    })

    const { estado, textoEstado, notaProyectada } = calcularEstadoArea(
      area,
      modulosDelArea,
      asignacionMap,
      estadoMap,
      data,
    )

    return [
      {
        id: area.id,
        nombre: area.nombre,
        color: area.color,
        peso: area.peso,
        puntajeObjetivo: area.puntajeObjetivo,
        estado,
        textoEstado,
        notaProyectada,
        modulos,
      },
    ]
  })

  return { areas, siguienteModuloId }
}

function mapearTag(
  tipo: "OBLIGATORIO" | "RECOMENDADO" | "OPCIONAL",
  tipoInscripcion: "SOLICITUD" | "LIBRE",
): VistaModuloTagAsignacion {
  if (tipoInscripcion === "LIBRE") {
    return "OPCIONAL_LIBRE"
  }
  return tipo
}

/**
 * Nota del modulo: en MVP, la nota efectiva es el promedio del mini si existe
 * (capa unica disponible) o null. La nota real combina actividades + mini con
 * pesos del curso (§9.5 MAESTRO), pero en MVP el back aun no tiene un campo
 * `notaModulo` cacheado y calcularlo aqui implicaria sumar entregas evaluadas
 * por bloque + reglas T05 mejor-intento. Se deja un fallback conservador:
 *   - Si hay entrega de mini con notaFinal, esa nota.
 *   - Si modulo COMPLETADO sin mini, asumir 70 (umbral aprobado MVP).
 */
function calcularNotaModulo(moduloId: string, data: VistaCursoData): number | null {
  const modulo = data.modulos.find((m) => m.id === moduloId)
  const estadoMod = data.estadosModulo.find((e) => e.moduloId === moduloId)
  if (!estadoMod || estadoMod.estado !== "COMPLETADO") {
    return null
  }
  if (modulo?.miniProyecto) {
    const entregas = data.entregasMini.filter(
      (e) => e.miniProyectoId === modulo.miniProyecto?.id && e.notaFinal != null,
    )
    if (entregas.length > 0) {
      const mejor = Math.max(...entregas.map((e) => e.notaFinal as number))
      return Math.round(mejor)
    }
  }
  return 70
}

function construirMiniProyecto(
  mini: { id: string; titulo: string; umbralAprobacion: number },
  moduloId: string,
  estadoModulo: "NO_INICIADO" | "EN_PROGRESO" | "COMPLETADO",
  data: VistaCursoData,
): VistaMiniProyecto {
  const entregas = data.entregasMini.filter((e) => e.miniProyectoId === mini.id)
  const ultima = entregas.at(-1)
  const hrefBase = `/cursos/${data.curso.slug}/modulo/${moduloId}#mini-proyecto`

  // Bloqueado: el modulo no esta completado.
  if (estadoModulo !== "COMPLETADO") {
    return {
      id: mini.id,
      titulo: mini.titulo,
      estado: "BLOQUEADO",
      textoEstado: "Bloqueado · completa el modulo",
      nota: null,
      intentoActual: null,
      href: null,
    }
  }

  if (!ultima) {
    return {
      id: mini.id,
      titulo: mini.titulo,
      estado: "DISPONIBLE",
      textoEstado: "Disponible",
      nota: null,
      intentoActual: null,
      href: hrefBase,
    }
  }

  const estado = clasificarEstadoMini(ultima, mini.umbralAprobacion)
  const nota = ultima.notaFinal == null ? null : Math.round(ultima.notaFinal)

  return {
    id: mini.id,
    titulo: mini.titulo,
    estado,
    textoEstado: textoEstadoMini(estado, nota, ultima.intento),
    nota,
    intentoActual: estado === "REPROBADO" ? ultima.intento : null,
    href: hrefBase,
  }
}

function clasificarEstadoMini(
  entrega: { estado: "ENVIADA" | "EN_REVISION" | "EVALUADA"; notaFinal: number | null },
  umbral: number,
): VistaMiniProyectoEstado {
  if (entrega.estado === "ENVIADA" || entrega.estado === "EN_REVISION") {
    return "EN_REVISION"
  }
  if (entrega.notaFinal == null) {
    return "EN_REVISION"
  }
  return entrega.notaFinal >= umbral ? "APROBADO" : "REPROBADO"
}

function textoEstadoMini(
  estado: VistaMiniProyectoEstado,
  nota: number | null,
  intento: number,
): string {
  switch (estado) {
    case "BLOQUEADO":
      return "Bloqueado · completa el modulo"
    case "DISPONIBLE":
      return "Disponible"
    case "EN_REVISION":
      return "En revision"
    case "APROBADO":
      return nota == null ? "Aprobado" : `Aprobado · Nota ${nota}`
    case "REPROBADO":
      return `Reintentar (intento ${intento})`
    default: {
      const _exhaustive: never = estado
      return _exhaustive
    }
  }
}

interface EstadoAreaCalculado {
  readonly estado: VistaAreaEstado
  readonly textoEstado: string
  readonly notaProyectada: number | null
}

function calcularEstadoArea(
  area: VistaCursoData["areas"][number],
  modulosArea: VistaCursoData["modulos"][number][],
  asignacionMap: Map<string, { moduloId: string; tipo: string }>,
  estadoMap: Map<string, { estado: string; porcentajeAvance: number }>,
  data: VistaCursoData,
): EstadoAreaCalculado {
  const obligOrRecom = modulosArea.filter((m) => {
    const a = asignacionMap.get(m.id)
    return a?.tipo === "OBLIGATORIO" || a?.tipo === "RECOMENDADO"
  })

  if (obligOrRecom.length === 0) {
    return {
      estado: "SIN_OBLIGACION",
      textoEstado: "Sin obligaciones en esta area",
      notaProyectada: null,
    }
  }

  const completos = obligOrRecom.filter((m) => estadoMap.get(m.id)?.estado === "COMPLETADO")
  const conAvance = obligOrRecom.filter((m) => (estadoMap.get(m.id)?.porcentajeAvance ?? 0) > 0)

  // Promedio de notas de modulos completos del area (proxy de nota proyectada).
  const notas = completos.flatMap((m) => {
    const n = calcularNotaModulo(m.id, data)
    return n == null ? [] : [n]
  })
  const notaProyectada =
    notas.length === 0 ? null : Math.round(notas.reduce((s, n) => s + n, 0) / notas.length)

  const cumpleUmbral =
    completos.length === obligOrRecom.length &&
    notaProyectada != null &&
    notaProyectada >= area.puntajeObjetivo

  if (cumpleUmbral) {
    return {
      estado: "CUMPLIDO",
      textoEstado: `Cumplido · ${notaProyectada}`,
      notaProyectada,
    }
  }

  // NO_ALCANZADO solo aplica si el curso es CERRADO_SIN_COMPLETAR. La query
  // filtra ese estado, por lo que aqui nunca se dispara. Se conserva el
  // branch en el contrato para cuando ese flujo se incorpore en una iteracion
  // futura (admin cierra curso en mitad).

  if (conAvance.length === 0) {
    return {
      estado: "SIN_INICIAR",
      textoEstado: "Sin iniciar",
      notaProyectada: null,
    }
  }

  return {
    estado: "EN_PROGRESO",
    textoEstado:
      notaProyectada == null ? "En progreso" : `En progreso · proyectado ${notaProyectada}`,
    notaProyectada,
  }
}

/**
 * Logica de "siguiente paso" del hero (§4.2.7).
 * Prioridades 1-4 (modulo). Las 5-7 (transversal/entrevista/expediente) se
 * resuelven en vista-curso.hero.ts despues de evaluar hitos.
 */
function elegirSiguienteModulo(
  data: VistaCursoData,
  moduloIdsAsignados: string[],
  asignacionMap: Map<
    string,
    { moduloId: string; tipo: "OBLIGATORIO" | "RECOMENDADO" | "OPCIONAL" }
  >,
  estadoMap: Map<string, { estado: "NO_INICIADO" | "EN_PROGRESO" | "COMPLETADO" }>,
): string | null {
  const modulosOrdenados = [...data.modulos]
    .filter((m) => moduloIdsAsignados.includes(m.id))
    .sort((a, b) => a.orden - b.orden)

  // Prio 1: EN_PROGRESO (cualquier modulo).
  const enProgreso = modulosOrdenados.find((m) => estadoMap.get(m.id)?.estado === "EN_PROGRESO")
  if (enProgreso) {
    return enProgreso.id
  }

  // Prio 2: OBLIGATORIO NO_INICIADO con menor orden.
  const oblNoIniciado = modulosOrdenados.find((m) => {
    const a = asignacionMap.get(m.id)
    const e = estadoMap.get(m.id)
    return a?.tipo === "OBLIGATORIO" && (e?.estado ?? "NO_INICIADO") === "NO_INICIADO"
  })
  if (oblNoIniciado) {
    return oblNoIniciado.id
  }

  // Prio 3: RECOMENDADO NO_INICIADO.
  const recNoIniciado = modulosOrdenados.find((m) => {
    const a = asignacionMap.get(m.id)
    const e = estadoMap.get(m.id)
    return a?.tipo === "RECOMENDADO" && (e?.estado ?? "NO_INICIADO") === "NO_INICIADO"
  })
  if (recNoIniciado) {
    return recNoIniciado.id
  }

  // Prio 4: OPCIONAL NO_INICIADO.
  const opcNoIniciado = modulosOrdenados.find((m) => {
    const a = asignacionMap.get(m.id)
    const e = estadoMap.get(m.id)
    return a?.tipo === "OPCIONAL" && (e?.estado ?? "NO_INICIADO") === "NO_INICIADO"
  })
  if (opcNoIniciado) {
    return opcNoIniciado.id
  }

  return null
}
