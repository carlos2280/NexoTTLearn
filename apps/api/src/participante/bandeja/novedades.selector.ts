// §4.3.2 · Novedades (max 5) desde el modelo Notificacion.

import type { NovedadItem, NovedadTipo } from "@nexott-learn/shared-types"
import type { PrismaService } from "../../common/prisma/prisma.service"
import { tiempoRelativo } from "./tiempo-relativo"

export const NOVEDADES_LIMITE = 5

type TipoNotif =
  | "MODULO_ASIGNADO"
  | "ENTREGA_EVALUADA"
  | "PROYECTO_REVISADO"
  | "DESBLOQUEO"
  | "RECALCULO_NOTA"
  | "CURSO_COMPLETADO"

interface NotifLite {
  id: string
  tipo: TipoNotif
  payload: unknown
  leida: boolean
  createdAt: Date
}

interface PayloadShape {
  titulo?: string
  mensaje?: string
  deepLink?: string
  contexto?: { nota?: number }
}

export async function calcularNovedades(
  prisma: PrismaService,
  participanteId: string,
  ahora: Date,
): Promise<{ items: NovedadItem[]; noLeidas: number }> {
  const [notifs, noLeidas] = await Promise.all([
    prisma.notificacion.findMany({
      where: { destinatarioId: participanteId, tipo: { in: TIPOS_PARTICIPANTE } },
      orderBy: { createdAt: "desc" },
      take: NOVEDADES_LIMITE,
      select: { id: true, tipo: true, payload: true, leida: true, createdAt: true },
    }),
    prisma.notificacion.count({
      where: { destinatarioId: participanteId, leida: false, tipo: { in: TIPOS_PARTICIPANTE } },
    }),
  ])
  const items = notifs.map((n) => mapear(n as NotifLite, ahora))
  return { items, noLeidas }
}

const TIPOS_PARTICIPANTE: TipoNotif[] = [
  "MODULO_ASIGNADO",
  "ENTREGA_EVALUADA",
  "PROYECTO_REVISADO",
  "DESBLOQUEO",
  "RECALCULO_NOTA",
  "CURSO_COMPLETADO",
]

function mapear(n: NotifLite, ahora: Date): NovedadItem {
  const tipo = mapearTipo(n.tipo)
  const payload = leerPayload(n.payload)
  return {
    id: n.id,
    tipo,
    titulo: payload.titulo ?? payload.mensaje ?? "Tienes una novedad",
    meta: tiempoRelativo(n.createdAt, ahora),
    resultado: extraerResultado(tipo, payload),
    leida: n.leida,
    href: payload.deepLink ?? "/",
  }
}

function mapearTipo(t: TipoNotif): NovedadTipo {
  switch (t) {
    case "ENTREGA_EVALUADA":
    case "PROYECTO_REVISADO":
      return "EVALUADO"
    case "DESBLOQUEO":
      return "DESBLOQUEADO"
    case "MODULO_ASIGNADO":
      return "ASIGNADO"
    case "RECALCULO_NOTA":
      return "RECALCULO"
    case "CURSO_COMPLETADO":
      return "CURSO_COMPLETADO"
    default: {
      const _exhaustive: never = t
      return _exhaustive
    }
  }
}

function leerPayload(p: unknown): PayloadShape {
  if (p == null || typeof p !== "object") {
    return {}
  }
  return p as PayloadShape
}

function extraerResultado(tipo: NovedadTipo, payload: PayloadShape): string | undefined {
  if (tipo === "EVALUADO" && typeof payload.contexto?.nota === "number") {
    return `${Math.round(payload.contexto.nota)}/100`
  }
  if (tipo === "DESBLOQUEADO" || tipo === "ASIGNADO") {
    return "Nuevo"
  }
  return undefined
}
