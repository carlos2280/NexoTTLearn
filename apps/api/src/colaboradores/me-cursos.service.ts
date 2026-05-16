import { Injectable, NotFoundException } from "@nestjs/common"
import type { MeCursoResumen, MeCursosQuery } from "@nexott-learn/shared-types"
import { EstadoAsignado, EstadoVoluntario, Prisma, RolAsignacion } from "@prisma/client"
import { apiErrorCodes } from "../common/errors/api-error.codes"
import { Paginated, buildPaginatedResponse, resolvePaginacion } from "../common/http/paginated"
import { PrismaService } from "../common/prisma/prisma.service"
import { PlanPersonalService } from "../plan-personal/plan-personal.service"

const SELECT_ASIGNACION_FIELDS = {
  id: true,
  rol: true,
  estadoAsignado: true,
  estadoVoluntario: true,
  createdAt: true,
  curso: {
    select: { id: true, titulo: true, estado: true, fechaDeadline: true },
  },
} as const satisfies Prisma.AsignacionCursoSelect

type AsignacionRow = Prisma.AsignacionCursoGetPayload<{
  select: typeof SELECT_ASIGNACION_FIELDS
}>

/**
 * `MeCursosService` (FIX-pre-S12) — listado paginado de cursos del colaborador
 * en sesion. Filtros opcionales por `estado` del curso (`ACTIVO` / `CERRADO` /
 * `TODOS`) y `rol` de asignacion (`ASIGNADO` / `VOLUNTARIO` / `TODOS`).
 *
 * El porcentaje se obtiene del motor canonico `PlanPersonalService.obtenerPorcentajeAvance`
 * (D-S7-B6, FIX-P11b-avance §5.128) — no se duplica la regla de seccion
 * completada. Voluntarios sin plan reciben 0 (D-AS-1).
 *
 * Las lecturas autoservicio no se auditan (D-CAT-3).
 */
@Injectable()
export class MeCursosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly planPersonalService: PlanPersonalService,
  ) {}

  async listarMisCursos(
    usuarioId: string,
    query: MeCursosQuery,
  ): Promise<Paginated<MeCursoResumen>> {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { colaboradorId: true },
    })
    if (!usuario?.colaboradorId) {
      throw new NotFoundException({
        code: apiErrorCodes.colaboradorNoEncontrado,
        message: "Colaborador no encontrado.",
      })
    }

    const { page, pageSize, skip, take } = resolvePaginacion(query)
    const where = this.buildWhere(usuario.colaboradorId, query)

    const [filas, total] = await this.prisma.$transaction([
      this.prisma.asignacionCurso.findMany({
        where,
        select: SELECT_ASIGNACION_FIELDS,
        orderBy: [{ createdAt: "desc" }],
        skip,
        take,
      }),
      this.prisma.asignacionCurso.count({ where }),
    ])

    const items = await Promise.all(filas.map((row) => this.toResumen(row)))
    return buildPaginatedResponse(items, total, page, pageSize)
  }

  private buildWhere(
    colaboradorId: string,
    query: MeCursosQuery,
  ): Prisma.AsignacionCursoWhereInput {
    const where: Prisma.AsignacionCursoWhereInput = { colaboradorId }
    if (query.estado !== "TODOS") {
      where.curso = { estado: query.estado }
    }
    if (query.rol !== "TODOS") {
      where.rol = query.rol as RolAsignacion
    }
    return where
  }

  private async toResumen(row: AsignacionRow): Promise<MeCursoResumen> {
    const porcentajeAvance =
      row.rol === RolAsignacion.ASIGNADO
        ? await this.planPersonalService.obtenerPorcentajeAvance(row.id)
        : 0
    return {
      asignacionId: row.id,
      cursoId: row.curso.id,
      cursoTitulo: row.curso.titulo,
      cursoEstado: row.curso.estado,
      rol: row.rol,
      estadoAsignado: row.estadoAsignado as EstadoAsignado | null,
      estadoVoluntario: row.estadoVoluntario as EstadoVoluntario | null,
      fechaInscripcion: row.createdAt.toISOString(),
      fechaDeadline: row.curso.fechaDeadline.toISOString(),
      porcentajeAvance,
    }
  }
}
