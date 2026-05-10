import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common"
import type {
  ActualizarSeccionAdminInput,
  CrearSeccionAdminInput,
  ReordenarSeccionesAdminInput,
  SeccionDeleteAdminResponse,
  SeccionDetalleAdmin,
  SeccionListAdminResponse,
} from "@nexott-learn/shared-types"
import { Prisma } from "@prisma/client"
import { PrismaService } from "../../common/prisma/prisma.service"
import {
  SECCION_DETALLE_SELECT,
  type SeccionDetalleRow,
  mapSeccionDetalle,
  snapshotSeccion,
} from "./cursos.mapper"

const ENTIDAD_TIPO_SECCION = "Seccion"
const ENTIDAD_TIPO_MODULO = "Modulo"

const ERROR_CURSO_NO_ENCONTRADO = "Curso no encontrado"
const ERROR_MODULO_NO_ENCONTRADO = "Modulo no encontrado"
const ERROR_SECCION_NO_ENCONTRADA = "Seccion no encontrada"
const ERROR_CURSO_CERRADO = "No se puede modificar una seccion en un curso CERRADO"
const ERROR_DELETE_NO_BORRADOR = "Solo se pueden eliminar secciones de cursos en estado BORRADOR"
const ERROR_DELETE_CON_ENTREGAS = "No se puede eliminar una seccion que tiene entregas"
const ERROR_REORDENAR_IDS_INVALIDOS =
  "Uno o mas ids no pertenecen a las secciones no archivadas del modulo"
const ERROR_REORDENAR_SUBSET_INCOMPLETO =
  "La lista debe incluir todas las secciones no archivadas del modulo"
const ERROR_REORDENAR_PERMUTACION_INVALIDA =
  "Los valores de orden deben ser una permutacion estricta sin huecos ni duplicados"

@Injectable()
export class CursosSeccionesService {
  constructor(private readonly prisma: PrismaService) {}

  // ──────────────────────────────────────────────────────────────────
  // LECTURA
  // ──────────────────────────────────────────────────────────────────

  async listar(cursoId: string, moduloId: string): Promise<SeccionListAdminResponse> {
    await this.requireModulo(cursoId, moduloId)
    const rows = await this.prisma.seccion.findMany({
      where: { moduloId, archivadoAt: null },
      orderBy: { orden: "asc" },
      select: SECCION_DETALLE_SELECT,
    })
    return Promise.all(rows.map((r) => this.hidratarSeccion(r)))
  }

  async obtenerPorId(
    cursoId: string,
    moduloId: string,
    seccionId: string,
  ): Promise<SeccionDetalleAdmin> {
    await this.requireModulo(cursoId, moduloId)
    const row = await this.prisma.seccion.findUnique({
      where: { id: seccionId },
      select: SECCION_DETALLE_SELECT,
    })
    if (!row || row.moduloId !== moduloId) {
      throw new NotFoundException(ERROR_SECCION_NO_ENCONTRADA)
    }
    return this.hidratarSeccion(row)
  }

  // ──────────────────────────────────────────────────────────────────
  // CREAR
  // ──────────────────────────────────────────────────────────────────

  async crear(
    cursoId: string,
    moduloId: string,
    input: CrearSeccionAdminInput,
    actorId: string,
  ): Promise<SeccionDetalleAdmin> {
    const curso = await this.requireCurso(cursoId)
    if (curso.estado === "CERRADO") {
      throw new ConflictException(ERROR_CURSO_CERRADO)
    }
    await this.requireModulo(cursoId, moduloId)

    const orden =
      input.orden ?? (await this.prisma.seccion.count({ where: { moduloId, archivadoAt: null } }))

    const nuevoId = await this.prisma.$transaction(async (tx) => {
      const creada = await tx.seccion.create({
        data: {
          moduloId,
          titulo: input.titulo.trim(),
          orden,
        },
        select: SECCION_DETALLE_SELECT,
      })

      await tx.logActividad.create({
        data: {
          actorId,
          tipoAccion: "CURSO_ACTUALIZADO",
          entidadTipo: ENTIDAD_TIPO_SECCION,
          entidadId: creada.id,
          valorAntes: Prisma.JsonNull,
          valorDespues: snapshotSeccion(creada),
        },
      })

      return creada.id
    })

    return this.obtenerPorId(cursoId, moduloId, nuevoId)
  }

  // ──────────────────────────────────────────────────────────────────
  // PATCH
  // ──────────────────────────────────────────────────────────────────

