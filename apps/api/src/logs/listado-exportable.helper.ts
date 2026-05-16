import { BadRequestException } from "@nestjs/common"
import { AccionAuditoria, type Prisma } from "@prisma/client"
import type { Response } from "express"
import { LIMITE_FILAS_EXPORTACION } from "../auditoria/auditoria-export.helpers"
import type { AuditLogService } from "../common/audit/audit-log.service"
import { apiErrorCodes } from "../common/errors/api-error.codes"
import type { ExportService } from "../common/export/export.service"
import type { ColumnaDef, ExportResult } from "../common/export/export.types"
import type { Paginated } from "../common/http/paginated"
import type { SesionUsuario } from "../common/types/sesion.types"
import type { ConsultasLogService } from "../reportes/consultas-log.service"
import { type DominioLogs, nombreArchivoExport } from "./logs-export.helpers"

/**
 * Dependencias compartidas por los seis pares `listar` + `exportar` del
 * visor admin de logs. Se inyectan una sola vez en el controller y se
 * pasan a las dos funciones puras de abajo.
 *
 * Notar que los servicios viajan como `type` porque aqui solo se usan
 * como parametros (no se construyen via DI dentro del helper). El
 * controller mantiene la inyeccion normal.
 */
export interface DependenciasListadoExportable {
  readonly consultasLog: ConsultasLogService
  readonly auditLog: AuditLogService
  readonly exportService: ExportService
}

/**
 * Claves de filtro opcionales que pueden aparecer en cualquiera de los
 * seis dominios. Se incluyen en `queryParams` de `consultas_logs` y en
 * `metadata.filtrosAplicados` de la audit de export solo cuando vienen
 * con valor truthy (igual semantica que la version pre-refactor).
 */
const CLAVES_FILTROS_OPCIONALES = [
  "cursoId",
  "asignacionId",
  "skillId",
  "moduloId",
  "planId",
  "seccionId",
  "autorUsuarioId",
  "endpoint",
  "estadoNuevo",
  "tipoEvento",
  "accion",
  "desde",
  "hasta",
] as const

function extraerFiltrosOpcionales(query: object): Record<string, Prisma.InputJsonValue> {
  const filtros: Record<string, Prisma.InputJsonValue> = {}
  const record = query as Record<string, string | undefined>
  for (const clave of CLAVES_FILTROS_OPCIONALES) {
    const valor = record[clave]
    if (valor) {
      filtros[clave] = valor
    }
  }
  return filtros
}

function assertTopeRespetado(total: number): void {
  if (total > LIMITE_FILAS_EXPORTACION) {
    throw new BadRequestException({
      code: apiErrorCodes.filtroDemasiadoAmplio,
      message:
        "El filtro produce demasiados resultados (>50.000). Reduce el rango temporal o anade filtros adicionales.",
    })
  }
}

async function construirExport<T>(
  exportService: ExportService,
  dominio: DominioLogs,
  formato: "csv" | "xlsx",
  filas: readonly T[],
  columnas: readonly ColumnaDef<T>[],
): Promise<ExportResult> {
  return formato === "csv"
    ? await exportService.aCsv(filas, columnas)
    : await exportService.aXlsx(filas, columnas, `logs-${dominio}`)
}

function enviarExport(response: Response, dominio: DominioLogs, result: ExportResult): void {
  response.setHeader("Content-Type", result.mime)
  response.setHeader(
    "Content-Disposition",
    `attachment; filename="${nombreArchivoExport(dominio, result.extension === "xlsx" ? "xlsx" : "csv")}"`,
  )
  response.send(result.buffer)
}

async function auditarExport(
  auditLog: AuditLogService,
  dominio: DominioLogs,
  query: object,
  sesion: SesionUsuario,
  result: ExportResult,
  totalFilas: number,
): Promise<void> {
  const metadata: Prisma.InputJsonObject = {
    dominio,
    formato: result.extension,
    totalFilas,
    filtrosAplicados: extraerFiltrosOpcionales(query),
  }
  await auditLog.record({
    usuarioId: sesion.usuarioId,
    accion: AccionAuditoria.LOGS_EXPORTADO,
    exito: true,
    recursoTipo: "logs",
    metadata,
  })
}

interface OpcionesListar<
  TQuery extends { readonly page: number; readonly pageSize: number },
  TFila,
