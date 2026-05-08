// Iter 10 · MAESTRO §13.1-13.5, A29 · servicio admin de seguimiento.
// Read-only. Reusa RecalculoService.snapshotAgregadosPorCurso (D-10.1).
//
// E1 GET /admin/cursos/:id/seguimiento/matriz?tab=...
// E2 GET /admin/cursos/:id/seguimiento/kpis?tab=...
// E3 GET /admin/cursos/:id/seguimiento/celda/:inscripcionId/:areaId?tab=...

import { ConflictException, Injectable, NotFoundException } from "@nestjs/common"
import type {
  CeldaActualDetalle,
  CeldaActualEntregaReciente,
  CeldaActualModulo,
  CeldaDetalleResponse,
  CeldaInicialDetalle,
  CohorteAreasResponse,
  CohorteDistribucionResponse,
  CohorteSerieResponse,
  EstadoSeguimiento,
  KpisCursoActual,
  KpisCursoInicial,
  KpisCursoResponse,
  MatrizCursoResponse,
  MatrizFila,
  SeguimientoMatrizQuery,
  SeguimientoTab,
  SemaforoCelda,
} from "@nexott-learn/shared-types"
import { Prisma } from "@prisma/client"
import { PrismaService } from "../../common/prisma/prisma.service"
import { RecalculoService } from "../recalculo/recalculo.service"
import type { AgregadosInscripcion } from "../recalculo/recalculo.types"
import {
  type AreaCursoParaClasificador,
  type ModuloAreaParaClasificador,
  clasificarEstadoSeguimiento,
} from "./seguimiento-clasificador"

export const ERROR_CURSO_NO_ENCONTRADO_SEG = "CURSO_NO_ENCONTRADO"
export const ERROR_CURSO_BORRADOR_SEG = "CURSO_EN_BORRADOR"
export const ERROR_CURSO_DEMASIADO_GRANDE = "CURSO_DEMASIADO_GRANDE"
export const ERROR_INSCRIPCION_NO_ENCONTRADA_SEG = "INSCRIPCION_NO_ENCONTRADA"
export const ERROR_AREA_NO_ENCONTRADA_SEG = "AREA_NO_ENCONTRADA"

const LIMITE_INSCRIPCIONES_MATRIZ = 200

