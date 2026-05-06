import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common"
import type {
  ActualizarCursoAreaInput,
  ActualizarCursoAreasInput,
  ActualizarCursoInput,
  AgregarCursoAreaInput,
  CrearCursoInput,
  CursoAreaIndividualDetalle,
  CursoAreaMutacionResponse,
  CursoDeleteResponse,
  CursoDetalle,
  CursoListResponse,
  ListarCursosQuery,
  PublicarResponse,
  ReemplazarCursoAreaInput,
  TransicionEstadoCursoInput,
} from "@nexott-learn/shared-types"
import { Prisma } from "@prisma/client"
import { PrismaService } from "../../common/prisma/prisma.service"
import { type CursoParaChecklist, evaluarChecklistPublicacion } from "./cursos.checklist"
import {
  CURSO_AREA_DETALLE_SELECT,
  CURSO_DETALLE_SELECT,
  CURSO_LIST_SELECT,
  type CursoAreaDetalleRow,
  type CursoDetalleRow,
  type ModuloConBloques,
  type ModulosPorAreaCount,
  mapCursoAreaIndividualDetalle,
  mapCursoDetalle,
  mapCursoListItem,
  snapshotAreas,
  snapshotCurso,
} from "./cursos.mapper"
import { construirSlugBase, esSlugValido, resolverSlugUnico } from "./cursos.slug"
import {
  ENTIDAD_TIPO,
  ERROR_AREAS_SOLO_BORRADOR,
  ERROR_AREA_DUPLICADA_EN_CURSO,
  ERROR_AREA_NO_ENCONTRADA,
  ERROR_AREA_NUEVA_YA_EN_CURSO,
  ERROR_AREA_OBSOLETA,
  ERROR_AREA_TIENE_MODULOS,
  ERROR_CERRAR_NO_ACTIVO,
  ERROR_CURSO_AREA_NO_ENCONTRADA,
  ERROR_CURSO_NO_ENCONTRADO,
  ERROR_DESPUBLICAR_NO_ACTIVO,
  ERROR_DUPLICAR_ORIGEN_NO_ENCONTRADO,
  ERROR_ELIMINAR_CON_INSCRIPCIONES,
  ERROR_ELIMINAR_NO_BORRADOR,
  ERROR_PUBLICAR_DESDE_CERRADO,
  ERROR_SLUG_DUPLICADO,
} from "./cursos.types"

// MAESTRO §5, §6 · CRUD admin del curso (schema v2).
//
// Notas de implementacion que conviene recordar al releer:
// - El estado se cambia SOLO via endpoints dedicados (publicar/despublicar/
//   cerrar). PATCH /:id rechaza la clave `estado` (zod `.strict()` en el DTO).
// - Pesos a nivel curso e intra-modulo son los del modelo Curso (escalares
//   Decimal). En esta iteracion NO se enforce con Postgres la suma=100; el
//   checklist de publicacion la valida antes de pasar a ACTIVO.
// - LogActividad: cada mutacion (crear, duplicar, actualizar, actualizarAreas,
//   publicar, despublicar, cerrar, eliminar) emite UN log dentro de la
//   transaccion (T02·I3). Cambios de pesos en ACTIVO emiten ademas un log
//   CURSO_PESOS_RECALCULO_PENDIENTE para que el job de recalculo sepa que
//   tiene que pasar (no se recalcula aqui — solo se senaliza).

@Injectable()
export class CursosService {
  constructor(private readonly prisma: PrismaService) {}

  // ──────────────────────────────────────────────────────────────────
  // LECTURA
  // ──────────────────────────────────────────────────────────────────

