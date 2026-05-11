import { ConflictException, Injectable, NotFoundException } from "@nestjs/common"
import {
  CrearSkillInput,
  ListarSkillsQuery,
  Paginated,
  RenombrarSkillInput,
  SkillDuplicadaCandidata,
  SkillResponse,
} from "@nexott-learn/shared-types"
import { AccionAuditoria, EstadoSkill, Prisma } from "@prisma/client"
import { AuditLogService } from "../../common/audit/audit-log.service"
import { ContextoHttpAuditoria } from "../../common/audit/audit-log.types"
import { apiErrorCodes } from "../../common/errors/api-error.codes"
import { buildPaginatedResponse, resolvePaginacion } from "../../common/http/paginated"
import { PrismaService } from "../../common/prisma/prisma.service"

const SELECT_SKILL_FIELDS = {
  id: true,
  etiquetaVisible: true,
  areaId: true,
  estado: true,
  createdAt: true,
  updatedAt: true,
} as const satisfies Prisma.SkillSelect

const MAX_CANDIDATAS_WIZARD = 5
const LONGITUD_MIN_SUFIJO_BUSQUEDA = 3

type SkillRow = Prisma.SkillGetPayload<{ select: typeof SELECT_SKILL_FIELDS }>

export interface HistoricoRenombradoResponse {
  readonly id: string
  readonly fecha: string
  readonly etiquetaAnterior: string
  readonly etiquetaNueva: string
  readonly autorUsuarioId: string
}

export interface HistoricoCambioAreaResponse {
  readonly id: string
  readonly fecha: string
  readonly areaAnteriorId: string
  readonly areaNuevaId: string
  readonly autorUsuarioId: string
  readonly motivo: string
}

export interface HistoricoSkillResponse {
  readonly renombrados: readonly HistoricoRenombradoResponse[]
  readonly cambiosArea: readonly HistoricoCambioAreaResponse[]
}

export interface CoberturaSeccion {
  readonly seccionId: string
  readonly moduloId: string
  readonly tituloSeccion: string
}

export interface CoberturaSkillResponse {
  readonly secciones: readonly CoberturaSeccion[]
}

interface CrearSkillOptions {
  readonly forzarCreacion: boolean
}

