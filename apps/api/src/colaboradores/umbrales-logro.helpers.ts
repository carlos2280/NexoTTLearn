import { type UmbralesLogroValores, umbralesLogroValoresSchema } from "@nexott-learn/shared-types"

/**
 * Umbrales canonicos del sistema para la escala cualitativa (cap. 9.1 / 10.5).
 * Se aplican cuando un curso NO configuro sus propios `umbralesLogro`, y en
 * contextos cross-curso (ficha global, historial) donde no existe un umbral de
 * curso unico. Un admin puede sobreescribirlos por curso desde
 * `PATCH /cursos/:id/umbrales-logro`.
 *
 *   nota >= excelencia    -> excelencia
 *   nota >= solido        -> solido
 *   nota >= enDesarrollo  -> enDesarrollo / inicial (segun la escala)
 */
export const UMBRALES_LOGRO_DEFAULT: UmbralesLogroValores = {
  excelencia: 85,
  solido: 70,
  enDesarrollo: 50,
}

/**
 * Interpreta el JSONB opaco de `Curso.umbralesLogro` (o su copia congelada en
 * el snapshot de cierre) como umbrales validos. Usa el schema de shared-types
 * como fuente unica de verdad — no confia en el shape declarado en TS sobre
 * datos de BD (regla §3 "0 any sobre datos libres"). Acepta `unknown` para ser
 * la UNICA autoridad de validacion: los lectores del JSONB (snapshot de cierre,
 * `Curso.umbralesLogro`) lo pasan crudo sin pre-validar. Si el valor es `null`,
 * ausente o invalido, cae al canon del sistema. Nunca lanza.
 */
export function parseUmbralesLogro(raw: unknown): UmbralesLogroValores {
  const parsed = umbralesLogroValoresSchema.safeParse(raw)
  return parsed.success ? parsed.data : UMBRALES_LOGRO_DEFAULT
}
