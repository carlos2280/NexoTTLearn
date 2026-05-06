import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common"
import type {
  AjustarEntregaProyectoAdminInput,
  EntregaProyectoDetalleAdmin,
  EntregaProyectoListAdminResponse,
  EvaluarEntregaProyectoAdminInput,
  ListarEntregasProyectoAdminQuery,
} from "@nexott-learn/shared-types"
import { Prisma } from "@prisma/client"
import { PrismaService } from "../../common/prisma/prisma.service"
import {
  ENTREGA_PROYECTO_DETALLE_SELECT,
  ENTREGA_PROYECTO_INTENTO_SELECT,
  ENTREGA_PROYECTO_LISTADO_SELECT,
  type EntregaProyectoDetalleRow,
  calcularNotaFinal,
  deriveTipoProyecto,
  mapEntregaProyectoDetalle,
  mapEntregaProyectoListItem,
  snapshotEntregaProyecto,
} from "./centro-revision-proyectos.mapper"
import {
  ENTIDAD_TIPO_ENTREGA_PROYECTO,
  ERROR_AJUSTAR_PROYECTO_ENVIADA,
  ERROR_AJUSTAR_PROYECTO_PESOS_AUSENTES,
  ERROR_CURSO_CERRADO_PROYECTO,
  ERROR_ENTREGA_PROYECTO_NO_ENCONTRADA,
  ERROR_EVALUAR_PROYECTO_ENVIADA,
  ERROR_EVALUAR_PROYECTO_YA_EVALUADA,
  ERROR_INSCRIPCION_NO_ACTIVA_EVALUAR_PROYECTO,
  ERROR_INSCRIPCION_NO_AJUSTABLE_PROYECTO,
} from "./centro-revision-proyectos.types"

// MAESTRO §10 (proyectos 3 capas), §10.5 (fórmula notaFinal), §12.4
// (acciones admin sobre proyecto), §12.5 (trazabilidad), §A25 (evaluación
// 3 capas), §A26 (ajuste manual con motivo). Iter 9.B.
//
// Notas de implementación:
// - El modelo `EntregaProyecto` NO tiene `evaluadaPorId`. La traza del
//   actor humano vive solo en `LogActividad.actorId` (T02). Por eso no
//   seteamos ese campo en evaluar/ajustar (no existe en el modelo).
// - `evaluar` calcula notaFinal con pesos vigentes del MiniProyecto/PT y
//   los persiste como snapshot en `pesoCapa*Aplicado` (MAESTRO §10.5).
// - `ajustar` (A26) NO toca notas de capa ni pesos snapshot — recibe
//   notaFinal directa, igual que el modal A26 (un solo campo `nota_nueva`).

@Injectable()
export class CentroRevisionProyectosService {
  constructor(private readonly prisma: PrismaService) {}

  // ──────────────────────────────────────────────────────────────────
  // LISTADO · cola filtrable. Por defecto solo EN_REVISION.
  // ──────────────────────────────────────────────────────────────────

  async listar(query: ListarEntregasProyectoAdminQuery): Promise<EntregaProyectoListAdminResponse> {
    const where: Prisma.EntregaProyectoWhereInput = {}

    if (query.estado === undefined) {
      where.estado = "EN_REVISION"
    } else if (query.estado !== "all") {
      where.estado = query.estado
    }

    if (query.cursoId) {
      where.inscripcion = { cursoId: query.cursoId }
    }
    if (query.participanteId) {
      where.inscripcion = {
        ...(where.inscripcion as Prisma.InscripcionWhereInput),
        participanteId: query.participanteId,
      }
    }
    if (query.miniProyectoId) {
      where.miniProyectoId = query.miniProyectoId
    }
    if (query.transversalId) {
      where.transversalId = query.transversalId
    }
    if (query.moduloId) {
      where.miniProyecto = { moduloId: query.moduloId }
    }
    if (query.tipo === "MINI") {
      where.miniProyectoId = where.miniProyectoId ?? { not: null }
    } else if (query.tipo === "TRANSVERSAL") {
      where.transversalId = where.transversalId ?? { not: null }
    }

    const skip = (query.page - 1) * query.pageSize
    const take = query.pageSize

    const [items, total] = await this.prisma.$transaction([
      this.prisma.entregaProyecto.findMany({
        where,
        select: ENTREGA_PROYECTO_LISTADO_SELECT,
        orderBy: [{ enviadaAt: "asc" }],
        skip,
        take,
      }),
      this.prisma.entregaProyecto.count({ where }),
    ])

    return {
      items: items.map(mapEntregaProyectoListItem),
      total,
      page: query.page,
      pageSize: query.pageSize,
    }
  }

