import type {
  IntentoTransversalAdminResponse,
  PuntoAReforzar,
  RevisionIa,
} from "@nexott-learn/shared-types"

/**
 * Estado del formulario de curación (B3): solo los campos que el admin edita y
 * que ve el participante — resumen + áreas a reforzar. El resto del informe
 * (comentario/confianza/porDimension/fortalezas…) se preserva sin tocar.
 */
export interface FormularioCuracion {
  readonly resumen: string
  readonly aReforzar: readonly PuntoAReforzar[]
}

/** Tope de áreas a reforzar (espeja `revisionIaSchema.aReforzar.max(5)`). */
export const MAX_AREAS_REFORZAR = 5

/** El informe solo se cura mientras el intento sigue EVALUADO (lo enforcea el backend E13). */
export function esCurable(estado: IntentoTransversalAdminResponse["estado"]): boolean {
  return estado === "EVALUADO"
}

/**
 * Base desde la que arranca la curación: el `reporteFinal` ya sembrado (copia
 * del crudo al cargar la capa) o, para intentos legacy sin sembrar, el
 * `revisionIa` crudo. `null` si aún no hay informe (capa sin cargar).
 */
export function baseParaCurar(intento: IntentoTransversalAdminResponse): RevisionIa | null {
  return intento.reporteFinal ?? intento.revisionIa
}

/** Valores iniciales del formulario desde la base (solo los campos curables). */
export function estadoInicialCuracion(base: RevisionIa | null): FormularioCuracion {
  return {
    resumen: base?.resumen ?? "",
    aReforzar: base?.aReforzar ?? [],
  }
}

/**
 * Arma el `reporteFinal` a enviar a E13: preserva TODO lo que el admin no cura
 * (comentario/confianza/veredicto/porDimension/fortalezas/cumplimientoCriterios)
 * y solo pisa resumen + aReforzar. Hace trim y descarta filas de "a reforzar"
 * incompletas (el backend exige `que` y `sugerencia`). Si un campo queda vacío,
 * viaja `undefined` (se omite del JSON, coherente con su `optional` en el schema).
 */
export function construirReporteFinal(
  base: RevisionIa | null,
  form: FormularioCuracion,
): RevisionIa {
  // Cimiento mínimo válido para un intento legacy sin informe previo.
  const cimiento: RevisionIa = base ?? { comentario: "", confianza: "MEDIA" }
  const resumen = form.resumen.trim()
  const aReforzar = form.aReforzar
    .map((r) => ({ que: r.que.trim(), sugerencia: r.sugerencia.trim() }))
    .filter((r) => r.que.length > 0 && r.sugerencia.length > 0)
  return {
    ...cimiento,
    resumen: resumen.length > 0 ? resumen : undefined,
    aReforzar: aReforzar.length > 0 ? aReforzar : undefined,
  }
}

/**
 * `true` si alguna fila de "a reforzar" tiene exactamente uno de sus dos campos
 * lleno (qué / sugerencia): el backend exige ambos, así que el editor bloquea
 * guardar hasta completarla o vaciarla.
 */
export function hayFilasIncompletas(aReforzar: readonly PuntoAReforzar[]): boolean {
  return aReforzar.some((r) => {
    const tieneQue = r.que.trim().length > 0
    const tieneSugerencia = r.sugerencia.trim().length > 0
    return tieneQue !== tieneSugerencia
  })
}
