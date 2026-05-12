import { Injectable, Logger, NotFoundException, UnprocessableEntityException } from "@nestjs/common"
import type {
  AvanceCursoQuery,
  BrechasDetectadasQuery,
  BrechasDetectadasResponse,
  CentroRevisionQuery,
  CentroRevisionResponse,
  DetalleColaboradorQuery,
  DetalleColaboradorResponse,
  EficaciaPlataformaQuery,
  EficaciaPlataformaResponse,
  EventoHistorico,
  FichaRelevanteItem,
  FilaAvanceCurso,
  FilaCentroRevisionEntrevistaIa,
  FilaCentroRevisionTransversal,
  HistoricoClienteQuery,
  HistoricoClienteResponse,
  IntentoBloqueResumen,
  IntentoEntrevistaIaResumen,
  IntentoTransversalResumen,
  InventarioSkillItem,
  InventarioSkillsQuery,
  InventarioSkillsResponse,
  ItemPlanReporte,
  MotivoRevisionTransversal,
  ObservacionFrecuente,
  ReutilizacionCatalogoQuery,
  ReutilizacionCatalogoResponse,
  SkillBrechaItem,
  TipoAlerta,
  UmbralesBrechas,
} from "@nexott-learn/shared-types"
import { Prisma, TipoReporteCache } from "@prisma/client"
import { apiErrorCodes } from "../common/errors/api-error.codes"
import { type Paginated, buildPaginatedResponse, resolvePaginacion } from "../common/http/paginated"
import { PrismaService } from "../common/prisma/prisma.service"
import { PlanPersonalService } from "../plan-personal/plan-personal.service"
import { ReporteCacheService } from "./reporte-cache.service"
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
  UMBRAL_INVENTARIO_EXCELENCIA,
  UMBRAL_INVENTARIO_NO_CUMPLE,
  esSnapshotFotografiaV1,
  esUmbralesLogro,
} from "./reportes.types"