@Injectable()
export class SeguimientoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly recalculo: RecalculoService,
  ) {}

  // ────────────────────────────────────────────────────────────────
  // E1 · matriz
  // ────────────────────────────────────────────────────────────────

  async obtenerMatriz(
    cursoId: string,
    query: SeguimientoMatrizQuery,
  ): Promise<MatrizCursoResponse> {
    const curso = await this.requireCursoMutable(cursoId)
    const { inscripciones, areas, asignacionesPorInscripcion } = await this.cargarCursoBase(cursoId)
    if (inscripciones.length > LIMITE_INSCRIPCIONES_MATRIZ) {
      throw new ConflictException(ERROR_CURSO_DEMASIADO_GRANDE)
    }

    // EvaluacionInicial se carga SIEMPRE (no solo en tab="inicial"): en tab
    // "actual" alimenta MatrizCelda.notaInicial y MatrizFila.trayectoriaResumen
    // para que el frontend pueda mostrar la trayectoria "inicial → actual" sin
    // ramificar por tab.
    const evaluacionesIniciales = await this.prisma.evaluacionInicial.findMany({
      where: { inscripcionId: { in: inscripciones.map((i) => i.id) } },
      select: { inscripcionId: true, areaId: true, puntaje: true },
    })
    const inicialPorInscripcion = new Map<string, Map<string, number>>()
    for (const ev of evaluacionesIniciales) {
      let perIns = inicialPorInscripcion.get(ev.inscripcionId)
      if (!perIns) {
        perIns = new Map()
        inicialPorInscripcion.set(ev.inscripcionId, perIns)
      }
      perIns.set(ev.areaId, ev.puntaje)
    }

    const agregadosPorIns =
      query.tab === "actual" ? await this.recalculo.snapshotAgregadosPorCurso(cursoId) : null

    // Curso config para el clasificador (transversal + entrevistaIA + umbral por area).
    const areasParaClasificador: AreaCursoParaClasificador[] = areas.map((a) => ({
      areaId: a.id,
      umbralArea: a.puntajeObjetivo,
    }))
    const transversalConfig = curso.proyectoTransversal
      ? {
          umbralAprobacion: curso.proyectoTransversal.umbralAprobacion,
          umbralPorInscripcion: await this.cargarUltimaNotaTransversalPorInscripcion(
            curso.proyectoTransversal.id,
            inscripciones.map((i) => i.id),
          ),
        }
      : null
    const entrevistaConfig = curso.entrevistaIAConfig
      ? await this.cargarEntrevistaIAAprobadaPorInscripcion(
          curso.entrevistaIAConfig.id,
          inscripciones.map((i) => i.id),
        )
      : null

    const filas: MatrizFila[] = inscripciones.map((ins) =>
      construirFilaMatriz({
        ins,
        tab: query.tab,
        areas,
        notasIniciales: inicialPorInscripcion.get(ins.id) ?? new Map<string, number>(),
        agregados: agregadosPorIns?.get(ins.id) ?? null,
        asignaciones: asignacionesPorInscripcion.get(ins.id) ?? [],
        areasParaClasificador,
        transversalUltimaNota:
          curso.proyectoTransversal && transversalConfig
            ? (transversalConfig.umbralPorInscripcion.get(ins.id) ?? null)
            : null,
        transversalUmbral: curso.proyectoTransversal?.umbralAprobacion ?? null,
        entrevistaActiva: curso.entrevistaIAConfig !== null,
        entrevistaAprobada: entrevistaConfig?.get(ins.id) === true,
      }),
    )

    const filtrasFinales = aplicarFiltros(filas, query)

    return {
      cursoId,
      tab: query.tab,
      areas: areas.map((a) => ({
        id: a.id,
        nombre: a.nombre,
        peso: Number(a.peso),
        umbral: a.puntajeObjetivo,
      })),
      filas: filtrasFinales,
    }
  }

  // ────────────────────────────────────────────────────────────────
  // E2 · KPIs
  // ────────────────────────────────────────────────────────────────

  async obtenerKpis(cursoId: string, tab: SeguimientoTab): Promise<KpisCursoResponse> {
    const matriz = await this.obtenerMatriz(cursoId, { tab, search: undefined, estado: "all" })
    if (tab === "actual") {
      return this.kpisActual(matriz)
    }
    return this.kpisInicial(cursoId, matriz)
  }

  private kpisActual(matriz: MatrizCursoResponse): KpisCursoActual {
    const total = matriz.filas.length
    const aptos = matriz.filas.filter(
      (f) => f.estadoSeguimiento === "Apto" || f.estadoSeguimiento === "Completado",
    ).length
    const enRiesgo = matriz.filas.filter((f) => f.estadoSeguimiento === "EnRiesgo").length
    const completados = matriz.filas.filter((f) => f.estadoSeguimiento === "Completado").length
    return {
      tab: "actual",
      cumplimientoPct: total === 0 ? 0 : redondear2((aptos * 100) / total),
      enRiesgo,
      // aptosEntrevista se calcula en una segunda lectura puntual abajo.
      aptosEntrevista: 0,
      completados,
    }
  }

  private async kpisInicial(
    cursoId: string,
    matriz: MatrizCursoResponse,
  ): Promise<KpisCursoInicial> {
    // Diagnosticados = inscripciones con >=1 EvaluacionInicial.
    const inscripcionesIds = matriz.filas.map((f) => f.inscripcionId)
    const evaluaciones = await this.prisma.evaluacionInicial.findMany({
      where: { inscripcionId: { in: inscripcionesIds } },
      select: { inscripcionId: true, areaId: true, puntaje: true },
    })
    const inscripcionesDiagnosticadas = new Set(evaluaciones.map((e) => e.inscripcionId))

    // Sin diagnostico: SOLICITUD sin EvaluacionInicial completa. LIBRE NO entra.
    const inscripcionesSolicitud = await this.prisma.inscripcion.findMany({
      where: { cursoId, tipo: "SOLICITUD", estado: "ACTIVA" },
      select: { id: true },
    })
    const sinDiagnostico = inscripcionesSolicitud.filter(
      (i) => !inscripcionesDiagnosticadas.has(i.id),
    ).length

    // Areas con brecha = areas con alguna inscripcion donde notaInicial < umbral.
    const areasUmbral = new Map(matriz.areas.map((a) => [a.id, a.umbral]))
    const areasConBrecha = new Set<string>()
    for (const ev of evaluaciones) {
      const umbral = areasUmbral.get(ev.areaId)
      if (umbral !== undefined && ev.puntaje < umbral) {
        areasConBrecha.add(ev.areaId)
      }
    }

    // Cumplimiento promedio inicial = avg(cobertura) sobre inscripciones diagnosticadas.
    const filasDiag = matriz.filas.filter((f) => inscripcionesDiagnosticadas.has(f.inscripcionId))
    const cumplimientoPromedioInicial =
      filasDiag.length === 0
        ? 0
        : redondear2(filasDiag.reduce((acc, f) => acc + f.cobertura, 0) / filasDiag.length)

    return {
      tab: "inicial",
      diagnosticados: inscripcionesDiagnosticadas.size,
      sinDiagnostico,
      areasConBrecha: areasConBrecha.size,
      cumplimientoPromedioInicial,
    }
  }

  // KPI "aptosEntrevista" requiere conocer si el curso tiene entrevista IA y
  // si la inscripcion AUN no la tiene aprobada — calcular esto correctamente
  // requiere mas que el matriz (el matriz ya colapsa esa info en
  // estadoSeguimiento). Lo recalculamos puntualmente cuando tab=actual.
  async obtenerKpisActualConEntrevista(cursoId: string): Promise<KpisCursoActual> {
    const matriz = await this.obtenerMatriz(cursoId, {
      tab: "actual",
      search: undefined,
      estado: "all",
    })
    const total = matriz.filas.length
    const aptos = matriz.filas.filter(
      (f) => f.estadoSeguimiento === "Apto" || f.estadoSeguimiento === "Completado",
    ).length
    const enRiesgo = matriz.filas.filter((f) => f.estadoSeguimiento === "EnRiesgo").length
    const completados = matriz.filas.filter((f) => f.estadoSeguimiento === "Completado").length

    const cursoEntrevista = await this.prisma.curso.findUnique({
      where: { id: cursoId },
      select: { entrevistaIAConfig: { select: { id: true } } },
    })
    let aptosEntrevista = 0
    if (cursoEntrevista?.entrevistaIAConfig) {
      const aptosFilas = matriz.filas.filter((f) => f.estadoSeguimiento === "Apto")
      const aprobadasPorIns = await this.cargarEntrevistaIAAprobadaPorInscripcion(
        cursoEntrevista.entrevistaIAConfig.id,
        aptosFilas.map((f) => f.inscripcionId),
      )
      aptosEntrevista = aptosFilas.filter(
        (f) => aprobadasPorIns.get(f.inscripcionId) !== true,
      ).length
    }

    return {
      tab: "actual",
      cumplimientoPct: total === 0 ? 0 : redondear2((aptos * 100) / total),
      enRiesgo,
      aptosEntrevista,
      completados,
    }
  }

  // ────────────────────────────────────────────────────────────────
  // Cohorte · charts agregados (B/C/D)
  // ────────────────────────────────────────────────────────────────
  //
  // Reusan obtenerMatriz(tab="actual", estado="all"). Para 200 inscripciones el
  // costo es despreciable y el front carga los 3 charts juntos. Si en el futuro
  // hace falta optimizar, cada endpoint puede consultar Prisma directo.

  async obtenerCohorteSerie(cursoId: string): Promise<CohorteSerieResponse> {
    const matriz = await this.obtenerMatriz(cursoId, { tab: "actual", estado: "all" })
    if (matriz.filas.length === 0) {
      return {
        puntos: [
          { etiqueta: "Inicial", valor: 0 },
          { etiqueta: "Hoy", valor: 0 },
        ],
      }
    }
    const pesosAreas = matriz.areas.map((a) => ({ areaId: a.id, peso: a.peso, umbral: a.umbral }))
    let sumaInicial = 0
    let sumaActual = 0
    for (const fila of matriz.filas) {
      const notasInicial = new Map(fila.celdas.map((c) => [c.areaId, c.notaInicial]))
      sumaInicial += calcularCobertura(pesosAreas, notasInicial)
      sumaActual += fila.cobertura
    }
    const n = matriz.filas.length
    return {
      puntos: [
        { etiqueta: "Inicial", valor: redondear2(sumaInicial / n) },
        { etiqueta: "Hoy", valor: redondear2(sumaActual / n) },
      ],
    }
  }

  async obtenerCohorteAreas(cursoId: string): Promise<CohorteAreasResponse> {
    const matriz = await this.obtenerMatriz(cursoId, { tab: "actual", estado: "all" })
    const areas = matriz.areas.map((a) => {
      let suma = 0
      let n = 0
      for (const fila of matriz.filas) {
        const celda = fila.celdas.find((c) => c.areaId === a.id)
        if (celda?.nota !== null && celda?.nota !== undefined) {
          suma += celda.nota
          n += 1
        }
      }
      return {
        areaId: a.id,
        nombre: a.nombre,
        promedio: n === 0 ? 0 : redondear2(suma / n),
        objetivo: a.umbral,
      }
    })
    return { areas }
  }

  async obtenerCohorteDistribucion(cursoId: string): Promise<CohorteDistribucionResponse> {
    const matriz = await this.obtenerMatriz(cursoId, { tab: "actual", estado: "all" })
    const orden: readonly EstadoSeguimiento[] = ["Apto", "EnRuta", "EnRiesgo", "Completado"]
    const conteo = new Map<EstadoSeguimiento, number>(orden.map((e) => [e, 0]))
    for (const fila of matriz.filas) {
      conteo.set(fila.estadoSeguimiento, (conteo.get(fila.estadoSeguimiento) ?? 0) + 1)
    }
    return {
      distribucion: orden.map((estado) => ({ estado, cantidad: conteo.get(estado) ?? 0 })),
    }
  }

  // ────────────────────────────────────────────────────────────────
  // E3 · celda
  // ────────────────────────────────────────────────────────────────

  async obtenerCelda(
    cursoId: string,
    inscripcionId: string,
    areaId: string,
    tab: SeguimientoTab,
  ): Promise<CeldaDetalleResponse> {
    await this.requireCursoMutable(cursoId)
    const inscripcion = await this.prisma.inscripcion.findFirst({
      where: { id: inscripcionId, cursoId },
      select: { id: true },
    })
    if (!inscripcion) {
      throw new NotFoundException(ERROR_INSCRIPCION_NO_ENCONTRADA_SEG)
    }
    const area = await this.prisma.cursoArea.findFirst({
      where: { cursoId, areaId },
      select: { areaId: true, puntajeObjetivo: true },
    })
    if (!area) {
      throw new NotFoundException(ERROR_AREA_NO_ENCONTRADA_SEG)
    }

    if (tab === "inicial") {
      return this.detalleCeldaInicial(inscripcionId, areaId)
    }
    return this.detalleCeldaActual(inscripcionId, areaId, area.puntajeObjetivo)
  }

  private async detalleCeldaInicial(
    inscripcionId: string,
    areaId: string,
  ): Promise<CeldaInicialDetalle> {
    const ev = await this.prisma.evaluacionInicial.findUnique({
      // biome-ignore lint/style/useNamingConvention: nombre del where compuesto generado por Prisma
      where: { inscripcionId_areaId: { inscripcionId, areaId } },
      select: {
        puntaje: true,
        observaciones: true,
        capturadaAt: true,
        capturadaPor: { select: { id: true, nombre: true, apellido: true } },
      },
    })
    // Asignacion confirmada del modulo del area (si existe). Filtramos por
    // moduloId IN (modulos del area) para no depender del orden de las
    // asignaciones del inscripto. Asignacion.moduloId es FK suave sin
    // @relation, asi que el JOIN navegable Prisma no esta disponible — usamos
    // IN. La "sugerida" no esta modelada en MVP — devolvemos null.
    const modulosDelArea = await this.prisma.modulo.findMany({
      where: { areaId, archivadoAt: null },
      select: { id: true },
    })
    const asignacionModuloArea =
      modulosDelArea.length === 0
        ? null
        : await this.prisma.asignacion.findFirst({
            where: { inscripcionId, moduloId: { in: modulosDelArea.map((m) => m.id) } },
            select: { tipo: true },
          })
    const asignacionConfirmada: "OBLIGATORIO" | "RECOMENDADO" | "OPCIONAL" | null =
      asignacionModuloArea?.tipo ?? null
    return {
      tab: "inicial",
      nota: ev ? ev.puntaje : null,
      observaciones: ev?.observaciones ?? null,
      capturadaPor: ev?.capturadaPor ?? null,
      capturadaAt: ev ? ev.capturadaAt.toISOString() : null,
      asignacionSugerida: null,
      asignacionConfirmada,
    }
  }

  private async detalleCeldaActual(
    inscripcionId: string,
    areaId: string,
    _umbralArea: number,
  ): Promise<CeldaActualDetalle> {
    const agregados = await this.recalculo.snapshotAgregados(inscripcionId)
    const notaArea = agregados.notasArea.get(areaId) ?? null

    const modulos = await this.prisma.modulo.findMany({
      where: {
        areaId,
        archivadoAt: null,
        curso: { inscripciones: { some: { id: inscripcionId } } },
      },
      select: { id: true, titulo: true },
    })
    const estadosModulo = await this.prisma.estadoModuloInscripcion.findMany({
      where: { inscripcionId, moduloId: { in: modulos.map((m) => m.id) } },
      select: { moduloId: true, estado: true },
    })
    const estadoPorModulo = new Map(estadosModulo.map((e) => [e.moduloId, e.estado]))
    const modulosArea: CeldaActualModulo[] = modulos.map((m) => ({
      id: m.id,
      titulo: m.titulo,
      nota: agregados.notasModulo.get(m.id) ?? null,
      estado: estadoPorModulo.get(m.id) ?? "NO_INICIADO",
    }))

    const entregasBloque = await this.prisma.entregaBloque.findMany({
      where: { inscripcionId, bloque: { seccion: { modulo: { areaId } } } },
      select: {
        id: true,
        bloqueId: true,
        nota: true,
        estado: true,
        enviadaAt: true,
      },
      orderBy: { enviadaAt: "desc" },
      take: 10,
    })
    const entregasRecientes: CeldaActualEntregaReciente[] = entregasBloque.map((e) => ({
      id: e.id,
      bloqueId: e.bloqueId,
      miniProyectoId: null,
      nota: e.nota === null ? null : Number(e.nota),
      enviadaAt: e.enviadaAt.toISOString(),
      estado: e.estado,
    }))

    // Alertas básicas: sin actividad en 7 dias (basado en ultima entrega).
    const alertas: string[] = []
    if (entregasBloque.length > 0) {
      const ultima = entregasBloque[0]?.enviadaAt
      if (ultima) {
        const dias = (Date.now() - ultima.getTime()) / (1000 * 60 * 60 * 24)
        if (dias > 7) {
          alertas.push("sin actividad 7 días")
        }
      }
    } else if (modulos.length > 0) {
      alertas.push("sin actividad en el área")
    }

    return {
      tab: "actual",
      notaArea,
      modulosArea,
      entregasRecientes,
      alertas,
    }
  }

  // ────────────────────────────────────────────────────────────────
  // helpers de carga
  // ────────────────────────────────────────────────────────────────

  private async requireCursoMutable(cursoId: string): Promise<CursoConfigMin> {
    const curso = await this.prisma.curso.findUnique({
      where: { id: cursoId },
      select: {
        id: true,
        estado: true,
        proyectoTransversal: { select: { id: true, umbralAprobacion: true } },
        entrevistaIAConfig: { select: { id: true } },
      },
    })
    if (!curso) {
      throw new NotFoundException(ERROR_CURSO_NO_ENCONTRADO_SEG)
    }
    if (curso.estado === "BORRADOR") {
      throw new ConflictException(ERROR_CURSO_BORRADOR_SEG)
    }
    return curso
  }

  private async cargarCursoBase(cursoId: string): Promise<CursoBase> {
    const inscripciones = await this.prisma.inscripcion.findMany({
      where: { cursoId },
      select: {
        id: true,
        estado: true,
        participante: {
          select: { id: true, nombre: true, apellido: true, email: true },
        },
      },
      orderBy: [{ participante: { apellido: "asc" } }, { participante: { nombre: "asc" } }],
    })
    const cursoAreas = await this.prisma.cursoArea.findMany({
      where: { cursoId },
      select: {
        areaId: true,
        peso: true,
        puntajeObjetivo: true,
        orden: true,
        area: { select: { id: true, nombre: true } },
      },
      orderBy: { orden: "asc" },
    })
    const areas = cursoAreas.map((ca) => ({
      id: ca.areaId,
      nombre: ca.area.nombre,
      peso: ca.peso,
      puntajeObjetivo: ca.puntajeObjetivo,
    }))

    const asignaciones = await this.prisma.asignacion.findMany({
      where: { inscripcionId: { in: inscripciones.map((i) => i.id) } },
      select: { inscripcionId: true, moduloId: true, tipo: true },
    })
    const modulos = await this.prisma.modulo.findMany({
      where: { cursoId },
      select: { id: true, areaId: true },
    })
    const areaPorModulo = new Map(modulos.map((m) => [m.id, m.areaId]))
    const asignacionesPorInscripcion = new Map<
      string,
      Array<{ moduloId: string; areaId: string; tipoAsignacion: AsignacionTipo }>
    >()
    for (const a of asignaciones) {
      const areaId = areaPorModulo.get(a.moduloId)
      if (!areaId) {
        continue
      }
      let lista = asignacionesPorInscripcion.get(a.inscripcionId)
      if (!lista) {
        lista = []
        asignacionesPorInscripcion.set(a.inscripcionId, lista)
      }
      lista.push({ moduloId: a.moduloId, areaId, tipoAsignacion: a.tipo })
    }
    return { inscripciones, areas, asignacionesPorInscripcion }
  }

  private async cargarUltimaNotaTransversalPorInscripcion(
    transversalId: string,
    inscripcionIds: string[],
  ): Promise<Map<string, number>> {
    const entregas = await this.prisma.entregaProyecto.findMany({
      where: {
        inscripcionId: { in: inscripcionIds },
        transversalId,
        estado: "EVALUADA",
        notaFinal: { not: null },
      },
      select: { inscripcionId: true, notaFinal: true, intento: true },
      orderBy: { intento: "desc" },
    })
    const map = new Map<string, number>()
    for (const e of entregas) {
      if (e.notaFinal === null) {
        continue
      }
      if (!map.has(e.inscripcionId)) {
        map.set(e.inscripcionId, Number(e.notaFinal))
      }
    }
    return map
  }

  private async cargarEntrevistaIAAprobadaPorInscripcion(
    configId: string,
    inscripcionIds: string[],
  ): Promise<Map<string, boolean>> {
    const sesiones = await this.prisma.entrevistaIASesion.findMany({
      where: {
        configId,
        inscripcionId: { in: inscripcionIds },
        estado: { in: ["APROBADA", "AJUSTADA_MANUAL"] },
      },
      select: { inscripcionId: true },
    })
    const map = new Map<string, boolean>()
    for (const s of sesiones) {
      map.set(s.inscripcionId, true)
    }
    return map
  }
}

