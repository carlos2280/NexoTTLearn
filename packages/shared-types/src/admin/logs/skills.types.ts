/**
 * Slice futuro B (P-B-b) — Visor admin de cambios sobre Skills.
 *
 * Union proyectada de `historico_renombrados_skill` + `historico_cambios_area_skill`
 * con discriminador `tipoEvento`. El backend hace dos `findMany` en paralelo y
 * mergea por `fecha DESC` antes de aplicar el slice final.
 *
 * Los campos exclusivos de cada tabla quedan nullables en el union:
 *   - RENOMBRADO  -> etiquetaAnterior / etiquetaNueva (motivo opcional)
 *   - CAMBIO_AREA -> areaAnteriorId  / areaNuevaId   (motivo requerido)
 */

export const TIPOS_EVENTO_LOG_SKILL = ["RENOMBRADO", "CAMBIO_AREA"] as const
export type TipoEventoLogSkill = (typeof TIPOS_EVENTO_LOG_SKILL)[number]

export interface LogSkillEventoResumen {
  readonly id: string
  readonly skillId: string
  readonly fecha: string
  readonly autorUsuarioId: string
  readonly autorEmail: string | null
  readonly autorNombre: string | null
  readonly tipoEvento: TipoEventoLogSkill
  readonly motivo: string | null
  readonly etiquetaAnterior: string | null
  readonly etiquetaNueva: string | null
  readonly areaAnteriorId: string | null
  readonly areaNuevaId: string | null
}
