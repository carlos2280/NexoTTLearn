import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common"
import type {
  CandidatoDisponible,
  CandidatosDisponiblesQuery,
  CandidatosDisponiblesResponse,
  InvitarCandidatosBody,
  InvitarCandidatosErrorCodigo,
  InvitarCandidatosResponse,
} from "@nexott-learn/shared-types"
import { Prisma } from "@prisma/client"
import { PrismaService } from "../../common/prisma/prisma.service"
import {
  INSCRIPCION_DIAGNOSTICO_SELECT,
  mapInscripcionDiagnostico,
} from "./inscripciones-curso.mapper"
import {
  ENTIDAD_TIPO_INSCRIPCION,
  ERROR_CURSO_NO_ENCONTRADO,
  ERROR_PARTICIPANTE_IDS_DUPLICADOS,
} from "./inscripciones-curso.types"

interface ClasificacionUsuarios {
  readonly aCrear: readonly string[]
  readonly yaInvitados: readonly { participanteId: string; inscripcionId: string }[]
  readonly errores: readonly { participanteId: string; codigo: InvitarCandidatosErrorCodigo }[]
}

@Injectable()
export class InscripcionesCursoInvitarService {
  constructor(private readonly prisma: PrismaService) {}

  async buscarCandidatosDisponibles(
    cursoId: string,
    query: CandidatosDisponiblesQuery,
  ): Promise<CandidatosDisponiblesResponse> {
    await this.requireCurso(cursoId)

    const inscritosActivos = await this.prisma.inscripcion.findMany({
      where: { cursoId, estado: "ACTIVA" },
      select: { participanteId: true },
    })
    const excluidos = new Set(inscritosActivos.map((i) => i.participanteId))

    const limit = query.limit
    const where: Prisma.UsuarioWhereInput = {
      rol: "PARTICIPANTE",
      bloqueado: false,
      id: { notIn: Array.from(excluidos) },
      ...filtroBusquedaUsuario(query.q),
    }

    const rows = await this.prisma.usuario.findMany({
      where,
      select: { id: true, nombre: true, apellido: true, email: true },
      orderBy: [{ apellido: "asc" }, { nombre: "asc" }],
      take: limit + 1,
    })

    const truncado = rows.length > limit
    const items: CandidatoDisponible[] = rows.slice(0, limit).map((u) => ({
      id: u.id,
      nombre: u.nombre,
      apellido: u.apellido,
      email: u.email,
    }))
    return { items, truncado }
  }

  async invitarCandidatos(
    cursoId: string,
    body: InvitarCandidatosBody,
    actorId: string,
  ): Promise<InvitarCandidatosResponse> {
    const { areasTotales } = await this.requireCurso(cursoId)

    const idsUnicos = new Set(body.participanteIds)
    if (idsUnicos.size !== body.participanteIds.length) {
      throw new BadRequestException(ERROR_PARTICIPANTE_IDS_DUPLICADOS)
    }

    const ids = Array.from(idsUnicos)
    const clasificacion = await this.clasificarUsuarios(cursoId, ids)

    if (clasificacion.aCrear.length === 0) {
      return {
        creadas: [],
        yaInvitados: [...clasificacion.yaInvitados],
        errores: [...clasificacion.errores],
      }
    }

    const creadas = await this.prisma.$transaction(async (tx) => {
      const inscripcionesNuevas = await Promise.all(
        clasificacion.aCrear.map((participanteId) =>
          tx.inscripcion.create({
            data: { cursoId, participanteId, tipo: "SOLICITUD", estado: "ACTIVA" },
            select: INSCRIPCION_DIAGNOSTICO_SELECT,
          }),
        ),
      )

      await tx.logActividad.create({
        data: {
          actorId,
          tipoAccion: "CURSO_ACTUALIZADO",
          entidadTipo: ENTIDAD_TIPO_INSCRIPCION,
          entidadId: cursoId,
          valorAntes: Prisma.JsonNull,
          valorDespues: {
            invitados: inscripcionesNuevas.map((i) => i.id),
            participanteIds: clasificacion.aCrear,
          },
        },
      })

      return inscripcionesNuevas
    })

    return {
      creadas: creadas.map((row) => mapInscripcionDiagnostico({ row, areasTotales })),
      yaInvitados: [...clasificacion.yaInvitados],
      errores: [...clasificacion.errores],
    }
  }

  private async requireCurso(cursoId: string): Promise<{ readonly areasTotales: number }> {
    const curso = await this.prisma.curso.findUnique({
      where: { id: cursoId },
      select: { id: true, _count: { select: { cursoAreas: true } } },
    })
    if (!curso) {
      throw new NotFoundException(ERROR_CURSO_NO_ENCONTRADO)
    }
    return { areasTotales: curso._count.cursoAreas }
  }

  private async clasificarUsuarios(
    cursoId: string,
    participanteIds: readonly string[],
  ): Promise<ClasificacionUsuarios> {
    const usuarios = await this.prisma.usuario.findMany({
      where: { id: { in: [...participanteIds] } },
      select: { id: true, rol: true, bloqueado: true },
    })
    const usuariosPorId = new Map(usuarios.map((u) => [u.id, u]))

    const inscripcionesActivas = await this.prisma.inscripcion.findMany({
      where: { cursoId, estado: "ACTIVA", participanteId: { in: [...participanteIds] } },
      select: { id: true, participanteId: true },
    })
    const inscripcionPorParticipante = new Map(
      inscripcionesActivas.map((i) => [i.participanteId, i.id]),
    )

    const aCrear: string[] = []
    const yaInvitados: { participanteId: string; inscripcionId: string }[] = []
    const errores: { participanteId: string; codigo: InvitarCandidatosErrorCodigo }[] = []

    for (const id of participanteIds) {
      const inscripcionId = inscripcionPorParticipante.get(id)
      if (inscripcionId) {
        yaInvitados.push({ participanteId: id, inscripcionId })
        continue
      }
      const usuario = usuariosPorId.get(id)
      if (!usuario) {
        errores.push({ participanteId: id, codigo: "USUARIO_NO_ENCONTRADO" })
        continue
      }
      if (usuario.rol !== "PARTICIPANTE") {
        errores.push({ participanteId: id, codigo: "USUARIO_NO_PARTICIPANTE" })
        continue
      }
      if (usuario.bloqueado) {
        errores.push({ participanteId: id, codigo: "USUARIO_BLOQUEADO" })
        continue
      }
      aCrear.push(id)
    }
    return { aCrear, yaInvitados, errores }
  }
}

function filtroBusquedaUsuario(q: string | undefined): Prisma.UsuarioWhereInput {
  if (!q) {
    return {}
  }
  return {
    // biome-ignore lint/style/useNamingConvention: OR es operador estandar de Prisma
    OR: [
      { nombre: { contains: q, mode: "insensitive" } },
      { apellido: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
    ],
  }
}