// ──────────────────────────────────────────────────────────────────────
// Helpers puros
// ──────────────────────────────────────────────────────────────────────

export function calcularSemaforo(nota: number | null, umbralArea: number): SemaforoCelda {
  if (nota === null) {
    return "vacio"
  }
  if (nota >= umbralArea) {
    return "verde"
  }
  if (nota <= umbralArea - 10) {
    return "rojo"
  }
  return "amarillo"
}

export function calcularCobertura(
  areas: ReadonlyArray<{ areaId: string; peso: number; umbral: number }>,
  notasPorArea: ReadonlyMap<string, number | null>,
): number {
  let sumaPesos = 0
  let sumaCumple = 0
  for (const a of areas) {
    sumaPesos += a.peso
    const nota = notasPorArea.get(a.areaId) ?? null
    if (nota !== null && nota >= a.umbral) {
      sumaCumple += a.peso
    }
  }
  if (sumaPesos === 0) {
    return 0
  }
  return redondear2((sumaCumple * 100) / sumaPesos)
}

function redondear2(n: number): number {
  return Math.round(n * 100) / 100
}

interface ConstruirFilaArgs {
  ins: {
    id: string
    estado: "ACTIVA" | "COMPLETADA" | "ABANDONADA" | "CERRADO_SIN_COMPLETAR"
    participante: { id: string; nombre: string; apellido: string; email: string }
  }
  tab: SeguimientoTab
  areas: ReadonlyArray<{
    id: string
    nombre: string
    peso: Prisma.Decimal
    puntajeObjetivo: number
  }>
  notasIniciales: ReadonlyMap<string, number>
  agregados: AgregadosInscripcion | null
  asignaciones: ReadonlyArray<{
    moduloId: string
    areaId: string
    tipoAsignacion: AsignacionTipo
  }>
  areasParaClasificador: readonly AreaCursoParaClasificador[]
  transversalUltimaNota: number | null
  transversalUmbral: number | null
  entrevistaActiva: boolean
  entrevistaAprobada: boolean
}

