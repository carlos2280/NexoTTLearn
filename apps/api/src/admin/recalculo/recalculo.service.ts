// Iter 9.9 · servicio de recalculo encadenado tras evaluar/ajustar
// entregas. MAESTRO §17.3, A26 (idempotencia + cadena).
//
// Cadena:
//   bloque   → seccion → modulo → area → curso → etiqueta
//   miniProy → modulo  → area   → curso → etiqueta
//   transv   → curso   → etiqueta
//
// Notas de diseno:
// - Las notas agregadas (modulo/area/curso/etiqueta) NO se persisten en
//   el schema v2 actual: son derivadas de las entregas. Por eso este
//   servicio:
//     1) recibe un snapshot "antes" (capturado por el caller antes de
//        mutar la entrega),
//     2) calcula el "despues" leyendo la BD (con la entrega ya mutada),
//     3) compara y emite logs RECALCULO_MODULO/AREA/CURSO/ETIQUETA cuando
//        hay diferencia.
// - Idempotencia A26 caso borde 1: si nada cambia → 0 logs.
// - LogActividad.causaId encadena cada log hijo al log que disparo el
//   recalculo (ENTREGA_EVALUADA / NOTA_AJUSTADA_MANUAL / PROYECTO_EVALUADO).
//
// IMPORTANTE: este servicio NO toca PESOS_CAMBIADOS_RETROACTIVO ni
// CURSO_PESOS_RECALCULO_PENDIENTE — esos viven en el flujo A16 (otro iter).

import { Injectable, NotFoundException } from "@nestjs/common"
import { Prisma } from "@prisma/client"
import { derivarEtiquetaLogro, promedioPonderado } from "../../common/calculo-nota"
import { PrismaService } from "../../common/prisma/prisma.service"
import {
  type AgregadosInscripcion,
  type DiffAgregados,
  ENTIDAD_TIPO_INSCRIPCION,
} from "./recalculo.types"

type Tx = Prisma.TransactionClient

interface RecalcularOptions {
  /** Snapshot tomado antes de mutar la entrega. Si no se pasa, se asume
   *  vacio (primer recalculo) y todos los niveles "antes" son null. */
  agregadosAntes?: AgregadosInscripcion
  /** Para encadenar logs hijos al log padre (T02 · causaId). */
  causaLogId?: string
}

interface RecalcularResultado {
  agregadosAntes: AgregadosInscripcion
  agregadosDespues: AgregadosInscripcion
  diff: DiffAgregados
  /** Cantidad de logs RECALCULO_* emitidos. 0 si idempotente. */
  logsEmitidos: number
}

export const ERROR_INSCRIPCION_NO_ENCONTRADA_RECALCULO = "INSCRIPCION_NO_ENCONTRADA"

@Injectable()
export class RecalculoService {
  constructor(private readonly prisma: PrismaService) {}

  // ──────────────────────────────────────────────────────────────────
  // API publica
  // ──────────────────────────────────────────────────────────────────

  /**
   * Snapshot del estado agregado actual de la inscripcion. El caller lo
   * usa antes de mutar la entrega para capturar el "antes" y luego lo
   * pasa a recalcular*.
   */
  snapshotAgregados(inscripcionId: string, tx?: Tx): Promise<AgregadosInscripcion> {
    const client = tx ?? this.prisma
    return calcularAgregados(client, inscripcionId)
  }

  /**
   * Iter 10 · D-10.1 · agregados por curso en una sola transaccion (sin N+1).
   * Lee la estructura del curso una vez y todas las entregas del curso de una
   * vez, luego agrupa en memoria por inscripcionId. Devuelve un Map con una
   * entrada por inscripcion (incluso si esta sin entregas → AgregadosInscripcion vacio).
   *
   * Reusa los helpers puros internos para no duplicar la formula §9.5-§9.8.
   */
  snapshotAgregadosPorCurso(cursoId: string, tx?: Tx): Promise<Map<string, AgregadosInscripcion>> {
    const client = tx ?? this.prisma
    return calcularAgregadosPorCurso(client, cursoId)
  }

  /**
   * Recalculo tras evaluar/ajustar una entrega de bloque.
   * Cadena completa modulo → area → curso → etiqueta.
   * `bloqueId` se reserva para optimizaciones futuras (recalcular solo
   * el modulo/area afectado); en MVP recalculamos toda la inscripcion.
   */
  recalcularInscripcionTrasEntregaBloque(
    inscripcionId: string,
    _bloqueId: string,
    actorId: string,
    options: RecalcularOptions = {},
    tx?: Tx,
  ): Promise<RecalcularResultado> {
    return this.recalcularInscripcionCompleta(inscripcionId, actorId, options, tx)
  }

