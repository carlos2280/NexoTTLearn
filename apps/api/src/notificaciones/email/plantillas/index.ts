import { Prisma, TipoEventoNotif } from "@prisma/client"
import {
  AsignacionCursoPayload,
  esAsignacionCursoPayload,
} from "../../payload/asignacion-curso.payload"
import { CasoReabiertoPayload, esCasoReabiertoPayload } from "../../payload/caso-reabierto.payload"
import { CursoDeadlinePayload, esCursoDeadlinePayload } from "../../payload/curso-deadline.payload"
import {
  EntrevistaIaDisponiblePayload,
  esEntrevistaIaDisponiblePayload,
} from "../../payload/entrevista-ia-disponible.payload"
import {
  PlanRecalculadoPayload,
  esPlanRecalculadoPayload,
} from "../../payload/plan-recalculado.payload"
import {
  ResultadoCierrePayload,
  esResultadoCierrePayload,
} from "../../payload/resultado-cierre.payload"
import {
  TransversalDisponiblePayload,
  esTransversalDisponiblePayload,
} from "../../payload/transversal-disponible.payload"
import { construirAsignacionCurso } from "./asignacion-curso.template"
import { construirCasoReabierto } from "./caso-reabierto.template"
import { construirCursoDeadline } from "./curso-deadline.template"
import { construirEntrevistaIaDisponible } from "./entrevista-ia-disponible.template"
import {
  PlantillaContexto,
  PlantillaResultado,
  construirPlanRecalculado,
} from "./plan-recalculado.template"
import { construirResultadoCierre } from "./resultado-cierre.template"
import { construirTransversalDisponible } from "./transversal-disponible.template"

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

const ENTRY_CURSO_DEADLINE: PlantillaEntry<CursoDeadlinePayload> = {
  esPayloadValido: esCursoDeadlinePayload,
  construir: construirCursoDeadline,
}

const ENTRY_ASIGNACION_CURSO: PlantillaEntry<AsignacionCursoPayload> = {
  esPayloadValido: esAsignacionCursoPayload,
  construir: construirAsignacionCurso,
}

const ENTRY_CASO_REABIERTO: PlantillaEntry<CasoReabiertoPayload> = {
  esPayloadValido: esCasoReabiertoPayload,
  construir: construirCasoReabierto,
}

const ENTRY_TRANSVERSAL_DISPONIBLE: PlantillaEntry<TransversalDisponiblePayload> = {
  esPayloadValido: esTransversalDisponiblePayload,
  construir: construirTransversalDisponible,
}

const ENTRY_ENTREVISTA_IA_DISPONIBLE: PlantillaEntry<EntrevistaIaDisponiblePayload> = {
  esPayloadValido: esEntrevistaIaDisponiblePayload,
  construir: construirEntrevistaIaDisponible,
}

export const PLANTILLAS: ReadonlyMap<TipoEventoNotif, PlantillaEntry<unknown>> = new Map<
  TipoEventoNotif,
  PlantillaEntry<unknown>
>([
  [TipoEventoNotif.PLAN_RECALCULADO, ENTRY_PLAN_RECALCULADO as PlantillaEntry<unknown>],
  [TipoEventoNotif.RESULTADO_CIERRE, ENTRY_RESULTADO_CIERRE as PlantillaEntry<unknown>],
  [TipoEventoNotif.CURSO_DEADLINE, ENTRY_CURSO_DEADLINE as PlantillaEntry<unknown>],
  [TipoEventoNotif.ASIGNACION_CURSO, ENTRY_ASIGNACION_CURSO as PlantillaEntry<unknown>],
  [TipoEventoNotif.CASO_REABIERTO, ENTRY_CASO_REABIERTO as PlantillaEntry<unknown>],
  [TipoEventoNotif.TRANSVERSAL_DISPONIBLE, ENTRY_TRANSVERSAL_DISPONIBLE as PlantillaEntry<unknown>],
  [
    TipoEventoNotif.ENTREVISTA_IA_DISPONIBLE,
    ENTRY_ENTREVISTA_IA_DISPONIBLE as PlantillaEntry<unknown>,
  ],
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