function construirFilaMatriz(args: ConstruirFilaArgs): MatrizFila {
  const { ins, tab, areas, notasIniciales, agregados, asignaciones } = args
  const notasAreaActuales: Map<string, number> = agregados?.notasArea ?? new Map()
  const celdas = areas.map((a) => {
    const inicial = notasIniciales.get(a.id) ?? null
    const nota = tab === "inicial" ? inicial : (notasAreaActuales.get(a.id) ?? null)
    return {
      areaId: a.id,
      nota,
      notaInicial: inicial,
      semaforo: calcularSemaforo(nota, a.puntajeObjetivo),
    }
  })
  const cobertura = calcularCobertura(
    areas.map((a) => ({ areaId: a.id, peso: Number(a.peso), umbral: a.puntajeObjetivo })),
    new Map(celdas.map((c) => [c.areaId, c.nota])),
  )
  // Resumen de trayectoria solo en tab "actual" cuando hay al menos un par
  // (inicial, actual) definido. En tab "inicial" no aplica (nota === inicial).
  let trayectoriaResumen: { deltaPromedio: number } | undefined
  if (tab === "actual") {
    let sumaInicial = 0
    let sumaActual = 0
    let pares = 0
    for (const c of celdas) {
      if (c.notaInicial !== null && c.nota !== null) {
        sumaInicial += c.notaInicial
        sumaActual += c.nota
        pares += 1
      }
    }
    if (pares > 0) {
      trayectoriaResumen = {
        deltaPromedio: redondear2(sumaActual / pares - sumaInicial / pares),
      }
    }
  }
  const modulosClasif: ModuloAreaParaClasificador[] = asignaciones.map((m) => ({
    areaId: m.areaId,
    tipoAsignacion: m.tipoAsignacion,
    notaModulo: agregados?.notasModulo.get(m.moduloId) ?? null,
  }))
  const estadoSeguimiento = clasificarEstadoSeguimiento({
    estadoInscripcion: ins.estado,
    etiqueta: agregados?.etiqueta ?? null,
    areas: args.areasParaClasificador,
    modulos: modulosClasif,
    notasArea: notasAreaActuales,
    transversal:
      args.transversalUmbral !== null
        ? { umbralAprobacion: args.transversalUmbral, ultimaNota: args.transversalUltimaNota }
        : null,
    entrevistaIA: args.entrevistaActiva ? { aprobada: args.entrevistaAprobada } : null,
  })
  return {
    inscripcionId: ins.id,
    participante: {
      id: ins.participante.id,
      nombre: ins.participante.nombre,
      apellido: ins.participante.apellido,
      email: ins.participante.email,
    },
    estadoSeguimiento,
    celdas,
    cobertura,
    ...(trayectoriaResumen ? { trayectoriaResumen } : {}),
  }
}