function toSkillResponse(row: SkillRow): SkillResponse {
  return {
    id: row.id,
    etiquetaVisible: row.etiquetaVisible,
    areaId: row.areaId,
    estado: row.estado,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

function esViolacionUniqueEtiqueta(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002" &&
    Array.isArray(error.meta?.target) &&
    (error.meta.target as readonly string[]).some(
      (c) =>
        c === "etiquetaVisible" || c === "etiqueta_visible" || c === "skills_etiqueta_visible_key",
    )
  )
}

@Injectable()
export class SkillsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async listar(query: ListarSkillsQuery): Promise<Paginated<SkillResponse>> {
    const { areaId, estado, q } = query
    const { skip, take, page, pageSize } = resolvePaginacion(query)
    const where: Prisma.SkillWhereInput = {
      ...(areaId ? { areaId } : {}),
      ...(estado ? { estado } : {}),
      ...(q ? { etiquetaVisible: { contains: q, mode: "insensitive" } } : {}),
    }

    const [filas, total] = await this.prisma.$transaction([
      this.prisma.skill.findMany({
        where,
        select: SELECT_SKILL_FIELDS,
        orderBy: { etiquetaVisible: "asc" },
        take,
        skip,
      }),
      this.prisma.skill.count({ where }),
    ])

    return buildPaginatedResponse(filas.map(toSkillResponse), total, page, pageSize)
  }

  async obtenerPorIdOrThrow(id: string): Promise<SkillResponse> {
    const fila = await this.prisma.skill.findUnique({
      where: { id },
      select: SELECT_SKILL_FIELDS,
    })
    if (!fila) {
      throw new NotFoundException({
        code: apiErrorCodes.skillNoEncontrada,
        message: "Skill no encontrada.",
      })
    }
    return toSkillResponse(fila)
  }

  async crear(
    input: CrearSkillInput,
    options: CrearSkillOptions,
    adminUsuarioId: string,
    contexto: ContextoHttpAuditoria = {},
  ): Promise<SkillResponse> {
    const area = await this.prisma.area.findUnique({
      where: { id: input.areaId },
      select: { id: true },
    })
    if (!area) {
      throw new NotFoundException({
        code: apiErrorCodes.areaNoEncontrada,
        message: "Area no encontrada.",
      })
    }

    const igualdadExacta = await this.prisma.skill.findFirst({
      where: { etiquetaVisible: { equals: input.etiquetaVisible, mode: "insensitive" } },
      select: { id: true },
    })
    if (igualdadExacta) {
      throw new ConflictException({
        code: apiErrorCodes.conflictSkillNombreDuplicado,
        message: "Ya existe una skill con esa etiqueta.",
      })
    }

    if (!options.forzarCreacion) {
      const candidatas = await this.buscarCandidatasDuplicadas(input.etiquetaVisible)
      if (candidatas.length > 0) {
        throw new ConflictException({
          code: apiErrorCodes.conflictSkillDuplicada,
          message: "Existen skills similares.",
          details: { candidatas },
        })
      }
    }

    try {
      const fila = await this.prisma.skill.create({
        data: {
          etiquetaVisible: input.etiquetaVisible,
          areaId: input.areaId,
          estado: EstadoSkill.ACTIVA,
        },
        select: SELECT_SKILL_FIELDS,
      })
      await this.auditLog.record({
        usuarioId: adminUsuarioId,
        accion: AccionAuditoria.SKILL_CREADA,
        exito: true,
        recursoTipo: "skill",
        recursoId: fila.id,
        ...contexto,
      })
      return toSkillResponse(fila)
    } catch (error) {
      if (esViolacionUniqueEtiqueta(error)) {
        // Race condition contra la verificacion ILIKE previa: el unique de
        // Prisma es case-sensitive en Postgres, pero un valor con misma
        // capitalizacion creado entre el findFirst y el create produce P2002.
        throw new ConflictException({
          code: apiErrorCodes.conflictSkillNombreDuplicado,
          message: "Ya existe una skill con esa etiqueta.",
        })
      }
      throw error
    }
  }

  /**
   * Wizard de duplicados D-CAT-15: separa la etiqueta por el primer punto en
   * `familia.sufijo`, busca primero coincidencias por prefijo `familia.` y
   * luego, si el sufijo tiene >=3 caracteres, por contains. Dedup por id,
   * tope 5. Conteo `cursosQueLaUsan` por cursos exigidos directos + indirectos.
   */
  private async buscarCandidatasDuplicadas(
    etiqueta: string,
  ): Promise<readonly SkillDuplicadaCandidata[]> {
    const indicePunto = etiqueta.indexOf(".")
    const familia = indicePunto === -1 ? etiqueta : etiqueta.slice(0, indicePunto)
    const sufijo = indicePunto === -1 ? "" : etiqueta.slice(indicePunto + 1)

    const porFamilia = await this.prisma.skill.findMany({
      where: {
        estado: EstadoSkill.ACTIVA,
        etiquetaVisible: { startsWith: `${familia}.`, mode: "insensitive" },
      },
      orderBy: { etiquetaVisible: "asc" },
      take: MAX_CANDIDATAS_WIZARD,
      select: {
        id: true,
        etiquetaVisible: true,
        areaId: true,
        area: { select: { nombre: true } },
      },
    })

    const porSufijo =
      sufijo.length >= LONGITUD_MIN_SUFIJO_BUSQUEDA
        ? await this.prisma.skill.findMany({
            where: {
              estado: EstadoSkill.ACTIVA,
              etiquetaVisible: { contains: sufijo, mode: "insensitive" },
            },
            orderBy: { etiquetaVisible: "asc" },
            take: MAX_CANDIDATAS_WIZARD,
            select: {
              id: true,
              etiquetaVisible: true,
              areaId: true,
              area: { select: { nombre: true } },
            },
          })
        : []

    const dedup = new Map<string, (typeof porFamilia)[number]>()
    for (const c of porFamilia) {
      dedup.set(c.id, c)
    }
    for (const c of porSufijo) {
      if (!dedup.has(c.id) && dedup.size < MAX_CANDIDATAS_WIZARD) {
        dedup.set(c.id, c)
      }
    }
    const seleccionadas = Array.from(dedup.values()).slice(0, MAX_CANDIDATAS_WIZARD)

    const conteos = await Promise.all(
      seleccionadas.map((c) => this.contarCursosQueUsanSkill(c.id, c.areaId)),
    )
    return seleccionadas.map((c, i) => ({
      id: c.id,
      etiquetaVisible: c.etiquetaVisible,
      areaNombre: c.area.nombre,
      cursosQueLaUsan: conteos[i] ?? 0,
    }))
  }

  private async contarCursosQueUsanSkill(skillId: string, areaId: string): Promise<number> {
    const [directos, porArea] = await Promise.all([
      this.prisma.cursoSkillExigida.findMany({
        where: { skillId },
        select: { cursoId: true },
      }),
      this.prisma.cursoAreaExigida.findMany({
        where: { areaId },
        select: { cursoId: true },
      }),
    ])
    const cursos = new Set<string>()
    for (const c of directos) {
      cursos.add(c.cursoId)
    }
    for (const c of porArea) {
      cursos.add(c.cursoId)
    }
    return cursos.size
  }

  async renombrar(
    skillId: string,
    input: RenombrarSkillInput,
    _motivo: string,
    adminUsuarioId: string,
    contexto: ContextoHttpAuditoria = {},
  ): Promise<SkillResponse> {
    const actual = await this.prisma.skill.findUnique({
      where: { id: skillId },
      select: SELECT_SKILL_FIELDS,
    })
    if (!actual) {
      throw new NotFoundException({
        code: apiErrorCodes.skillNoEncontrada,
        message: "Skill no encontrada.",
      })
    }

    if (input.etiquetaVisible === actual.etiquetaVisible) {
      return toSkillResponse(actual)
    }

    try {
      const fila = await this.prisma.$transaction(async (tx) => {
        const actualizada = await tx.skill.update({
          where: { id: skillId },
          data: { etiquetaVisible: input.etiquetaVisible },
          select: SELECT_SKILL_FIELDS,
        })
        await tx.historicoRenombradoSkill.create({
          data: {
            skillId,
            etiquetaAnterior: actual.etiquetaVisible,
            etiquetaNueva: input.etiquetaVisible,
            autorUsuarioId: adminUsuarioId,
          },
        })
        return actualizada
      })

      await this.auditLog.record({
        usuarioId: adminUsuarioId,
        accion: AccionAuditoria.SKILL_RENOMBRADA,
        exito: true,
        recursoTipo: "skill",
        recursoId: skillId,
        ...contexto,
      })
      return toSkillResponse(fila)
    } catch (error) {
      if (esViolacionUniqueEtiqueta(error)) {
        throw new ConflictException({
          code: apiErrorCodes.conflictSkillNombreDuplicado,
          message: "Ya existe una skill con esa etiqueta.",
        })
      }
      throw error
    }
  }

  async archivar(
    skillId: string,
    _motivo: string,
    adminUsuarioId: string,
    contexto: ContextoHttpAuditoria = {},
  ): Promise<void> {
    const actual = await this.prisma.skill.findUnique({
      where: { id: skillId },
      select: { id: true, estado: true },
    })
    if (!actual) {
      throw new NotFoundException({
        code: apiErrorCodes.skillNoEncontrada,
        message: "Skill no encontrada.",
      })
    }
    if (actual.estado === EstadoSkill.ARCHIVADA) {
      throw new ConflictException({
        code: apiErrorCodes.conflictSkillYaArchivada,
        message: "La skill ya esta archivada.",
      })
    }
    await this.prisma.skill.update({
      where: { id: skillId },
      data: { estado: EstadoSkill.ARCHIVADA },
      select: { id: true },
    })
    await this.auditLog.record({
      usuarioId: adminUsuarioId,
      accion: AccionAuditoria.SKILL_ARCHIVADA,
      exito: true,
      recursoTipo: "skill",
      recursoId: skillId,
      ...contexto,
    })
  }

  async desarchivar(
    skillId: string,
    adminUsuarioId: string,
    contexto: ContextoHttpAuditoria = {},
  ): Promise<void> {
    const actual = await this.prisma.skill.findUnique({
      where: { id: skillId },
      select: { id: true, estado: true },
    })
    if (!actual) {
      throw new NotFoundException({
        code: apiErrorCodes.skillNoEncontrada,
        message: "Skill no encontrada.",
      })
    }
    if (actual.estado === EstadoSkill.ACTIVA) {
      throw new ConflictException({
        code: apiErrorCodes.conflictSkillYaActiva,
        message: "La skill ya esta activa.",
      })
    }
    await this.prisma.skill.update({
      where: { id: skillId },
      data: { estado: EstadoSkill.ACTIVA },
      select: { id: true },
    })
    await this.auditLog.record({
      usuarioId: adminUsuarioId,
      accion: AccionAuditoria.SKILL_DESARCHIVADA,
      exito: true,
      recursoTipo: "skill",
      recursoId: skillId,
      ...contexto,
    })
  }

  async eliminar(
    skillId: string,
    _motivo: string,
    adminUsuarioId: string,
    contexto: ContextoHttpAuditoria = {},
  ): Promise<void> {
    const actual = await this.prisma.skill.findUnique({
      where: { id: skillId },
      select: { id: true, etiquetaVisible: true },
    })
    if (!actual) {
      throw new NotFoundException({
        code: apiErrorCodes.skillNoEncontrada,
        message: "Skill no encontrada.",
      })
    }

    const [secciones, cursos, bloques, transversales, notas] = await Promise.all([
      this.prisma.seccionSkill.count({ where: { skillId } }),
      this.prisma.cursoSkillExigida.count({ where: { skillId } }),
      this.prisma.bloque.count({ where: { skillQueMideId: skillId } }),
      this.prisma.transversalSkill.count({ where: { skillId } }),
      this.prisma.notaSkill.count({ where: { skillId } }),
    ])

    const total = secciones + cursos + bloques + transversales + notas
    if (total > 0) {
      throw new ConflictException({
        code: apiErrorCodes.conflictSkillConReferencias,
        message: "No se puede eliminar la skill: tiene referencias activas.",
        details: { referencias: { secciones, cursos, bloques, transversales, notas } },
      })
    }

    await this.prisma.skill.delete({ where: { id: skillId } })
    await this.auditLog.record({
      usuarioId: adminUsuarioId,
      accion: AccionAuditoria.SKILL_ELIMINADA,
      exito: true,
      recursoTipo: "skill",
      recursoId: skillId,
      ...contexto,
    })
  }

  async historico(skillId: string): Promise<HistoricoSkillResponse> {
    const existe = await this.prisma.skill.findUnique({
      where: { id: skillId },
      select: { id: true },
    })
    if (!existe) {
      throw new NotFoundException({
        code: apiErrorCodes.skillNoEncontrada,
        message: "Skill no encontrada.",
      })
    }
    const [renombrados, cambiosArea] = await Promise.all([
      this.prisma.historicoRenombradoSkill.findMany({
        where: { skillId },
        orderBy: { fecha: "desc" },
        take: 100,
        select: {
          id: true,
          fecha: true,
          etiquetaAnterior: true,
          etiquetaNueva: true,
          autorUsuarioId: true,
        },
      }),
      this.prisma.historicoCambiosAreaSkill.findMany({
        where: { skillId },
        orderBy: { fecha: "desc" },
        take: 100,
        select: {
          id: true,
          fecha: true,
          areaAnteriorId: true,
          areaNuevaId: true,
          autorUsuarioId: true,
          motivo: true,
        },
      }),
    ])
    return {
      renombrados: renombrados.map((r) => ({
        id: r.id,
        fecha: r.fecha.toISOString(),
        etiquetaAnterior: r.etiquetaAnterior,
        etiquetaNueva: r.etiquetaNueva,
        autorUsuarioId: r.autorUsuarioId,
      })),
      cambiosArea: cambiosArea.map((c) => ({
        id: c.id,
        fecha: c.fecha.toISOString(),
        areaAnteriorId: c.areaAnteriorId,
        areaNuevaId: c.areaNuevaId,
        autorUsuarioId: c.autorUsuarioId,
        motivo: c.motivo,
      })),
    }
  }

  async cobertura(skillId: string): Promise<CoberturaSkillResponse> {
    const existe = await this.prisma.skill.findUnique({
      where: { id: skillId },
      select: { id: true },
    })
    if (!existe) {
      throw new NotFoundException({
        code: apiErrorCodes.skillNoEncontrada,
        message: "Skill no encontrada.",
      })
    }
    const filas = await this.prisma.seccionSkill.findMany({
      where: { skillId },
      select: {
        seccion: {
          select: { id: true, titulo: true, moduloId: true },
        },
      },
    })
    return {
      secciones: filas.map((f) => ({
        seccionId: f.seccion.id,
        moduloId: f.seccion.moduloId,
        tituloSeccion: f.seccion.titulo,
      })),
    }
  }
}
