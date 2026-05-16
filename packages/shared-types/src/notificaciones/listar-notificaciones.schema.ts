import { z } from "zod"
import { booleanQuerySchema } from "../catalogo/paginacion"
import { TIPOS_EVENTO_NOTIF, type TipoEventoNotif } from "./tipo-evento"

/**
 * Boolean opcional (sin default). Distingue "ausente" de "false" — el filtro
 * `leida` necesita esa distincion: ausencia = no filtrar; false = solo no
 * leidas. `booleanQuerySchema()` del catalogo aplica `default(false)`, que
 * para este caso convierte ausencia en false y oculta los items leidos.
 */
const booleanOpcionalSchema = z
  .union([z.boolean(), z.literal("true"), z.literal("false")])
  .optional()
  .transform((v) => (v === undefined ? undefined : v === true || v === "true"))

/**
 * Acepta:
 *  - array de strings ya parseado (tests / clientes node).
 *  - string CSV ("PLAN_RECALCULADO,RESULTADO_CIERRE" — el formato HTTP).
 *  - undefined (filtro ausente).
 *
 * Validacion final: cada elemento debe pertenecer al catalogo D88. Si no, 400
 * `INVALID_QUERY` con `details` apuntando al campo.
 */
const tipoEventoArrayLiteral = z.enum(
  TIPOS_EVENTO_NOTIF as unknown as readonly [TipoEventoNotif, ...TipoEventoNotif[]],
)

const tipoEventoCsvSchema = z
  .union([z.array(tipoEventoArrayLiteral), z.string()])
  .optional()
  .transform((value, ctx): readonly TipoEventoNotif[] | undefined => {
    if (value === undefined) {
      return undefined
    }
    const tokens = Array.isArray(value)
      ? value
      : value
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s.length > 0)
    const resultado: TipoEventoNotif[] = []
    for (const token of tokens) {
      const parsed = tipoEventoArrayLiteral.safeParse(token)
      if (!parsed.success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Tipo de evento no reconocido: ${token}`,
          path: [],
        })
        return z.NEVER
      }
      resultado.push(parsed.data)
    }
    return resultado
  })

const sortSchema = z.enum(["fechaCreacion", "-fechaCreacion"]).default("-fechaCreacion")

/**
 * Schema de query para `GET /api/v1/notificaciones`.
 *
 * Defaults seguros: `archivada=false` (oculta archivadas por defecto, §19.3
 * punto 3), `sort=-fechaCreacion`, paginacion 1/20. `leida` y `tipoEvento`
 * son opcionales sin default — ausencia implica "no filtrar".
 *
 * `desde`/`hasta` aceptan ISO 8601 (date o datetime). El service compara
 * contra `fecha_creacion`.
 */
export const listarNotificacionesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  leida: booleanOpcionalSchema,
  archivada: booleanQuerySchema(),
  tipoEvento: tipoEventoCsvSchema,
  desde: z.coerce.date().optional(),
  hasta: z.coerce.date().optional(),
  sort: sortSchema,
})

export type ListarNotificacionesQuery = z.infer<typeof listarNotificacionesQuerySchema>