const MS_DIA = 86_400_000
const MESES_REUTILIZACION_DEFAULT = 12

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
    private readonly cache: ReporteCacheService,
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

  // ===========================================================================
  // SLICE 11 P11c — Estrategicos cache + recalculo (D-S11-C1..C7).
  // ===========================================================================

  /**
   * E1 — GET /reportes/eficacia-plataforma (D78, D-S11-C3).
   *
   * Calcula correlacion entre prediccion del sistema (`estado_asignado`
   * APTO/NO_APTO) y resultado real con cliente (`resultado_entrevista_cliente`).
   * Usa cache lazy revalidate-on-miss (24h). Si `presentadosCliente=0` devuelve
   * `correlacion=null` + `meta.warning='sin-presentados-cliente'`.
   */
  async eficaciaPlataforma(query: EficaciaPlataformaQuery): Promise<EficaciaPlataformaResponse> {
    return this.obtenerEstrategicoConCache(
      TipoReporteCache.EFICACIA_PLATAFORMA,
      this.scopeEficacia(query),
      () => this.recalcularEficaciaPlataforma(query),
    )
  }

  /**
   * E2 — GET /reportes/historico-cliente (D93). `clienteId` requerido.
   */
  async historicoCliente(query: HistoricoClienteQuery): Promise<HistoricoClienteResponse> {
    await this.assertClienteExiste(query.clienteId)
    return this.obtenerEstrategicoConCache(
      TipoReporteCache.HISTORICO_CLIENTE,
      this.scopeHistoricoCliente(query),
      () => this.recalcularHistoricoCliente(query),
    )
  }

  /**
   * E3 — GET /reportes/inventario-skills. Conteo cualitativo por skill.
   */
  async inventarioSkills(query: InventarioSkillsQuery): Promise<InventarioSkillsResponse> {
    return this.obtenerEstrategicoConCache(
      TipoReporteCache.INVENTARIO_SKILLS,
      this.scopeInventarioSkills(query),
      () => this.recalcularInventarioSkills(query),
    )
  }

  /**
   * E4 — GET /reportes/reutilizacion-catalogo. Ranking modulos + skills.
   */
  async reutilizacionCatalogo(
    query: ReutilizacionCatalogoQuery,
  ): Promise<ReutilizacionCatalogoResponse> {
    return this.obtenerEstrategicoConCache(
      TipoReporteCache.REUTILIZACION_CATALOGO,
      this.scopeReutilizacion(query),
      () => this.recalcularReutilizacionCatalogo(query),
    )
  }

  /**
   * Endpoint interno usado por el cron nocturno (D-S11-C2). Toma un `tipo` y
   * un scope (queryParams normalizados) y recalcula+guarda. Se valida el shape
   * minimo del scope antes de despachar — un scope corrupto en
   * `consultas_logs` no debe propagarse como error de cron.
   */
  async recalcularYGuardarPorTipo(
    tipo: TipoReporteCache,
    scope: Record<string, unknown>,
  ): Promise<void> {
    switch (tipo) {
      case TipoReporteCache.EFICACIA_PLATAFORMA: {
        const query = this.coerceEficaciaScope(scope)
        await this.recalcularEficaciaPlataforma(query)
        return
      }
      case TipoReporteCache.HISTORICO_CLIENTE: {
        const query = this.coerceHistoricoScope(scope)
        if (!query) {
          return
        }
        await this.recalcularHistoricoCliente(query)
        return
      }
      case TipoReporteCache.INVENTARIO_SKILLS: {
        const query = this.coerceInventarioScope(scope)
        await this.recalcularInventarioSkills(query)
        return
      }
      case TipoReporteCache.REUTILIZACION_CATALOGO: {
        const query = this.coerceReutilizacionScope(scope)
        await this.recalcularReutilizacionCatalogo(query)
        return
      }
      default:
        return
    }
  }

  // ---------------------------------------------------------------------------
  // Dispatcher cache lazy revalidate-on-miss
  // ---------------------------------------------------------------------------

  private async obtenerEstrategicoConCache<
    T extends { readonly meta: { frescura: string; scopeHash: string; warning?: string } },
  >(
    tipo: TipoReporteCache,
    scope: Record<string, unknown>,
    recalcular: () => Promise<T>,
  ): Promise<T> {
    const hit = await this.cache.obtener<T>(tipo, scope)
    if (hit) {
      return {
        ...hit.payload,
        meta: {
          ...hit.payload.meta,
          frescura: hit.frescura.toISOString(),
          scopeHash: hit.scopeHash,
        },
      } as T
    }
    const payload = await recalcular()
    const { frescura, scopeHash } = await this.cache.guardar(tipo, scope, payload)
    return {
      ...payload,
      meta: { ...payload.meta, frescura: frescura.toISOString(), scopeHash },
    } as T
  }

  // ---------------------------------------------------------------------------
  // E1 — eficacia-plataforma
  // ---------------------------------------------------------------------------

  private scopeEficacia(query: EficaciaPlataformaQuery): Record<string, unknown> {
    return {
      tipo: "EFICACIA_PLATAFORMA",
      desde: query.desde?.toISOString() ?? null,
      hasta: query.hasta?.toISOString() ?? null,
      clienteId: query.clienteId ?? null,
    }
  }

  private async recalcularEficaciaPlataforma(
    query: EficaciaPlataformaQuery,
  ): Promise<EficaciaPlataformaResponse> {
    const where: Prisma.AsignacionCursoWhereInput = {
      rol: "ASIGNADO",
      ...(query.clienteId ? { curso: { clienteId: query.clienteId } } : {}),
      ...(query.desde || query.hasta
        ? {
            fechaCierre: {
              ...(query.desde ? { gte: query.desde } : {}),
              ...(query.hasta ? { lte: query.hasta } : {}),
            },
          }
        : {}),
    }

    const asignaciones = await this.prisma.asignacionCurso.findMany({
      where,
      select: {
        estadoAsignado: true,
        resultadoEntrevistaCliente: true,
        observacionesCliente: true,
      },
    })

    const agregado = agregarEficacia(asignaciones)
    const observacionesFrecuentes = topObservaciones(agregado.observaciones, 5)
    const correlacion =
      agregado.presentadosCliente === 0
        ? null
        : Number(
            ((agregado.aptoPaso + agregado.noAptoNoPaso) / agregado.presentadosCliente).toFixed(4),
          )

    const meta: EficaciaPlataformaResponse["meta"] = {
      frescura: new Date().toISOString(),
      scopeHash: "",
      ...(agregado.presentadosCliente === 0 ? { warning: "sin-presentados-cliente" } : {}),
    }

    return {
      presentadosCliente: agregado.presentadosCliente,
      aptos: {
        total: agregado.aptoTotal,
        pasaron: agregado.aptoPaso,
        noPasaron: agregado.aptoNoPaso,
        pendientes: agregado.aptoPendiente,
      },
      noAptos: {
        total: agregado.noAptoTotal,
        presentadosIgual: agregado.noAptoPaso + agregado.noAptoNoPaso,
        pasaronIgual: agregado.noAptoPaso,
      },
      correlacion,
      observacionesFrecuentes,
      meta,
    }
  }

  private coerceEficaciaScope(scope: Record<string, unknown>): EficaciaPlataformaQuery {
    return {
      desde: coerceDateOrUndefined(scope.desde),
      hasta: coerceDateOrUndefined(scope.hasta),
      clienteId: typeof scope.clienteId === "string" ? scope.clienteId : undefined,
      format: "json",
    }
  }

  // ---------------------------------------------------------------------------
  // E2 — historico-cliente
  // ---------------------------------------------------------------------------

  private scopeHistoricoCliente(query: HistoricoClienteQuery): Record<string, unknown> {
    return {
      tipo: "HISTORICO_CLIENTE",
      clienteId: query.clienteId,
      desde: query.desde?.toISOString() ?? null,
      hasta: query.hasta?.toISOString() ?? null,
    }
  }

  private async assertClienteExiste(clienteId: string): Promise<void> {
    const cliente = await this.prisma.cliente.findUnique({
      where: { id: clienteId },
      select: { id: true },
    })
    if (!cliente) {
      throw new NotFoundException({
        code: apiErrorCodes.clienteNoEncontrado,
        message: "Cliente no encontrado.",
      })
    }
  }

  private async recalcularHistoricoCliente(
    query: HistoricoClienteQuery,
  ): Promise<HistoricoClienteResponse> {
    const filtroFecha =
      query.desde || query.hasta
        ? {
            ...(query.desde ? { gte: query.desde } : {}),
            ...(query.hasta ? { lte: query.hasta } : {}),
          }
        : undefined

    const cursos = await this.prisma.curso.findMany({
      where: {
        clienteId: query.clienteId,
        ...(filtroFecha ? { fechaCierre: filtroFecha } : {}),
      },
      select: {
        id: true,
        titulo: true,
        asignaciones: {
          where: { rol: "ASIGNADO" },
          select: {
            estadoAsignado: true,
            resultadoEntrevistaCliente: true,
            observacionesCliente: true,
          },
        },
      },
    })

    const observacionesAgrupadas = new Map<string, number>()
    const items = cursos.map((curso) => {
      const { presentados, aceptados } = agregarCursoHistorico(
        curso.asignaciones,
        observacionesAgrupadas,
      )
      const porcentaje =
        presentados === 0 ? 0 : Number(((aceptados / presentados) * 100).toFixed(2))
      return {
        cursoId: curso.id,
        titulo: curso.titulo,
        presentados,
        aceptados,
        porcentajeAceptacion: porcentaje,
      }
    })

    return {
      clienteId: query.clienteId,
      periodo: {
        desde: query.desde?.toISOString() ?? null,
        hasta: query.hasta?.toISOString() ?? null,
      },
      cursos: items,
      observacionesFrecuentes: topObservaciones(observacionesAgrupadas, 5),
      meta: { frescura: new Date().toISOString(), scopeHash: "" },
    }
  }

  private coerceHistoricoScope(scope: Record<string, unknown>): HistoricoClienteQuery | null {
    if (typeof scope.clienteId !== "string") {
      return null
    }
    return {
      clienteId: scope.clienteId,
      desde: coerceDateOrUndefined(scope.desde),
      hasta: coerceDateOrUndefined(scope.hasta),
      format: "json",
    }
  }

  // ---------------------------------------------------------------------------
  // E3 — inventario-skills
  // ---------------------------------------------------------------------------

  private scopeInventarioSkills(query: InventarioSkillsQuery): Record<string, unknown> {
    return {
      tipo: "INVENTARIO_SKILLS",
      areaId: query.areaId ?? null,
      skillIds: query.skillIds ? [...query.skillIds].sort() : null,
      umbralCumple: query.umbralCumple,
    }
  }

  private async recalcularInventarioSkills(
    query: InventarioSkillsQuery,
  ): Promise<InventarioSkillsResponse> {
    const where: Prisma.SkillWhereInput = {
      estado: "ACTIVA",
      ...(query.areaId ? { areaId: query.areaId } : {}),
      ...(query.skillIds && query.skillIds.length > 0 ? { id: { in: [...query.skillIds] } } : {}),
    }
    const skills = await this.prisma.skill.findMany({
      where,
      select: {
        id: true,
        etiquetaVisible: true,
        areaId: true,
        notasSkill: { select: { notaActual: true } },
      },
    })

    const items: InventarioSkillItem[] = skills.map((skill) => {
      const conteo = clasificarNotas(skill.notasSkill, query.umbralCumple)
      return {
        skillId: skill.id,
        etiqueta: skill.etiquetaVisible,
        areaId: skill.areaId,
        totalColaboradores: skill.notasSkill.length,
        porEtiquetaCualitativa: conteo,
      }
    })

    return {
      skills: items,
      meta: { frescura: new Date().toISOString(), scopeHash: "" },
    }
  }

  private coerceInventarioScope(scope: Record<string, unknown>): InventarioSkillsQuery {
    const skillIdsRaw = scope.skillIds
    const skillIds = Array.isArray(skillIdsRaw)
      ? (skillIdsRaw.filter((v): v is string => typeof v === "string") as readonly string[])
      : undefined
    return {
      areaId: typeof scope.areaId === "string" ? scope.areaId : undefined,
      skillIds,
      umbralCumple: typeof scope.umbralCumple === "number" ? scope.umbralCumple : 70,
      format: "json",
    }
  }

  // ---------------------------------------------------------------------------
  // E4 — reutilizacion-catalogo
  // ---------------------------------------------------------------------------

  private scopeReutilizacion(query: ReutilizacionCatalogoQuery): Record<string, unknown> {
    return {
      tipo: "REUTILIZACION_CATALOGO",
      desde: query.desde?.toISOString() ?? null,
      hasta: query.hasta?.toISOString() ?? null,
    }
  }

  private async recalcularReutilizacionCatalogo(
    query: ReutilizacionCatalogoQuery,
  ): Promise<ReutilizacionCatalogoResponse> {
    const desde = query.desde ?? new Date(Date.now() - MESES_REUTILIZACION_DEFAULT * 30 * MS_DIA)
    const hasta = query.hasta ?? new Date()

    const cursos = await this.prisma.curso.findMany({
      where: { createdAt: { gte: desde, lte: hasta } },
      select: {
        id: true,
        modulosHabilitados: { select: { moduloId: true } },
        skillsExigidas: { select: { skillId: true } },
      },
    })

    const moduloAgregado = new Map<string, { veces: number; cursos: Set<string> }>()
    const skillAgregado = new Map<string, { veces: number; cursos: Set<string> }>()

    for (const curso of cursos) {
      for (const m of curso.modulosHabilitados) {
        const acc = moduloAgregado.get(m.moduloId) ?? { veces: 0, cursos: new Set<string>() }
        acc.veces += 1
        acc.cursos.add(curso.id)
        moduloAgregado.set(m.moduloId, acc)
      }
      for (const s of curso.skillsExigidas) {
        const acc = skillAgregado.get(s.skillId) ?? { veces: 0, cursos: new Set<string>() }
        acc.veces += 1
        acc.cursos.add(curso.id)
        skillAgregado.set(s.skillId, acc)
      }
    }

    const moduloIds = [...moduloAgregado.keys()]
    const skillIds = [...skillAgregado.keys()]
    const [modulos, skills] = await Promise.all([
      moduloIds.length === 0
        ? Promise.resolve([] as { id: string; titulo: string }[])
        : this.prisma.modulo.findMany({
            where: { id: { in: moduloIds } },
            select: { id: true, titulo: true },
          }),
      skillIds.length === 0
        ? Promise.resolve([] as { id: string; etiquetaVisible: string }[])
        : this.prisma.skill.findMany({
            where: { id: { in: skillIds } },
            select: { id: true, etiquetaVisible: true },
          }),
    ])

    const itemsModulos = modulos
      .map((m) => {
        const acc = moduloAgregado.get(m.id)
        return {
          moduloId: m.id,
          titulo: m.titulo,
          vecesUsado: acc?.veces ?? 0,
          cursosUnicos: acc?.cursos.size ?? 0,
        }
      })
      .sort((a, b) => b.vecesUsado - a.vecesUsado)

    const itemsSkills = skills
      .map((s) => {
        const acc = skillAgregado.get(s.id)
        return {
          skillId: s.id,
          etiqueta: s.etiquetaVisible,
          vecesExigida: acc?.veces ?? 0,
          cursosUnicos: acc?.cursos.size ?? 0,
        }
      })
      .sort((a, b) => b.vecesExigida - a.vecesExigida)

    return {
      modulos: itemsModulos,
      skills: itemsSkills,
      meta: { frescura: new Date().toISOString(), scopeHash: "" },
    }
  }

  private coerceReutilizacionScope(scope: Record<string, unknown>): ReutilizacionCatalogoQuery {
    return {
      desde: coerceDateOrUndefined(scope.desde),
      hasta: coerceDateOrUndefined(scope.hasta),
      format: "json",
    }
  }
}

