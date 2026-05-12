import { Prisma, TipoEventoNotif } from "@prisma/client"
import {
  PlanRecalculadoPayload,
  esPlanRecalculadoPayload,
} from "../../payload/plan-recalculado.payload"
import {
  ResultadoCierrePayload,
  esResultadoCierrePayload,
} from "../../payload/resultado-cierre.payload"
import {
  PlantillaContexto,
  PlantillaResultado,
  construirPlanRecalculado,
} from "./plan-recalculado.template"
import { construirResultadoCierre } from "./resultado-cierre.template"

/**
 * Registro central de plantillas activas en P10c (D-S10-C9).
 *
 * Cada entrada del registro encapsula:
 *  - el type guard para validar el JSON persistido en `notificaciones.payload`,
 *  - el constructor de la plantilla concreta (subject + html + text).
 *
 * `NotificacionesService.intentarEnvioEmail` consulta este registro para
 * decidir si hay plantilla disponible y construir el email solo si el payload
 * cumple el shape esperado. Si el guard rechaza, no se envia y se loggea
 * `payload-invalido` en lugar de propagar el error al trigger origen.
 *
 * El catalogo `tienePlantilla(tipo)` se reduce a `PLANTILLAS.has(tipo)`.
 */
interface PlantillaEntry<TPayload> {
  readonly esPayloadValido: (value: unknown) => value is TPayload
  readonly construir: (payload: TPayload, contexto: PlantillaContexto) => PlantillaResultado
}

const ENTRY_PLAN_RECALCULADO: PlantillaEntry<PlanRecalculadoPayload> = {
  esPayloadValido: esPlanRecalculadoPayload,
  construir: construirPlanRecalculado,
}

const ENTRY_RESULTADO_CIERRE: PlantillaEntry<ResultadoCierrePayload> = {
  esPayloadValido: esResultadoCierrePayload,
  construir: construirResultadoCierre,
}

export const PLANTILLAS: ReadonlyMap<TipoEventoNotif, PlantillaEntry<unknown>> = new Map<
  TipoEventoNotif,
  PlantillaEntry<unknown>
>([
  [TipoEventoNotif.PLAN_RECALCULADO, ENTRY_PLAN_RECALCULADO as PlantillaEntry<unknown>],
  [TipoEventoNotif.RESULTADO_CIERRE, ENTRY_RESULTADO_CIERRE as PlantillaEntry<unknown>],
])

/**
 * Helper que valida el payload y construye la plantilla en un solo paso.
 * Devuelve `null` si el tipo no tiene plantilla registrada o si el guard
 * rechaza el payload (defense in depth).
 */
export function construirPlantilla(
  tipo: TipoEventoNotif,
  payload: Prisma.JsonValue,
  contexto: PlantillaContexto,
): PlantillaResultado | null {
  const entry = PLANTILLAS.get(tipo)
  if (!entry) {
    return null
  }
  if (!entry.esPayloadValido(payload)) {
    return null
  }
  return entry.construir(payload, contexto)
}

export type { PlantillaContexto, PlantillaResultado }
