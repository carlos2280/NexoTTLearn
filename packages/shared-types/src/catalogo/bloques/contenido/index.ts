/**
 * Contratos del `contenido` (jsonb) de cada tipo de bloque.
 *
 * Fuente de verdad para validar el shape en los tres puntos (editor,
 * backend, motor). Los schemas evaluables (QUIZ, CODIGO_PREGUNTAS,
 * CODIGO_TESTS) viven en `intentos-bloque/` y se agregan en `por-tipo`.
 */
export { contenidoParrafoSchema } from "./parrafo.schema"
export type { ContenidoParrafo } from "./parrafo.schema"
export { contenidoTipSchema, varianteTipSchema } from "./tip.schema"
export type { ContenidoTip, VarianteTip } from "./tip.schema"
export { contenidoCodigoIlustrativoSchema } from "./codigo-ilustrativo.schema"
export type { ContenidoCodigoIlustrativo } from "./codigo-ilustrativo.schema"
export { contenidoVideoSchema, proveedorVideoSchema } from "./video.schema"
export type { ContenidoVideo, ProveedorVideo } from "./video.schema"
export { contenidoRecursoSchema, subtipoRecursoSchema } from "./recurso.schema"
export type { ContenidoRecurso, SubtipoRecurso } from "./recurso.schema"
export {
  contenidoBloquePorTipo,
  schemaContenidoBloquePorTipo,
  validarContenidoBloque,
} from "./por-tipo"
