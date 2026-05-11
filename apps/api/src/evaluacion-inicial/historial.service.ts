import { Injectable, NotFoundException } from "@nestjs/common"
import { CargaEvaluacionInicialResumen } from "@nexott-learn/shared-types"
import { Prisma } from "@prisma/client"
import { apiErrorCodes } from "../common/errors/api-error.codes"
import { Paginated, buildPaginatedResponse, resolvePaginacion } from "../common/http/paginated"
import { PrismaService } from "../common/prisma/prisma.service"

const SELECT_CARGA_HISTORIAL = {
  id: true,
  previewId: true,
  archivoId: true,
  createdAt: true,
  skillsActualizadas: true,
  colaboradoresActualizados: true,
  aplicadoPor: {
    select: {
      id: true,
      colaborador: { select: { nombre: true } },
    },
  },
  archivo: { select: { metadata: true } },
} as const satisfies Prisma.CargaEvaluacionInicialSelect

type CargaRow = Prisma.CargaEvaluacionInicialGetPayload<{
  select: typeof SELECT_CARGA_HISTORIAL
}>

interface ListarHistorialQuery {
  readonly page: number
  readonly pageSize: number
}

/**
 * HistorialService — Slice 5 P5c (`GET .../evaluacion-inicial/historial`).
 *
 * Lista paginada (Paginated<T>) de `CargaEvaluacionInicial` para un curso,
 * ordenada por `createdAt DESC`. NO se incluye `archivoUrl` firmado (decision
 * documentada en el contrato HTTP). El `archivoId` viaja como referencia
 * opaca.
 *
 * Lecturas NO se loggean en `activity_logs` (D-CAT-3): la consulta del
 * historico es lectura admin frecuente y satura el log.
 */
@Injectable()
export class HistorialService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(
    cursoId: string,
    query: ListarHistorialQuery,
  ): Promise<Paginated<CargaEvaluacionInicialResumen>> {
    const curso = await this.prisma.curso.findUnique({
      where: { id: cursoId },
      select: { id: true },
    })
    if (!curso) {
      throw new NotFoundException({
        code: apiErrorCodes.cursoNoEncontrado,
        message: `Curso ${cursoId} no encontrado.`,
      })
    }

    const { page, pageSize, skip, take } = resolvePaginacion(query)
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.cargaEvaluacionInicial.findMany({
        where: { cursoId },
        select: SELECT_CARGA_HISTORIAL,
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      this.prisma.cargaEvaluacionInicial.count({ where: { cursoId } }),
    ])

    const data: CargaEvaluacionInicialResumen[] = rows.map((r) => this.toResumen(r))
    return buildPaginatedResponse(data, total, page, pageSize)
  }

  private toResumen(row: CargaRow): CargaEvaluacionInicialResumen {
    return {
      cargaId: row.id,
      previewId: row.previewId,
      archivoId: row.archivoId,
      nombreOriginal: this.extraerNombreOriginal(row.archivo.metadata),
      aplicadoEn: row.createdAt.toISOString(),
      aplicadoPor: {
        usuarioId: row.aplicadoPor.id,
        nombre: row.aplicadoPor.colaborador.nombre,
      },
      skillsActualizadas: row.skillsActualizadas,
      colaboradoresActualizados: row.colaboradoresActualizados,
    }
  }

  private extraerNombreOriginal(metadata: Prisma.JsonValue | null): string | null {
    if (metadata === null || typeof metadata !== "object" || Array.isArray(metadata)) {
      return null
    }
    const raw = (metadata as Record<string, unknown>).nombreOriginal
    return typeof raw === "string" ? raw : null
  }
}