  async actualizar(
    cursoId: string,
    moduloId: string,
    seccionId: string,
    input: ActualizarSeccionAdminInput,
    actorId: string,
  ): Promise<SeccionDetalleAdmin> {
    const previo = await this.requireSeccion(moduloId, seccionId)
    const curso = await this.requireCurso(cursoId)
    if (curso.estado === "CERRADO") {
      throw new ConflictException(ERROR_CURSO_CERRADO)
    }
    await this.requireModulo(cursoId, moduloId)

    await this.prisma.$transaction(async (tx) => {
      const data: Prisma.SeccionUpdateInput = {}
      if (input.titulo !== undefined) {
        data.titulo = input.titulo.trim()
      }
      if (input.orden !== undefined) {
        data.orden = input.orden
      }

      const actualizada = await tx.seccion.update({
        where: { id: seccionId },
        data,
        select: SECCION_DETALLE_SELECT,
      })

      await tx.logActividad.create({
        data: {
          actorId,
          tipoAccion: "CURSO_ACTUALIZADO",
          entidadTipo: ENTIDAD_TIPO_SECCION,
          entidadId: seccionId,
          valorAntes: snapshotSeccion(previo),
          valorDespues: snapshotSeccion(actualizada),
        },
      })
    })

    return this.obtenerPorId(cursoId, moduloId, seccionId)
  }

  // ──────────────────────────────────────────────────────────────────
  // ARCHIVAR / DESARCHIVAR
  // ──────────────────────────────────────────────────────────────────

  async archivar(
    cursoId: string,
    moduloId: string,
    seccionId: string,
    actorId: string,
  ): Promise<SeccionDetalleAdmin> {
    const previo = await this.requireSeccionInclusoArchivada(moduloId, seccionId)
    const curso = await this.requireCurso(cursoId)
    if (curso.estado === "CERRADO") {
      throw new ConflictException(ERROR_CURSO_CERRADO)
    }
    await this.requireModulo(cursoId, moduloId)

    if (previo.archivadoAt !== null) {
      return this.hidratarSeccion(previo)
    }

    await this.prisma.$transaction(async (tx) => {
      const now = new Date()
      const actualizada = await tx.seccion.update({
        where: { id: seccionId },
        data: { archivadoAt: now, archivadoEstado: "ARCHIVADO" },
        select: SECCION_DETALLE_SELECT,
      })
      await tx.logActividad.create({
        data: {
          actorId,
          tipoAccion: "CURSO_ACTUALIZADO",
          entidadTipo: ENTIDAD_TIPO_SECCION,
          entidadId: seccionId,
          valorAntes: snapshotSeccion(previo),
          valorDespues: snapshotSeccion(actualizada),
        },
      })
    })

    return this.obtenerPorId(cursoId, moduloId, seccionId)
  }

  async desarchivar(
    cursoId: string,
    moduloId: string,
    seccionId: string,
    actorId: string,
  ): Promise<SeccionDetalleAdmin> {
    const previo = await this.requireSeccionInclusoArchivada(moduloId, seccionId)
    const curso = await this.requireCurso(cursoId)
    if (curso.estado === "CERRADO") {
      throw new ConflictException(ERROR_CURSO_CERRADO)
    }
    await this.requireModulo(cursoId, moduloId)

    if (previo.archivadoAt === null) {
      return this.hidratarSeccion(previo)
    }

    await this.prisma.$transaction(async (tx) => {
      const actualizada = await tx.seccion.update({
        where: { id: seccionId },
        data: { archivadoAt: null, archivadoEstado: null },
        select: SECCION_DETALLE_SELECT,
      })
      await tx.logActividad.create({
        data: {
          actorId,
          tipoAccion: "CURSO_ACTUALIZADO",
          entidadTipo: ENTIDAD_TIPO_SECCION,
          entidadId: seccionId,
          valorAntes: snapshotSeccion(previo),
          valorDespues: snapshotSeccion(actualizada),
        },
      })
    })

    return this.obtenerPorId(cursoId, moduloId, seccionId)
  }

  // ──────────────────────────────────────────────────────────────────
  // DELETE (hard)
  // ──────────────────────────────────────────────────────────────────

  async eliminar(
    cursoId: string,
    moduloId: string,
    seccionId: string,
    actorId: string,
  ): Promise<SeccionDeleteAdminResponse> {
    const previo = await this.requireSeccionInclusoArchivada(moduloId, seccionId)
    const curso = await this.requireCurso(cursoId)

    if (curso.estado !== "BORRADOR") {
      throw new ConflictException(ERROR_DELETE_NO_BORRADOR)
    }
    await this.requireModulo(cursoId, moduloId)

    const tieneEntregas = await this.prisma.entregaBloque.count({
      where: { bloque: { seccionId } },
    })
    if (tieneEntregas > 0) {
      throw new ConflictException(ERROR_DELETE_CON_ENTREGAS)
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.logActividad.create({
        data: {
          actorId,
          tipoAccion: "CURSO_ACTUALIZADO",
          entidadTipo: ENTIDAD_TIPO_SECCION,
          entidadId: seccionId,
          valorAntes: snapshotSeccion(previo),
          valorDespues: Prisma.JsonNull,
        },
      })
      await tx.seccion.delete({ where: { id: seccionId } })
    })

