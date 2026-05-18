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

interface CatalogoCursoEntry {
  readonly skillsPendientesCount: number
  readonly areaCodigo: string | null
  readonly areaNombre: string | null
}

const CATALOGO_VACIO: CatalogoCursoEntry = {
  skillsPendientesCount: 0,
  areaCodigo: null,
  areaNombre: null,
}

/**
 * `MeCursosService` (FIX-pre-S12) — listado paginado de cursos del colaborador
 * en sesion. Filtros opcionales por `estado` del curso (`ACTIVO` / `CERRADO` /
 * `TODOS`) y `rol` de asignacion (`ASIGNADO` / `VOLUNTARIO` / `TODOS`).
 *
 * El porcentaje se obtiene del motor canonico `PlanPersonalService.obtenerPorcentajeAvance`
 * (D-S7-B6, FIX-P11b-avance §5.128) — no se duplica la regla de seccion
 * completada para asignados. Voluntarios (D-AS-1: sin PlanEstudio) usan la
 * misma formula que `MeAvanceService` para voluntarios: aperturas sobre el
 * total de secciones del curso (catalogo via `CursoModuloHabilitado`). Esto
 * evita el 0% perpetuo en la card "Mis cursos activos" de la bandeja.
 *
 * Las lecturas autoservicio no se auditan (D-CAT-3).
 *
 * B-2 / B-extra.1: cada item incluye `skillsPendientesCount` (skills del
 * catalogo que aun no superan `notaMinima` para este colaborador) y
 * `areaCodigo`/`areaNombre` (area mas representada en el catalogo del curso).
 * Se calculan con dos queries agregadas para evitar N+1.
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

    const cursoIds = filas.map((row) => row.curso.id)
    const catalogoPorCurso = await this.cargarCatalogoPorCurso(cursoIds, usuario.colaboradorId)

    const items = await Promise.all(
      filas.map((row) => this.toResumen(row, catalogoPorCurso.get(row.curso.id) ?? CATALOGO_VACIO)),
    )
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

  /**
   * Precarga, en dos queries, el catalogo de skills exigidas de los cursos
   * de la pagina y las notas actuales del colaborador. Devuelve por cursoId
   * el conteo de pendientes y el area dominante (empate alfabetico por
   * nombre).
   */
  private async cargarCatalogoPorCurso(
    cursoIds: readonly string[],
    colaboradorId: string,
  ): Promise<Map<string, CatalogoCursoEntry>> {
    if (cursoIds.length === 0) {
      return new Map()
    }

    const skillsExigidas = await this.prisma.cursoSkillExigida.findMany({
      where: { cursoId: { in: [...cursoIds] } },
      select: {
        cursoId: true,
        skillId: true,
        notaMinima: true,
        skill: {
          select: {
            area: { select: { id: true, codigo: true, nombre: true } },
          },
        },
      },
    })

    if (skillsExigidas.length === 0) {
      return new Map()
    }

    const skillIds = Array.from(new Set(skillsExigidas.map((s) => s.skillId)))
    const notas = await this.prisma.notaSkill.findMany({
      where: { colaboradorId, skillId: { in: skillIds } },
      select: { skillId: true, notaActual: true },
    })
    const notaPorSkill = new Map<string, Prisma.Decimal | null>(
      notas.map((n) => [n.skillId, n.notaActual]),
    )

    const acumuladorPorCurso = new Map<
      string,
      {
        pendientes: number
        areas: Map<string, { codigo: string; nombre: string; count: number }>
      }
    >()

    for (const exigida of skillsExigidas) {
      let bucket = acumuladorPorCurso.get(exigida.cursoId)
      if (!bucket) {
        bucket = { pendientes: 0, areas: new Map() }
        acumuladorPorCurso.set(exigida.cursoId, bucket)
      }

      const nota = notaPorSkill.get(exigida.skillId) ?? null
      if (nota === null || nota.lessThan(exigida.notaMinima)) {
        bucket.pendientes += 1
      }

      const area = exigida.skill.area
      const areaEntry = bucket.areas.get(area.id) ?? {
        codigo: area.codigo,
        nombre: area.nombre,
        count: 0,
      }
      areaEntry.count += 1
      bucket.areas.set(area.id, areaEntry)
    }

    const result = new Map<string, CatalogoCursoEntry>()
    for (const [cursoId, bucket] of acumuladorPorCurso) {
      const areaDominante = this.elegirAreaDominante(bucket.areas)
      result.set(cursoId, {
        skillsPendientesCount: bucket.pendientes,
        areaCodigo: areaDominante?.codigo ?? null,
        areaNombre: areaDominante?.nombre ?? null,
      })
    }
    return result
  }

  private elegirAreaDominante(
    areas: ReadonlyMap<string, { codigo: string; nombre: string; count: number }>,
  ): { codigo: string; nombre: string } | null {
    let mejor: { codigo: string; nombre: string; count: number } | null = null
    for (const area of areas.values()) {
      if (
        mejor === null ||
        area.count > mejor.count ||
        (area.count === mejor.count && area.nombre.localeCompare(mejor.nombre) < 0)
      ) {
        mejor = area
      }
    }
    return mejor ? { codigo: mejor.codigo, nombre: mejor.nombre } : null
  }

  private async toResumen(
    row: AsignacionRow,
    catalogo: CatalogoCursoEntry,
  ): Promise<MeCursoResumen> {
    const porcentajeAvance =
      row.rol === RolAsignacion.ASIGNADO
        ? await this.planPersonalService.obtenerPorcentajeAvance(row.id)
        : await this.porcentajeAvanceVoluntario(row.id, row.curso.id)
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
      skillsPendientesCount: catalogo.skillsPendientesCount,
      areaCodigo: catalogo.areaCodigo,
      areaNombre: catalogo.areaNombre,
    }
  }

  /**
   * Voluntario (D-AS-1: sin PlanEstudio): denominador = total de secciones
   * del curso (catalogo via `CursoModuloHabilitado`), numerador = aperturas.
   * Misma formula que `MeAvanceService.obtenerAvance` para voluntarios para
   * que el % de la card en la bandeja coincida con el del topbar del
   * inmersivo. Resultado clamped a [0, 100].
   */
  private async porcentajeAvanceVoluntario(asignacionId: string, cursoId: string): Promise<number> {
    const [aperturas, total] = await Promise.all([
      this.prisma.aperturaSeccion.count({ where: { asignacionId } }),
      this.prisma.seccion.count({
        where: { modulo: { cursosModulosHabilitados: { some: { cursoId } } } },
      }),
    ])
    if (total === 0) {
      return 0
    }
    return Math.min(100, Math.round((aperturas / total) * 100))
  }
}
