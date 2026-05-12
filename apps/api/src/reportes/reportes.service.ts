import { Injectable, Logger, NotFoundException, UnprocessableEntityException } from "@nestjs/common"
import type {
  AvanceCursoQuery,
  BrechasDetectadasQuery,
  BrechasDetectadasResponse,
  CentroRevisionQuery,
  CentroRevisionResponse,
  DetalleColaboradorQuery,
  DetalleColaboradorResponse,
  EventoHistorico,
  FichaRelevanteItem,
  FilaAvanceCurso,
  FilaCentroRevisionEntrevistaIa,
  FilaCentroRevisionTransversal,
  IntentoBloqueResumen,
  IntentoEntrevistaIaResumen,
  IntentoTransversalResumen,
  ItemPlanReporte,
  MotivoRevisionTransversal,
  SkillBrechaItem,
  TipoAlerta,
  UmbralesBrechas,
} from "@nexott-learn/shared-types"
import { Prisma } from "@prisma/client"
import { apiErrorCodes } from "../common/errors/api-error.codes"
import { type Paginated, buildPaginatedResponse, resolvePaginacion } from "../common/http/paginated"
import { PrismaService } from "../common/prisma/prisma.service"
import { PlanPersonalService } from "../plan-personal/plan-personal.service"
import {
  ALERTA_INTENTO_INVALIDADO_DIAS,
  ALERTA_SIN_ACTIVIDAD_DIAS,
  SELECT_COLABORADOR_EMBED_FIELDS,
  SELECT_INTENTO_BLOQUE_RESUMEN_FIELDS,
  SELECT_INTENTO_ENTREVISTA_IA_RESUMEN_FIELDS,
  SELECT_INTENTO_TRANSVERSAL_RESUMEN_FIELDS,
  SELECT_ITEM_PLAN_FIELDS,
  TOPE_ULTIMOS_INTENTOS,
  UMBRAL_APROBADO_DEFAULT,
  UMBRAL_EXCELENCIA_DEFAULT,
  esSnapshotFotografiaV1,
  esUmbralesLogro,
} from "./reportes.types"

const MS_DIA = 86_400_000

/**
 * `ReportesService` — Slice 11 P11b (D-S11-B1..B11).
 *
 * Solo lee. No emite notificaciones, no audit (P11b NO loggea consultas — la
 * meta-auditoria queda diferida a P11c con `consultas_logs`). Cada metodo
 * publico orquesta una vista (`ACTUAL` / `FOTOGRAFIA_CIERRE` / `HISTORICO`)
 * via dispatcher interno (D-S11-B7). Las alertas se computan en memoria a
 * partir de campos pre-seleccionados — sin N+1.
 */
@Injectable()
export class ReportesService {
  private readonly logger = new Logger(ReportesService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly planPersonalService: PlanPersonalService,
  ) {}

  // -------------------------------------------------------------------------
  // E1 — GET /reportes/avance-curso
  // -------------------------------------------------------------------------
  obtenerAvanceCurso(
    query: AvanceCursoQuery,
  ): Promise<Paginated<FilaAvanceCurso> | Paginated<EventoHistorico>> {
    if (query.vista === "FOTOGRAFIA_CIERRE") {
      return this.avanceCursoDesdeFotografia(query)
    }
    if (query.vista === "HISTORICO") {
      return this.avanceCursoDesdeHistorico(query)
    }
    return this.avanceCursoActual(query)
  }