  async listar(query: ListarCursosQuery): Promise<CursoListResponse> {
    const { q, estado = "all", page, pageSize } = query
    const where: Prisma.CursoWhereInput = {}
    if (estado !== "all") {
      where.estado = estado
    }
    if (q) {
      where.OR = [
        { titulo: { contains: q, mode: "insensitive" } },
        { empresaCliente: { contains: q, mode: "insensitive" } },
      ]
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.curso.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: CURSO_LIST_SELECT,
      }),
      this.prisma.curso.count({ where }),
    ])

    return {
      items: items.map(mapCursoListItem),
      total,
      page,
      pageSize,
    }
  }

  async obtenerPorId(id: string): Promise<CursoDetalle> {
    const curso = await this.prisma.curso.findUnique({
      where: { id },
      select: CURSO_DETALLE_SELECT,
    })
    if (!curso) {
      throw new NotFoundException(ERROR_CURSO_NO_ENCONTRADO)
    }
    const modulosPorArea = await this.contarModulosPorArea(id)
    return mapCursoDetalle(curso, modulosPorArea)
  }

  // ──────────────────────────────────────────────────────────────────
  // CREAR (con o sin duplicar)
  // ──────────────────────────────────────────────────────────────────

  async crear(input: CrearCursoInput, actorId: string): Promise<CursoDetalle> {
    const empresaCliente = input.empresaCliente.trim()
    const tituloRaw = input.titulo.trim()

    if (input.duplicarDeId) {
      return this.duplicar(input.duplicarDeId, empresaCliente, tituloRaw, actorId)
    }

    const slug = await this.generarSlugUnico(tituloRaw, empresaCliente)
    const cursoIdNuevo = await this.prisma.$transaction(async (tx) => {
      const creado = await tx.curso.create({
        data: {
          empresaCliente,
          titulo: tituloRaw,
          slug,
          // estado, pesos y umbrales toman default del schema (BORRADOR,
          // 70/20/10, 70/30, 50/70/90, brecha 10).
        },
        select: CURSO_DETALLE_SELECT,
      })
      await tx.logActividad.create({
        data: {
          actorId,
          tipoAccion: "CURSO_CREADO",
          entidadTipo: ENTIDAD_TIPO,
          entidadId: creado.id,
          valorAntes: Prisma.JsonNull,
          valorDespues: snapshotCurso(creado),
        },
      })
      return creado.id
    })

    return this.obtenerPorId(cursoIdNuevo)
  }

  private async duplicar(
    origenId: string,
    empresaCliente: string,
    tituloDestinoBase: string,
    actorId: string,
  ): Promise<CursoDetalle> {
    const origen = await this.prisma.curso.findUnique({
      where: { id: origenId },
      select: {
        ...CURSO_DETALLE_SELECT,
        modulos: {
          where: { archivadoAt: null },
          orderBy: { orden: "asc" },
          select: {
            id: true,
            areaId: true,
            titulo: true,
            descripcion: true,
            orden: true,
            miniProyectoActivo: true,
            umbralMiniOverride: true,
            secciones: {
              where: { archivadoAt: null },
              orderBy: { orden: "asc" },
              select: {
                id: true,
                titulo: true,
                orden: true,
                bloques: {
                  where: { archivadoAt: null },
                  orderBy: { orden: "asc" },
                  select: {
                    id: true,
                    tipo: true,
                    orden: true,
                    codigoUbicacion: true,
                    codigoInteractivo: true,
                    codigoEvaluable: true,
                    codigoLenguaje: true,
                    payload: true,
                    solucionReferencia: true,
                  },
                },
              },
            },
            miniProyecto: {
              select: {
                titulo: true,
                enunciado: true,
                pesoCapa1: true,
                pesoCapa2: true,
                pesoCapa3: true,
              },
            },
          },
        },
      },
    })
    if (!origen) {
      throw new NotFoundException(ERROR_DUPLICAR_ORIGEN_NO_ENCONTRADO)
    }

    // Titulo destino = `${titulo} (copia)`. Si el caller ya envio uno explicito
    // distinto, lo respetamos y NO sufijamos.
    const titulo =
      tituloDestinoBase === origen.titulo ? `${origen.titulo} (copia)` : tituloDestinoBase
    const slug = await this.generarSlugUnico(titulo, empresaCliente)

    const cursoIdNuevo = await this.prisma.$transaction(async (tx) => {
      const cursoNuevo = await tx.curso.create({
        data: {
          empresaCliente,
          titulo,
          slug,
          descripcion: origen.descripcion,
          imagenUrl: origen.imagenUrl,
          duracionEstimada: origen.duracionEstimada,
          pesoAreas: origen.pesoAreas,
          pesoProyectoTransversal: origen.pesoProyectoTransversal,
          pesoEntrevistaIA: origen.pesoEntrevistaIA,
          pesoActividades: origen.pesoActividades,
          pesoMiniProyecto: origen.pesoMiniProyecto,
          umbralExcelencia: origen.umbralExcelencia,
          umbralAprobado: origen.umbralAprobado,
          umbralEnDesarrollo: origen.umbralEnDesarrollo,
          umbralBrechaNoCumple: origen.umbralBrechaNoCumple,
          duplicadoDeId: origen.id,
          // estado: BORRADOR default.
        },
        select: CURSO_DETALLE_SELECT,
      })

      // CursoArea: copiar pesos y puntajeObjetivo.
      for (const ca of origen.cursoAreas) {
        await tx.cursoArea.create({
          data: {
            cursoId: cursoNuevo.id,
            areaId: ca.areaId,
            peso: ca.peso,
            puntajeObjetivo: ca.puntajeObjetivo,
            orden: ca.orden,
          },
        })
      }

      // Modulos + secciones + bloques + miniProyecto.
      for (const mod of origen.modulos) {
        const moduloNuevo = await tx.modulo.create({
          data: {
            cursoId: cursoNuevo.id,
            areaId: mod.areaId,
            titulo: mod.titulo,
            descripcion: mod.descripcion,
            orden: mod.orden,
            miniProyectoActivo: mod.miniProyectoActivo,
            umbralMiniOverride: mod.umbralMiniOverride,
            clonadoDeId: mod.id,
          },
          select: { id: true },
        })

        for (const sec of mod.secciones) {
          const seccionNueva = await tx.seccion.create({
            data: {
              moduloId: moduloNuevo.id,
              titulo: sec.titulo,
              orden: sec.orden,
            },
            select: { id: true },
          })

          for (const bloque of sec.bloques) {
            await tx.bloque.create({
              data: {
                seccionId: seccionNueva.id,
                tipo: bloque.tipo,
                orden: bloque.orden,
                codigoUbicacion: bloque.codigoUbicacion,
                codigoInteractivo: bloque.codigoInteractivo,
                codigoEvaluable: bloque.codigoEvaluable,
                codigoLenguaje: bloque.codigoLenguaje,
                payload: bloque.payload as Prisma.InputJsonValue,
                solucionReferencia: bloque.solucionReferencia,
              },
            })
          }
        }

        if (mod.miniProyecto) {
          await tx.miniProyecto.create({
            data: {
              moduloId: moduloNuevo.id,
              titulo: mod.miniProyecto.titulo,
              enunciado: mod.miniProyecto.enunciado,
              pesoCapa1: mod.miniProyecto.pesoCapa1,
              pesoCapa2: mod.miniProyecto.pesoCapa2,
              pesoCapa3: mod.miniProyecto.pesoCapa3,
            },
          })
        }
      }

      // Log de duplicacion: el "antes" es null (curso nuevo) y el "despues"
      // incluye el snapshot + el origen para trazabilidad cruzada.
      await tx.logActividad.create({
        data: {
          actorId,
          tipoAccion: "CURSO_DUPLICADO",
          entidadTipo: ENTIDAD_TIPO,
          entidadId: cursoNuevo.id,
          valorAntes: Prisma.JsonNull,
          valorDespues: {
            ...(snapshotCurso(cursoNuevo) as object),
            duplicadoDeId: origen.id,
          } as Prisma.InputJsonValue,
        },
      })

      return cursoNuevo.id
    })

    return this.obtenerPorId(cursoIdNuevo)
  }

  // ──────────────────────────────────────────────────────────────────
  // PATCH (datos generales + pesos + umbrales + flag inscripcion libre)
  // ──────────────────────────────────────────────────────────────────

  async actualizar(
    id: string,
    input: ActualizarCursoInput,
    actorId: string,
  ): Promise<CursoDetalle> {
    const previo = await this.prisma.curso.findUnique({
      where: { id },
      select: CURSO_DETALLE_SELECT,
    })
    if (!previo) {
      throw new NotFoundException(ERROR_CURSO_NO_ENCONTRADO)
    }
    if (previo.estado === "CERRADO") {
      throw new ConflictException("No se puede modificar un curso CERRADO")
    }

    const data = construirDataPatch(input)
    await this.resolverSlugEnPatch(id, input, previo.slug, data)
    validarUmbralesOrden(input, previo)

    const huboCambios = Object.keys(data).length > 0
    if (!huboCambios) {
      // PATCH vacio o solo con slug igual al actual: nada que persistir, nada
      // que loguear. Devolvemos el detalle tal cual (operacion idempotente).
      return this.obtenerPorId(id)
    }

    const pesosCambiaronEnActivo = previo.estado === "ACTIVO" && hayCambioDePesos(input)

    await this.prisma.$transaction(async (tx) => {
      const actualizado = await tx.curso.update({
        where: { id },
        data,
        select: CURSO_DETALLE_SELECT,
      })
      await tx.logActividad.create({
        data: {
          actorId,
          tipoAccion: "CURSO_ACTUALIZADO",
          entidadTipo: ENTIDAD_TIPO,
          entidadId: id,
          valorAntes: snapshotCurso(previo),
          valorDespues: snapshotCurso(actualizado),
        },
      })
      if (pesosCambiaronEnActivo) {
        // MAESTRO §17.3: cambios de pesos en ACTIVO requieren recalculo
        // retroactivo. Aqui NO recalculamos — solo emitimos un log marcador
        // para que el job de recalculo (siguiente iteracion) lo procese.
        await tx.logActividad.create({
          data: {
            actorId,
            tipoAccion: "CURSO_PESOS_RECALCULO_PENDIENTE",
            entidadTipo: ENTIDAD_TIPO,
            entidadId: id,
            valorAntes: snapshotCurso(previo),
            valorDespues: snapshotCurso(actualizado),
          },
        })
      }
    })

    return this.obtenerPorId(id)
  }

  // ──────────────────────────────────────────────────────────────────
  // PUT areas
  // ──────────────────────────────────────────────────────────────────

  async actualizarAreas(
    id: string,
    input: ActualizarCursoAreasInput,
    actorId: string,
  ): Promise<CursoDetalle> {
    const previo = await this.prisma.curso.findUnique({
      where: { id },
      select: CURSO_DETALLE_SELECT,
    })
    if (!previo) {
      throw new NotFoundException(ERROR_CURSO_NO_ENCONTRADO)
    }
    if (previo.estado !== "BORRADOR") {
      throw new ConflictException(ERROR_AREAS_SOLO_BORRADOR)
    }

    // Verificar que cada areaId existe Y este en estado ACTIVA. T01·Q1.2: una
    // area OBSOLETA no se puede asignar en cursos nuevos. Hacemos UN solo
    // findMany trayendo `estado` para discriminar 400-noExiste vs
    // 400-obsoleta, ambos con mensaje claro (no dejamos que el FK explote en
    // 500).
    const areasIds = input.areas.map((a) => a.areaId)
    const existentes = await this.prisma.area.findMany({
      where: { id: { in: areasIds } },
      select: { id: true, estado: true },
    })
    if (existentes.length !== areasIds.length) {
      throw new BadRequestException(ERROR_AREA_NO_ENCONTRADA)
    }
    const obsoletas = existentes.filter((a) => a.estado !== "ACTIVA")
    if (obsoletas.length > 0) {
      throw new BadRequestException(
        `${ERROR_AREA_OBSOLETA}: ${obsoletas.map((a) => a.id).join(", ")}`,
      )
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.cursoArea.deleteMany({ where: { cursoId: id } })
      for (const a of input.areas) {
        await tx.cursoArea.create({
          data: {
            cursoId: id,
            areaId: a.areaId,
            peso: a.peso,
            puntajeObjetivo: a.puntajeObjetivo,
            orden: a.orden,
          },
        })
      }
      // Releer el curso con las nuevas areas para snapshot "despues".
      const actualizado = await tx.curso.findUnique({
        where: { id },
        select: CURSO_DETALLE_SELECT,
      })
      if (!actualizado) {
        // Practicamente imposible (el curso existe arriba) pero el tipo lo exige.
        throw new NotFoundException(ERROR_CURSO_NO_ENCONTRADO)
      }
      await tx.logActividad.create({
        data: {
          actorId,
          tipoAccion: "CURSO_AREAS_ACTUALIZADAS",
          entidadTipo: ENTIDAD_TIPO,
          entidadId: id,
          valorAntes: snapshotAreas(previo),
          valorDespues: snapshotAreas(actualizado),
        },
      })
    })

    return this.obtenerPorId(id)
  }

  // ──────────────────────────────────────────────────────────────────
  // PUBLICAR · BORRADOR → ACTIVO
  // ──────────────────────────────────────────────────────────────────

  async publicar(id: string, actorId: string): Promise<PublicarResponse> {
    const curso = await this.cargarCursoParaPublicar(id)
    if (curso.estado === "CERRADO") {
      throw new ConflictException(ERROR_PUBLICAR_DESDE_CERRADO)
    }

    // Idempotencia: ya ACTIVO → devolver caso B con la fecha original.
    if (curso.estado === "ACTIVO") {
      const checklist = evaluarChecklistPublicacion(toChecklistInput(curso))
      const detalle = await this.obtenerPorId(id)
      return {
        caso: "B_OK",
        curso: detalle,
        resumen: checklist.resumen,
      }
    }

    const checklist = evaluarChecklistPublicacion(toChecklistInput(curso))
    if (!checklist.todoCumplido) {
      return {
        caso: "A_FALTANTES",
        faltantes: checklist.faltantes,
        cumplidos: checklist.cumplidos,
        opcionales: checklist.opcionales,
      }
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.curso.update({
        where: { id },
        data: { estado: "ACTIVO", publicadoAt: new Date() },
        select: { id: true },
      })
      await tx.logActividad.create({
        data: {
          actorId,
          tipoAccion: "CURSO_PUBLICADO",
          entidadTipo: ENTIDAD_TIPO,
          entidadId: id,
          valorAntes: snapshotCurso(curso.row),
          valorDespues: snapshotCurso({
            ...curso.row,
            estado: "ACTIVO",
            publicadoAt: new Date(),
          }),
        },
      })
    })

    const detalle = await this.obtenerPorId(id)
    return { caso: "B_OK", curso: detalle, resumen: checklist.resumen }
  }

  // ──────────────────────────────────────────────────────────────────
  // DESPUBLICAR · ACTIVO → BORRADOR
  // ──────────────────────────────────────────────────────────────────

  async despublicar(
    id: string,
    input: TransicionEstadoCursoInput,
    actorId: string,
  ): Promise<CursoDetalle> {
    const previo = await this.prisma.curso.findUnique({
      where: { id },
      select: CURSO_DETALLE_SELECT,
    })
    if (!previo) {
      throw new NotFoundException(ERROR_CURSO_NO_ENCONTRADO)
    }
    if (previo.estado !== "ACTIVO") {
      throw new ConflictException(ERROR_DESPUBLICAR_NO_ACTIVO)
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.curso.update({
        where: { id },
        data: { estado: "BORRADOR" },
        select: { id: true },
      })
      await tx.logActividad.create({
        data: {
          actorId,
          tipoAccion: "CURSO_DESPUBLICADO",
          entidadTipo: ENTIDAD_TIPO,
          entidadId: id,
          valorAntes: snapshotCurso(previo),
          valorDespues: snapshotCurso({ ...previo, estado: "BORRADOR" }),
          motivo: input.motivo,
        },
      })
    })

    return this.obtenerPorId(id)
  }

  // ──────────────────────────────────────────────────────────────────
  // CERRAR · ACTIVO → CERRADO
  // ──────────────────────────────────────────────────────────────────

  async cerrar(
    id: string,
    input: TransicionEstadoCursoInput,
    actorId: string,
  ): Promise<CursoDetalle> {
    const previo = await this.prisma.curso.findUnique({
      where: { id },
      select: CURSO_DETALLE_SELECT,
    })
    if (!previo) {
      throw new NotFoundException(ERROR_CURSO_NO_ENCONTRADO)
    }
    if (previo.estado !== "ACTIVO") {
      throw new ConflictException(ERROR_CERRAR_NO_ACTIVO)
    }

    const cerradoAt = new Date()

    await this.prisma.$transaction(async (tx) => {
      await tx.curso.update({
        where: { id },
        data: { estado: "CERRADO", cerradoAt },
        select: { id: true },
      })
      await tx.logActividad.create({
        data: {
          actorId,
          tipoAccion: "CURSO_CERRADO",
          entidadTipo: ENTIDAD_TIPO,
          entidadId: id,
          valorAntes: snapshotCurso(previo),
          valorDespues: snapshotCurso({ ...previo, estado: "CERRADO", cerradoAt }),
          motivo: input.motivo,
        },
      })
    })

    return this.obtenerPorId(id)
  }

  // ──────────────────────────────────────────────────────────────────
  // ELIMINAR (hard delete, solo BORRADOR sin inscripciones)
  // ──────────────────────────────────────────────────────────────────

  async eliminar(id: string, actorId: string): Promise<CursoDeleteResponse> {
    const previo = await this.prisma.curso.findUnique({
      where: { id },
      select: CURSO_DETALLE_SELECT,
    })
    if (!previo) {
      throw new NotFoundException(ERROR_CURSO_NO_ENCONTRADO)
    }
    if (previo.estado !== "BORRADOR") {
      throw new ConflictException(ERROR_ELIMINAR_NO_BORRADOR)
    }
    // Eliminar exige cero inscripciones EN CUALQUIER ESTADO (§5.3). El
    // CURSO_DETALLE_SELECT solo cuenta ACTIVAS para la lista; aqui hacemos un
    // count global aparte.
    const inscripcionesTotales = await this.prisma.inscripcion.count({
      where: { cursoId: id },
    })
    if (inscripcionesTotales > 0) {
      throw new ConflictException(ERROR_ELIMINAR_CON_INSCRIPCIONES)
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.logActividad.create({
        data: {
          actorId,
          tipoAccion: "CURSO_ELIMINADO",
          entidadTipo: ENTIDAD_TIPO,
          entidadId: id,
          valorAntes: snapshotCurso(previo),
          valorDespues: Prisma.JsonNull,
        },
      })
      await tx.curso.delete({ where: { id } })
    })

    return { tipo: "ELIMINADA", id }
  }

  // ──────────────────────────────────────────────────────────────────
  // Helpers privados
  // ──────────────────────────────────────────────────────────────────

  // Cuenta de modulos no archivados por areaId dentro del curso. groupBy
  // evita N+1 en el detalle.
  private async contarModulosPorArea(cursoId: string): Promise<ModulosPorAreaCount> {
    const groups = await this.prisma.modulo.groupBy({
      by: ["areaId"],
      where: { cursoId, archivadoAt: null },
      _count: { _all: true },
    })
    const map: ModulosPorAreaCount = new Map()
    for (const g of groups) {
      map.set(g.areaId, g._count._all)
    }
    return map
  }

  // ──────────────────────────────────────────────────────────────────
  // AREAS INDIVIDUALES (Iter 2)
  // ──────────────────────────────────────────────────────────────────

  async agregarArea(
    cursoId: string,
    input: AgregarCursoAreaInput,
    actorId: string,
  ): Promise<CursoAreaMutacionResponse> {
    const curso = await this.prisma.curso.findUnique({
      where: { id: cursoId },
      select: CURSO_DETALLE_SELECT,
    })
    if (!curso) {
      throw new NotFoundException(ERROR_CURSO_NO_ENCONTRADO)
    }
    if (curso.estado !== "BORRADOR") {
      throw new ConflictException(ERROR_AREAS_SOLO_BORRADOR)
    }

    // Verificar que el area existe y esta ACTIVA.
    const area = await this.prisma.area.findUnique({
      where: { id: input.areaId },
      select: { id: true, estado: true },
    })
    if (!area) {
      throw new BadRequestException(ERROR_AREA_NO_ENCONTRADA)
    }
    if (area.estado !== "ACTIVA") {
      throw new BadRequestException(ERROR_AREA_OBSOLETA)
    }

    // Verificar que el area no este ya en el curso.
    const duplicada = curso.cursoAreas.find((ca) => ca.areaId === input.areaId)
    if (duplicada) {
      throw new BadRequestException(ERROR_AREA_DUPLICADA_EN_CURSO)
    }

    const orden = input.orden ?? curso.cursoAreas.length

    const nuevaCursoArea = await this.prisma.$transaction(async (tx) => {
      const creada = await tx.cursoArea.create({
        data: {
          cursoId,
          areaId: input.areaId,
          peso: input.peso,
          puntajeObjetivo: input.puntajeObjetivo,
          orden,
        },
        select: {
          id: true,
          areaId: true,
          peso: true,
          puntajeObjetivo: true,
          orden: true,
          area: { select: { id: true, nombre: true, color: true } },
        },
      })

      // Releer el curso para snapshot y suma de pesos.
      const actualizado = await tx.curso.findUnique({
        where: { id: cursoId },
        select: CURSO_DETALLE_SELECT,
      })
      if (!actualizado) {
        throw new NotFoundException(ERROR_CURSO_NO_ENCONTRADO)
      }
      await tx.logActividad.create({
        data: {
          actorId,
          tipoAccion: "CURSO_AREAS_ACTUALIZADAS",
          entidadTipo: ENTIDAD_TIPO,
          entidadId: cursoId,
          valorAntes: snapshotAreas(curso),
          valorDespues: snapshotAreas(actualizado),
        },
      })
      return { creada, actualizado }
    })

    const sumaPesosActual = nuevaCursoArea.actualizado.cursoAreas.reduce(
      (acc, ca) => acc + Number(ca.peso.toString()),
      0,
    )

    return {
      cursoArea: {
        id: nuevaCursoArea.creada.id,
        areaId: nuevaCursoArea.creada.areaId,
        area: nuevaCursoArea.creada.area,
        peso: Number(nuevaCursoArea.creada.peso.toString()),
        puntajeObjetivo: nuevaCursoArea.creada.puntajeObjetivo,
        orden: nuevaCursoArea.creada.orden,
        modulosCount: 0,
      },
      sumaPesosActual,
    }
  }

  async actualizarCursoArea(
    cursoId: string,
    cursoAreaId: string,
    input: ActualizarCursoAreaInput,
    actorId: string,
  ): Promise<CursoAreaMutacionResponse> {
    const curso = await this.prisma.curso.findUnique({
      where: { id: cursoId },
      select: CURSO_DETALLE_SELECT,
    })
    if (!curso) {
      throw new NotFoundException(ERROR_CURSO_NO_ENCONTRADO)
    }
    if (curso.estado !== "BORRADOR") {
      throw new ConflictException(ERROR_AREAS_SOLO_BORRADOR)
    }

    const cursoAreaExistente = curso.cursoAreas.find((ca) => ca.id === cursoAreaId)
    if (!cursoAreaExistente) {
      throw new NotFoundException(ERROR_CURSO_AREA_NO_ENCONTRADA)
    }

    // Validar rangos.
    if (input.peso !== undefined && (input.peso < 0 || input.peso > 100)) {
      throw new BadRequestException("El peso debe estar en rango [0, 100]")
    }
    if (
      input.puntajeObjetivo !== undefined &&
      (input.puntajeObjetivo < 1 || input.puntajeObjetivo > 100)
    ) {
      throw new BadRequestException("El puntaje objetivo debe estar en rango [1, 100]")
    }

    const actualizado = await this.prisma.$transaction(async (tx) => {
      const actualizada = await tx.cursoArea.update({
        where: { id: cursoAreaId },
        data: {
          ...(input.peso !== undefined ? { peso: input.peso } : {}),
          ...(input.puntajeObjetivo !== undefined
            ? { puntajeObjetivo: input.puntajeObjetivo }
            : {}),
          ...(input.orden !== undefined ? { orden: input.orden } : {}),
        },
        select: {
          id: true,
          areaId: true,
          peso: true,
          puntajeObjetivo: true,
          orden: true,
          area: { select: { id: true, nombre: true, color: true } },
        },
      })

      const cursoDespues = await tx.curso.findUnique({
        where: { id: cursoId },
        select: CURSO_DETALLE_SELECT,
      })
      if (!cursoDespues) {
        throw new NotFoundException(ERROR_CURSO_NO_ENCONTRADO)
      }

      await tx.logActividad.create({
        data: {
          actorId,
          tipoAccion: "CURSO_AREAS_ACTUALIZADAS",
          entidadTipo: ENTIDAD_TIPO,
          entidadId: cursoId,
          valorAntes: snapshotAreas(curso),
          valorDespues: snapshotAreas(cursoDespues),
        },
      })
      return { actualizada, cursoDespues }
    })

    const modulosCount = await this.prisma.modulo.count({
      where: { cursoId, areaId: actualizado.actualizada.areaId, archivadoAt: null },
    })

    const sumaPesosActual = actualizado.cursoDespues.cursoAreas.reduce(
      (acc, ca) => acc + Number(ca.peso.toString()),
      0,
    )

    return {
      cursoArea: {
        id: actualizado.actualizada.id,
        areaId: actualizado.actualizada.areaId,
        area: actualizado.actualizada.area,
        peso: Number(actualizado.actualizada.peso.toString()),
        puntajeObjetivo: actualizado.actualizada.puntajeObjetivo,
        orden: actualizado.actualizada.orden,
        modulosCount,
      },
      sumaPesosActual,
    }
  }

  async eliminarCursoArea(
    cursoId: string,
    cursoAreaId: string,
    actorId: string,
  ): Promise<{ ok: true }> {
    const curso = await this.prisma.curso.findUnique({
      where: { id: cursoId },
      select: CURSO_DETALLE_SELECT,
    })
    if (!curso) {
      throw new NotFoundException(ERROR_CURSO_NO_ENCONTRADO)
    }
    if (curso.estado !== "BORRADOR") {
      throw new ConflictException(ERROR_AREAS_SOLO_BORRADOR)
    }

    const cursoAreaExistente = curso.cursoAreas.find((ca) => ca.id === cursoAreaId)
    if (!cursoAreaExistente) {
      throw new NotFoundException(ERROR_CURSO_AREA_NO_ENCONTRADA)
    }

    // 409 si el area tiene modulos no archivados en este curso.
    const modulosCount = await this.prisma.modulo.count({
      where: { cursoId, areaId: cursoAreaExistente.areaId, archivadoAt: null },
    })
    if (modulosCount > 0) {
      throw new ConflictException(`${ERROR_AREA_TIENE_MODULOS} (modulosCount: ${modulosCount})`)
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.cursoArea.delete({ where: { id: cursoAreaId } })
      const cursoDespues = await tx.curso.findUnique({
        where: { id: cursoId },
        select: CURSO_DETALLE_SELECT,
      })
      if (!cursoDespues) {
        throw new NotFoundException(ERROR_CURSO_NO_ENCONTRADO)
      }
      await tx.logActividad.create({
        data: {
          actorId,
          tipoAccion: "CURSO_AREAS_ACTUALIZADAS",
          entidadTipo: ENTIDAD_TIPO,
          entidadId: cursoId,
          valorAntes: snapshotAreas(curso),
          valorDespues: snapshotAreas(cursoDespues),
        },
      })
    })

    return { ok: true }
  }

  async reemplazarCursoArea(
    cursoId: string,
    cursoAreaId: string,
    input: ReemplazarCursoAreaInput,
    actorId: string,
  ): Promise<CursoAreaMutacionResponse> {
    const curso = await this.prisma.curso.findUnique({
      where: { id: cursoId },
      select: CURSO_DETALLE_SELECT,
    })
    if (!curso) {
      throw new NotFoundException(ERROR_CURSO_NO_ENCONTRADO)
    }
    if (curso.estado !== "BORRADOR") {
      throw new ConflictException(ERROR_AREAS_SOLO_BORRADOR)
    }

    const cursoAreaExistente = curso.cursoAreas.find((ca) => ca.id === cursoAreaId)
    if (!cursoAreaExistente) {
      throw new NotFoundException(ERROR_CURSO_AREA_NO_ENCONTRADA)
    }

    // Verificar que el nuevo area existe y esta ACTIVA.
    const nuevaArea = await this.prisma.area.findUnique({
      where: { id: input.nuevoAreaId },
      select: { id: true, estado: true },
    })
    if (!nuevaArea) {
      throw new BadRequestException(ERROR_AREA_NO_ENCONTRADA)
    }
    if (nuevaArea.estado !== "ACTIVA") {
      throw new BadRequestException(ERROR_AREA_OBSOLETA)
    }

    // Verificar que el nuevo area no este ya en el curso (excepto la misma cursoArea).
    const conflicto = curso.cursoAreas.find(
      (ca) => ca.areaId === input.nuevoAreaId && ca.id !== cursoAreaId,
    )
    if (conflicto) {
      throw new BadRequestException(ERROR_AREA_NUEVA_YA_EN_CURSO)
    }

    const areaViejaId = cursoAreaExistente.areaId

    const resultado = await this.prisma.$transaction(async (tx) => {
      // Reasignar en cascada los modulos que apuntan al area vieja en este curso.
      await tx.modulo.updateMany({
        where: { cursoId, areaId: areaViejaId },
        data: { areaId: input.nuevoAreaId },
      })

      const actualizada = await tx.cursoArea.update({
        where: { id: cursoAreaId },
        data: { areaId: input.nuevoAreaId },
        select: {
          id: true,
          areaId: true,
          peso: true,
          puntajeObjetivo: true,
          orden: true,
          area: { select: { id: true, nombre: true, color: true } },
        },
      })

      const cursoDespues = await tx.curso.findUnique({
        where: { id: cursoId },
        select: CURSO_DETALLE_SELECT,
      })
      if (!cursoDespues) {
        throw new NotFoundException(ERROR_CURSO_NO_ENCONTRADO)
      }

      // Log principal de areas actualizadas.
      await tx.logActividad.create({
        data: {
          actorId,
          tipoAccion: "CURSO_AREAS_ACTUALIZADAS",
          entidadTipo: ENTIDAD_TIPO,
          entidadId: cursoId,
          valorAntes: snapshotAreas(curso),
          valorDespues: snapshotAreas(cursoDespues),
        },
      })

      // Log adicional con los modulos reasignados.
      const modulosReasignados = await tx.modulo.findMany({
        where: { cursoId, areaId: input.nuevoAreaId },
        select: { id: true },
      })
      if (modulosReasignados.length > 0) {
        await tx.logActividad.create({
          data: {
            actorId,
            tipoAccion: "CURSO_AREAS_ACTUALIZADAS",
            entidadTipo: ENTIDAD_TIPO,
            entidadId: cursoId,
            valorAntes: Prisma.JsonNull,
            valorDespues: {
              modulosReasignados: modulosReasignados.map((m) => m.id),
              areaVieja: areaViejaId,
              areaNueva: input.nuevoAreaId,
            } as Prisma.InputJsonValue,
          },
        })
      }

      return { actualizada, cursoDespues }
    })

    const modulosCount = await this.prisma.modulo.count({
      where: { cursoId, areaId: resultado.actualizada.areaId, archivadoAt: null },
    })

    const sumaPesosActual = resultado.cursoDespues.cursoAreas.reduce(
      (acc, ca) => acc + Number(ca.peso.toString()),
      0,
    )

    return {
      cursoArea: {
        id: resultado.actualizada.id,
        areaId: resultado.actualizada.areaId,
        area: resultado.actualizada.area,
        peso: Number(resultado.actualizada.peso.toString()),
        puntajeObjetivo: resultado.actualizada.puntajeObjetivo,
        orden: resultado.actualizada.orden,
        modulosCount,
      },
      sumaPesosActual,
    }
  }

  async obtenerCursoArea(
    cursoId: string,
    cursoAreaId: string,
  ): Promise<CursoAreaIndividualDetalle> {
    const cursoArea = await this.prisma.cursoArea.findUnique({
      where: { id: cursoAreaId },
      select: CURSO_AREA_DETALLE_SELECT,
    })
    if (!cursoArea || cursoArea.cursoId !== cursoId) {
      throw new NotFoundException(ERROR_CURSO_AREA_NO_ENCONTRADA)
    }

    // Cargar modulos del curso para esta area con sus secciones y bloques.
    const modulosRaw = await this.prisma.modulo.findMany({
      where: { cursoId, areaId: cursoArea.areaId, archivadoAt: null },
      orderBy: { orden: "asc" },
      select: {
        id: true,
        titulo: true,
        secciones: {
          orderBy: { orden: "asc" },
          select: {
            archivadoAt: true,
            bloques: {
              select: {
                archivadoAt: true,
                tipo: true,
                codigoEvaluable: true,
              },
            },
          },
        },
      },
    })

    const modulos: ModuloConBloques[] = modulosRaw.map((mod) => ({
      id: mod.id,
      titulo: mod.titulo,
      secciones: mod.secciones.map((sec) => ({
        archivadoAt: sec.archivadoAt,
        bloques: sec.bloques.map((b) => ({
          archivadoAt: b.archivadoAt,
          tipo: b.tipo as ModuloConBloques["secciones"][number]["bloques"][number]["tipo"],
          codigoEvaluable:
            b.codigoEvaluable as ModuloConBloques["secciones"][number]["bloques"][number]["codigoEvaluable"],
        })),
      })),
    }))

    return mapCursoAreaIndividualDetalle(cursoArea as CursoAreaDetalleRow, modulos)
  }

  private generarSlugUnico(titulo: string, empresa: string): Promise<string> {
    const base = construirSlugBase(titulo, empresa)
    return resolverSlugUnico(base, async (candidate) => {
      const existe = await this.prisma.curso.findUnique({
        where: { slug: candidate },
        select: { id: true },
      })
      return existe !== null
    })
  }

  // Aplica slug al patch si el cliente envio uno y es valido. Lanza 400 si el
  // formato es invalido y 409 si choca con otro curso.
  private async resolverSlugEnPatch(
    id: string,
    input: ActualizarCursoInput,
    slugActual: string,
    data: Prisma.CursoUpdateInput,
  ): Promise<void> {
    if (input.slug === undefined) {
      return
    }
    if (!esSlugValido(input.slug)) {
      throw new BadRequestException("El slug no tiene formato kebab-case valido")
    }
    if (input.slug === slugActual) {
      return
    }
    const colision = await this.prisma.curso.findUnique({
      where: { slug: input.slug },
      select: { id: true },
    })
    if (colision && colision.id !== id) {
      throw new ConflictException(ERROR_SLUG_DUPLICADO)
    }
    data.slug = input.slug
  }

  // Carga el curso con todos los datos que necesita el checklist.
  private async cargarCursoParaPublicar(id: string): Promise<{
    estado: "BORRADOR" | "ACTIVO" | "CERRADO"
    row: CursoDetalleRow
    cursoConChecklist: CursoConChecklist
  }> {
    const row = await this.prisma.curso.findUnique({
      where: { id },
      select: {
        ...CURSO_DETALLE_SELECT,
        modulos: {
          where: { archivadoAt: null },
          select: {
            id: true,
            areaId: true,
            miniProyectoActivo: true,
            secciones: {
              where: { archivadoAt: null },
              select: {
                id: true,
                bloques: {
                  where: { archivadoAt: null },
                  select: { id: true },
                },
              },
            },
          },
        },
      },
    })
    if (!row) {
      throw new NotFoundException(ERROR_CURSO_NO_ENCONTRADO)
    }

    // Separamos `modulos` del `CURSO_DETALLE_SELECT` (que NO los incluye) para
    // el checklist y dejamos `row` como CursoDetalleRow para el snapshot.
    const { modulos, ...rowSinModulos } = row
    return {
      estado: row.estado,
      row: rowSinModulos as CursoDetalleRow,
      cursoConChecklist: { ...rowSinModulos, modulos } as CursoConChecklist,
    }
  }
}