function topObservaciones(
  agrupadas: Map<string, number>,
  limite: number,
): readonly ObservacionFrecuente[] {
  return [...agrupadas.entries()]
    .map(([texto, casos]) => ({ texto, casos }))
    .sort((a, b) => b.casos - a.casos)
    .slice(0, limite)
}

interface EficaciaAcum {
  aptoTotal: number
  aptoPaso: number
  aptoNoPaso: number
  aptoPendiente: number
  noAptoTotal: number
  noAptoPaso: number
  noAptoNoPaso: number
  presentadosCliente: number
  observaciones: Map<string, number>
}

interface FilaEficacia {
  readonly estadoAsignado: string | null
  readonly resultadoEntrevistaCliente: string | null
  readonly observacionesCliente: string | null
}

function agregarEficacia(filas: readonly FilaEficacia[]): EficaciaAcum {
  const acc: EficaciaAcum = {
    aptoTotal: 0,
    aptoPaso: 0,
    aptoNoPaso: 0,
    aptoPendiente: 0,
    noAptoTotal: 0,
    noAptoPaso: 0,
    noAptoNoPaso: 0,
    presentadosCliente: 0,
    observaciones: new Map<string, number>(),
  }
  for (const fila of filas) {
    const presentado =
      fila.resultadoEntrevistaCliente === "PASO" || fila.resultadoEntrevistaCliente === "NO_PASO"
    if (presentado) {
      acc.presentadosCliente += 1
    }
    if (fila.estadoAsignado === "APTO") {
      acumApto(acc, fila.resultadoEntrevistaCliente)
    } else if (fila.estadoAsignado === "NO_APTO") {
      acumNoApto(acc, fila.resultadoEntrevistaCliente)
    }
    if (presentado && fila.observacionesCliente) {
      const txt = fila.observacionesCliente.trim()
      if (txt.length > 0) {
        acc.observaciones.set(txt, (acc.observaciones.get(txt) ?? 0) + 1)
      }
    }
  }
  return acc
}