  /**
   * Recalculo tras evaluar/ajustar una entrega de proyecto (mini o
   * transversal). El detalle de la cadena depende del tipo:
   *   - MINI: modulo → area → curso → etiqueta.
   *   - TRANSVERSAL: curso → etiqueta.
   * Igual que en bloque, en MVP recalculamos toda la inscripcion.
   */
  recalcularInscripcionTrasEntregaProyecto(
    inscripcionId: string,
    _entregaProyectoId: string,
    actorId: string,
    options: RecalcularOptions = {},
    tx?: Tx,
  ): Promise<RecalcularResultado> {
    return this.recalcularInscripcionCompleta(inscripcionId, actorId, options, tx)
  }

  /**
   * Recalculo agnostico al disparador. Calcula agregados, hace diff con
   * `agregadosAntes` (o vacio) y emite logs RECALCULO_* por nivel
   * cambiado. Idempotente: 0 cambios → 0 logs.
   */
  async recalcularInscripcionCompleta(
    inscripcionId: string,
    actorId: string,
    options: RecalcularOptions = {},
    tx?: Tx,
  ): Promise<RecalcularResultado> {
    const client = tx ?? this.prisma
    const inscripcion = await client.inscripcion.findUnique({
      where: { id: inscripcionId },
      select: { id: true },
    })
    if (!inscripcion) {
      throw new NotFoundException(ERROR_INSCRIPCION_NO_ENCONTRADA_RECALCULO)
    }

    const agregadosAntes = options.agregadosAntes ?? agregadosVacios()
    const agregadosDespues = await calcularAgregados(client, inscripcionId)
    const diff = calcularDiff(agregadosAntes, agregadosDespues)

    let logsEmitidos = 0
    if (!diff.sinCambios) {
      logsEmitidos = await emitirLogsRecalculo({
        client,
        inscripcionId,
        actorId,
        diff,
        causaLogId: options.causaLogId,
      })
    }

    return { agregadosAntes, agregadosDespues, diff, logsEmitidos }
  }
}

// ──────────────────────────────────────────────────────────────────────
// Calculo de agregados (puro / lectura)
// ──────────────────────────────────────────────────────────────────────

interface CursoConfigParaRecalculo {
  id: string
  pesoAreas: Prisma.Decimal
  pesoProyectoTransversal: Prisma.Decimal
  pesoEntrevistaIA: Prisma.Decimal
  pesoActividades: Prisma.Decimal
  pesoMiniProyecto: Prisma.Decimal
  umbralExcelencia: number
  umbralAprobado: number
  umbralEnDesarrollo: number
  cursoAreas: Array<{ areaId: string; peso: Prisma.Decimal }>
}

type CursoConRelaciones = CursoConfigParaRecalculo & {
  modulos: Array<{
    id: string
    areaId: string
    miniProyectoActivo: boolean
    secciones: Array<{ id: string; bloques: Array<{ id: string }> }>
  }>
}