// Forma intermedia que junta el detalle con los modulos hidratados para el
// checklist. Lo declaramos arriba del helper que lo materializa.
type CursoConChecklist = CursoDetalleRow & {
  modulos: ReadonlyArray<{
    id: string
    areaId: string
    miniProyectoActivo: boolean
    secciones: ReadonlyArray<{
      id: string
      bloques: ReadonlyArray<{ id: string }>
    }>
  }>
}

function aplicarCamposTexto(data: Prisma.CursoUpdateInput, input: ActualizarCursoInput): void {
  if (input.empresaCliente !== undefined) {
    data.empresaCliente = input.empresaCliente.trim()
  }
  if (input.titulo !== undefined) {
    data.titulo = input.titulo.trim()
  }
  if (input.descripcion !== undefined) {
    data.descripcion = input.descripcion === null ? null : input.descripcion.trim()
  }
  if (input.duracionEstimada !== undefined) {
    data.duracionEstimada = input.duracionEstimada === null ? null : input.duracionEstimada.trim()
  }
  if (input.imagenUrl !== undefined) {
    data.imagenUrl = input.imagenUrl
  }
}

function aplicarFechasYFlag(data: Prisma.CursoUpdateInput, input: ActualizarCursoInput): void {
  if (input.fechaInicio !== undefined) {
    data.fechaInicio = input.fechaInicio === null ? null : new Date(input.fechaInicio)
  }
  if (input.deadline !== undefined) {
    data.deadline = input.deadline === null ? null : new Date(input.deadline)
  }
  if (input.permiteInscripcionLibre !== undefined) {
    data.permiteInscripcionLibre = input.permiteInscripcionLibre
  }
}