    return { tipo: "ELIMINADO", id: seccionId }
  }

  // ──────────────────────────────────────────────────────────────────
  // REORDENAR
  // ──────────────────────────────────────────────────────────────────

  async reordenar(
    cursoId: string,
    moduloId: string,
    input: ReordenarSeccionesAdminInput,
    actorId: string,
  ): Promise<SeccionListAdminResponse> {
    const curso = await this.requireCurso(cursoId)
    if (curso.estado === "CERRADO") {
      throw new ConflictException(ERROR_CURSO_CERRADO)
    }
    await this.requireModulo(cursoId, moduloId)

    const seccionesActivas = await this.prisma.seccion.findMany({
      where: { moduloId, archivadoAt: null },
      select: { id: true },
    })
    const idsActivos = new Set(seccionesActivas.map((s) => s.id))

    if (input.items.length !== idsActivos.size) {
      throw new BadRequestException(ERROR_REORDENAR_SUBSET_INCOMPLETO)
    }

    for (const item of input.items) {
      if (!idsActivos.has(item.id)) {
        throw new BadRequestException(ERROR_REORDENAR_IDS_INVALIDOS)
      }
    }

    validarPermutacionOrden(input.items)

    await this.prisma.$transaction(async (tx) => {
      await Promise.all(
        input.items.map((item) =>
          tx.seccion.update({
            where: { id: item.id },
            data: { orden: item.orden },
          }),
        ),
      )
      await tx.logActividad.create({
        data: {
          actorId,
          tipoAccion: "CURSO_ACTUALIZADO",
          entidadTipo: ENTIDAD_TIPO_MODULO,
          entidadId: moduloId,
          valorAntes: Prisma.JsonNull,
          valorDespues: {
            accion: "SECCIONES_REORDENADAS",
            items: input.items,
          } as Prisma.InputJsonValue,
        },
      })
    })

    return this.listar(cursoId, moduloId)
  }

  // ──────────────────────────────────────────────────────────────────
  // Helpers privados
  // ──────────────────────────────────────────────────────────────────

  private async requireCurso(cursoId: string) {
    const curso = await this.prisma.curso.findUnique({
      where: { id: cursoId },
      select: { id: true, estado: true },
    })
    if (!curso) {
      throw new NotFoundException(ERROR_CURSO_NO_ENCONTRADO)
    }
    return curso
  }

  private async requireModulo(cursoId: string, moduloId: string) {
    const modulo = await this.prisma.modulo.findUnique({
      where: { id: moduloId },
      select: { id: true, cursoId: true, archivadoAt: true },
    })
    if (!modulo || modulo.cursoId !== cursoId || modulo.archivadoAt !== null) {
      throw new NotFoundException(ERROR_MODULO_NO_ENCONTRADO)
    }
    return modulo
  }

  private async requireSeccion(moduloId: string, seccionId: string): Promise<SeccionDetalleRow> {
    const row = await this.prisma.seccion.findUnique({
      where: { id: seccionId },
      select: SECCION_DETALLE_SELECT,
    })
    if (!row || row.moduloId !== moduloId || row.archivadoAt !== null) {
      throw new NotFoundException(ERROR_SECCION_NO_ENCONTRADA)
    }
    return row
  }

  private async requireSeccionInclusoArchivada(
    moduloId: string,
    seccionId: string,
  ): Promise<SeccionDetalleRow> {
    const row = await this.prisma.seccion.findUnique({
      where: { id: seccionId },
      select: SECCION_DETALLE_SELECT,
    })
    if (!row || row.moduloId !== moduloId) {
      throw new NotFoundException(ERROR_SECCION_NO_ENCONTRADA)
    }
    return row
  }

  private async hidratarSeccion(row: SeccionDetalleRow): Promise<SeccionDetalleAdmin> {
    const entregas = await this.prisma.entregaBloque.count({
      where: { bloque: { seccionId: row.id } },
    })
    const base = mapSeccionDetalle(row)
    return { ...base, tieneEntregas: entregas > 0 }
  }
}

function validarPermutacionOrden(items: ReadonlyArray<{ orden: number }>): void {
  const ordenes = new Set<number>()
  for (const item of items) {
    if (item.orden < 0 || item.orden >= items.length || ordenes.has(item.orden)) {
      throw new BadRequestException(ERROR_REORDENAR_PERMUTACION_INVALIDA)
    }
    ordenes.add(item.orden)
  }
}
