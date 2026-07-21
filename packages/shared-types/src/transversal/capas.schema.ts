import { z } from "zod"

/**
 * Bodies de carga de capa del intento transversal (Slice 8 P8b, D-S8-C2/C4).
 *
 * - `tests` recibe la nota y un `detalle` libre (proviene del CI externo, D-S8-C2).
 * - `cualitativa` recibe la nota + comentario textual + nivel de confianza.
 * - `comprension` recibe la nota + la transcripcion de la mini-entrevista IA.
 *
 * Los 3 schemas son `.strict()` para rechazar payloads con campos extra y se
 * reutilizan tanto en el controller admin como en el job worker interno.
 */

const notaCapaSchema = z.number().min(0).max(100)
const notaDimensionSchema = z.number().min(0).max(100).nullable()

export const cargarCapaTestsSchema = z
  .object({
    nota: notaCapaSchema,
    detalle: z.record(z.unknown()),
  })
  .strict()

export type CargarCapaTestsInput = z.infer<typeof cargarCapaTestsSchema>

/**
 * Una dimension del informe estructurado (Slice 8 Fase 2). Los ejes son las
 * skills que el transversal declara (`TransversalSkill`): puntuar contra ellas
 * hace comparables dos repos distintos. `nota` es `null` cuando la IA no pudo
 * evaluar esa dimension (repo parcial, evidencia ausente).
 */
export const dimensionInformeSchema = z
  .object({
    dimension: z.string().min(1).max(200),
    nota: notaDimensionSchema,
    comentario: z.string().max(1000),
  })
  .strict()

export type DimensionInforme = z.infer<typeof dimensionInformeSchema>

export const puntoAReforzarSchema = z
  .object({
    que: z.string().min(1).max(300),
    sugerencia: z.string().min(1).max(500),
  })
  .strict()

export type PuntoAReforzar = z.infer<typeof puntoAReforzarSchema>

/**
 * Un ítem de la "Lista a evaluar" que el admin redacta al configurar el
 * transversal (aparte del brief en prosa). Texto libre y corto: cada ítem es
 * una cosa concreta que la IA verifica sobre el repo.
 */
export const criterioEvaluacionSchema = z.string().trim().min(1).max(200)

/**
 * Lista completa de criterios "a evaluar" (fuente única write+read). Opcional:
 * un transversal sin lista se comporta como antes (la IA solo puntúa skills).
 * Rechaza duplicados (comparación tolerante a mayúsculas/espacios), en paridad
 * con `skillsQueMideIds`: dos ítems que normalizan igual romperían el checklist
 * (la reconciliación asignaría el mismo veredicto a ambos).
 */
export const criteriosEvaluacionSchema = z
  .array(criterioEvaluacionSchema)
  .max(15)
  .refine((items) => {
    const claves = items.map((c) => c.trim().toLowerCase())
    return new Set(claves).size === claves.length
  }, "Hay criterios duplicados en la lista a evaluar.")

export type CriteriosEvaluacion = z.infer<typeof criteriosEvaluacionSchema>

/**
 * Resultado de verificar UN criterio de la lista contra el repo (Slice 8, lista
 * a evaluar). `cumple` es un veredicto honesto de 3 estados; `null` = la IA no
 * pudo verificarlo (no ejecuta el código, evidencia ausente). Se reconcilia
 * aguas arriba contra la lista declarada (cubre exactamente esos ítems).
 *
 * Gemelo de `aiCumplimientoCriterioSchema` en apps/api (ai.types.ts): ese valida
 * el output crudo de la IA, este el contrato write+read. Misma forma: si cambia
 * el enum o los límites de uno, actualiza el otro.
 */
export const cumplimientoCriterioSchema = z
  .object({
    criterio: z.string().min(1).max(200),
    cumple: z.enum(["cumple", "parcial", "no"]).nullable(),
    evidencia: z.string().max(500),
  })
  .strict()

export type CumplimientoCriterio = z.infer<typeof cumplimientoCriterioSchema>

