import { Prisma, TipoEventoNotif } from "@prisma/client"
import {
  AsignacionCursoPayload,
  esAsignacionCursoPayload,
} from "../../payload/asignacion-curso.payload"
import { CasoReabiertoPayload, esCasoReabiertoPayload } from "../../payload/caso-reabierto.payload"
import {
  CentroRevisionPayload,
  esCentroRevisionPayload,
} from "../../payload/centro-revision.payload"
import {
  ColaboradorListoPayload,
  esColaboradorListoPayload,
} from "../../payload/colaborador-listo.payload"
import { CursoDeadlinePayload, esCursoDeadlinePayload } from "../../payload/curso-deadline.payload"
import {
  EntrevistaIaDisponiblePayload,
  esEntrevistaIaDisponiblePayload,
} from "../../payload/entrevista-ia-disponible.payload"
import { ExcelCargadoPayload, esExcelCargadoPayload } from "../../payload/excel-cargado.payload"
import {
  ModuloHuerfanoSkillPayload,
  esModuloHuerfanoSkillPayload,
} from "../../payload/modulo-huerfano-skill.payload"
import {
  PlanRecalculadoPayload,
  esPlanRecalculadoPayload,
} from "../../payload/plan-recalculado.payload"
import {
  PlanesDesactualizadosPayload,
  esPlanesDesactualizadosPayload,
} from "../../payload/planes-desactualizados.payload"
import {
  RecordatorioDeadlinePayload,
  esRecordatorioDeadlinePayload,
} from "../../payload/recordatorio-deadline.payload"
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
import { construirCentroRevision } from "./centro-revision.template"
import { construirColaboradorListo } from "./colaborador-listo.template"
import { construirCursoDeadline } from "./curso-deadline.template"
import { construirEntrevistaIaDisponible } from "./entrevista-ia-disponible.template"
import { construirExcelCargado } from "./excel-cargado.template"
import { construirModuloHuerfanoSkill } from "./modulo-huerfano-skill.template"
import {
  PlantillaContexto,
  PlantillaResultado,
  construirPlanRecalculado,
} from "./plan-recalculado.template"
import { construirPlanesDesactualizados } from "./planes-desactualizados.template"
import { construirRecordatorioDeadline } from "./recordatorio-deadline.template"
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

const ENTRY_COLABORADOR_LISTO: PlantillaEntry<ColaboradorListoPayload> = {
  esPayloadValido: esColaboradorListoPayload,
  construir: construirColaboradorListo,
}

const ENTRY_EXCEL_CARGADO: PlantillaEntry<ExcelCargadoPayload> = {
  esPayloadValido: esExcelCargadoPayload,
  construir: construirExcelCargado,
}

const ENTRY_PLANES_DESACTUALIZADOS: PlantillaEntry<PlanesDesactualizadosPayload> = {
  esPayloadValido: esPlanesDesactualizadosPayload,
  construir: construirPlanesDesactualizados,
}

const ENTRY_MODULO_HUERFANO_SKILL: PlantillaEntry<ModuloHuerfanoSkillPayload> = {
  esPayloadValido: esModuloHuerfanoSkillPayload,
  construir: construirModuloHuerfanoSkill,
}

const ENTRY_RECORDATORIO_DEADLINE: PlantillaEntry<RecordatorioDeadlinePayload> = {
  esPayloadValido: esRecordatorioDeadlinePayload,
  construir: construirRecordatorioDeadline,
}

const ENTRY_CENTRO_REVISION: PlantillaEntry<CentroRevisionPayload> = {
  esPayloadValido: esCentroRevisionPayload,
  construir: construirCentroRevision,
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
  [TipoEventoNotif.COLABORADOR_LISTO, ENTRY_COLABORADOR_LISTO as PlantillaEntry<unknown>],
  [TipoEventoNotif.EXCEL_CARGADO, ENTRY_EXCEL_CARGADO as PlantillaEntry<unknown>],
  [TipoEventoNotif.PLANES_DESACTUALIZADOS, ENTRY_PLANES_DESACTUALIZADOS as PlantillaEntry<unknown>],
  [TipoEventoNotif.MODULO_HUERFANO_SKILL, ENTRY_MODULO_HUERFANO_SKILL as PlantillaEntry<unknown>],
  [TipoEventoNotif.RECORDATORIO_DEADLINE, ENTRY_RECORDATORIO_DEADLINE as PlantillaEntry<unknown>],
  [TipoEventoNotif.CENTRO_REVISION, ENTRY_CENTRO_REVISION as PlantillaEntry<unknown>],
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
