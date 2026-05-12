import type { Asignacion } from "@nexott-learn/shared-types"

export interface ResumenCursoKpis {
  readonly total: number
  readonly asignados: number
  readonly voluntarios: number
  readonly activos: number
  readonly listo: number
  readonly aptos: number
  readonly noAptos: number
  readonly retirados: number
  readonly tasaAptos: number | null
  readonly clientePaso: number
  readonly clienteNoPaso: number
  readonly clientePendiente: number
}

function esActivo(a: Asignacion): boolean {
  if (a.rol === "ASIGNADO") {
    return a.estadoAsignado === "ASIGNADO" || a.estadoAsignado === "EN_PROGRESO"
  }
  return a.estadoVoluntario === "INSCRITO" || a.estadoVoluntario === "EN_PROGRESO"
}

function esListo(a: Asignacion): boolean {
  return a.estadoAsignado === "LISTO" || a.estadoVoluntario === "LISTO"
}

function esCerrado(a: Asignacion): "apto" | "no-apto" | "retirado" | null {
  if (a.estadoAsignado === "APTO" || a.estadoVoluntario === "COMPLETADO") {
    return "apto"
  }
  if (a.estadoAsignado === "NO_APTO") {
    return "no-apto"
  }
  if (a.estadoAsignado === "RETIRADO" || a.estadoVoluntario === "RETIRADO") {
    return "retirado"
  }
  return null
}

export function calcularResumenCurso(items: readonly Asignacion[]): ResumenCursoKpis {
  let asignados = 0
  let voluntarios = 0
  let activos = 0
  let listo = 0
  let aptos = 0
  let noAptos = 0
  let retirados = 0
  let clientePaso = 0
  let clienteNoPaso = 0
  let clientePendiente = 0

  for (const a of items) {
    if (a.rol === "ASIGNADO") {
      asignados += 1
    } else {
      voluntarios += 1
    }
    if (esActivo(a)) {
      activos += 1
    }
    if (esListo(a)) {
      listo += 1
    }
    const cierre = esCerrado(a)
    if (cierre === "apto") {
      aptos += 1
    } else if (cierre === "no-apto") {
      noAptos += 1
    } else if (cierre === "retirado") {
      retirados += 1
    }
    if (a.resultadoEntrevistaCliente === "PASO") {
      clientePaso += 1
    } else if (a.resultadoEntrevistaCliente === "NO_PASO") {
      clienteNoPaso += 1
    } else if (a.resultadoEntrevistaCliente === "PENDIENTE") {
      clientePendiente += 1
    }
  }

  const totalCerradosConVeredicto = aptos + noAptos
  const tasaAptos = totalCerradosConVeredicto > 0 ? aptos / totalCerradosConVeredicto : null

  return {
    total: items.length,
    asignados,
    voluntarios,
    activos,
    listo,
    aptos,
    noAptos,
    retirados,
    tasaAptos,
    clientePaso,
    clienteNoPaso,
    clientePendiente,
  }
}

export function ordenarPorActividadReciente(items: readonly Asignacion[]): readonly Asignacion[] {
  return [...items].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  )
}