  async obtener(id: string): Promise<EntregaProyectoDetalleAdmin> {
    const entrega = await this.requireEntrega(id)

    const intentos = await this.prisma.entregaProyecto.findMany({
      where: agruparIntentosWhere(entrega),
      select: ENTREGA_PROYECTO_INTENTO_SELECT,
      orderBy: [{ intento: "asc" }],
    })

    return mapEntregaProyectoDetalle(entrega, intentos)
  }

  // ──────────────────────────────────────────────────────────────────
  // PATCH /:id/evaluar · A25 · EN_REVISION → EVALUADA
  // Server calcula notaFinal con pesos vigentes y persiste snapshot.
  // ──────────────────────────────────────────────────────────────────

  async evaluar(
    id: string,
    input: EvaluarEntregaProyectoAdminInput,
    actorId: string,
  ): Promise<EntregaProyectoDetalleAdmin> {
    const previo = await this.requireEntrega(id)
    this.requireMutableEvaluar(previo)

    const pesos = this.leerPesosVigentes(previo)
    const notaFinal = calcularNotaFinal(
      input.notaCapa1,
      input.notaCapa2,
      input.notaCapa3,
      pesos.pesoCapa1,
      pesos.pesoCapa2,
      pesos.pesoCapa3,
    )

    const valorAntes = snapshotEntregaProyecto(previo)
    const data: Prisma.EntregaProyectoUncheckedUpdateInput = {
      notaCapa1: new Prisma.Decimal(input.notaCapa1),
      notaCapa2: new Prisma.Decimal(input.notaCapa2),
      notaCapa3: new Prisma.Decimal(input.notaCapa3),
      notaFinal,
      pesoCapa1Aplicado: pesos.pesoCapa1,
      pesoCapa2Aplicado: pesos.pesoCapa2,
      pesoCapa3Aplicado: pesos.pesoCapa3,
      estado: "EVALUADA",
      ajustadaManual: false,
      evaluadaAt: new Date(),
    }
    aplicarPatchTexto(data, "fortalezas", input.fortalezas)
    aplicarPatchTexto(data, "areasMejora", input.areasMejora)
    aplicarPatchTexto(data, "dudasDetectadas", input.dudasDetectadas)
    // biome-ignore lint/nursery/noSecrets: nombre de campo de dominio, no es un secreto
    aplicarPatchTexto(data, "transcripcionCapa3", input.transcripcionCapa3)

    await this.prisma.$transaction(async (tx) => {
      const actualizado = await tx.entregaProyecto.update({
        where: { id },
        data,
        select: SELECT_LOG,
      })

      await tx.logActividad.create({
        data: {
          actorId,
          tipoAccion: "PROYECTO_EVALUADO",
          entidadTipo: ENTIDAD_TIPO_ENTREGA_PROYECTO,
          entidadId: id,
          valorAntes,
          valorDespues: snapshotEntregaProyecto(actualizado),
        },
      })

      // TODO Iter 9.9 / 10 · disparar recalculo encadenado tras evaluar
      //   (mini → modulo → area → curso → etiqueta;
      //    transversal → curso → etiqueta).
      // TODO post-MVP · emitir notificacion PROYECTO_REVISADO al participante (T06).
    })

    return this.obtener(id)
  }

  // ──────────────────────────────────────────────────────────────────
  // PATCH /:id/ajustar · A26 · sobrescritura con motivo
  // Permitido desde EN_REVISION o EVALUADA. Si EN_REVISION → marca EVALUADA
  // (A26 paso 5 línea 49). NO toca notaCapa* ni pesoCapa*Aplicado.
  // ──────────────────────────────────────────────────────────────────

