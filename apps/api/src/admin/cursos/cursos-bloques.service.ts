import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common"
import {
  type ActualizarBloqueAdminInput,
  type BloqueDeleteAdminResponse,
  type BloqueDetalleAdmin,
  type BloqueListAdminResponse,
  type CrearBloqueAdminInput,
  type ReordenarBloquesAdminInput,
  type TipoBloque,
  payloadParaTipo,
} from "@nexott-learn/shared-types"
import { Prisma } from "@prisma/client"
import { PrismaService } from "../../common/prisma/prisma.service"
import {
  BLOQUE_DETALLE_SELECT,
  type BloqueDetalleRow,
  mapBloqueDetalle,
  snapshotBloque,
} from "./cursos.mapper"

const ENTIDAD_TIPO_BLOQUE = "Bloque"
const ENTIDAD_TIPO_SECCION = "Seccion"

const ERROR_CURSO_NO_ENCONTRADO = "Curso no encontrado"
const ERROR_MODULO_NO_ENCONTRADO = "Modulo no encontrado"
const ERROR_SECCION_NO_ENCONTRADA = "Seccion no encontrada"
const ERROR_BLOQUE_NO_ENCONTRADO = "Bloque no encontrado"
const ERROR_CURSO_CERRADO = "No se puede modificar un bloque en un curso CERRADO"
const ERROR_DELETE_NO_BORRADOR = "Solo se pueden eliminar bloques de cursos en estado BORRADOR"
const ERROR_DELETE_CON_ENTREGAS = "No se puede eliminar un bloque que tiene entregas"
const ERROR_PAYLOAD_INVALIDO = "El payload no cumple el shape requerido por el tipo del bloque"
const ERROR_CODIGO_FIELDS_FUERA_DE_TIPO =
  "Los campos especificos de CODIGO solo se permiten para bloques tipo CODIGO"
const ERROR_REORDENAR_IDS_INVALIDOS =
  "Uno o mas ids no pertenecen a los bloques no archivados de la seccion"
const ERROR_REORDENAR_SUBSET_INCOMPLETO =
  "La lista debe incluir todos los bloques no archivados de la seccion"
const ERROR_REORDENAR_PERMUTACION_INVALIDA =
  "Los valores de orden deben ser una permutacion estricta sin huecos ni duplicados"

type CodigoFields = Pick<
  ActualizarBloqueAdminInput,
  | "codigoUbicacion"
  | "codigoInteractivo"
  | "codigoEvaluable"
  | "codigoLenguaje"
  | "solucionReferencia"
>

@Injectable()
export class CursosBloquesService {
  constructor(private readonly prisma: PrismaService) {}

  // ──────────────────────────────────────────────────────────────────
  // LECTURA
  // ──────────────────────────────────────────────────────────────────

  async listar(
    cursoId: string,
    moduloId: string,
    seccionId: string,
  ): Promise<BloqueListAdminResponse> {
    await this.requireSeccionInclusoArchivada(cursoId, moduloId, seccionId)
    const rows = await this.prisma.bloque.findMany({
      where: { seccionId, archivadoAt: null },
      orderBy: { orden: "asc" },
      select: BLOQUE_DETALLE_SELECT,
    })
    return rows.map((r) => mapBloqueDetalle(r))
  }

  async obtenerPorId(
    cursoId: string,
    moduloId: string,
    seccionId: string,
    bloqueId: string,
  ): Promise<BloqueDetalleAdmin> {
    await this.requireSeccionInclusoArchivada(cursoId, moduloId, seccionId)
    const row = await this.prisma.bloque.findUnique({
      where: { id: bloqueId },
      select: BLOQUE_DETALLE_SELECT,
    })
    if (!row || row.seccionId !== seccionId) {
      throw new NotFoundException(ERROR_BLOQUE_NO_ENCONTRADO)
    }
    return mapBloqueDetalle(row)
  }

  // ──────────────────────────────────────────────────────────────────
  // CREAR
  // ──────────────────────────────────────────────────────────────────