/**
 * Informe de la "Revisión con IA" = `detalle` de la capa cualitativa.
 * `comentario` + `confianza` son el contrato original (D-S8-C2). Los campos del
 * informe estructurado (Fase 2) son **opcionales y aditivos**: los emite el
 * motor IA nuevo, pero un detalle legacy (solo comentario/confianza) sigue
 * siendo valido. El `veredicto` se deriva aguas arriba de
 * `nota >= umbralAprobacion`, no lo decide la IA.
 *
 * Fuente única: se usa como body de escritura (`cargarCapaCualitativaSchema`) y
 * como shape de lectura (`IntentoTransversalAdminResponse.revisionIa`).
 */
export const revisionIaSchema = z
  .object({
    comentario: z.string().max(4000).trim(),
    confianza: z.enum(["BAJA", "MEDIA", "ALTA"]),
    veredicto: z.enum(["apto", "necesita_ajustes"]).optional(),
    // El curado por el admin (reporteFinal) puede traer HTML de TipTap; el crudo
    // de la IA es texto plano. Ambos se sanitizan al renderizar. Tope holgado
    // para acomodar el formato (tags + texto).
    resumen: z.string().max(10000).optional(),
    queReviso: z.string().max(500).optional(),
    queNoReviso: z.string().max(500).optional(),
    porDimension: z.array(dimensionInformeSchema).max(30).optional(),
    fortalezas: z.array(z.string().min(1).max(300)).max(5).optional(),
    aReforzar: z.array(puntoAReforzarSchema).max(5).optional(),
    /**
     * Verificación ítem por ítem de la "Lista a evaluar" del admin. Aditivo y
     * opcional: sólo aparece si el transversal declaró criterios y la IA nueva
     * los evaluó; un detalle legacy o sin lista sigue siendo válido.
     */
    cumplimientoCriterios: z.array(cumplimientoCriterioSchema).max(15).optional(),
  })
  .strict()

export type RevisionIa = z.infer<typeof revisionIaSchema>

export const cargarCapaCualitativaSchema = z
  .object({
    nota: notaCapaSchema,
    detalle: revisionIaSchema,
  })
  .strict()

export type CargarCapaCualitativaInput = z.infer<typeof cargarCapaCualitativaSchema>

/**
 * "Qué evaluó la IA" (Fase 4b ③): snapshot de lo que la IA leyó del repo, para
 * que la evidencia sobreviva aunque el participante borre o cambie el repo. Se
 * captura al evaluar (`RepoFetchService`) y se persiste inmutable en el intento.
 * `contenido` es el texto exacto empaquetado (hasta el tope del empaquetador).
 */
export const evidenciaRepoSchema = z
  .object({
    commit: z.string().max(64).nullable(),
    archivos: z.array(z.string().max(500)).max(500),
    truncado: z.boolean(),
    bytesTotales: z.number().int().nonnegative(),
    contenido: z.string(),
  })
  .strict()

export type EvidenciaRepo = z.infer<typeof evidenciaRepoSchema>

/**
 * Metadata de la evidencia SIN el `contenido` (que puede pesar cientos de KB).
 * Es lo que viaja en el detalle admin del intento; el `contenido` completo se
 * pide bajo demanda a su endpoint propio.
 */
export const evidenciaRepoResumenSchema = evidenciaRepoSchema.omit({ contenido: true })

export type EvidenciaRepoResumen = z.infer<typeof evidenciaRepoResumenSchema>

/**
 * Body de curación del informe final (Fase 4b ③): el admin edita el informe que
 * verá el participante. Reusa el shape de `revisionIaSchema` (mismo informe, ya
 * curado). El backend sella `validadoPor`/`fechaValidacion` al finalizar.
 */
export const curarReporteFinalSchema = z
  .object({
    reporteFinal: revisionIaSchema,
  })
  .strict()

export type CurarReporteFinalInput = z.infer<typeof curarReporteFinalSchema>

export const cargarCapaComprensionSchema = z
  .object({
    nota: notaCapaSchema,
    detalle: z
      .object({
        transcripcion: z
          .array(
            z
              .object({
                rol: z.enum(["ASISTENTE", "COLABORADOR"]),
                mensaje: z.string().max(4000),
              })
              .strict(),
          )
          .max(50),
      })
      .strict(),
  })
  .strict()

export type CargarCapaComprensionInput = z.infer<typeof cargarCapaComprensionSchema>
