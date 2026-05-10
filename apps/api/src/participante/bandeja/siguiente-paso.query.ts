// Carga los modulos asignados al participante (inscripciones ACTIVA) con
// el estado por inscripcion. Devuelve aplanado para que el selector decida.

import type { Prisma } from "@prisma/client"
import type { PrismaService } from "../../common/prisma/prisma.service"
import type { ModuloAsignado } from "./siguiente-paso.types"

type InscripcionRow = Prisma.InscripcionGetPayload<{
  select: {
    id: true
    curso: { select: { id: true; titulo: true; empresaCliente: true; deadline: true } }
    asignaciones: { select: { moduloId: true; tipo: true } }
    estadosModulo: { select: { moduloId: true; estado: true; porcentajeAvance: true } }
  }
}>

type ModuloInfo = { id: string; titulo: string; orden: number }

export async function cargarModulosCandidatos(
  prisma: PrismaService,
  participanteId: string,
): Promise<ModuloAsignado[]> {
  const inscripciones = await prisma.inscripcion.findMany({
    where: { participanteId, estado: "ACTIVA" },
    select: {
      id: true,
      curso: {
        select: { id: true, titulo: true, empresaCliente: true, deadline: true },
      },
      asignaciones: { select: { moduloId: true, tipo: true } },
      estadosModulo: {
        select: { moduloId: true, estado: true, porcentajeAvance: true },
      },
    },
  })

  const moduloIds = new Set<string>()
  for (const ins of inscripciones) {
    for (const a of ins.asignaciones) {
      moduloIds.add(a.moduloId)
    }
  }
  if (moduloIds.size === 0) {
    return []
  }

  const modulosInfo = await prisma.modulo.findMany({
    where: { id: { in: Array.from(moduloIds) }, archivadoAt: null },
    select: { id: true, titulo: true, orden: true },
  })
  const moduloMap = new Map<string, ModuloInfo>(modulosInfo.map((m) => [m.id, m]))

  return aplanar(inscripciones, moduloMap)
}

function aplanar(
  inscripciones: InscripcionRow[],
  moduloMap: Map<string, ModuloInfo>,
): ModuloAsignado[] {
  const out: ModuloAsignado[] = []
  for (const ins of inscripciones) {
    const estadoMap = new Map(ins.estadosModulo.map((e) => [e.moduloId, e]))
    for (const a of ins.asignaciones) {
      const info = moduloMap.get(a.moduloId)
      if (!info) {
        continue
      }
      const estado = estadoMap.get(a.moduloId)
      out.push({
        inscripcionId: ins.id,
        moduloId: a.moduloId,
        tipoAsignacion: a.tipo,
        tituloModulo: info.titulo,
        tituloCurso: ins.curso.titulo,
        empresaCliente: ins.curso.empresaCliente,
        cursoId: ins.curso.id,
        cursoDeadline: ins.curso.deadline,
        estadoModulo: estado?.estado ?? "NO_INICIADO",
        porcentajeAvance: estado?.porcentajeAvance ?? 0,
        ordenModulo: info.orden,
      })
    }
  }
  return out
}