async function leerCursoEstructura(
  client: Pick<Prisma.TransactionClient, "inscripcion">,
  inscripcionId: string,
): Promise<CursoConRelaciones | null> {
  const inscripcion = await client.inscripcion.findUnique({
    where: { id: inscripcionId },
    select: {
      id: true,
      curso: {
        select: {
          id: true,
          pesoAreas: true,
          pesoProyectoTransversal: true,
          pesoEntrevistaIA: true,
          pesoActividades: true,
          pesoMiniProyecto: true,
          umbralExcelencia: true,
          umbralAprobado: true,
          umbralEnDesarrollo: true,
          cursoAreas: { select: { areaId: true, peso: true } },
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
      },
    },
  })
  if (!inscripcion) {
    return null
  }
  return inscripcion.curso as unknown as CursoConRelaciones
}

async function leerMejorNotaPorBloque(
  client: Pick<Prisma.TransactionClient, "entregaBloque">,
  inscripcionId: string,
): Promise<Map<string, Prisma.Decimal>> {
  const entregasBloque = await client.entregaBloque.findMany({
    where: {
      inscripcionId,
      estado: { in: ["EVALUADA", "EVALUADA_AUTOMATICAMENTE"] },
      nota: { not: null },
    },
    select: { bloqueId: true, nota: true },
  })
  const mejor = new Map<string, Prisma.Decimal>()
  for (const e of entregasBloque) {
    if (e.nota === null) {
      continue
    }
    const prev = mejor.get(e.bloqueId)
    if (!prev || e.nota.greaterThan(prev)) {
      mejor.set(e.bloqueId, e.nota)
    }
  }
  return mejor
}

interface NotasProyecto {
  ultimaNotaMiniPorModulo: Map<string, number>
  ultimaNotaTransversal: number | null
}

async function leerUltimaNotaProyecto(
  client: Pick<Prisma.TransactionClient, "entregaProyecto">,
  inscripcionId: string,
): Promise<NotasProyecto> {
  const entregasProyecto = await client.entregaProyecto.findMany({
    where: {
      inscripcionId,
      estado: "EVALUADA",
      notaFinal: { not: null },
    },
    select: {
      miniProyectoId: true,
      transversalId: true,
      notaFinal: true,
      intento: true,
      miniProyecto: { select: { moduloId: true } },
    },
    orderBy: { intento: "desc" },
  })
  const ultimaNotaMiniPorModulo = new Map<string, number>()
  let ultimaNotaTransversal: number | null = null
  for (const e of entregasProyecto) {
    if (e.notaFinal === null) {
      continue
    }
    if (e.miniProyectoId !== null && e.miniProyecto) {
      const moduloId = e.miniProyecto.moduloId
      if (!ultimaNotaMiniPorModulo.has(moduloId)) {
        ultimaNotaMiniPorModulo.set(moduloId, e.notaFinal.toNumber())
      }
    } else if (e.transversalId !== null && ultimaNotaTransversal === null) {
      ultimaNotaTransversal = e.notaFinal.toNumber()
    }
  }
  return { ultimaNotaMiniPorModulo, ultimaNotaTransversal }
}

function calcularNotaModulo(
  modulo: CursoConRelaciones["modulos"][number],
  curso: CursoConRelaciones,
  mejorPorBloque: Map<string, Prisma.Decimal>,
  ultimaNotaMiniPorModulo: Map<string, number>,
): number | null {
  const notasBloques: number[] = []
  for (const sec of modulo.secciones) {
    for (const b of sec.bloques) {
      const n = mejorPorBloque.get(b.id)
      if (n) {
        notasBloques.push(n.toNumber())
      }
    }
  }
  const tieneActividades = notasBloques.length > 0
  const tieneMini = modulo.miniProyectoActivo && ultimaNotaMiniPorModulo.has(modulo.id)
  if (!(tieneActividades || tieneMini)) {
    return null
  }
  // Promedio simple de bloques (MAESTRO §9.5 no fija pesos intra-bloque en MVP).
  const notaActividades = tieneActividades
    ? round2(notasBloques.reduce((a, b) => a + b, 0) / notasBloques.length)
    : null
  const notaMini = tieneMini ? (ultimaNotaMiniPorModulo.get(modulo.id) ?? null) : null
  const items: Array<{ valor: number; peso: Prisma.Decimal }> = []
  if (notaActividades !== null) {
    items.push({ valor: notaActividades, peso: curso.pesoActividades })
  }
  if (notaMini !== null) {
    items.push({ valor: notaMini, peso: curso.pesoMiniProyecto })
  }
  return promedioPonderado(items)
}

function calcularNotasArea(
  curso: CursoConRelaciones,
  notasModulo: Map<string, number>,
): Map<string, number> {
  const modulosPorArea = new Map<string, string[]>()
  for (const m of curso.modulos) {
    const lista = modulosPorArea.get(m.areaId) ?? []
    lista.push(m.id)
    modulosPorArea.set(m.areaId, lista)
  }
  const notasArea = new Map<string, number>()
  for (const [areaId, moduloIds] of modulosPorArea.entries()) {
    const notas = moduloIds
      .map((id) => notasModulo.get(id))
      .filter((n): n is number => n !== undefined)
    if (notas.length === 0) {
      continue
    }
    notasArea.set(areaId, round2(notas.reduce((a, b) => a + b, 0) / notas.length))
  }
  return notasArea
}

function calcularNotaCurso(
  curso: CursoConRelaciones,
  notasArea: Map<string, number>,
  ultimaNotaTransversal: number | null,
): number | null {
  const itemsAreas = curso.cursoAreas
    .map((ca) => {
      const valor = notasArea.get(ca.areaId)
      return valor === undefined ? null : { valor, peso: ca.peso }
    })
    .filter((x): x is { valor: number; peso: Prisma.Decimal } => x !== null)
  const notaAreasGlobal = promedioPonderado(itemsAreas)

  const itemsCurso: Array<{ valor: number; peso: Prisma.Decimal }> = []
  if (notaAreasGlobal !== null) {
    itemsCurso.push({ valor: notaAreasGlobal, peso: curso.pesoAreas })
  }
  if (ultimaNotaTransversal !== null) {
    itemsCurso.push({ valor: ultimaNotaTransversal, peso: curso.pesoProyectoTransversal })
  }
  // entrevistaIA queda fuera del recalculo en Iter 9.9.
  return promedioPonderado(itemsCurso)
}

async function calcularAgregados(
  client: Pick<Prisma.TransactionClient, "inscripcion" | "entregaBloque" | "entregaProyecto">,
  inscripcionId: string,
): Promise<AgregadosInscripcion> {
  const curso = await leerCursoEstructura(client, inscripcionId)
  if (!curso) {
    return agregadosVacios()
  }
  const mejorPorBloque = await leerMejorNotaPorBloque(client, inscripcionId)
  const { ultimaNotaMiniPorModulo, ultimaNotaTransversal } = await leerUltimaNotaProyecto(
    client,
    inscripcionId,
  )

  const notasModulo = new Map<string, number>()
  for (const modulo of curso.modulos) {
    const nota = calcularNotaModulo(modulo, curso, mejorPorBloque, ultimaNotaMiniPorModulo)
    if (nota !== null) {
      notasModulo.set(modulo.id, nota)
    }
  }
  const notasArea = calcularNotasArea(curso, notasModulo)
  const notaCurso = calcularNotaCurso(curso, notasArea, ultimaNotaTransversal)
  const etiqueta = derivarEtiquetaLogro(notaCurso, {
    umbralExcelencia: curso.umbralExcelencia,
    umbralAprobado: curso.umbralAprobado,
    umbralEnDesarrollo: curso.umbralEnDesarrollo,
  })
  return { notasModulo, notasArea, notaCurso, etiqueta }
}

function agregadosVacios(): AgregadosInscripcion {
  return {
    notasModulo: new Map(),
    notasArea: new Map(),
    notaCurso: null,
    etiqueta: null,
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

// ──────────────────────────────────────────────────────────────────────
// Diff y emision de logs
// ──────────────────────────────────────────────────────────────────────

function calcularDiff(antes: AgregadosInscripcion, despues: AgregadosInscripcion): DiffAgregados {
  const modulosCambiados: DiffAgregados["modulosCambiados"] = []
  const idsModulo = new Set([...antes.notasModulo.keys(), ...despues.notasModulo.keys()])
  for (const moduloId of idsModulo) {
    const a = antes.notasModulo.get(moduloId) ?? null
    const d = despues.notasModulo.get(moduloId) ?? null
    if (a !== d) {
      modulosCambiados.push({ moduloId, antes: a, despues: d })
    }
  }
  const areasCambiadas: DiffAgregados["areasCambiadas"] = []
  const idsArea = new Set([...antes.notasArea.keys(), ...despues.notasArea.keys()])
  for (const areaId of idsArea) {
    const a = antes.notasArea.get(areaId) ?? null
    const d = despues.notasArea.get(areaId) ?? null
    if (a !== d) {
      areasCambiadas.push({ areaId, antes: a, despues: d })
    }
  }
  const cursoCambio =
    antes.notaCurso !== despues.notaCurso
      ? { antes: antes.notaCurso, despues: despues.notaCurso }
      : null
  const etiquetaCambio =
    antes.etiqueta !== despues.etiqueta
      ? { antes: antes.etiqueta, despues: despues.etiqueta }
      : null
  const sinCambios =
    modulosCambiados.length === 0 &&
    areasCambiadas.length === 0 &&
    cursoCambio === null &&
    etiquetaCambio === null
  return { modulosCambiados, areasCambiadas, cursoCambio, etiquetaCambio, sinCambios }
}

interface EmitirLogsArgs {
  client: Pick<Prisma.TransactionClient, "logActividad">
  inscripcionId: string
  actorId: string
  diff: DiffAgregados
  causaLogId?: string
}

async function emitirLogsRecalculo(args: EmitirLogsArgs): Promise<number> {
  const { client, inscripcionId, actorId, diff, causaLogId } = args
  let count = 0
  for (const m of diff.modulosCambiados) {
    await client.logActividad.create({
      data: {
        actorId,
        tipoAccion: "RECALCULO_MODULO",
        entidadTipo: ENTIDAD_TIPO_INSCRIPCION,
        entidadId: inscripcionId,
        valorAntes: snapshotNivel("modulo", m.moduloId, m.antes),
        valorDespues: snapshotNivel("modulo", m.moduloId, m.despues),
        causaId: causaLogId,
      },
    })
    count++
  }
  for (const a of diff.areasCambiadas) {
    await client.logActividad.create({
      data: {
        actorId,
        tipoAccion: "RECALCULO_AREA",
        entidadTipo: ENTIDAD_TIPO_INSCRIPCION,
        entidadId: inscripcionId,
        valorAntes: snapshotNivel("area", a.areaId, a.antes),
        valorDespues: snapshotNivel("area", a.areaId, a.despues),
        causaId: causaLogId,
      },
    })
    count++
  }
  if (diff.cursoCambio) {
    await client.logActividad.create({
      data: {
        actorId,
        tipoAccion: "RECALCULO_CURSO",
        entidadTipo: ENTIDAD_TIPO_INSCRIPCION,
        entidadId: inscripcionId,
        valorAntes: { nivel: "curso", nota: diff.cursoCambio.antes },
        valorDespues: { nivel: "curso", nota: diff.cursoCambio.despues },
        causaId: causaLogId,
      },
    })
    count++
  }
  if (diff.etiquetaCambio) {
    await client.logActividad.create({
      data: {
        actorId,
        tipoAccion: "RECALCULO_ETIQUETA",
        entidadTipo: ENTIDAD_TIPO_INSCRIPCION,
        entidadId: inscripcionId,
        valorAntes: { nivel: "etiqueta", etiqueta: diff.etiquetaCambio.antes },
        valorDespues: { nivel: "etiqueta", etiqueta: diff.etiquetaCambio.despues },
        causaId: causaLogId,
      },
    })
    count++
  }
  return count
}

function snapshotNivel(
  nivel: "modulo" | "area",
  id: string,
  nota: number | null,
): Prisma.InputJsonValue {
  const idKey = nivel === "modulo" ? "moduloId" : "areaId"
  return { nivel, [idKey]: id, nota } as unknown as Prisma.InputJsonValue
}

// ──────────────────────────────────────────────────────────────────────
// Iter 10 · agregados por curso (lectura masiva, sin N+1)
// ──────────────────────────────────────────────────────────────────────

async function calcularAgregadosPorCurso(
  client: Pick<
    Prisma.TransactionClient,
    "curso" | "inscripcion" | "entregaBloque" | "entregaProyecto"
  >,
  cursoId: string,
): Promise<Map<string, AgregadosInscripcion>> {
  const cursoEstructura = await leerEstructuraCurso(client, cursoId)
  if (!cursoEstructura) {
    return new Map()
  }
  const inscripciones = await client.inscripcion.findMany({
    where: { cursoId },
    select: { id: true },
  })
  const inscripcionIds = inscripciones.map((i) => i.id)
  if (inscripcionIds.length === 0) {
    return new Map()
  }

  const entregasBloque = await client.entregaBloque.findMany({
    where: {
      inscripcionId: { in: inscripcionIds },
      estado: { in: ["EVALUADA", "EVALUADA_AUTOMATICAMENTE"] },
      nota: { not: null },
    },
    select: { inscripcionId: true, bloqueId: true, nota: true },
  })
  const entregasProyecto = await client.entregaProyecto.findMany({
    where: {
      inscripcionId: { in: inscripcionIds },
      estado: "EVALUADA",
      notaFinal: { not: null },
    },
    select: {
      inscripcionId: true,
      miniProyectoId: true,
      transversalId: true,
      notaFinal: true,
      intento: true,
      miniProyecto: { select: { moduloId: true } },
    },
    orderBy: { intento: "desc" },
  })

  const mejorPorInscripcion = agruparMejorBloquePorInscripcion(entregasBloque)
  const proyectoPorInscripcion = agruparProyectoPorInscripcion(entregasProyecto)

  const resultado = new Map<string, AgregadosInscripcion>()
  for (const insId of inscripcionIds) {
    const mejor = mejorPorInscripcion.get(insId) ?? new Map<string, Prisma.Decimal>()
    const np =
      proyectoPorInscripcion.get(insId) ??
      ({ ultimaNotaMiniPorModulo: new Map(), ultimaNotaTransversal: null } satisfies NotasProyecto)
    resultado.set(insId, calcularAgregadosDesdeBuckets(cursoEstructura, mejor, np))
  }
  return resultado
}

function agruparMejorBloquePorInscripcion(
  entregas: ReadonlyArray<{
    inscripcionId: string
    bloqueId: string
    nota: Prisma.Decimal | null
  }>,
): Map<string, Map<string, Prisma.Decimal>> {
  const map = new Map<string, Map<string, Prisma.Decimal>>()
  for (const e of entregas) {
    if (e.nota === null) {
      continue
    }
    let mejor = map.get(e.inscripcionId)
    if (!mejor) {
      mejor = new Map<string, Prisma.Decimal>()
      map.set(e.inscripcionId, mejor)
    }
    const prev = mejor.get(e.bloqueId)
    if (!prev || e.nota.greaterThan(prev)) {
      mejor.set(e.bloqueId, e.nota)
    }
  }
  return map
}

function agruparProyectoPorInscripcion(
  entregas: ReadonlyArray<{
    inscripcionId: string
    miniProyectoId: string | null
    transversalId: string | null
    notaFinal: Prisma.Decimal | null
    miniProyecto: { moduloId: string } | null
  }>,
): Map<string, NotasProyecto> {
  const map = new Map<string, NotasProyecto>()
  for (const e of entregas) {
    if (e.notaFinal === null) {
      continue
    }
    let np = map.get(e.inscripcionId)
    if (!np) {
      np = { ultimaNotaMiniPorModulo: new Map(), ultimaNotaTransversal: null }
      map.set(e.inscripcionId, np)
    }
    if (e.miniProyectoId !== null && e.miniProyecto) {
      const moduloId = e.miniProyecto.moduloId
      if (!np.ultimaNotaMiniPorModulo.has(moduloId)) {
        np.ultimaNotaMiniPorModulo.set(moduloId, e.notaFinal.toNumber())
      }
    } else if (e.transversalId !== null && np.ultimaNotaTransversal === null) {
      np.ultimaNotaTransversal = e.notaFinal.toNumber()
    }
  }
  return map
}

function calcularAgregadosDesdeBuckets(
  cursoEstructura: CursoConRelaciones,
  mejorPorBloque: Map<string, Prisma.Decimal>,
  np: NotasProyecto,
): AgregadosInscripcion {
  const notasModulo = new Map<string, number>()
  for (const modulo of cursoEstructura.modulos) {
    const nota = calcularNotaModulo(
      modulo,
      cursoEstructura,
      mejorPorBloque,
      np.ultimaNotaMiniPorModulo,
    )
    if (nota !== null) {
      notasModulo.set(modulo.id, nota)
    }
  }
  const notasArea = calcularNotasArea(cursoEstructura, notasModulo)
  const notaCurso = calcularNotaCurso(cursoEstructura, notasArea, np.ultimaNotaTransversal)
  const etiqueta = derivarEtiquetaLogro(notaCurso, {
    umbralExcelencia: cursoEstructura.umbralExcelencia,
    umbralAprobado: cursoEstructura.umbralAprobado,
    umbralEnDesarrollo: cursoEstructura.umbralEnDesarrollo,
  })
  return { notasModulo, notasArea, notaCurso, etiqueta }
}

async function leerEstructuraCurso(
  client: Pick<Prisma.TransactionClient, "curso">,
  cursoId: string,
): Promise<CursoConRelaciones | null> {
  const curso = await client.curso.findUnique({
    where: { id: cursoId },
    select: {
      id: true,
      pesoAreas: true,
      pesoProyectoTransversal: true,
      pesoEntrevistaIA: true,
      pesoActividades: true,
      pesoMiniProyecto: true,
      umbralExcelencia: true,
      umbralAprobado: true,
      umbralEnDesarrollo: true,
      cursoAreas: { select: { areaId: true, peso: true } },
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
  return curso as unknown as CursoConRelaciones | null
}

export type { AgregadosInscripcion, DiffAgregados, RecalcularResultado, RecalcularOptions, Tx }
// Para testing — exportar los pure helpers internos.
export const __testing = {
  calcularAgregados,
  calcularAgregadosPorCurso,
  calcularDiff,
  emitirLogsRecalculo,
  agregadosVacios,
}
