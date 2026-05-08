import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common"
import type {
  ActualizarModuloAdminInput,
  CrearModuloAdminInput,
  ModuloDeleteAdminResponse,
  ModuloDetalleAdmin,
  ModuloListAdminResponse,
  ReordenarModulosAdminInput,
} from "@nexott-learn/shared-types"
import { Prisma } from "@prisma/client"
import { PrismaService } from "../../common/prisma/prisma.service"
import { MODULO_DETALLE_SELECT, type ModuloDetalleRow, mapModuloDetalle } from "./cursos.mapper"
import { ENTIDAD_TIPO } from "./cursos.types"

const ENTIDAD_TIPO_MODULO = "Modulo"

const ERROR_CURSO_NO_ENCONTRADO = "Curso no encontrado"
const ERROR_MODULO_NO_ENCONTRADO = "Modulo no encontrado"
const ERROR_CURSO_CERRADO = "No se puede modificar un modulo en un curso CERRADO"
const ERROR_AREA_NO_EN_CURSO = "El areaId no pertenece a las areas asignadas al curso"
const ERROR_DELETE_NO_BORRADOR = "Solo se pueden eliminar modulos de cursos en estado BORRADOR"
const ERROR_DELETE_CON_ENTREGAS = "No se puede eliminar un modulo que tiene entregas"
const ERROR_REORDENAR_IDS_INVALIDOS =
  "Uno o mas ids no pertenecen a los modulos no archivados del curso"
const ERROR_REORDENAR_SUBSET_INCOMPLETO =
  "La lista debe incluir todos los modulos no archivados del curso"
const ERROR_REORDENAR_PERMUTACION_INVALIDA =
  "Los valores de orden deben ser una permutacion estricta sin huecos ni duplicados"
const ERROR_MINI_CON_ENTREGAS =
  "No se puede desactivar el mini proyecto porque tiene entregas registradas"
const ERROR_UMBRAL_MINI_SIN_MINI =
  // biome-ignore lint/nursery/noSecrets: nombre de campo de dominio, no es un secreto
  "umbralMiniOverride solo es valido cuando miniProyectoActivo=true"

function snapshotModulo(row: {
  id: string
  cursoId: string
  areaId: string
  titulo: string
  orden: number
  miniProyectoActivo: boolean
  archivadoAt: Date | null
}): Prisma.InputJsonValue {
  return {
    id: row.id,
    cursoId: row.cursoId,
    areaId: row.areaId,
    titulo: row.titulo,
    orden: row.orden,
    miniProyectoActivo: row.miniProyectoActivo,
    archivadoAt: row.archivadoAt ? row.archivadoAt.toISOString() : null,
  }
}

@Injectable()
export class CursosModulosService {
  constructor(private readonly prisma: PrismaService) {}

  // ──────────────────────────────────────────────────────────────────
  // LECTURA
  // ──────────────────────────────────────────────────────────────────

  async listar(cursoId: string): Promise<ModuloListAdminResponse> {
    await this.requireCurso(cursoId)
    const rows = await this.prisma.modulo.findMany({
      where: { cursoId, archivadoAt: null },
      orderBy: { orden: "asc" },
      select: MODULO_DETALLE_SELECT,
    })
    return Promise.all(rows.map((r) => this.hidratarModulo(r)))
  }

  async obtenerPorId(cursoId: string, moduloId: string): Promise<ModuloDetalleAdmin> {
    const row = await this.prisma.modulo.findUnique({
      where: { id: moduloId },
      select: MODULO_DETALLE_SELECT,
    })
    if (!row || row.cursoId !== cursoId) {
      throw new NotFoundException(ERROR_MODULO_NO_ENCONTRADO)
    }
    return this.hidratarModulo(row)
  }

  // ──────────────────────────────────────────────────────────────────
  // CREAR
  // ──────────────────────────────────────────────────────────────────