function aplicarPesos(data: Prisma.CursoUpdateInput, input: ActualizarCursoInput): void {
  if (input.pesoAreas !== undefined) {
    data.pesoAreas = input.pesoAreas
  }
  if (input.pesoProyectoTransversal !== undefined) {
    data.pesoProyectoTransversal = input.pesoProyectoTransversal
  }
  if (input.pesoEntrevistaIA !== undefined) {
    data.pesoEntrevistaIA = input.pesoEntrevistaIA
  }
  if (input.pesoActividades !== undefined) {
    data.pesoActividades = input.pesoActividades
  }
  if (input.pesoMiniProyecto !== undefined) {
    data.pesoMiniProyecto = input.pesoMiniProyecto
  }
}

function aplicarUmbrales(data: Prisma.CursoUpdateInput, input: ActualizarCursoInput): void {
  if (input.umbralExcelencia !== undefined) {
    data.umbralExcelencia = input.umbralExcelencia
  }
  if (input.umbralAprobado !== undefined) {
    data.umbralAprobado = input.umbralAprobado
  }
  if (input.umbralEnDesarrollo !== undefined) {
    data.umbralEnDesarrollo = input.umbralEnDesarrollo
  }
  if (input.umbralBrechaNoCumple !== undefined) {
    data.umbralBrechaNoCumple = input.umbralBrechaNoCumple
  }
}

