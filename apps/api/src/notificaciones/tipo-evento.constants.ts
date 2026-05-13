import { TipoEventoNotif } from "@prisma/client"
import { PLANTILLAS } from "./email/plantillas"

/**
 * Constantes del catalogo D88 — autoridad en codigo (no en BD).
 *
 * El flag `esCritico` y la audiencia conceptual de cada tipo cambian con
 * decisiones D88 (estables, no por datos), por eso viven aqui en TS tipados
 * y no en columnas auxiliares. Patron heredado de `feature-flags` del Slice 4.
 */

/**
 * Tipos criticos — no silenciables (§19.3 punto 1, D-S10-A2).
 *
 * El service `NotificacionesService.crear()` ignora la tabla
 * `preferencias_notificacion` para estos tipos: aunque el usuario haya
 * solicitado silenciar (cosa que P10b rechaza con 422), el envio igual ocurre.
 */
export const TIPOS_CRITICOS: ReadonlySet<TipoEventoNotif> = new Set<TipoEventoNotif>([
  TipoEventoNotif.ASIGNACION_CURSO,
  TipoEventoNotif.CASO_REABIERTO,
  TipoEventoNotif.RESULTADO_CIERRE,
  TipoEventoNotif.EXCEL_CARGADO,
  TipoEventoNotif.MODULO_HUERFANO_SKILL,
])

/**
 * Audiencia conceptual de cada tipo (§19.2).
 *
 * La resolucion del `usuarioId` concreto la hace cada trigger en P10c.
 * Esta tabla solo documenta a QUIEN se dirige cada tipo segun la
 * decision D88 — sirve para validacion estatica y para los tests.
 */
export type AudienciaTipo = "participante" | "admin"

/**
 * Catalogo de audiencia por tipo. Se modela como `ReadonlyMap` (no como
 * objeto literal) para evitar el `useNamingConvention` de Biome sobre claves
 * SCREAMING_SNAKE — los identificadores son valores del enum Prisma `TipoEventoNotif`
 * y deben mantenerse 1-a-1 con `tipo_evento_notif_enum` en BD.
 */
export const AUDIENCIA_POR_TIPO: ReadonlyMap<TipoEventoNotif, AudienciaTipo> = new Map<
  TipoEventoNotif,
  AudienciaTipo
>([
  [TipoEventoNotif.ASIGNACION_CURSO, "participante"],
  [TipoEventoNotif.PLAN_RECALCULADO, "participante"],
  [TipoEventoNotif.TRANSVERSAL_DISPONIBLE, "participante"],
  [TipoEventoNotif.ENTREVISTA_IA_DISPONIBLE, "participante"],
  [TipoEventoNotif.RECORDATORIO_DEADLINE, "participante"],
  [TipoEventoNotif.CASO_REABIERTO, "participante"],
  [TipoEventoNotif.RESULTADO_CIERRE, "participante"],
  [TipoEventoNotif.CURSO_DEADLINE, "admin"],
  [TipoEventoNotif.COLABORADOR_LISTO, "admin"],
  [TipoEventoNotif.EXCEL_CARGADO, "admin"],
  [TipoEventoNotif.MODULO_HUERFANO_SKILL, "admin"],
  [TipoEventoNotif.PLANES_DESACTUALIZADOS, "admin"],
  [TipoEventoNotif.CENTRO_REVISION, "admin"],
])

/**
 * Tipos con plantilla HTML/text disponible.
 *
 * Fuente unica de verdad: el registro `PLANTILLAS` en `email/plantillas/index.ts`.
 * P11.5c (D-S11.5-C*): los 13 tipos del enum tienen plantilla
 * activa — catalogo D88 100% cubierto.
 *
 * Se expone como funcion (no como objeto literal) para poder mockearla en tests
 * sin mutar global state — `vi.spyOn(catalogoTipoEvento, 'tienePlantilla')`.
 */
function tienePlantilla(tipo: TipoEventoNotif): boolean {
  return PLANTILLAS.has(tipo)
}

export function esTipoCritico(tipo: TipoEventoNotif): boolean {
  return TIPOS_CRITICOS.has(tipo)
}

/**
 * API exportada como objeto para que los tests puedan mockear `tienePlantilla()`
 * via `vi.spyOn(catalogoTipoEvento, "tienePlantilla")` sin recurrir a
 * `import * as` (prohibido por `noNamespaceImport`).
 */
export const catalogoTipoEvento = {
  tienePlantilla,
  esTipoCritico,
}