  async crear(
    cursoId: string,
    input: CrearModuloAdminInput,
    actorId: string,
  ): Promise<ModuloDetalleAdmin> {
    const curso = await this.requireCurso(cursoId)
    if (curso.estado === "CERRADO") {
      throw new ConflictException(ERROR_CURSO_CERRADO)
    }
    await this.requireAreaEnCurso(cursoId, input.areaId)

    const orden =
      input.orden ?? (await this.prisma.modulo.count({ where: { cursoId, archivadoAt: null } }))

    const nuevoId = await this.prisma.$transaction(async (tx) => {
      const creado = await tx.modulo.create({
        data: {
          cursoId,
          areaId: input.areaId,
          titulo: input.titulo.trim(),
          descripcion: input.descripcion?.trim(),
          orden,
          miniProyectoActivo: input.miniProyectoActivo ?? false,
        },
        select: MODULO_DETALLE_SELECT,
      })

      if (input.miniProyectoActivo === true) {
        await tx.miniProyecto.create({
          data: { moduloId: creado.id, titulo: "", enunciado: "" },
        })
      }

      await tx.logActividad.create({
        data: {
          actorId,
          tipoAccion: "CURSO_ACTUALIZADO",
          entidadTipo: ENTIDAD_TIPO_MODULO,
          entidadId: creado.id,
          valorAntes: Prisma.JsonNull,
          valorDespues: snapshotModulo(creado),
        },
      })

      return creado.id
    })

    return this.obtenerPorId(cursoId, nuevoId)
  }

  // ──────────────────────────────────────────────────────────────────
  // PATCH
  // ──────────────────────────────────────────────────────────────────

  async actualizar(
    cursoId: string,
    moduloId: string,
    input: ActualizarModuloAdminInput,
    actorId: string,
  ): Promise<ModuloDetalleAdmin> {
    const previo = await this.requireModulo(cursoId, moduloId)
    const curso = await this.requireCurso(cursoId)
    if (curso.estado === "CERRADO") {
      throw new ConflictException(ERROR_CURSO_CERRADO)
    }

    if (input.areaId !== undefined && input.areaId !== previo.areaId) {
      await this.requireAreaEnCurso(cursoId, input.areaId)
    }

    // Coherencia: umbralMiniOverride solo aplica si el modulo termina con mini activo.
    const miniActivoFinal = input.miniProyectoActivo ?? previo.miniProyectoActivo
    if (
      input.umbralMiniOverride !== undefined &&
      input.umbralMiniOverride !== null &&
      !miniActivoFinal
    ) {
      throw new BadRequestException(ERROR_UMBRAL_MINI_SIN_MINI)
    }

    await this.prisma.$transaction(async (tx) => {
      await this.sincronizarMiniProyecto(tx, moduloId, input, previo.miniProyectoActivo)

      const data = construirDataPatchModulo(input)
      const actualizado = await tx.modulo.update({
        where: { id: moduloId },
        data,
        select: MODULO_DETALLE_SELECT,
      })

      await tx.logActividad.create({
        data: {
          actorId,
          tipoAccion: "CURSO_ACTUALIZADO",
          entidadTipo: ENTIDAD_TIPO_MODULO,
          entidadId: moduloId,
          valorAntes: snapshotModulo(previo),
          valorDespues: snapshotModulo(actualizado),
        },
      })

      // Si la actualización pudo haber desactivado el mini de este módulo,
      // verificamos el invariante MAESTRO §9.5 a nivel curso.
      if (input.miniProyectoActivo === false && previo.miniProyectoActivo) {
        await this.aplicarInvarianteMiniSiSinActivos(tx, cursoId, actorId)
      }
    })

    return this.obtenerPorId(cursoId, moduloId)
  }

  // ──────────────────────────────────────────────────────────────────
  // ARCHIVAR / DESARCHIVAR
  // ──────────────────────────────────────────────────────────────────

