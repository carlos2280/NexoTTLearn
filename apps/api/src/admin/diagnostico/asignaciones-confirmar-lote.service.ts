import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common"
import type {
  ConfirmarLoteInput,
  ConfirmarLoteResponse,
  ConfirmarLoteResumen,
  TipoAsignacion,
} from "@nexott-learn/shared-types"
import { PrismaService } from "../../common/prisma/prisma.service"
import {
  ENTIDAD_TIPO_ASIGNACION,
  ERROR_CURSO_NO_ENCONTRADO,
  ERROR_INSCRIPCION_LIBRE_INMUTABLE,
  ERROR_MODULOS_DUPLICADOS,
  ERROR_MODULO_NO_PERTENECE_AL_CURSO,
} from "./asignaciones.types"

@Injectable()
export class AsignacionesConfirmarLoteService {
  constructor(private readonly prisma: PrismaService) {}

  async confirmar(
    cursoId: string,
    input: ConfirmarLoteInput,
    actorId: string,
  ): Promise<ConfirmarLoteResponse> {
    const curso = await this.prisma.curso.findUnique({
      where: { id: cursoId },
      select: { id: true },
    })
    if (!curso) {
      throw new NotFoundException(ERROR_CURSO_NO_ENCONTRADO)
    }

    const inscripcionIds = input.items.map((i) => i.inscripcionId)
    const inscripciones = await this.prisma.inscripcion.findMany({
      where: { id: { in: inscripcionIds }, cursoId, estado: "ACTIVA" },
      select: {
        id: true,
        tipo: true,
        asignaciones: { select: { moduloId: true, tipo: true } },
      },
    })
    if (inscripciones.length !== new Set(inscripcionIds).size) {
      throw new BadRequestException("Alguna inscripcion no pertenece al curso o no esta ACTIVA")
    }

    const moduloIds = new Set<string>()
    for (const item of input.items) {
      const ids = item.asignaciones.map((a) => a.moduloId)
      if (new Set(ids).size !== ids.length) {
        throw new BadRequestException(ERROR_MODULOS_DUPLICADOS)
      }
      const inscripcion = inscripciones.find((i) => i.id === item.inscripcionId)
      if (inscripcion?.tipo === "LIBRE" && item.asignaciones.some((a) => a.tipo !== "OPCIONAL")) {
        throw new BadRequestException(ERROR_INSCRIPCION_LIBRE_INMUTABLE)
      }
      for (const id of ids) {
        moduloIds.add(id)
      }
    }
    if (moduloIds.size > 0) {
      const validos = await this.prisma.modulo.count({
        where: { cursoId, id: { in: Array.from(moduloIds) } },
      })
      if (validos !== moduloIds.size) {
        throw new BadRequestException(ERROR_MODULO_NO_PERTENECE_AL_CURSO)
      }
    }

    const resumen: ConfirmarLoteResumen = {
      candidatosAfectados: 0,
      asignacionesCreadas: 0,
      asignacionesActualizadas: 0,
      asignacionesEliminadas: 0,
      obligatorios: 0,
      recomendados: 0,
      opcionales: 0,
    }
    const previosPorInscripcion = new Map(inscripciones.map((i) => [i.id, i.asignaciones]))

    await this.prisma.$transaction(async (tx) => {
      for (const item of input.items) {
        const previas = previosPorInscripcion.get(item.inscripcionId) ?? []
        await aplicarItem(tx, item, previas, actorId)
        actualizarResumen(resumen, item, previas)
      }
    })

    return { ok: true, resumen }
  }
}

type Tx = Parameters<Parameters<PrismaService["$transaction"]>[0]>[0]
type ItemLote = ConfirmarLoteInput["items"][number]
type Previas = readonly { readonly moduloId: string; readonly tipo: TipoAsignacion }[]

async function aplicarItem(tx: Tx, item: ItemLote, previas: Previas, actorId: string) {
  const previasMap = new Map(previas.map((p) => [p.moduloId, p.tipo]))
  await tx.asignacion.deleteMany({ where: { inscripcionId: item.inscripcionId } })
  if (item.asignaciones.length > 0) {
    await tx.asignacion.createMany({
      data: item.asignaciones.map((a) => ({
        inscripcionId: item.inscripcionId,
        moduloId: a.moduloId,
        tipo: a.tipo,
        modificadaAt: previasMap.has(a.moduloId) ? new Date() : null,
      })),
    })
  }
  await tx.logActividad.create({
    data: {
      actorId,
      tipoAccion: "MODULOS_ASIGNADOS",
      entidadTipo: ENTIDAD_TIPO_ASIGNACION,
      entidadId: item.inscripcionId,
      valorAntes: { asignaciones: previas },
      valorDespues: { asignaciones: item.asignaciones },
    },
  })
}

function actualizarResumen(resumen: ConfirmarLoteResumen, item: ItemLote, previas: Previas): void {
  const previasMap = new Map(previas.map((p) => [p.moduloId, p.tipo]))
  const nuevasIds = new Set(item.asignaciones.map((a) => a.moduloId))
  const eliminadas = previas.filter((p) => !nuevasIds.has(p.moduloId))
  resumen.candidatosAfectados += 1
  resumen.asignacionesEliminadas += eliminadas.length
  for (const a of item.asignaciones) {
    if (previasMap.has(a.moduloId)) {
      if (previasMap.get(a.moduloId) !== a.tipo) {
        resumen.asignacionesActualizadas += 1
      }
    } else {
      resumen.asignacionesCreadas += 1
    }
    sumarTipo(resumen, a.tipo)
  }
}

function sumarTipo(resumen: ConfirmarLoteResumen, tipo: TipoAsignacion): void {
  if (tipo === "OBLIGATORIO") {
    resumen.obligatorios += 1
  } else if (tipo === "RECOMENDADO") {
    resumen.recomendados += 1
  } else {
    resumen.opcionales += 1
  }
}