> {
  readonly query: TQuery
  readonly sesion: SesionUsuario
  readonly endpoint: string
  readonly fetch: (query: TQuery) => Promise<Paginated<TFila>>
  /**
   * `true` para los cinco dominios estandar; `false` para el visor de
   * `consultas` (recursion bloqueada: registrarlo crearia un loop
   * infinito de inserts).
   */
  readonly registrarEnConsultas: boolean
}

/**
 * Ejecuta un handler `listar*` del visor admin de logs:
 * 1. Llama al fetch del service y mide latencia.
 * 2. Si `registrarEnConsultas`, inserta fila en `consultas_logs` con
 *    `{ page, pageSize, ...filtrosOpcionales }`.
 * 3. Devuelve el `Paginated<TFila>` tal cual al controller.
 */
export async function ejecutarListarLogs<
  TQuery extends { readonly page: number; readonly pageSize: number },
  TFila,
>(
  deps: DependenciasListadoExportable,
  opciones: OpcionesListar<TQuery, TFila>,
): Promise<Paginated<TFila>> {
  const inicio = Date.now()
  const resultado = await opciones.fetch(opciones.query)
  if (opciones.registrarEnConsultas) {
    await deps.consultasLog.registrar({
      autorUsuarioId: opciones.sesion.usuarioId,
      endpoint: opciones.endpoint,
      queryParams: {
        page: opciones.query.page,
        pageSize: opciones.query.pageSize,
        ...extraerFiltrosOpcionales(opciones.query),
      },
      latenciaMs: Date.now() - inicio,
    })
  }
  return resultado
}

interface OpcionesExportar<
  TQuery extends { readonly formato: "csv" | "xlsx" },
  TFilaRaw,
  TFilaExport,
> {
  readonly query: TQuery
  readonly sesion: SesionUsuario
  readonly response: Response
  readonly dominio: DominioLogs
  readonly endpoint: string
  readonly columnas: readonly ColumnaDef<TFilaExport>[]
  readonly fetch: (query: TQuery) => Promise<{
    readonly filas: readonly TFilaRaw[]
    readonly total: number
  }>
  /**
   * Aplanador opcional fila a fila. Cursos y consultas convierten
   * estructuras anidadas a columnas planas; los otros cuatro dominios
   * exportan la fila tal cual y omiten esta opcion.
   */
  readonly mapper?: (fila: TFilaRaw) => TFilaExport
  /**
   * `false` solo para el exportador del visor de consultas (recursion
   * bloqueada). `true` para los otros cinco.
   */
  readonly registrarEnConsultas: boolean
}

/**
 * Ejecuta un handler `exportar*` del visor admin de logs:
 * 1. Pre-count + fetch via service.
 * 2. Valida tope 50k (`filtroDemasiadoAmplio`).
 * 3. Aplana si `mapper` esta presente.
 * 4. Construye CSV o XLSX segun `formato`.
 * 5. Audita `LOGS_EXPORTADO` (siempre).
 * 6. Si `registrarEnConsultas`, inserta en `consultas_logs`.
 * 7. Escribe headers + buffer en el `response`.
 *
 * El binario se envia al final, despues de auditoria y meta-auditoria,
 * por contrato e2e: supertest solo resuelve cuando los inserts ya estan
 * commiteados.
 */
export async function ejecutarExportarLogs<
  TQuery extends { readonly formato: "csv" | "xlsx" },
  TFilaRaw,
  TFilaExport = TFilaRaw,
>(
  deps: DependenciasListadoExportable,
  opciones: OpcionesExportar<TQuery, TFilaRaw, TFilaExport>,
): Promise<void> {
  const inicio = Date.now()
  const { filas, total } = await opciones.fetch(opciones.query)
  assertTopeRespetado(total)
  const filasParaExport: readonly TFilaExport[] = opciones.mapper
    ? filas.map(opciones.mapper)
    : (filas as readonly unknown[] as readonly TFilaExport[])
  const result = await construirExport(
    deps.exportService,
    opciones.dominio,
    opciones.query.formato,
    filasParaExport,
    opciones.columnas,
  )
  await auditarExport(
    deps.auditLog,
    opciones.dominio,
    opciones.query,
    opciones.sesion,
    result,
    total,
  )
  if (opciones.registrarEnConsultas) {
    await deps.consultasLog.registrar({
      autorUsuarioId: opciones.sesion.usuarioId,
      endpoint: opciones.endpoint,
      queryParams: {
        formato: opciones.query.formato,
        ...extraerFiltrosOpcionales(opciones.query),
      },
      latenciaMs: Date.now() - inicio,
    })
  }
  enviarExport(opciones.response, opciones.dominio, result)
}