function acumApto(acc: EficaciaAcum, resultado: string | null): void {
  acc.aptoTotal += 1
  if (resultado === "PASO") {
    acc.aptoPaso += 1
  } else if (resultado === "NO_PASO") {
    acc.aptoNoPaso += 1
  } else {
    acc.aptoPendiente += 1
  }
}

function acumNoApto(acc: EficaciaAcum, resultado: string | null): void {
  acc.noAptoTotal += 1
  if (resultado === "PASO") {
    acc.noAptoPaso += 1
  } else if (resultado === "NO_PASO") {
    acc.noAptoNoPaso += 1
  }
}

interface FilaHistoricoCliente {
  readonly resultadoEntrevistaCliente: string | null
  readonly observacionesCliente: string | null
}

function agregarCursoHistorico(
  asignaciones: readonly FilaHistoricoCliente[],
  observaciones: Map<string, number>,
): { presentados: number; aceptados: number } {
  let presentados = 0
  let aceptados = 0
  for (const asig of asignaciones) {
    if (asig.resultadoEntrevistaCliente === "PASO") {
      presentados += 1
      aceptados += 1
    } else if (asig.resultadoEntrevistaCliente === "NO_PASO") {
      presentados += 1
    }
    if (asig.observacionesCliente) {
      const txt = asig.observacionesCliente.trim()
      if (txt.length > 0) {
        observaciones.set(txt, (observaciones.get(txt) ?? 0) + 1)
      }
    }
  }
  return { presentados, aceptados }
}

interface NotaSkillRow {
  readonly notaActual: { toString(): string } | number | null
}

function clasificarNotas(
  notas: readonly NotaSkillRow[],
  umbralCumple: number,
): { excelencia: number; solido: number; enDesarrollo: number; noCumple: number } {
  let excelencia = 0
  let solido = 0
  let enDesarrollo = 0
  let noCumple = 0
  for (const nota of notas) {
    const valor = nota.notaActual === null ? null : Number(nota.notaActual)
    if (valor === null || valor < UMBRAL_INVENTARIO_NO_CUMPLE) {
      noCumple += 1
    } else if (valor >= UMBRAL_INVENTARIO_EXCELENCIA) {
      excelencia += 1
    } else if (valor >= umbralCumple) {
      solido += 1
    } else {
      enDesarrollo += 1
    }
  }
  return { excelencia, solido, enDesarrollo, noCumple }
}

function coerceDateOrUndefined(value: unknown): Date | undefined {
  if (typeof value !== "string" || value.length === 0) {
    return undefined
  }
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? undefined : d
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