  private async avanceCursoActual(query: AvanceCursoQuery): Promise<Paginated<FilaAvanceCurso>> {
    const { skip, take, page, pageSize } = resolvePaginacion(query)

    const where: Prisma.AsignacionCursoWhereInput = { cursoId: query.cursoId }
    const [asignaciones, total] = await this.prisma.$transaction([
      this.prisma.asignacionCurso.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          rol: true,
          estadoAsignado: true,
          estadoVoluntario: true,
          colaboradorId: true,
          colaborador: { select: SELECT_COLABORADOR_EMBED_FIELDS },
          plan: { select: { id: true, estaDesactualizado: true } },
        },
      }),
      this.prisma.asignacionCurso.count({ where }),
    ])

    if (asignaciones.length === 0) {
      return buildPaginatedResponse([], total, page, pageSize)
    }

    const colaboradorIds = asignaciones.map((a) => a.colaboradorId)
    const ahora = Date.now()
    const fechaCorteSinActividad = new Date(ahora - ALERTA_SIN_ACTIVIDAD_DIAS * MS_DIA)
    const fechaCorteInvalidado = new Date(ahora - ALERTA_INTENTO_INVALIDADO_DIAS * MS_DIA)

    const [ultimosBloque, ultimosTransversal, ultimosEntrevista, invalidadosRecientes] =
      await Promise.all([
        this.ultimoIntentoBloquePorColaborador(colaboradorIds),
        this.ultimoIntentoTransversalPorColaborador(colaboradorIds),
        this.ultimoIntentoEntrevistaIaPorColaborador(colaboradorIds),
        this.prisma.intentoBloque.findMany({
          where: {
            colaboradorId: { in: colaboradorIds },
            estaInvalidado: true,
            fecha: { gte: fechaCorteInvalidado },
          },
          select: { colaboradorId: true },
          distinct: ["colaboradorId"],
        }),
      ])

    const invalidadosSet = new Set(invalidadosRecientes.map((r) => r.colaboradorId))

    // §5.128 (FIX-P11b-avance): calculo en paralelo del % real reusando el
    // motor de plan-personal. Cada entrada del map es independiente y la
    // cardinalidad esta acotada por la pagina (`take` ya aplicado).
    const porcentajes = await Promise.all(
      asignaciones.map((a) => this.planPersonalService.obtenerPorcentajeAvance(a.id)),
    )
    const porcentajePorAsignacion = new Map(asignaciones.map((a, i) => [a.id, porcentajes[i] ?? 0]))

    const filas: FilaAvanceCurso[] = asignaciones.map((asig) => {
      const ultimoIntento = maxFechaDeMaps(
        [ultimosBloque, ultimosTransversal, ultimosEntrevista],
        asig.colaboradorId,
      )
      const alertas: TipoAlerta[] = []
      if (ultimoIntento === null || ultimoIntento < fechaCorteSinActividad) {
        alertas.push("SIN_ACTIVIDAD_7_DIAS")
      }
      if (asig.rol === "ASIGNADO" && asig.plan === null) {
        alertas.push("PLAN_NO_CALCULADO")
      }
      if (asig.plan?.estaDesactualizado === true) {
        alertas.push("PLAN_DESACTUALIZADO")
      }
      if (invalidadosSet.has(asig.colaboradorId)) {
        alertas.push("INTENTO_INVALIDADO_RECIENTE")
      }
      return {
        asignacionId: asig.id,
        colaborador: {
          id: asig.colaborador.id,
          nombre: asig.colaborador.nombre,
          email: asig.colaborador.email,
        },
        estado: asig.estadoAsignado ?? asig.estadoVoluntario ?? "DESCONOCIDO",
        porcentajeAvance: porcentajePorAsignacion.get(asig.id) ?? 0,
        alertas,
      }
    })

    return buildPaginatedResponse(filas, total, page, pageSize)
  }

  private async avanceCursoDesdeFotografia(
    query: AvanceCursoQuery,
  ): Promise<Paginated<FilaAvanceCurso>> {
    const { page, pageSize } = resolvePaginacion(query)
    const fotografia = await this.prisma.cursoFotografiaCierre.findUnique({
      where: { cursoId: query.cursoId },
      select: { snapshot: true, descartada: true },
    })
    if (!fotografia || fotografia.descartada) {
      throw new NotFoundException({
        code: apiErrorCodes.fotografiaNoEncontrada,
        message: "Fotografia de cierre no encontrada o descartada para este curso.",
      })
    }
    if (!esSnapshotFotografiaV1(fotografia.snapshot)) {
      this.logger.warn(`Snapshot v1 invalido en fotografia del curso ${query.cursoId}`)
      throw new NotFoundException({
        code: apiErrorCodes.fotografiaNoEncontrada,
        message: "Fotografia de cierre con formato incompatible.",
      })
    }

    const total = fotografia.snapshot.asignaciones.length
    const skip = (page - 1) * pageSize
    const filas: FilaAvanceCurso[] = fotografia.snapshot.asignaciones
      .slice(skip, skip + pageSize)
      .map((fila) => ({
        asignacionId: fila.asignacionId,
        colaborador: {
          id: fila.colaborador.id,
          nombre: fila.colaborador.nombre,
          email: fila.colaborador.email,
        },
        estado: fila.estado,
        porcentajeAvance: fila.porcentajeAvance,
        alertas: [],
      }))

    return buildPaginatedResponse(filas, total, page, pageSize)
  }

  private async avanceCursoDesdeHistorico(
    query: AvanceCursoQuery,
  ): Promise<Paginated<EventoHistorico>> {
    const { skip, take, page, pageSize } = resolvePaginacion(query)

    const [logsCurso, historicoAsig] = await Promise.all([
      this.prisma.logCambioCurso.findMany({
        where: { cursoId: query.cursoId },
        select: {
          id: true,
          fecha: true,
          accion: true,
          motivo: true,
          autorUsuario: {
            select: { colaborador: { select: { nombre: true } } },
          },
        },
        orderBy: { fecha: "desc" },
        take: 500,
      }),
      this.prisma.historicoEstadoAsignacion.findMany({
        where: { asignacion: { cursoId: query.cursoId } },
        select: {
          id: true,
          fecha: true,
          estadoAnterior: true,
          estadoNuevo: true,
          motivo: true,
          autorUsuario: {
            select: { colaborador: { select: { nombre: true } } },
          },
        },
        orderBy: { fecha: "desc" },
        take: 500,
      }),
    ])

    const eventos: EventoHistorico[] = [
      ...logsCurso.map((log) => ({
        tipoCambio: `CURSO_${log.accion}`,
        fecha: log.fecha.toISOString(),
        autor: log.autorUsuario?.colaborador?.nombre ?? null,
        valorPrev: null,
        valorNuevo: null,
        motivo: log.motivo,
      })),
      ...historicoAsig.map((hist) => ({
        tipoCambio: "ASIGNACION_ESTADO",
        fecha: hist.fecha.toISOString(),
        autor: hist.autorUsuario?.colaborador?.nombre ?? null,
        valorPrev: hist.estadoAnterior,
        valorNuevo: hist.estadoNuevo,
        motivo: hist.motivo,
      })),
    ]
    eventos.sort((a, b) => b.fecha.localeCompare(a.fecha))

    const total = eventos.length
    const pagina = eventos.slice(skip, skip + take)
    return buildPaginatedResponse(pagina, total, page, pageSize)
  }

  // -------------------------------------------------------------------------
  // E2 — GET /reportes/detalle-colaborador
  // -------------------------------------------------------------------------
  async obtenerDetalleColaborador(
    query: DetalleColaboradorQuery,
  ): Promise<DetalleColaboradorResponse> {
    if (query.vista !== "ACTUAL") {
      throw new UnprocessableEntityException({
        code: apiErrorCodes.vistaNoSoportada,
        message: "detalle-colaborador solo admite vista=ACTUAL en P11b.",
      })
    }

    const asignacion = await this.prisma.asignacionCurso.findUnique({
      where: {
        // biome-ignore lint/style/useNamingConvention: clave compuesta generada por Prisma.
        colaboradorId_cursoId: {
          colaboradorId: query.colaboradorId,
          cursoId: query.cursoId,
        },
      },
      select: {
        id: true,
        rol: true,
        estadoAsignado: true,
        estadoVoluntario: true,
        fechaInicio: true,
        fechaCierre: true,
        plan: {
          select: {
            id: true,
            items: { select: SELECT_ITEM_PLAN_FIELDS },
          },
        },
      },
    })
    if (!asignacion) {
      throw new NotFoundException({
        code: apiErrorCodes.asignacionNoEncontrada,
        message: "Asignacion no encontrada para este curso y colaborador.",
      })
    }

    const skillsExigidas = await this.prisma.cursoSkillExigida.findMany({
      where: { cursoId: query.cursoId },
      select: { skillId: true, skill: { select: { id: true, etiquetaVisible: true } } },
    })
    const skillIds = skillsExigidas.map((s) => s.skillId)

    const notasSkill =
      skillIds.length === 0
        ? []
        : await this.prisma.notaSkill.findMany({
            where: {
              colaboradorId: query.colaboradorId,
              skillId: { in: skillIds },
            },
            select: {
              skillId: true,
              notaActual: true,
              origenActual: true,
            },
          })

    const fichaRelevante: FichaRelevanteItem[] = skillsExigidas.map((exigida) => {
      const nota = notasSkill.find((n) => n.skillId === exigida.skillId)
      return {
        skillId: exigida.skillId,
        etiqueta: exigida.skill.etiquetaVisible,
        notaActual:
          nota?.notaActual === null || nota?.notaActual === undefined
            ? null
            : Number(nota.notaActual),
        origen: extraerOrigenEtiqueta(nota?.origenActual ?? null),
      }
    })

    const itemsPlan = asignacion.plan?.items ?? []
    const plan: ItemPlanReporte[] = [...itemsPlan]
      .sort((a, b) => {
        if (a.modulo.titulo === b.modulo.titulo) {
          return a.seccion.orden - b.seccion.orden
        }
        return a.modulo.titulo.localeCompare(b.modulo.titulo)
      })
      .map((item) => ({
        id: item.id,
        moduloId: item.moduloId,
        seccionId: item.seccionId,
        caracter: item.caracter,
        razon: item.razon,
      }))

    const [bloqueRaw, transversalRaw, entrevistaRaw] = await Promise.all([
      this.prisma.intentoBloque.findMany({
        where: { colaboradorId: query.colaboradorId, cursoId: query.cursoId },
        orderBy: { fecha: "desc" },
        take: TOPE_ULTIMOS_INTENTOS + 1,
        select: SELECT_INTENTO_BLOQUE_RESUMEN_FIELDS,
      }),
      this.prisma.intentoTransversal.findMany({
        where: {
          colaboradorId: query.colaboradorId,
          transversal: { cursoId: query.cursoId },
        },
        orderBy: { fecha: "desc" },
        take: TOPE_ULTIMOS_INTENTOS + 1,
        select: SELECT_INTENTO_TRANSVERSAL_RESUMEN_FIELDS,
      }),
      this.prisma.intentoEntrevistaIA.findMany({
        where: {
          colaboradorId: query.colaboradorId,
          entrevistaIA: { cursoId: query.cursoId },
        },
        orderBy: { fecha: "desc" },
        take: TOPE_ULTIMOS_INTENTOS + 1,
        select: SELECT_INTENTO_ENTREVISTA_IA_RESUMEN_FIELDS,
      }),
    ])

    const hayMasBloque = bloqueRaw.length > TOPE_ULTIMOS_INTENTOS
    const hayMasTransversal = transversalRaw.length > TOPE_ULTIMOS_INTENTOS
    const hayMasEntrevista = entrevistaRaw.length > TOPE_ULTIMOS_INTENTOS

    const bloque: IntentoBloqueResumen[] = bloqueRaw.slice(0, TOPE_ULTIMOS_INTENTOS).map((i) => ({
      id: i.id,
      bloqueId: i.bloqueId,
      fechaInicio: i.fecha.toISOString(),
      fechaFin: null,
      mejorPorcentaje: i.nota === null ? null : Number(i.nota),
      estaInvalidado: i.estaInvalidado,
    }))

    const transversal: IntentoTransversalResumen[] = transversalRaw
      .slice(0, TOPE_ULTIMOS_INTENTOS)
      .map((i) => ({
        id: i.id,
        estado: i.estado,
        fechaInicio: i.fecha.toISOString(),
        fechaFinalizacion: i.fechaFinalizacion?.toISOString() ?? null,
        capasCargadas:
          (i.notaCapaTests === null ? 0 : 1) +
          (i.notaCapaCualitativa === null ? 0 : 1) +
          (i.notaCapaComprension === null ? 0 : 1),
      }))

    const entrevistaIa: IntentoEntrevistaIaResumen[] = entrevistaRaw
      .slice(0, TOPE_ULTIMOS_INTENTOS)
      .map((i) => ({
        id: i.id,
        estado: i.estado,
        fechaInicio: i.fecha.toISOString(),
        fechaFinalizacion: i.fechaFinalizacion?.toISOString() ?? null,
        notaGlobal: i.notaGlobal === null ? null : Number(i.notaGlobal),
        notaAjustadaAdmin: i.notaAjustadaAdmin === null ? null : Number(i.notaAjustadaAdmin),
      }))

    return {
      asignacion: {
        id: asignacion.id,
        estado: asignacion.estadoAsignado ?? asignacion.estadoVoluntario ?? "DESCONOCIDO",
        rolAsignacion: asignacion.rol,
        fechaInscripcion: asignacion.fechaInicio?.toISOString() ?? null,
        fechaCierre: asignacion.fechaCierre?.toISOString() ?? null,
      },
      plan,
      fichaRelevante,
      ultimosIntentos: { bloque, transversal, entrevistaIa },
      hayMas: {
        bloque: hayMasBloque,
        transversal: hayMasTransversal,
        entrevistaIa: hayMasEntrevista,
      },
      meta: { frescura: new Date().toISOString() },
    }
  }

  // -------------------------------------------------------------------------
  // E3 — GET /reportes/brechas-detectadas
  // -------------------------------------------------------------------------
  async obtenerBrechasDetectadas(
    query: BrechasDetectadasQuery,
  ): Promise<BrechasDetectadasResponse> {
    if (query.vista !== "ACTUAL") {
      throw new UnprocessableEntityException({
        code: apiErrorCodes.vistaNoSoportada,
        message: "brechas-detectadas solo admite vista=ACTUAL en P11b.",
      })
    }

    const curso = await this.prisma.curso.findUnique({
      where: { id: query.cursoId },
      select: { id: true, umbralNoCumple: true, umbralesLogro: true },
    })
    if (!curso) {
      throw new NotFoundException({
        code: apiErrorCodes.cursoNoEncontrado,
        message: "Curso no encontrado.",
      })
    }

    const skillsExigidas = await this.prisma.cursoSkillExigida.findMany({
      where: { cursoId: query.cursoId },
      select: {
        skillId: true,
        notaMinima: true,
        skill: { select: { id: true, etiquetaVisible: true } },
      },
    })

    const asignaciones = await this.prisma.asignacionCurso.findMany({
      where: { cursoId: query.cursoId },
      select: { colaboradorId: true },
    })
    const colaboradorIds = asignaciones.map((a) => a.colaboradorId)
    const skillIds = skillsExigidas.map((s) => s.skillId)

    const notas =
      colaboradorIds.length === 0 || skillIds.length === 0
        ? []
        : await this.prisma.notaSkill.findMany({
            where: {
              colaboradorId: { in: colaboradorIds },
              skillId: { in: skillIds },
            },
            select: { skillId: true, colaboradorId: true, notaActual: true },
          })

    const umbralNoCumple = Number(curso.umbralNoCumple)
    const skills: SkillBrechaItem[] = skillsExigidas.map((exigida) => {
      const umbralCumpleSkill = Number(exigida.notaMinima)
      let noCumple = 0
      let cerca = 0
      let cumple = 0
      for (const colaboradorId of colaboradorIds) {
        const nota = notas.find(
          (n) => n.skillId === exigida.skillId && n.colaboradorId === colaboradorId,
        )
        const valor =
          nota?.notaActual === null || nota?.notaActual === undefined
            ? null
            : Number(nota.notaActual)
        if (valor === null || valor < umbralNoCumple) {
          noCumple += 1
        } else if (valor >= umbralCumpleSkill) {
          cumple += 1
        } else {
          cerca += 1
        }
      }
      return {
        skillId: exigida.skillId,
        etiqueta: exigida.skill.etiquetaVisible,
        noCumple,
        cerca,
        cumple,
      }
    })

    const umbrales = this.armarUmbrales(skillsExigidas, umbralNoCumple, curso.umbralesLogro)

    return {
      cursoId: curso.id,
      umbrales,
      skills,
      meta: { frescura: new Date().toISOString() },
    }
  }

  // -------------------------------------------------------------------------
  // E4 — GET /reportes/centro-revision
  // -------------------------------------------------------------------------
  async obtenerCentroRevision(query: CentroRevisionQuery): Promise<CentroRevisionResponse> {
    if (query.vista !== "ACTUAL") {
      throw new UnprocessableEntityException({
        code: apiErrorCodes.vistaNoSoportada,
        message: "centro-revision solo admite vista=ACTUAL en P11b.",
      })
    }

    const incluyeTransversal = query.tipo === "TRANSVERSAL" || query.tipo === "TODAS"
    const incluyeEntrevista = query.tipo === "ENTREVISTA_IA" || query.tipo === "TODAS"

    const filtroTransversal: Prisma.IntentoTransversalWhereInput = {
      estado: "EVALUADO",
      // biome-ignore lint/style/useNamingConvention: `OR` es operador Prisma, no clave de dominio.
      OR: [{ notaCapaTests: null }, { notaCapaCualitativa: null }, { notaCapaComprension: null }],
      ...(query.cursoId ? { transversal: { cursoId: query.cursoId } } : {}),
    }

    const filtroEntrevista: Prisma.IntentoEntrevistaIAWhereInput = {
      estado: "FINALIZADO",
      notaAjustadaAdmin: null,
      ...(query.cursoId ? { entrevistaIA: { cursoId: query.cursoId } } : {}),
    }

    const [intentosTransv, intentosEntrev] = await Promise.all([
      incluyeTransversal
        ? this.prisma.intentoTransversal.findMany({
            where: filtroTransversal,
            select: {
              id: true,
              fechaFinalizacion: true,
              notaCapaTests: true,
              notaCapaCualitativa: true,
              notaCapaComprension: true,
              colaborador: { select: SELECT_COLABORADOR_EMBED_FIELDS },
              transversal: { select: { cursoId: true } },
            },
            orderBy: { fechaFinalizacion: "desc" },
            take: 200,
          })
        : Promise.resolve([]),
      incluyeEntrevista
        ? this.prisma.intentoEntrevistaIA.findMany({
            where: filtroEntrevista,
            select: {
              id: true,
              fechaFinalizacion: true,
              colaborador: { select: SELECT_COLABORADOR_EMBED_FIELDS },
              entrevistaIA: { select: { cursoId: true } },
            },
            orderBy: { fechaFinalizacion: "desc" },
            take: 200,
          })
        : Promise.resolve([]),
    ])

    const transversales: FilaCentroRevisionTransversal[] = intentosTransv.flatMap((intento) =>
      motivosTransversalPendientes(intento).map((motivo) => ({
        intentoId: intento.id,
        colaborador: {
          id: intento.colaborador.id,
          nombre: intento.colaborador.nombre,
          email: intento.colaborador.email,
        },
        cursoId: intento.transversal.cursoId,
        motivoRevision: motivo,
        fechaFinalizacion: intento.fechaFinalizacion?.toISOString() ?? null,
      })),
    )

    const entrevistasIa: FilaCentroRevisionEntrevistaIa[] = intentosEntrev.map((intento) => ({
      intentoId: intento.id,
      colaborador: {
        id: intento.colaborador.id,
        nombre: intento.colaborador.nombre,
        email: intento.colaborador.email,
      },
      cursoId: intento.entrevistaIA.cursoId,
      motivoRevision: "AJUSTE_ADMIN_PENDIENTE",
      fechaFinalizacion: intento.fechaFinalizacion?.toISOString() ?? null,
    }))

    return {
      transversales,
      entrevistasIa,
      totales: {
        transversales: transversales.length,
        entrevistasIa: entrevistasIa.length,
      },
      meta: { frescura: new Date().toISOString() },
    }
  }

  // -------------------------------------------------------------------------
  // Helpers privados
  // -------------------------------------------------------------------------
  private armarUmbrales(
    skillsExigidas: ReadonlyArray<{ notaMinima: Prisma.Decimal }>,
    umbralNoCumple: number,
    umbralesLogroRaw: Prisma.JsonValue,
  ): UmbralesBrechas {
    const umbralCumple =
      skillsExigidas.length === 0
        ? null
        : Number(
            (
              skillsExigidas.reduce((acc, s) => acc + Number(s.notaMinima), 0) /
              skillsExigidas.length
            ).toFixed(2),
          )

    let umbralAprobado = UMBRAL_APROBADO_DEFAULT
    let umbralExcelencia = UMBRAL_EXCELENCIA_DEFAULT
    if (esUmbralesLogro(umbralesLogroRaw)) {
      umbralAprobado = umbralesLogroRaw.solido
      umbralExcelencia = umbralesLogroRaw.excelencia
    }

    return { umbralCumple, umbralNoCumple, umbralAprobado, umbralExcelencia }
  }

  private async ultimoIntentoBloquePorColaborador(
    colaboradorIds: readonly string[],
  ): Promise<Map<string, Date>> {
    if (colaboradorIds.length === 0) {
      return new Map()
    }
    const filas = await this.prisma.intentoBloque.groupBy({
      by: ["colaboradorId"],
      where: { colaboradorId: { in: [...colaboradorIds] } },
      _max: { fecha: true },
    })
    return mapaDesdeGroupBy(filas)
  }

  private async ultimoIntentoTransversalPorColaborador(
    colaboradorIds: readonly string[],
  ): Promise<Map<string, Date>> {
    if (colaboradorIds.length === 0) {
      return new Map()
    }
    const filas = await this.prisma.intentoTransversal.groupBy({
      by: ["colaboradorId"],
      where: { colaboradorId: { in: [...colaboradorIds] } },
      _max: { fecha: true },
    })
    return mapaDesdeGroupBy(filas)
  }

  private async ultimoIntentoEntrevistaIaPorColaborador(
    colaboradorIds: readonly string[],
  ): Promise<Map<string, Date>> {
    if (colaboradorIds.length === 0) {
      return new Map()
    }
    const filas = await this.prisma.intentoEntrevistaIA.groupBy({
      by: ["colaboradorId"],
      where: { colaboradorId: { in: [...colaboradorIds] } },
      _max: { fecha: true },
    })
    return mapaDesdeGroupBy(filas)
  }
}

