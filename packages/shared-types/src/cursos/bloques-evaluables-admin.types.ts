import type { TipoBloque } from "../catalogo/bloques/listar-bloques.schema"

/**
 * Vista admin del subtab "Bloques" del PanelEvaluaciones (nivel lista).
 * Un curso suele tener entre 5 y 30 bloques evaluables, por lo que el
 * endpoint NO pagina. Una fila por bloque con stats agregadas sobre los
 * intentos del curso.
 *
 * Reglas de cómputo:
 * - `colaboradoresConIntento`: distinct sobre IntentoBloque (excluye anulados).
 * - `totalIntentos`: count de IntentoBloque del curso, excluyendo anulados.
 * - `aprobados`: count de colaboradores cuyo mejor intento (no anulado)
 *   alcanza `umbralAprobacion`.
 * - `notaMedia`: promedio de la nota del mejor intento de cada colaborador
 *   con intento (no anulado). `null` cuando no hay intentos.
 * - `umbralAprobacion`: lo determina `umbralAprobacionBloque(tipo, contenido)`
 *   en el backend (default 60; QUIZ respeta `contenido.notaMinima`).
 */
export interface BloqueEvaluableAdminItem {
  readonly bloqueId: string
  readonly orden: number
  readonly tipo: TipoBloque
  readonly version: number
  readonly umbralAprobacion: number
  readonly modulo: { readonly id: string; readonly titulo: string }
  readonly seccion: { readonly id: string; readonly titulo: string; readonly orden: number }
  readonly skill: { readonly id: string; readonly etiqueta: string } | null
  readonly stats: BloqueEvaluableStats
}

export interface BloqueEvaluableStats {
  readonly colaboradoresConIntento: number
  readonly totalIntentos: number
  readonly aprobados: number
  readonly notaMedia: number | null
}

/**
 * Vista del drawer "Detalle de bloque" (nivel colaborador). Una fila por
 * colaborador que ha intentado el bloque al menos una vez (no se listan
 * asignados sin intento; ese es ruido para esta vista).
 *
 * - `mejorNota`: la nota del intento marcado como `esMejorIntento=true`.
 * - `cantidadIntentos`: total de intentos del colaborador en el bloque,
 *   excluyendo anulados.
 * - `aprobado`: `mejorNota >= bloque.umbralAprobacion`.
 * - `tieneVersionVieja`: algún intento usó una `versionBloque < versionActual`.
 *   Aviso útil para que el admin sepa que los datos comparan peras y manzanas.
 */
export interface BloqueEvaluableColaboradorItem {
  readonly colaborador: {
    readonly id: string
    readonly nombre: string
    readonly email: string
  }
  readonly mejorNota: number
  readonly cantidadIntentos: number
  readonly ultimoIntentoFecha: string
  readonly aprobado: boolean
  readonly tieneVersionVieja: boolean
}

/**
 * Respuesta completa del endpoint del drawer. Incluye metadata del bloque
 * para que el frontend no tenga que hacer un fetch adicional.
 *
 * `preguntasMasFalladas` solo se devuelve para bloques tipo QUIZ y agrupa
 * los `preguntaId` que aparecen en `intento.preguntasFalladas`. Ordenadas
 * desc por conteo. Las preguntas se identifican por su ID dentro del
 * contenido del bloque (no se reexpone el enunciado).
 */
export interface BloqueEvaluableDetalleResponse {
  readonly bloque: {
    readonly id: string
    readonly tipo: TipoBloque
    readonly umbralAprobacion: number
    readonly versionActual: number
  }
  readonly colaboradores: readonly BloqueEvaluableColaboradorItem[]
  readonly preguntasMasFalladas?: readonly {
    readonly preguntaId: string
    readonly conteo: number
  }[]
}