  async archivar(cursoId: string, moduloId: string, actorId: string): Promise<ModuloDetalleAdmin> {
    const previo = await this.requireModuloInclusoArchivado(cursoId, moduloId)
    const curso = await this.requireCurso(cursoId)
    if (curso.estado === "CERRADO") {
      throw new ConflictException(ERROR_CURSO_CERRADO)
    }

    // Idempotente: ya archivado → devolver tal cual (despues de validar curso)
    if (previo.archivadoAt !== null) {
      return this.hidratarModulo(previo)
    }

    await this.prisma.$transaction(async (tx) => {
      const now = new Date()
      const actualizado = await tx.modulo.update({
        where: { id: moduloId },
        data: { archivadoAt: now, archivadoEstado: "ARCHIVADO" },
        select: MODULO_DETALLE_SELECT,
      })
      await tx.logActividad.create({
        data: {
          actorId,
          tipoAccion: "CURSO_ACTUALIZADO",
          entidadTipo: ENTIDAD_TIPO_MODULO,
          entidadId: moduloId,
          valorAntes: snapshotModulo(previo),
          valorDespues: snapshotModulo(actualizado),
        },
      })
      // El módulo archivado deja de contar como activo. Si tenía mini activo,
      // verificamos el invariante MAESTRO §9.5 a nivel curso.
      if (previo.miniProyectoActivo) {
        await this.aplicarInvarianteMiniSiSinActivos(tx, cursoId, actorId)
      }
    })

    return this.obtenerPorId(cursoId, moduloId)
  }

  async desarchivar(
    cursoId: string,
    moduloId: string,
    actorId: string,
  ): Promise<ModuloDetalleAdmin> {
    const previo = await this.requireModuloInclusoArchivado(cursoId, moduloId)
    const curso = await this.requireCurso(cursoId)
    if (curso.estado === "CERRADO") {
      throw new ConflictException(ERROR_CURSO_CERRADO)
    }

    // Idempotente: no archivado → devolver tal cual (despues de validar curso)
    if (previo.archivadoAt === null) {
      return this.hidratarModulo(previo)
    }

    await this.prisma.$transaction(async (tx) => {
      const actualizado = await tx.modulo.update({
        where: { id: moduloId },
        data: { archivadoAt: null, archivadoEstado: null },
        select: MODULO_DETALLE_SELECT,
      })
      await tx.logActividad.create({
        data: {
          actorId,
          tipoAccion: "CURSO_ACTUALIZADO",
          entidadTipo: ENTIDAD_TIPO_MODULO,
          entidadId: moduloId,
          valorAntes: snapshotModulo(previo),
          valorDespues: snapshotModulo(actualizado),
        },
      })
    })

    return this.obtenerPorId(cursoId, moduloId)
  }

  // ──────────────────────────────────────────────────────────────────
  // DELETE (hard)
  // ──────────────────────────────────────────────────────────────────

  async eliminar(
    cursoId: string,
    moduloId: string,
    actorId: string,
  ): Promise<ModuloDeleteAdminResponse> {
    const previo = await this.requireModuloInclusoArchivado(cursoId, moduloId)
    const curso = await this.requireCurso(cursoId)

    if (curso.estado !== "BORRADOR") {
      throw new ConflictException(ERROR_DELETE_NO_BORRADOR)
    }

    const tieneEntregas = await this.contarEntregasModulo(moduloId)
    if (tieneEntregas > 0) {
      throw new ConflictException(ERROR_DELETE_CON_ENTREGAS)
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.logActividad.create({
        data: {
          actorId,
          tipoAccion: "CURSO_ACTUALIZADO",
          entidadTipo: ENTIDAD_TIPO_MODULO,
          entidadId: moduloId,
          valorAntes: snapshotModulo(previo),
          valorDespues: Prisma.JsonNull,
        },
      })
      await tx.modulo.delete({ where: { id: moduloId } })
      // El módulo borrado deja de contar como activo. Si tenía mini activo,
      // verificamos el invariante MAESTRO §9.5 a nivel curso.
      if (previo.miniProyectoActivo) {
        await this.aplicarInvarianteMiniSiSinActivos(tx, cursoId, actorId)
      }
    })

