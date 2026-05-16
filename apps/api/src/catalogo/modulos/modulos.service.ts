import {
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common"
import {
  ActualizarModuloInput,
  CrearModuloInput,
  CursoActivoAfectado,
  ListarModulosQuery,
  ModuloResponse,
  Paginated,
  PreviewImpactoArchivoModulo,
  SkillHuerfana,
} from "@nexott-learn/shared-types"
import {
  AccionAuditoria,
  EstadoBloque,
  EstadoCurso,
  EstadoModulo,
  EstadoSkill,
  Prisma,
  TipoEventoNotif,
} from "@prisma/client"
import { AuditLogService } from "../../common/audit/audit-log.service"
import { ContextoHttpAuditoria } from "../../common/audit/audit-log.types"
import { apiErrorCodes } from "../../common/errors/api-error.codes"
import { buildPaginatedResponse, resolvePaginacion } from "../../common/http/paginated"
import { PrismaService } from "../../common/prisma/prisma.service"
import { broadcastAdminsActivos } from "../../notificaciones/notificaciones.helpers"
import { NotificacionesService } from "../../notificaciones/notificaciones.service"

const SELECT_MODULO_FIELDS = {
  id: true,
  titulo: true,
  descripcion: true,
  estado: true,
  createdAt: true,
  updatedAt: true,
} as const satisfies Prisma.ModuloSelect

type ModuloRow = Prisma.ModuloGetPayload<{ select: typeof SELECT_MODULO_FIELDS }>

function toModuloResponse(row: ModuloRow): ModuloResponse {
  return {
    id: row.id,
    titulo: row.titulo,
    descripcion: row.descripcion,
    estado: row.estado,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

export interface ArchivarModuloResponse {
  readonly modulo: ModuloResponse
  readonly previewImpacto: PreviewImpactoArchivoModulo
}

@Injectable()
export class ModulosService {
  private readonly logger = new Logger(ModulosService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
    private readonly notificaciones: NotificacionesService,
  ) {}

  async listar(query: ListarModulosQuery): Promise<Paginated<ModuloResponse>> {
    const { estado, q } = query
    const { skip, take, page, pageSize } = resolvePaginacion(query)
    // D-CAT-4: soft-delete excluido siempre del listado.
    const where: Prisma.ModuloWhereInput = {
      deletedAt: null,
      ...(estado ? { estado } : {}),
      ...(q ? { titulo: { contains: q, mode: "insensitive" } } : {}),
    }

    const [filas, total] = await this.prisma.$transaction([
      this.prisma.modulo.findMany({
        where,
        select: SELECT_MODULO_FIELDS,
        orderBy: { titulo: "asc" },
        take,
        skip,
      }),
      this.prisma.modulo.count({ where }),
    ])

    return buildPaginatedResponse(filas.map(toModuloResponse), total, page, pageSize)
  }

  async obtenerPorIdOrThrow(id: string): Promise<ModuloResponse> {
    const fila = await this.prisma.modulo.findFirst({
      where: { id, deletedAt: null },
      select: SELECT_MODULO_FIELDS,
    })
    if (!fila) {
      throw new NotFoundException({
        code: apiErrorCodes.moduloNoEncontrado,
        message: "Modulo no encontrado.",
      })
    }
    return toModuloResponse(fila)
  }

  async crear(
    input: CrearModuloInput,
    adminUsuarioId: string,
    contexto: ContextoHttpAuditoria = {},
  ): Promise<ModuloResponse> {
    const fila = await this.prisma.modulo.create({
      data: {
        titulo: input.titulo,
        descripcion: input.descripcion,
        estado: EstadoModulo.ACTIVO,
      },
      select: SELECT_MODULO_FIELDS,
    })
    await this.auditLog.record({
      usuarioId: adminUsuarioId,
      accion: AccionAuditoria.MODULO_CREADO,
      exito: true,
      recursoTipo: "modulo",
      recursoId: fila.id,
      ...contexto,
    })
    return toModuloResponse(fila)
  }

  async actualizar(
    id: string,
    input: ActualizarModuloInput,
    motivo: string | undefined,
    adminUsuarioId: string,
    contexto: ContextoHttpAuditoria = {},
  ): Promise<ModuloResponse> {
    const actual = await this.prisma.modulo.findFirst({
      where: { id, deletedAt: null },
      select: SELECT_MODULO_FIELDS,
    })
    if (!actual) {
      throw new NotFoundException({
        code: apiErrorCodes.moduloNoEncontrado,
        message: "Modulo no encontrado.",
      })
    }
    if (actual.estado === EstadoModulo.ARCHIVADO) {
      throw new ConflictException({
        code: apiErrorCodes.conflictModuloArchivado,
        message: "No se puede editar un modulo archivado.",
      })
    }
    if (input.titulo !== undefined && (motivo === undefined || motivo.length === 0)) {
      throw new HttpException(
        {
          code: apiErrorCodes.motivoRequerido,
          message: "Se requiere X-Motivo para cambiar el titulo del modulo.",
        },
        HttpStatus.UNPROCESSABLE_ENTITY,
      )
    }

    const data: Prisma.ModuloUpdateInput = {}
    const camposCambiados: string[] = []
    if (input.titulo !== undefined && input.titulo !== actual.titulo) {
      data.titulo = input.titulo
      camposCambiados.push("titulo")
    }
    if (input.descripcion !== undefined && input.descripcion !== actual.descripcion) {
      data.descripcion = input.descripcion
      camposCambiados.push("descripcion")
    }
    if (camposCambiados.length === 0) {
      return toModuloResponse(actual)
    }

    const fila = await this.prisma.modulo.update({
      where: { id },
      data,
      select: SELECT_MODULO_FIELDS,
    })

    const metadata: Record<string, Prisma.InputJsonValue> = { camposCambiados }
    if (camposCambiados.includes("titulo") && motivo) {
      metadata.motivo = motivo
    }
    await this.auditLog.record({
      usuarioId: adminUsuarioId,
      accion: AccionAuditoria.MODULO_ACTUALIZADO,
      exito: true,
      recursoTipo: "modulo",
      recursoId: id,
      metadata,
      ...contexto,
    })
    return toModuloResponse(fila)
  }

  /**
   * D-CAT-13: archiva el modulo, persiste historico_estados_modulo y calcula el
   * impacto sobre cursos ACTIVOS (huerfanas). El archivado NO se bloquea aunque
   * haya huerfanas — es informativo. La calculacion va dentro del $transaction
   * para release atomica (D-AUDIT-2: el audit log se invoca fuera del tx).
   */
  async archivar(
    moduloId: string,
    motivo: string,
    adminUsuarioId: string,
    contexto: ContextoHttpAuditoria = {},
  ): Promise<ArchivarModuloResponse> {
    const actual = await this.prisma.modulo.findFirst({
      where: { id: moduloId, deletedAt: null },
      select: { id: true, estado: true },
    })
    if (!actual) {
      throw new NotFoundException({
        code: apiErrorCodes.moduloNoEncontrado,
        message: "Modulo no encontrado.",
      })
    }
    if (actual.estado === EstadoModulo.ARCHIVADO) {
      throw new ConflictException({
        code: apiErrorCodes.moduloYaArchivado,
        message: "El modulo ya esta archivado.",
      })
    }

    const { modulo, previewImpacto } = await this.prisma.$transaction(async (tx) => {
      // Releer en tx: cierra race con otro admin que archive en paralelo.
      const enTx = await tx.modulo.findFirst({
        where: { id: moduloId, deletedAt: null },
        select: { id: true, estado: true },
      })
      if (!enTx) {
        throw new NotFoundException({
          code: apiErrorCodes.moduloNoEncontrado,
          message: "Modulo no encontrado.",
        })
      }
      if (enTx.estado === EstadoModulo.ARCHIVADO) {
        throw new ConflictException({
          code: apiErrorCodes.moduloYaArchivado,
          message: "El modulo ya esta archivado.",
        })
      }
      const moduloActualizado = await tx.modulo.update({
        where: { id: moduloId },
        data: { estado: EstadoModulo.ARCHIVADO },
        select: SELECT_MODULO_FIELDS,
      })
      await tx.historicoEstadoModulo.create({
        data: {
          moduloId,
          estadoAnterior: EstadoModulo.ACTIVO,
          estadoNuevo: EstadoModulo.ARCHIVADO,
          autorUsuarioId: adminUsuarioId,
          motivo,
        },
      })
      const preview = await this.calcularImpactoArchivado(tx, moduloId)
      return { modulo: moduloActualizado, previewImpacto: preview }
    })

    await this.auditLog.record({
      usuarioId: adminUsuarioId,
      accion: AccionAuditoria.MODULO_ARCHIVADO,
      exito: true,
      recursoTipo: "modulo",
      recursoId: moduloId,
      metadata: { motivo },
      ...contexto,
    })
    if (previewImpacto.skillsHuerfanas.length > 0) {
      // (S11.5) emitido via notificarModuloHuerfanoSkill (D-S11.5-B4, D88).
      await this.auditLog.record({
        usuarioId: adminUsuarioId,
        accion: AccionAuditoria.MODULO_HUERFANO_DETECTADO,
        exito: true,
        recursoTipo: "modulo",
        recursoId: moduloId,
        metadata: {
          cursos: previewImpacto.cursosActivosAfectados.map((c) => c.cursoId),
          huerfanas: previewImpacto.skillsHuerfanas.map((s) => ({
            skillId: s.skillId,
            etiquetaVisible: s.etiquetaVisible,
            cursosDondeQuedaHuerfana: [...s.cursosDondeQuedaHuerfana],
          })),
        },
        ...contexto,
      })
      // Notificacion broadcast a admins activos (tipo critico — no silenciable).
      // FUERA del $transaction (R-S10-2 / R-S11.5-2): un fallo de envio NO
      // deshace el archivado del modulo ni el audit log que ya quedo escrito.
      await this.notificarModuloHuerfanoSkill(moduloId, previewImpacto)
    }
    return { modulo: toModuloResponse(modulo), previewImpacto }
  }

  /**
   * Trigger MODULO_HUERFANO_SKILL (D-S11.5-B4, D79+D82, D88). Tipo critico —
   * broadcast a TODOS los admins activos. Solo se invoca si
   * `previewImpacto.skillsHuerfanas.length > 0` (guard en el caller). Cualquier
   * error se loggea sin propagar (R-S10-2 / R-S11.5-2). La identidad del
   * recurso (moduloId, cursos, huerfanas) viene del `previewImpacto` calculado
   * server-side dentro del `$transaction` previo (A01).
   */
  private async notificarModuloHuerfanoSkill(
    moduloId: string,
    previewImpacto: PreviewImpactoArchivoModulo,
  ): Promise<void> {
    try {
      await broadcastAdminsActivos(
        this.prisma,
        this.notificaciones,
        this.logger,
        TipoEventoNotif.MODULO_HUERFANO_SKILL,
        {
          moduloId,
          cursos: previewImpacto.cursosActivosAfectados.map((c) => ({
            cursoId: c.cursoId,
            titulo: c.titulo,
          })),
          huerfanas: previewImpacto.skillsHuerfanas.map((s) => ({
            skillId: s.skillId,
            etiquetaVisible: s.etiquetaVisible,
            cursosDondeQuedaHuerfana: [...s.cursosDondeQuedaHuerfana],
          })),
        },
      )
    } catch (error) {
      const detalle = error instanceof Error ? error.message : String(error)
      this.logger.warn(
        `notif | fallo | tipo=MODULO_HUERFANO_SKILL | modulo=${moduloId} | error=${detalle}`,
      )
    }
  }

  private async calcularImpactoArchivado(
    tx: Prisma.TransactionClient,
    moduloArchivadoId: string,
  ): Promise<PreviewImpactoArchivoModulo> {
    // 1) Cursos ACTIVOS que tenian el modulo habilitado.
    const cursosFila = await tx.cursoModuloHabilitado.findMany({
      where: { moduloId: moduloArchivadoId, curso: { estado: EstadoCurso.ACTIVO } },
      select: { cursoId: true, curso: { select: { titulo: true } } },
    })
    const cursosActivosAfectados: CursoActivoAfectado[] = cursosFila.map((c) => ({
      cursoId: c.cursoId,
      titulo: c.curso.titulo,
    }))
    if (cursosActivosAfectados.length === 0) {
      return { cursosActivosAfectados: [], skillsHuerfanas: [] }
    }

    const skillsHuerfanasMap = new Map<string, { etiquetaVisible: string; cursos: Set<string> }>()

    for (const curso of cursosActivosAfectados) {
      const exigidas = await this.calcularSkillsExigidas(tx, curso.cursoId)
      const cubiertas = await this.calcularSkillsCubiertas(tx, curso.cursoId, moduloArchivadoId)
      for (const [skillId, etiqueta] of exigidas) {
        if (!cubiertas.has(skillId)) {
          const entry = skillsHuerfanasMap.get(skillId)
          if (entry) {
            entry.cursos.add(curso.cursoId)
          } else {
            skillsHuerfanasMap.set(skillId, {
              etiquetaVisible: etiqueta,
              cursos: new Set([curso.cursoId]),
            })
          }
        }
      }
    }

    const skillsHuerfanas: SkillHuerfana[] = Array.from(skillsHuerfanasMap.entries()).map(
      ([skillId, e]) => ({
        skillId,
        etiquetaVisible: e.etiquetaVisible,
        cursosDondeQuedaHuerfana: Array.from(e.cursos),
      }),
    )

    return { cursosActivosAfectados, skillsHuerfanas }
  }

  private async calcularSkillsExigidas(
    tx: Prisma.TransactionClient,
    cursoId: string,
  ): Promise<Map<string, string>> {
    const [skillsDirectas, areasExigidas] = await Promise.all([
      tx.cursoSkillExigida.findMany({
        where: { cursoId },
        select: { skill: { select: { id: true, etiquetaVisible: true, estado: true } } },
      }),
      tx.cursoAreaExigida.findMany({
        where: { cursoId },
        select: { areaId: true },
      }),
    ])
    const resultado = new Map<string, string>()
    for (const s of skillsDirectas) {
      if (s.skill.estado === EstadoSkill.ACTIVA) {
        resultado.set(s.skill.id, s.skill.etiquetaVisible)
      }
    }
    const areaIds = areasExigidas.map((a) => a.areaId)
    if (areaIds.length > 0) {
      const skillsDeAreas = await tx.skill.findMany({
        where: { areaId: { in: areaIds }, estado: EstadoSkill.ACTIVA },
        select: { id: true, etiquetaVisible: true },
      })
      for (const s of skillsDeAreas) {
        if (!resultado.has(s.id)) {
          resultado.set(s.id, s.etiquetaVisible)
        }
      }
    }
    return resultado
  }

  private async calcularSkillsCubiertas(
    tx: Prisma.TransactionClient,
    cursoId: string,
    excluirModuloId: string,
  ): Promise<Set<string>> {
    const modulosCubrientes = await tx.cursoModuloHabilitado.findMany({
      where: {
        cursoId,
        moduloId: { not: excluirModuloId },
        modulo: { estado: EstadoModulo.ACTIVO, deletedAt: null },
      },
      select: { moduloId: true },
    })
    const moduloIds = modulosCubrientes.map((m) => m.moduloId)
    if (moduloIds.length === 0) {
      return new Set<string>()
    }
    const [seccionSkills, bloques] = await Promise.all([
      tx.seccionSkill.findMany({
        where: { seccion: { moduloId: { in: moduloIds } } },
        select: { skillId: true },
      }),
      tx.bloque.findMany({
        where: {
          seccion: { moduloId: { in: moduloIds } },
          skillQueMideId: { not: null },
          estado: { not: EstadoBloque.ELIMINADO },
        },
        select: { skillQueMideId: true },
      }),
    ])
    const resultado = new Set<string>()
    for (const s of seccionSkills) {
      resultado.add(s.skillId)
    }
    for (const b of bloques) {
      if (b.skillQueMideId) {
        resultado.add(b.skillQueMideId)
      }
    }
    return resultado
  }

  async desarchivar(
    moduloId: string,
    motivo: string,
    adminUsuarioId: string,
    contexto: ContextoHttpAuditoria = {},
  ): Promise<ModuloResponse> {
    const actual = await this.prisma.modulo.findFirst({
      where: { id: moduloId, deletedAt: null },
      select: { id: true, estado: true },
    })
    if (!actual) {
      throw new NotFoundException({
        code: apiErrorCodes.moduloNoEncontrado,
        message: "Modulo no encontrado.",
      })
    }
    if (actual.estado === EstadoModulo.ACTIVO) {
      throw new ConflictException({
        code: apiErrorCodes.moduloYaActivo,
        message: "El modulo ya esta activo.",
      })
    }

    const modulo = await this.prisma.$transaction(async (tx) => {
      const enTx = await tx.modulo.findFirst({
        where: { id: moduloId, deletedAt: null },
        select: { id: true, estado: true },
      })
      if (!enTx) {
        throw new NotFoundException({
          code: apiErrorCodes.moduloNoEncontrado,
          message: "Modulo no encontrado.",
        })
      }
      if (enTx.estado === EstadoModulo.ACTIVO) {
        throw new ConflictException({
          code: apiErrorCodes.moduloYaActivo,
          message: "El modulo ya esta activo.",
        })
      }
      const actualizada = await tx.modulo.update({
        where: { id: moduloId },
        data: { estado: EstadoModulo.ACTIVO },
        select: SELECT_MODULO_FIELDS,
      })
      await tx.historicoEstadoModulo.create({
        data: {
          moduloId,
          estadoAnterior: EstadoModulo.ARCHIVADO,
          estadoNuevo: EstadoModulo.ACTIVO,
          autorUsuarioId: adminUsuarioId,
          motivo,
        },
      })
      return actualizada
    })

    await this.auditLog.record({
      usuarioId: adminUsuarioId,
      accion: AccionAuditoria.MODULO_DESARCHIVADO,
      exito: true,
      recursoTipo: "modulo",
      recursoId: moduloId,
      metadata: { motivo },
      ...contexto,
    })
    return toModuloResponse(modulo)
  }

  async eliminar(
    moduloId: string,
    motivo: string,
    adminUsuarioId: string,
    contexto: ContextoHttpAuditoria = {},
  ): Promise<void> {
    const actual = await this.prisma.modulo.findFirst({
      where: { id: moduloId, deletedAt: null },
      select: { id: true },
    })
    if (!actual) {
      throw new NotFoundException({
        code: apiErrorCodes.moduloNoEncontrado,
        message: "Modulo no encontrado.",
      })
    }

    const cursosActivos = await this.prisma.cursoModuloHabilitado.findMany({
      where: { moduloId, curso: { estado: EstadoCurso.ACTIVO } },
      select: { cursoId: true },
    })
    if (cursosActivos.length > 0) {
      throw new ConflictException({
        code: apiErrorCodes.conflictModuloConReferenciasActivas,
        message: "No se puede eliminar el modulo: tiene referencias en cursos activos.",
        details: { cursos: cursosActivos.map((c) => c.cursoId) },
      })
    }
    const totalSecciones = await this.prisma.seccion.count({ where: { moduloId } })
    if (totalSecciones > 0) {
      throw new ConflictException({
        code: apiErrorCodes.conflictModuloConSecciones,
        message: "No se puede eliminar el modulo: tiene secciones. Eliminar primero las secciones.",
        details: { totalSecciones },
      })
    }

    await this.prisma.modulo.update({
      where: { id: moduloId },
      data: { deletedAt: new Date() },
      select: { id: true },
    })
    await this.auditLog.record({
      usuarioId: adminUsuarioId,
      accion: AccionAuditoria.MODULO_ELIMINADO,
      exito: true,
      recursoTipo: "modulo",
      recursoId: moduloId,
      metadata: { motivo },
      ...contexto,
    })
  }
}