function motivosTransversalPendientes(intento: {
  notaCapaTests: unknown
  notaCapaCualitativa: unknown
  notaCapaComprension: unknown
}): MotivoRevisionTransversal[] {
  const motivos: MotivoRevisionTransversal[] = []
  if (intento.notaCapaTests === null) {
    motivos.push("CAPA_PENDIENTE_TESTS")
  }
  if (intento.notaCapaCualitativa === null) {
    motivos.push("CAPA_PENDIENTE_CUALITATIVA")
  }
  if (intento.notaCapaComprension === null) {
    motivos.push("CAPA_PENDIENTE_COMPRENSION")
  }
  return motivos
}

function mapaDesdeGroupBy(
  filas: ReadonlyArray<{ colaboradorId: string; _max: { fecha: Date | null } }>,
): Map<string, Date> {
  const mapa = new Map<string, Date>()
  for (const fila of filas) {
    if (fila._max.fecha) {
      mapa.set(fila.colaboradorId, fila._max.fecha)
    }
  }
  return mapa
}

function maxFechaDeMaps(mapas: readonly Map<string, Date>[], colaboradorId: string): Date | null {
  let max: Date | null = null
  for (const mapa of mapas) {
    const fecha = mapa.get(colaboradorId)
    if (fecha && (max === null || fecha > max)) {
      max = fecha
    }
  }
  return max
}

function extraerOrigenEtiqueta(origen: Prisma.JsonValue): string | null {
  if (origen === null || typeof origen !== "object" || Array.isArray(origen)) {
    return null
  }
  const obj = origen as Record<string, unknown>
  const tipo = obj.tipo
  return typeof tipo === "string" ? tipo : null
}