// Construye Prisma.CursoUpdateInput aplicando solo los campos definidos en el
// input. Trim se aplica a campos textuales nullable (null borra, string limpia).
function construirDataPatch(input: ActualizarCursoInput): Prisma.CursoUpdateInput {
  const data: Prisma.CursoUpdateInput = {}
  aplicarCamposTexto(data, input)
  aplicarFechasYFlag(data, input)
  aplicarPesos(data, input)
  aplicarUmbrales(data, input)
  return data
}

// Verificacion estricta umbralEnDesarrollo < umbralAprobado < umbralExcelencia
// usando los persistidos como default cuando solo viene un subset.
function validarUmbralesOrden(
  input: ActualizarCursoInput,
  previo: {
    umbralEnDesarrollo: number
    umbralAprobado: number
    umbralExcelencia: number
  },
): void {
  const eDes = input.umbralEnDesarrollo ?? previo.umbralEnDesarrollo
  const eApr = input.umbralAprobado ?? previo.umbralAprobado
  const eExc = input.umbralExcelencia ?? previo.umbralExcelencia
  if (!(eDes < eApr && eApr < eExc)) {
    throw new BadRequestException(
      "Los umbrales deben cumplir umbralEnDesarrollo < umbralAprobado < umbralExcelencia",
    )
  }
}