    return { tipo: "ELIMINADO", id: moduloId }
  }

  // ──────────────────────────────────────────────────────────────────
  // REORDENAR
  // ──────────────────────────────────────────────────────────────────

  async reordenar(
    cursoId: string,
    input: ReordenarModulosAdminInput,
    actorId: string,
  ): Promise<ModuloListAdminResponse> {
    const curso = await this.requireCurso(cursoId)
    if (curso.estado === "CERRADO") {
      throw new ConflictException(ERROR_CURSO_CERRADO)
    }

    const modulosActivos = await this.prisma.modulo.findMany({
      where: { cursoId, archivadoAt: null },
      select: { id: true },
    })
    const idsActivos = new Set(modulosActivos.map((m) => m.id))

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
          tx.modulo.update({
            where: { id: item.id },
            data: { orden: item.orden },
          }),
        ),
      )
      await tx.logActividad.create({
        data: {
          actorId,
          tipoAccion: "CURSO_ACTUALIZADO",
          entidadTipo: ENTIDAD_TIPO,
          entidadId: cursoId,
          valorAntes: Prisma.JsonNull,
          valorDespues: {
            accion: "MODULOS_REORDENADOS",
            items: input.items,
          } as Prisma.InputJsonValue,
        },
      })
    })

    return this.listar(cursoId)
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

  private async requireModulo(cursoId: string, moduloId: string): Promise<ModuloDetalleRow> {
    const row = await this.prisma.modulo.findUnique({
      where: { id: moduloId },
      select: MODULO_DETALLE_SELECT,
    })
    if (!row || row.cursoId !== cursoId || row.archivadoAt !== null) {
      throw new NotFoundException(ERROR_MODULO_NO_ENCONTRADO)
    }
    return row
  }

  private async requireModuloInclusoArchivado(
    cursoId: string,
    moduloId: string,
  ): Promise<ModuloDetalleRow> {
    const row = await this.prisma.modulo.findUnique({
      where: { id: moduloId },
      select: MODULO_DETALLE_SELECT,
    })
    if (!row || row.cursoId !== cursoId) {
      throw new NotFoundException(ERROR_MODULO_NO_ENCONTRADO)
    }
    return row
  }

  private async requireAreaEnCurso(cursoId: string, areaId: string): Promise<void> {
    const cursoArea = await this.prisma.cursoArea.findFirst({
      where: { cursoId, areaId },
      select: { id: true },
    })
    if (!cursoArea) {
      throw new BadRequestException(ERROR_AREA_NO_EN_CURSO)
    }
  }

  // Cuenta entregas del módulo: EntregaBloque via secciones→bloques + EntregaProyecto via miniProyecto
  private async contarEntregasModulo(moduloId: string): Promise<number> {
    const [entregasBloque, entregasProyecto] = await Promise.all([
      this.prisma.entregaBloque.count({
        where: {
          bloque: {
            seccion: { moduloId },
          },
        },
      }),
      this.prisma.entregaProyecto.count({
        where: { miniProyecto: { moduloId } },
      }),
    ])
    return entregasBloque + entregasProyecto
  }

  private async hidratarModulo(row: ModuloDetalleRow): Promise<ModuloDetalleAdmin> {
    const entregas = await this.contarEntregasModulo(row.id)
    const base = mapModuloDetalle(row)
    return { ...base, tieneEntregas: entregas > 0 }
  }

  private async sincronizarMiniProyecto(
    tx: Prisma.TransactionClient,
    moduloId: string,
    input: ActualizarModuloAdminInput,
    miniActivo: boolean,
  ): Promise<void> {
    if (input.miniProyectoActivo === undefined) {
      return
    }
    if (input.miniProyectoActivo && !miniActivo) {
      await tx.miniProyecto.create({ data: { moduloId, titulo: "", enunciado: "" } })
      return
    }
    if (!input.miniProyectoActivo && miniActivo) {
      const entregasCount = await tx.entregaProyecto.count({
        where: { miniProyecto: { moduloId } },
      })
      if (entregasCount > 0) {
        throw new ConflictException(ERROR_MINI_CON_ENTREGAS)
      }
      await tx.miniProyecto.delete({ where: { moduloId } })
    }
  }

  // MAESTRO §9.5: si ningún módulo del curso tiene Mini Proyecto activo,
  // entonces pesoActividades=100 y pesoMiniProyecto=0. Esta función mantiene
  // ese invariante: la invocamos tras cualquier operación que pueda haber
  // dejado al curso sin módulos con mini activo (desactivación, archivado,
  // hard delete). Si el curso ya cumple el invariante (ej. los pesos ya
  // estaban en 100/0) no logueamos nada para evitar ruido.
  private async aplicarInvarianteMiniSiSinActivos(
    tx: Prisma.TransactionClient,
    cursoId: string,
    actorId: string,
  ): Promise<void> {
    const cuentaActivos = await tx.modulo.count({
      where: { cursoId, archivadoAt: null, miniProyectoActivo: true },
    })
    if (cuentaActivos > 0) {
      return
    }
    const curso = await tx.curso.findUniqueOrThrow({
      where: { id: cursoId },
      select: { pesoActividades: true, pesoMiniProyecto: true },
    })
    const pesoActividadesPrevio = Number(curso.pesoActividades.toString())
    const pesoMiniPrevio = Number(curso.pesoMiniProyecto.toString())
    if (pesoActividadesPrevio === 100 && pesoMiniPrevio === 0) {
      return
    }
    await tx.curso.update({
      where: { id: cursoId },
      data: { pesoActividades: 100, pesoMiniProyecto: 0 },
    })
    await tx.logActividad.create({
      data: {
        actorId,
        tipoAccion: "CURSO_ACTUALIZADO",
        entidadTipo: ENTIDAD_TIPO,
        entidadId: cursoId,
        valorAntes: {
          pesoActividades: pesoActividadesPrevio,
          pesoMiniProyecto: pesoMiniPrevio,
        },
        valorDespues: { pesoActividades: 100, pesoMiniProyecto: 0 },
      },
    })
  }
}

