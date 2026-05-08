// §4.3.1 · Selector de pendientes (max 10 ordenados por prioridad).

import type { PendienteItem, PendienteTag } from "@nexott-learn/shared-types"
import type { PrismaService } from "../../common/prisma/prisma.service"
import { cargarPendientesCrudos } from "./pendientes.query"
import {
  type PendienteCrudo,
  ctaPorTag,
  etiquetaPendienteTipo,
  mapearTipoBloqueAPendienteTipo,
} from "./pendientes.types"

export const PENDIENTES_LIMITE = 10
const URGENTE_MS = 24 * 60 * 60 * 1000

export async function calcularPendientes(
  prisma: PrismaService,
  participanteId: string,
  ahora: Date,
): Promise<PendienteItem[]> {
  const crudos = await cargarPendientesCrudos(prisma, participanteId)
  if (crudos.length === 0) {
    return []
  }
  const ordenados = ordenar(crudos, ahora)
  return ordenados.slice(0, PENDIENTES_LIMITE).map((c) => mapear(c, ahora))
}

function tagDe(c: PendienteCrudo, ahora: Date): PendienteTag {
  if (c.cursoDeadline && c.cursoDeadline.getTime() - ahora.getTime() <= URGENTE_MS) {
    return "URGENTE"
  }
  if (c.intentosPrevios > 0) {
    return "RETOMAR"
  }
  return "PENDIENTE"
}

function prioridadTag(tag: PendienteTag): number {
  switch (tag) {
    case "URGENTE":
      return 0
    case "RETOMAR":
      return 1
    case "PENDIENTE":
      return 2
    default: {
      const _exhaustive: never = tag
      return _exhaustive
    }
  }
}

function ordenar(crudos: PendienteCrudo[], ahora: Date): PendienteCrudo[] {
  const conTag = crudos.map((c) => ({ c, tag: tagDe(c, ahora) }))
  conTag.sort((a, b) => {
    const t = prioridadTag(a.tag) - prioridadTag(b.tag)
    if (t !== 0) {
      return t
    }
    const dA = a.c.cursoDeadline?.getTime() ?? Number.POSITIVE_INFINITY
    const dB = b.c.cursoDeadline?.getTime() ?? Number.POSITIVE_INFINITY
    return dA - dB
  })
  return conTag.map((x) => x.c)
}

function mapear(c: PendienteCrudo, ahora: Date): PendienteItem {
  const tag = tagDe(c, ahora)
  const tipo = mapearTipoBloqueAPendienteTipo(c.tipoBloque, c.codigoEvaluable)
  return {
    id: c.bloqueId,
    tipo,
    tipoLabel: etiquetaPendienteTipo(tipo),
    titulo: `${etiquetaPendienteTipo(tipo)}: ${c.tituloModulo}`,
    contexto: contexto(c, ahora),
    tag,
    cta: ctaPorTag(tag),
    href: `/cursos/${c.cursoId}/modulo/${c.moduloId}#bloque-${c.bloqueId}`,
  }
}

function contexto(c: PendienteCrudo, ahora: Date): string {
  const partes = [c.tituloCurso, c.tituloModulo]
  if (c.cursoDeadline) {
    partes.push(textoDeadline(c.cursoDeadline, ahora))
  }
  return partes.join(" · ")
}

function textoDeadline(deadline: Date, ahora: Date): string {
  const diffMs = deadline.getTime() - ahora.getTime()
  if (diffMs < 0) {
    return "Vencido"
  }
  if (diffMs <= URGENTE_MS) {
    return "Vence hoy"
  }
  const dias = Math.ceil(diffMs / URGENTE_MS)
  return `Vence en ${dias} ${dias === 1 ? "dia" : "dias"}`
}
