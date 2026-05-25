/**
 * `GET /api/v1/me/ficha/resumen` (B-3) — agregado cualitativo para el
 * widget "Tu camino" de la bandeja del participante. Solo etiquetas
 * cualitativas, sin numeros crudos en el cliente (decision del producto:
 * el server decide el criterio).
 *
 * Nivel cualitativo del area: derivado del promedio de las skills del
 * area con `notaActual != null`:
 *   - `solido`         → promedio >= 70
 *   - `enDesarrollo`   → promedio >= 50
 *   - `inicial`        → promedio < 50
 *
 * `topAreas` se ordena por (nivel desc: solido > enDesarrollo > inicial),
 * desempate alfabetico por nombre. Limite 3 elementos.
 *
 * Mas amplio que el `NivelCualitativoArea` de la pantalla "Mi ficha"
 * (que distingue `excelencia` y `sinTocar`); aqui el widget no necesita
 * esa granularidad.
 */
export type NivelCualitativoAreaResumen = "solido" | "enDesarrollo" | "inicial"

export interface FichaResumenTopArea {
  readonly areaId: string
  readonly areaNombre: string
  /** Slug del catalogo de areas → mapea a `--color-area-{codigo}` en el web. */
  readonly areaCodigo: string
  readonly nivelCualitativo: NivelCualitativoAreaResumen
}

export interface FichaResumenResponse {
  /** Numero de areas distintas donde el colaborador tiene ≥1 skill con nota. */
  readonly totalAreasConActividad: number
  /** Top 3 areas por nivel cualitativo. Puede ser array vacio. */
  readonly topAreas: readonly FichaResumenTopArea[]
  /**
   * Ultima entrada con `valor != null` en `historico_notas_skill` para este
   * colaborador. `null` si nunca demostro nada.
   */
  readonly ultimaSkillDemostrada: {
    readonly skillNombre: string
    readonly fecha: string
  } | null
}