  async crear(
    cursoId: string,
    moduloId: string,
    seccionId: string,
    input: CrearBloqueAdminInput,
    actorId: string,
  ): Promise<BloqueDetalleAdmin> {
    const curso = await this.requireCurso(cursoId)
    if (curso.estado === "CERRADO") {
      throw new ConflictException(ERROR_CURSO_CERRADO)
    }
    await this.requireSeccion(cursoId, moduloId, seccionId)

    const orden =
      input.orden ?? (await this.prisma.bloque.count({ where: { seccionId, archivadoAt: null } }))

    const data: Prisma.BloqueUncheckedCreateInput = {
      seccionId,
      tipo: input.tipo,
      orden,
      payload: input.payload as Prisma.InputJsonValue,
    }
    if (input.tipo === "CODIGO") {
      data.codigoUbicacion = input.codigoUbicacion
      data.codigoInteractivo = input.codigoInteractivo
      data.codigoEvaluable = input.codigoEvaluable
      data.codigoLenguaje = input.codigoLenguaje
      if (input.solucionReferencia !== undefined) {
        data.solucionReferencia = input.solucionReferencia
      }
    }

    const nuevoId = await this.prisma.$transaction(async (tx) => {
      const creado = await tx.bloque.create({ data, select: BLOQUE_DETALLE_SELECT })

      await tx.logActividad.create({
        data: {
          actorId,
          tipoAccion: "CURSO_ACTUALIZADO",
          entidadTipo: ENTIDAD_TIPO_BLOQUE,
          entidadId: creado.id,
          valorAntes: Prisma.JsonNull,
          valorDespues: snapshotBloque(creado),
        },
      })

      return creado.id
    })

    return this.obtenerPorId(cursoId, moduloId, seccionId, nuevoId)
  }

  // ──────────────────────────────────────────────────────────────────
  // PATCH
  // ──────────────────────────────────────────────────────────────────

  async actualizar(
    cursoId: string,
    moduloId: string,
    seccionId: string,
    bloqueId: string,
    input: ActualizarBloqueAdminInput,
    actorId: string,
  ): Promise<BloqueDetalleAdmin> {
    const previo = await this.requireBloque(cursoId, moduloId, seccionId, bloqueId)
    const curso = await this.requireCurso(cursoId)
    if (curso.estado === "CERRADO") {
      throw new ConflictException(ERROR_CURSO_CERRADO)
    }
    await this.requireSeccion(cursoId, moduloId, seccionId)

    if (input.payload !== undefined) {
      const result = payloadParaTipo(previo.tipo).safeParse(input.payload)
      if (!result.success) {
        throw new BadRequestException({
          message: ERROR_PAYLOAD_INVALIDO,
          errors: result.error.flatten().fieldErrors,
        })
      }
    }

    if (previo.tipo !== "CODIGO" && tieneCodigoFields(input)) {
      throw new BadRequestException(ERROR_CODIGO_FIELDS_FUERA_DE_TIPO)
    }

    await this.prisma.$transaction(async (tx) => {
      const data: Prisma.BloqueUpdateInput = {}
      if (input.payload !== undefined) {
        data.payload = input.payload as Prisma.InputJsonValue
      }
      if (input.codigoUbicacion !== undefined) {
        data.codigoUbicacion = input.codigoUbicacion
      }
      if (input.codigoInteractivo !== undefined) {
        data.codigoInteractivo = input.codigoInteractivo
      }
      if (input.codigoEvaluable !== undefined) {
        data.codigoEvaluable = input.codigoEvaluable
      }
      if (input.codigoLenguaje !== undefined) {
        data.codigoLenguaje = input.codigoLenguaje
      }
      if (input.solucionReferencia !== undefined) {
        data.solucionReferencia = input.solucionReferencia
      }

      const actualizado = await tx.bloque.update({
        where: { id: bloqueId },
        data,
        select: BLOQUE_DETALLE_SELECT,
      })

      await tx.logActividad.create({
        data: {
          actorId,
          tipoAccion: "CURSO_ACTUALIZADO",
          entidadTipo: ENTIDAD_TIPO_BLOQUE,
          entidadId: bloqueId,
          valorAntes: snapshotBloque(previo),
          valorDespues: snapshotBloque(actualizado),
        },
      })
    })

    return this.obtenerPorId(cursoId, moduloId, seccionId, bloqueId)
  }

  // ──────────────────────────────────────────────────────────────────
  // ARCHIVAR / DESARCHIVAR
  // ──────────────────────────────────────────────────────────────────