function hayCambioDePesos(input: ActualizarCursoInput): boolean {
  return (
    input.pesoAreas !== undefined ||
    input.pesoProyectoTransversal !== undefined ||
    input.pesoEntrevistaIA !== undefined ||
    input.pesoActividades !== undefined ||
    input.pesoMiniProyecto !== undefined
  )
}

// Convierte el row Prisma a la forma minima que espera el evaluador puro.
function toChecklistInput(curso: {
  row: CursoDetalleRow
  cursoConChecklist: CursoConChecklist
}): CursoParaChecklist {
  const r = curso.cursoConChecklist
  return {
    empresaCliente: r.empresaCliente,
    titulo: r.titulo,
    fechaInicio: r.fechaInicio,
    deadline: r.deadline,
    pesoAreas: Number(r.pesoAreas.toString()),
    pesoProyectoTransversal: Number(r.pesoProyectoTransversal.toString()),
    pesoEntrevistaIA: Number(r.pesoEntrevistaIA.toString()),
    pesoActividades: Number(r.pesoActividades.toString()),
    pesoMiniProyecto: Number(r.pesoMiniProyecto.toString()),
    umbralExcelencia: r.umbralExcelencia,
    umbralAprobado: r.umbralAprobado,
    umbralEnDesarrollo: r.umbralEnDesarrollo,
    cursoAreas: r.cursoAreas.map((ca) => ({
      areaId: ca.areaId,
      peso: Number(ca.peso.toString()),
      puntajeObjetivo: ca.puntajeObjetivo,
    })),
    modulos: r.modulos,
    proyectoTransversalActivo: r.proyectoTransversal !== null,
    entrevistaIAActiva: r.entrevistaIAConfig !== null,
  }
}