  async ajustar(
    id: string,
    input: AjustarEntregaProyectoAdminInput,
    actorId: string,
  ): Promise<EntregaProyectoDetalleAdmin> {
    const previo = await this.requireEntrega(id)
    this.requireMutableAjustar(previo)

    const motivo = input.motivoAjuste.trim()
    const valorAntes = snapshotEntregaProyecto(previo)

    const transicionaAEvaluada = previo.estado !== "EVALUADA"
    const data: Prisma.EntregaProyectoUncheckedUpdateInput = {
      notaFinal: new Prisma.Decimal(input.notaFinal),
      estado: "EVALUADA",
      ajustadaManual: true,
    }
    if (transicionaAEvaluada) {
      data.evaluadaAt = new Date()
    }

    // D-3 defensivo · si no hay snapshot de pesos persistido (no deberia
    // pasar tras evaluar), persistir los vigentes ahora para que el
    // expediente histórico tenga los pesos con que se materializó la nota.
    let pesosDerivadosDefensivos = false
    if (
      previo.pesoCapa1Aplicado === null ||
      previo.pesoCapa2Aplicado === null ||
      previo.pesoCapa3Aplicado === null
    ) {
      try {
        const pesos = this.leerPesosVigentes(previo)
        data.pesoCapa1Aplicado = pesos.pesoCapa1
        data.pesoCapa2Aplicado = pesos.pesoCapa2
        data.pesoCapa3Aplicado = pesos.pesoCapa3
        pesosDerivadosDefensivos = true
      } catch {
        throw new InternalServerErrorException(ERROR_AJUSTAR_PROYECTO_PESOS_AUSENTES)
      }
    }

    aplicarPatchTexto(data, "fortalezas", input.fortalezas)
    aplicarPatchTexto(data, "areasMejora", input.areasMejora)
    aplicarPatchTexto(data, "dudasDetectadas", input.dudasDetectadas)
    // biome-ignore lint/nursery/noSecrets: nombre de campo de dominio, no es un secreto
    aplicarPatchTexto(data, "transcripcionCapa3", input.transcripcionCapa3)

    // TODO Iter 9.9/10 · idempotencia A26 caso borde 1: si
    //   input.notaFinal === previo.notaFinal Y outputs no cambian, registrar
    //   log pero NO disparar recalculo encadenado.

    await this.prisma.$transaction(async (tx) => {
      const actualizado = await tx.entregaProyecto.update({
        where: { id },
        data,
        select: SELECT_LOG,
      })

      const valorDespues = snapshotEntregaProyecto(actualizado)
      const valorDespuesConMotivo: Record<string, unknown> = {
        ...(valorDespues as Record<string, unknown>),
        motivo,
      }
      if (pesosDerivadosDefensivos) {
        valorDespuesConMotivo.pesosDerivadosDefensivos = true
      }

      await tx.logActividad.create({
        data: {
          actorId,
          tipoAccion: "NOTA_AJUSTADA_MANUAL",
          entidadTipo: ENTIDAD_TIPO_ENTREGA_PROYECTO,
          entidadId: id,
          motivo,
          valorAntes,
          valorDespues: valorDespuesConMotivo as Prisma.InputJsonValue,
        },
      })

      // TODO Iter 9.9/10 · recalculo encadenado tras A26.
      // TODO post-MVP · si etiqueta cambia → RECALCULO_NOTA (T06).
    })

    return this.obtener(id)
  }

  // ──────────────────────────────────────────────────────────────────
  // Helpers privados
  // ──────────────────────────────────────────────────────────────────

  private async requireEntrega(id: string): Promise<EntregaProyectoDetalleRow> {
    const row = await this.prisma.entregaProyecto.findUnique({
      where: { id },
      select: ENTREGA_PROYECTO_DETALLE_SELECT,
    })
    if (!row) {
      throw new NotFoundException(ERROR_ENTREGA_PROYECTO_NO_ENCONTRADA)
    }
    // I2 · valida XOR (defensivo, BD ya enforce). Lanza 500 si la BD se corrompe.
    deriveTipoProyecto(row)
    return row
  }