function construirDataPatchModulo(input: ActualizarModuloAdminInput): Prisma.ModuloUpdateInput {
  const data: Prisma.ModuloUpdateInput = {}
  if (input.titulo !== undefined) {
    data.titulo = input.titulo.trim()
  }
  if (input.descripcion !== undefined) {
    data.descripcion = input.descripcion.trim()
  }
  if (input.areaId !== undefined) {
    data.area = { connect: { id: input.areaId } }
  }
  if (input.orden !== undefined) {
    data.orden = input.orden
  }
  if (input.miniProyectoActivo !== undefined) {
    data.miniProyectoActivo = input.miniProyectoActivo
  }
  if (input.umbralMiniOverride !== undefined) {
    data.umbralMiniOverride = input.umbralMiniOverride
  }
  return data
}

// Verifica que los `orden` enviados sean exactamente {0, 1, ..., N-1} sin
// duplicados ni huecos. Asume que el caller ya validó length === N.
function validarPermutacionOrden(items: ReadonlyArray<{ orden: number }>): void {
  const ordenes = new Set<number>()
  for (const item of items) {
    if (item.orden < 0 || item.orden >= items.length || ordenes.has(item.orden)) {
      throw new BadRequestException(ERROR_REORDENAR_PERMUTACION_INVALIDA)
    }
    ordenes.add(item.orden)
  }
}