  async archivar(
    cursoId: string,
    moduloId: string,
    seccionId: string,
    bloqueId: string,
    actorId: string,
  ): Promise<BloqueDetalleAdmin> {
    const previo = await this.requireBloqueInclusoArchivado(cursoId, moduloId, seccionId, bloqueId)
    const curso = await this.requireCurso(cursoId)
    if (curso.estado === "CERRADO") {
      throw new ConflictException(ERROR_CURSO_CERRADO)
    }
    await this.requireSeccion(cursoId, moduloId, seccionId)

    if (previo.archivadoAt !== null) {
      return mapBloqueDetalle(previo)
    }

    await this.prisma.$transaction(async (tx) => {
      const now = new Date()
      const actualizado = await tx.bloque.update({
        where: { id: bloqueId },
        data: { archivadoAt: now, archivadoEstado: "ARCHIVADO" },
        select: BLOQUE_DETALLE_SELECT,
      })
      await tx.logActividad.create({
        data: {
          actorId,
          tipoAccion: "CURSO_ACTUALIZADO",
          entidadTipo: ENTIDAD_TIPO_BLOQUE,
          entidadId: bloqueId,
          valorAntes: snapshotBloque(previo),
          valorDespues: snapshotBloque(actualizado),
        },
      })
    })

    return this.obtenerPorId(cursoId, moduloId, seccionId, bloqueId)
  }

  async desarchivar(
    cursoId: string,
    moduloId: string,
    seccionId: string,
    bloqueId: string,
    actorId: string,
  ): Promise<BloqueDetalleAdmin> {
    const previo = await this.requireBloqueInclusoArchivado(cursoId, moduloId, seccionId, bloqueId)
    const curso = await this.requireCurso(cursoId)
    if (curso.estado === "CERRADO") {
      throw new ConflictException(ERROR_CURSO_CERRADO)
    }
    await this.requireSeccion(cursoId, moduloId, seccionId)

    if (previo.archivadoAt === null) {
      return mapBloqueDetalle(previo)
    }

    await this.prisma.$transaction(async (tx) => {
      const actualizado = await tx.bloque.update({
        where: { id: bloqueId },
        data: { archivadoAt: null, archivadoEstado: null },
        select: BLOQUE_DETALLE_SELECT,
      })
      await tx.logActividad.create({
        data: {
          actorId,
          tipoAccion: "CURSO_ACTUALIZADO",
          entidadTipo: ENTIDAD_TIPO_BLOQUE,
          entidadId: bloqueId,
          valorAntes: snapshotBloque(previo),
          valorDespues: snapshotBloque(actualizado),
        },
      })
    })

    return this.obtenerPorId(cursoId, moduloId, seccionId, bloqueId)
  }

  // ──────────────────────────────────────────────────────────────────
  // DELETE (hard)
  // ──────────────────────────────────────────────────────────────────

  async eliminar(
    cursoId: string,
    moduloId: string,
    seccionId: string,
    bloqueId: string,
    actorId: string,
  ): Promise<BloqueDeleteAdminResponse> {
    const previo = await this.requireBloqueInclusoArchivado(cursoId, moduloId, seccionId, bloqueId)
    const curso = await this.requireCurso(cursoId)

    if (curso.estado !== "BORRADOR") {
      throw new ConflictException(ERROR_DELETE_NO_BORRADOR)
    }
    await this.requireSeccion(cursoId, moduloId, seccionId)

    const tieneEntregas = await this.prisma.entregaBloque.count({
      where: { bloqueId },
    })
    if (tieneEntregas > 0) {
      throw new ConflictException(ERROR_DELETE_CON_ENTREGAS)
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.logActividad.create({
        data: {
          actorId,
          tipoAccion: "CURSO_ACTUALIZADO",
          entidadTipo: ENTIDAD_TIPO_BLOQUE,
          entidadId: bloqueId,
          valorAntes: snapshotBloque(previo),
          valorDespues: Prisma.JsonNull,
        },
      })
      await tx.bloque.delete({ where: { id: bloqueId } })
    })

