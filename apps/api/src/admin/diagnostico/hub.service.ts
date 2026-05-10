import { Injectable } from "@nestjs/common"
import type { HubDiagnosticoItem, HubDiagnosticoResponse } from "@nexott-learn/shared-types"
import { PrismaService } from "../../common/prisma/prisma.service"
import { type HubItemRaw, mapHubItem } from "./hub.mapper"
import { DIAS_URGENCIA_DEADLINE } from "./hub.types"

@Injectable()
export class HubDiagnosticoService {
  constructor(private readonly prisma: PrismaService) {}

  async obtenerHub(hoy: Date = new Date()): Promise<HubDiagnosticoResponse> {
    const cursos = await this.prisma.curso.findMany({
      where: { estado: "ACTIVO" },
      select: {
        id: true,
        empresaCliente: true,
        titulo: true,
        deadline: true,
        inscripciones: {
          where: { estado: "ACTIVA" },
          select: {
            id: true,
            evaluacionesIniciales: { select: { id: true }, take: 1 },
            asignaciones: { select: { id: true }, take: 1 },
          },
        },
      },
    })

    const items: HubDiagnosticoItem[] = cursos.map((curso) => {
      const inscripcionesIds = curso.inscripciones.map((i) => i.id)
      const conEvaluacion = new Set(
        curso.inscripciones.filter((i) => i.evaluacionesIniciales.length > 0).map((i) => i.id),
      )
      const conAsignacion = new Set(
        curso.inscripciones.filter((i) => i.asignaciones.length > 0).map((i) => i.id),
      )
      const raw: HubItemRaw = {
        cursoId: curso.id,
        empresaCliente: curso.empresaCliente,
        titulo: curso.titulo,
        deadline: curso.deadline,
        invitados: inscripcionesIds.length,
        inscripcionesIds,
        inscripcionesConEvaluacion: conEvaluacion,
        inscripcionesConAsignacion: conAsignacion,
      }
      return mapHubItem(raw, hoy)
    })

    items.sort(comparadorUrgencia)

    return { items, total: items.length }
  }
}

// hub.md §3 · orden por urgencia:
//   1. pendiente Y deadline < 14 dias
//   2. pendiente sin urgencia de deadline
//   3. al-dia
//   4. sin-invitados (al final, contraido en UI)
// Empate: dias restantes asc (null al final), luego titulo.
function comparadorUrgencia(a: HubDiagnosticoItem, b: HubDiagnosticoItem): number {
  const ra = rankUrgencia(a)
  const rb = rankUrgencia(b)
  if (ra !== rb) return ra - rb
  const da = a.diasRestantes ?? Number.POSITIVE_INFINITY
  const db = b.diasRestantes ?? Number.POSITIVE_INFINITY
  if (da !== db) return da - db
  return a.titulo.localeCompare(b.titulo)
}

function rankUrgencia(item: HubDiagnosticoItem): number {
  if (item.estadoDiagnostico === "sin-invitados") return 4
  if (item.estadoDiagnostico === "al-dia") return 3
  const urgentePorDeadline =
    item.diasRestantes !== null && item.diasRestantes < DIAS_URGENCIA_DEADLINE
  if (urgentePorDeadline) return 1
  return 2
}