function aplicarFiltros(filas: MatrizFila[], query: SeguimientoMatrizQuery): MatrizFila[] {
  let resultado = filas
  if (query.estado && query.estado !== "all") {
    const target: EstadoSeguimiento = query.estado
    resultado = resultado.filter((f) => f.estadoSeguimiento === target)
  } else if (!query.estado) {
    // Default: ACTIVA → Apto + EnRuta + EnRiesgo (no Completado).
    resultado = resultado.filter((f) => f.estadoSeguimiento !== "Completado")
  }
  if (query.search) {
    const needle = query.search.toLowerCase()
    resultado = resultado.filter(
      (f) =>
        `${f.participante.nombre} ${f.participante.apellido}`.toLowerCase().includes(needle) ||
        f.participante.email.toLowerCase().includes(needle),
    )
  }
  return resultado
}

// ──────────────────────────────────────────────────────────────────────
// Tipos internos
// ──────────────────────────────────────────────────────────────────────

type AsignacionTipo = "OBLIGATORIO" | "RECOMENDADO" | "OPCIONAL"

interface CursoConfigMin {
  id: string
  estado: "BORRADOR" | "ACTIVO" | "CERRADO"
  proyectoTransversal: { id: string; umbralAprobacion: number } | null
  entrevistaIAConfig: { id: string } | null
}

interface CursoBase {
  inscripciones: Array<{
    id: string
    estado: "ACTIVA" | "COMPLETADA" | "ABANDONADA" | "CERRADO_SIN_COMPLETAR"
    participante: { id: string; nombre: string; apellido: string; email: string }
  }>
  areas: Array<{
    id: string
    nombre: string
    peso: Prisma.Decimal
    puntajeObjetivo: number
  }>
  asignacionesPorInscripcion: Map<
    string,
    Array<{ moduloId: string; areaId: string; tipoAsignacion: AsignacionTipo }>
  >
}

// Re-export del tipo (alias por confort, no se usa fuera).
export type { AgregadosInscripcion }