    return { tipo: "ELIMINADO", id: bloqueId }
  }

  // ──────────────────────────────────────────────────────────────────
  // REORDENAR
  // ──────────────────────────────────────────────────────────────────

  async reordenar(
    cursoId: string,
    moduloId: string,
    seccionId: string,
    input: ReordenarBloquesAdminInput,
    actorId: string,
  ): Promise<BloqueListAdminResponse> {
    const curso = await this.requireCurso(cursoId)
    if (curso.estado === "CERRADO") {
      throw new ConflictException(ERROR_CURSO_CERRADO)
    }
    await this.requireSeccion(cursoId, moduloId, seccionId)

    const bloquesActivos = await this.prisma.bloque.findMany({
      where: { seccionId, archivadoAt: null },
      select: { id: true },
    })
    const idsActivos = new Set(bloquesActivos.map((b) => b.id))

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
          tx.bloque.update({
            where: { id: item.id },
            data: { orden: item.orden },
          }),
        ),
      )
      await tx.logActividad.create({
        data: {
          actorId,
          tipoAccion: "CURSO_ACTUALIZADO",
          entidadTipo: ENTIDAD_TIPO_SECCION,
          entidadId: seccionId,
          valorAntes: Prisma.JsonNull,
          valorDespues: {
            accion: "BLOQUES_REORDENADOS",
            items: input.items,
          } as Prisma.InputJsonValue,
        },
      })
    })

    return this.listar(cursoId, moduloId, seccionId)
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

  // Sección NO archivada — usada para mutaciones (sección archivada bloquea
  // cualquier mutación de sus bloques, paralelo a Iter 4).
  private async requireSeccion(cursoId: string, moduloId: string, seccionId: string) {
    await this.requireModulo(cursoId, moduloId)
    const seccion = await this.prisma.seccion.findUnique({
      where: { id: seccionId },
      select: { id: true, moduloId: true, archivadoAt: true },
    })
    if (!seccion || seccion.moduloId !== moduloId || seccion.archivadoAt !== null) {
      throw new NotFoundException(ERROR_SECCION_NO_ENCONTRADA)
    }
    return seccion
  }

  // Sección incluso archivada — usada para lecturas (la lectura del listado y
  // detalle de bloques se permite aunque la sección esté archivada; mutar no).
  private async requireSeccionInclusoArchivada(
    cursoId: string,
    moduloId: string,
    seccionId: string,
  ) {
    await this.requireModulo(cursoId, moduloId)
    const seccion = await this.prisma.seccion.findUnique({
      where: { id: seccionId },
      select: { id: true, moduloId: true, archivadoAt: true },
    })
    if (!seccion || seccion.moduloId !== moduloId) {
      throw new NotFoundException(ERROR_SECCION_NO_ENCONTRADA)
    }
    return seccion
  }

  private async requireBloque(
    cursoId: string,
    moduloId: string,
    seccionId: string,
    bloqueId: string,
  ): Promise<BloqueDetalleRow> {
    await this.requireSeccionInclusoArchivada(cursoId, moduloId, seccionId)
    const row = await this.prisma.bloque.findUnique({
      where: { id: bloqueId },
      select: BLOQUE_DETALLE_SELECT,
    })
    if (!row || row.seccionId !== seccionId || row.archivadoAt !== null) {
      throw new NotFoundException(ERROR_BLOQUE_NO_ENCONTRADO)
    }
    return row
  }

  private async requireBloqueInclusoArchivado(
    cursoId: string,
    moduloId: string,
    seccionId: string,
    bloqueId: string,
  ): Promise<BloqueDetalleRow> {
    await this.requireSeccionInclusoArchivada(cursoId, moduloId, seccionId)
    const row = await this.prisma.bloque.findUnique({
      where: { id: bloqueId },
      select: BLOQUE_DETALLE_SELECT,
    })
    if (!row || row.seccionId !== seccionId) {
      throw new NotFoundException(ERROR_BLOQUE_NO_ENCONTRADO)
    }
    return row
  }
}

function tieneCodigoFields(input: CodigoFields): boolean {
  return (
    input.codigoUbicacion !== undefined ||
    input.codigoInteractivo !== undefined ||
    input.codigoEvaluable !== undefined ||
    input.codigoLenguaje !== undefined ||
    input.solucionReferencia !== undefined
  )
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

// Re-export del tipo TipoBloque para que el controller lo use sin re-importar
// desde shared-types (alineamos la API publica del service).
export type { TipoBloque }