  private requireMutableEvaluar(entrega: EntregaProyectoDetalleRow): void {
    if (entrega.inscripcion.curso.estado === "CERRADO") {
      throw new ConflictException(ERROR_CURSO_CERRADO_PROYECTO)
    }
    if (entrega.inscripcion.estado !== "ACTIVA") {
      throw new ConflictException(ERROR_INSCRIPCION_NO_ACTIVA_EVALUAR_PROYECTO)
    }
    if (entrega.estado === "EVALUADA") {
      throw new ConflictException(ERROR_EVALUAR_PROYECTO_YA_EVALUADA)
    }
    if (entrega.estado === "ENVIADA") {
      throw new ConflictException(ERROR_EVALUAR_PROYECTO_ENVIADA)
    }
    // EN_REVISION → permitido.
  }

  private requireMutableAjustar(entrega: EntregaProyectoDetalleRow): void {
    if (entrega.inscripcion.curso.estado === "CERRADO") {
      throw new ConflictException(ERROR_CURSO_CERRADO_PROYECTO)
    }
    const estadoInscripcion = entrega.inscripcion.estado
    if (estadoInscripcion !== "ACTIVA" && estadoInscripcion !== "COMPLETADA") {
      throw new ConflictException(ERROR_INSCRIPCION_NO_AJUSTABLE_PROYECTO)
    }
    if (entrega.estado === "ENVIADA") {
      throw new ConflictException(ERROR_AJUSTAR_PROYECTO_ENVIADA)
    }
    // EN_REVISION o EVALUADA → permitido.
  }

  private leerPesosVigentes(entrega: EntregaProyectoDetalleRow): {
    pesoCapa1: Prisma.Decimal
    pesoCapa2: Prisma.Decimal
    pesoCapa3: Prisma.Decimal
  } {
    const tipo = deriveTipoProyecto(entrega)
    if (tipo === "MINI") {
      const mini = entrega.miniProyecto
      if (!mini) {
        throw new InternalServerErrorException(
          "EntregaProyecto MINI sin miniProyecto cargado en select",
        )
      }
      return {
        pesoCapa1: mini.pesoCapa1,
        pesoCapa2: mini.pesoCapa2,
        pesoCapa3: mini.pesoCapa3,
      }
    }
    const pt = entrega.transversal
    if (!pt) {
      throw new InternalServerErrorException(
        "EntregaProyecto TRANSVERSAL sin transversal cargado en select",
      )
    }
    return {
      pesoCapa1: pt.pesoCapa1,
      pesoCapa2: pt.pesoCapa2,
      pesoCapa3: pt.pesoCapa3,
    }
  }
}

const SELECT_LOG = {
  id: true,
  estado: true,
  notaCapa1: true,
  notaCapa2: true,
  notaCapa3: true,
  notaFinal: true,
  pesoCapa1Aplicado: true,
  pesoCapa2Aplicado: true,
  pesoCapa3Aplicado: true,
  ajustadaManual: true,
  fortalezas: true,
  areasMejora: true,
  dudasDetectadas: true,
  transcripcionCapa3: true,
  evaluadaAt: true,
} satisfies Prisma.EntregaProyectoSelect

function agruparIntentosWhere(
  entrega: EntregaProyectoDetalleRow,
): Prisma.EntregaProyectoWhereInput {
  if (entrega.miniProyectoId !== null) {
    return {
      inscripcionId: entrega.inscripcionId,
      miniProyectoId: entrega.miniProyectoId,
    }
  }
  return {
    inscripcionId: entrega.inscripcionId,
    transversalId: entrega.transversalId,
  }
}

type CamposTextoLibre = "fortalezas" | "areasMejora" | "dudasDetectadas" | "transcripcionCapa3"

/**
 * Semántica PATCH para campos de texto libre opcionales:
 * - undefined → no modifica (no asigna la propiedad).
 * - null → borra (asigna null).
 * - string → trim; vacío tras trim → null.
 */
function aplicarPatchTexto(
  data: Prisma.EntregaProyectoUncheckedUpdateInput,
  campo: CamposTextoLibre,
  valor: string | null | undefined,
): void {
  if (valor === undefined) {
    return
  }
  if (valor === null) {
    data[campo] = null
    return
  }
  const trimmed = valor.trim()
  data[campo] = trimmed.length === 0 ? null : trimmed
}
