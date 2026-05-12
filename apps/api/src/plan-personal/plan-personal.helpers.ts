/**
 * Motor de calculo + mapper visibilidad + % avance al vuelo del plan
 * personal (Slice 7 P7a). Separado del service para permitir tests unit
 * directos del algoritmo sin orquestacion HTTP.
 *
 * Decisiones de referencia:
 *  - D-S7-B1: 3 casos de brecha (NO_CUMPLE, CERCA, CUMPLE).
 *  - D-S7-B2: skill -> modulo habilitado -> seccion que ensena la skill.
 *  - D-S7-B3: fichaSnapshot v1 con brecha precalculada.
 *  - D-S7-B6: porcentaje al vuelo (sin materializar columna).
 *  - D-S7-D2: mapper diferenciado admin/participante.
 */
import { fichaSnapshotV1Schema } from "@nexott-learn/shared-types"
import type {
  DiffSeccionAfectada,
  DiffSkillItem,
  EstadoBrechaSnapshot,
  FichaSnapshotV1,
  ImpactoDiffSkill,
  ModuloPlanAdmin,
  ModuloPlanParticipante,
  PlanResponseAdmin,
  PlanResponseParticipante,
  SeccionPlanItemAdmin,
  SeccionPlanItemParticipante,
  SkillSnapshotItem,
} from "@nexott-learn/shared-types"
import { CaracterItemPlan, Prisma, RazonItemPlan, RolUsuario } from "@prisma/client"
import { UMBRAL_BLOQUE_DEFAULT } from "./plan-personal.constants"
import type {
  AvancePlan,
  AvanceSeccion,
  ItemPlanCalculado,
  ModuloSeccionRef,
} from "./plan-personal.types"

const PORCENTAJE_TOTAL = 100
const PRECISION_PORCENTAJE = 2

const ORIGEN_NOTA_VALORES = [
  "ENTREVISTA_INICIAL",
  "BLOQUE",
  "TRANSVERSAL",
  "ENTREVISTA_IA",
  "MANUAL",
] as const
type OrigenSnapshotMapeable = (typeof ORIGEN_NOTA_VALORES)[number]
const ORIGEN_NOTA_SET = new Set<string>(ORIGEN_NOTA_VALORES)

interface SkillBrechaEvaluada {
  readonly skillId: string
  readonly notaActual: number | null
  readonly notaMinimaExigida: number
  readonly brecha: number
  readonly estado: "NO_CUMPLE" | "CERCA" | "CUMPLE"
  readonly razon: "SKILL_FALTANTE" | "SKILL_CERCA" | "SKILL_YA_CUMPLE"
}

interface SeccionContext {
  readonly seccionId: string
  readonly moduloId: string
  readonly seccionTitulo: string
  readonly tituloModulo: string
  readonly skillIds: readonly string[]
}

interface CalcularPlanInput {
  readonly cursoId: string
  readonly colaboradorId: string
  /**
   * Umbral configurable por curso (`Curso.umbralNoCumple`). Determina cuando
   * una brecha pasa de CERCA a SKILL_FALTANTE. Default 10.
   */
  readonly umbralNoCumple: number
  /**
   * Skills exigidas por el curso (`CursoSkillExigida`).
   */
  readonly exigidas: ReadonlyArray<{
    readonly skillId: string
    readonly notaMinima: number
  }>
  /**
   * Notas vigentes del colaborador para las skills relevantes (`NotaSkill`).
   * Las skills sin entrada en `NotaSkill` se tratan como `notaActual=null`.
   */
  readonly notas: ReadonlyArray<{
    readonly skillId: string
    readonly notaActual: number | null
    readonly origen: string | null
  }>
  /**
   * Secciones disponibles bajo los modulos habilitados del curso. Incluye
   * `skillIds` para clasificar la seccion como OBLIGATORIA / OPCIONAL / FUERA.
   */
  readonly secciones: readonly SeccionContext[]
}

export interface ResultadoCalculo {
  readonly fichaSnapshot: FichaSnapshotV1
  readonly items: readonly ItemPlanCalculado[]
  readonly modulosSecciones: readonly ModuloSeccionRef[]
}

/**
 * Motor de calculo del plan (D-S7-B1, B2, B3). Devuelve `fichaSnapshot` + lista
 * de items sin persistir. La persistencia (UPSERT) la coordina el service.
 */
export function calcularPlan(input: CalcularPlanInput): ResultadoCalculo {
  const notasPorSkill = new Map(input.notas.map((n) => [n.skillId, n]))
  const skillsEvaluadas = evaluarSkills(input, notasPorSkill)
  const fichaSnapshot = construirSnapshot(skillsEvaluadas, notasPorSkill)

  const estadoPorSkill = new Map(skillsEvaluadas.map((s) => [s.skillId, s]))
  const skillIdsExigidas = new Set(input.exigidas.map((e) => e.skillId))

  const items: ItemPlanCalculado[] = []
  const modulosSecciones: ModuloSeccionRef[] = []

  for (const seccion of input.secciones) {
    const skillsExigidasSeccion = seccion.skillIds.filter((s) => skillIdsExigidas.has(s))
    if (skillsExigidasSeccion.length === 0) {
      // La seccion no ensena ninguna skill del curso -> fuera del plan.
      continue
    }
    const item = clasificarSeccion(seccion, skillsExigidasSeccion, estadoPorSkill)
    if (item) {
      items.push(item)
      modulosSecciones.push({
        moduloId: seccion.moduloId,
        tituloModulo: seccion.tituloModulo,
        seccionId: seccion.seccionId,
        seccionTitulo: seccion.seccionTitulo,
      })
    }
  }

  return { fichaSnapshot, items, modulosSecciones }
}

function evaluarSkills(
  input: CalcularPlanInput,
  notasPorSkill: Map<
    string,
    { readonly notaActual: number | null; readonly origen: string | null }
  >,
): readonly SkillBrechaEvaluada[] {
  return input.exigidas.map((exigida) => {
    const nota = notasPorSkill.get(exigida.skillId)
    const notaActual = nota?.notaActual ?? null
    const notaEfectiva = notaActual ?? 0
    const brecha = exigida.notaMinima - notaEfectiva
    if (brecha <= 0) {
      return {
        skillId: exigida.skillId,
        notaActual,
        notaMinimaExigida: exigida.notaMinima,
        brecha,
        estado: "CUMPLE",
        razon: "SKILL_YA_CUMPLE",
      }
    }
    if (brecha >= input.umbralNoCumple) {
      return {
        skillId: exigida.skillId,
        notaActual,
        notaMinimaExigida: exigida.notaMinima,
        brecha,
        estado: "NO_CUMPLE",
        razon: "SKILL_FALTANTE",
      }
    }
    return {
      skillId: exigida.skillId,
      notaActual,
      notaMinimaExigida: exigida.notaMinima,
      brecha,
      estado: "CERCA",
      razon: "SKILL_CERCA",
    }
  })
}

function construirSnapshot(
  skillsEvaluadas: readonly SkillBrechaEvaluada[],
  notasPorSkill: Map<
    string,
    { readonly notaActual: number | null; readonly origen: string | null }
  >,
): FichaSnapshotV1 {
  const ahora = new Date().toISOString()
  const skillsConsideradas: SkillSnapshotItem[] = skillsEvaluadas.map((s) => ({
    skillId: s.skillId,
    nota: s.notaActual,
    origen: mapearOrigenSnapshot(notasPorSkill.get(s.skillId)?.origen ?? null, s.notaActual),
    notaMinimaExigida: s.notaMinimaExigida,
    brecha: s.brecha,
    estado: s.estado,
  }))
  const ficha: FichaSnapshotV1 = {
    fechaCalculo: ahora,
    versionSnapshot: 1,
    skillsConsideradas,
  }
  // Defense in depth: validar antes de devolver. Si el shape no encaja con el
  // schema Zod publico, fallamos aqui en lugar de persistir un JSONB invalido.
  return fichaSnapshotV1Schema.parse(ficha)
}

function mapearOrigenSnapshot(
  origenCrudo: string | null,
  notaActual: number | null,
): SkillSnapshotItem["origen"] {
  if (notaActual === null || origenCrudo === null) {
    return "SIN_NOTA"
  }
  if (ORIGEN_NOTA_SET.has(origenCrudo)) {
    return origenCrudo as OrigenSnapshotMapeable
  }
  return "SIN_NOTA"
}

function clasificarSeccion(
  seccion: SeccionContext,
  skillsExigidasSeccion: readonly string[],
  estadoPorSkill: Map<string, SkillBrechaEvaluada>,
): ItemPlanCalculado | null {
  let hayFaltante = false
  let hayCerca = false
  let todasCumplen = true
  for (const skillId of skillsExigidasSeccion) {
    const ev = estadoPorSkill.get(skillId)
    if (!ev) {
      continue
    }
    if (ev.estado === "NO_CUMPLE") {
      hayFaltante = true
      todasCumplen = false
    } else if (ev.estado === "CERCA") {
      hayCerca = true
      todasCumplen = false
    }
  }
  if (hayFaltante) {
    return {
      moduloId: seccion.moduloId,
      seccionId: seccion.seccionId,
      caracter: "OBLIGATORIA",
      razon: "SKILL_FALTANTE",
    }
  }
  if (hayCerca) {
    return {
      moduloId: seccion.moduloId,
      seccionId: seccion.seccionId,
      caracter: "OBLIGATORIA",
      razon: "SKILL_CERCA",
    }
  }
  if (todasCumplen) {
    return {
      moduloId: seccion.moduloId,
      seccionId: seccion.seccionId,
      caracter: "OPCIONAL",
      razon: "SKILL_YA_CUMPLE",
    }
  }
  return null
}

interface SeccionConBloques {
  readonly seccionId: string
  readonly bloques: ReadonlyArray<{ readonly id: string }>
}

interface IntentoMejorVigente {
  readonly bloqueId: string
  readonly notaNum: number
}

interface AperturaSeccionRef {
  readonly seccionId: string
}

interface CalcularAvanceInput {
  /**
   * Items obligatorios del plan con su seccion + bloques evaluables activos.
   * El servicio carga esto desde Prisma con un select explicito (R-S7-1).
   */
  readonly seccionesObligatorias: readonly SeccionConBloques[]
  readonly mejoresIntentosVigentes: readonly IntentoMejorVigente[]
  readonly aperturas: readonly AperturaSeccionRef[]
}

/**
 * Calculo de % avance al vuelo (D-S7-B6). Una seccion obligatoria se considera
 * completada cuando:
 *  - Tiene bloques evaluables activos: todos los bloques tienen mejor-intento
 *    vigente con `nota >= UMBRAL_BLOQUE_DEFAULT` (P7b conectara el umbral real).
 *  - No tiene bloques evaluables: existe fila `AperturaSeccion` para la
 *    asignacion+seccion (D94 §9.6).
 * Si no hay obligatorias -> porcentaje 100 (vacuamente cumplido).
 */
export function calcularAvance(input: CalcularAvanceInput): {
  readonly avancePlan: AvancePlan
  readonly porSeccion: ReadonlyMap<string, AvanceSeccion>
} {
  const intentosPorBloque = new Map<string, IntentoMejorVigente>()
  for (const i of input.mejoresIntentosVigentes) {
    intentosPorBloque.set(i.bloqueId, i)
  }
  const aperturasSet = new Set(input.aperturas.map((a) => a.seccionId))

  const porSeccion = new Map<string, AvanceSeccion>()
  let seccionesCompletadas = 0
  for (const seccion of input.seccionesObligatorias) {
    const total = seccion.bloques.length
    let completados = 0
    let seccionCompletada = false
    if (total === 0) {
      seccionCompletada = aperturasSet.has(seccion.seccionId)
    } else {
      for (const bloque of seccion.bloques) {
        const intento = intentosPorBloque.get(bloque.id)
        if (intento && intento.notaNum >= UMBRAL_BLOQUE_DEFAULT) {
          completados += 1
        }
      }
      seccionCompletada = completados === total
    }
    if (seccionCompletada) {
      seccionesCompletadas += 1
    }
    porSeccion.set(seccion.seccionId, {
      seccionId: seccion.seccionId,
      completada: seccionCompletada,
      bloquesCompletados: completados,
      bloquesTotales: total,
    })
  }

  const seccionesObligatorias = input.seccionesObligatorias.length
  const porcentaje =
    seccionesObligatorias === 0
      ? PORCENTAJE_TOTAL
      : redondear(
          (seccionesCompletadas / seccionesObligatorias) * PORCENTAJE_TOTAL,
          PRECISION_PORCENTAJE,
        )

  return {
    avancePlan: { seccionesCompletadas, seccionesObligatorias, porcentaje },
    porSeccion,
  }
}

function redondear(valor: number, decimales: number): number {
  const factor = 10 ** decimales
  return Math.round(valor * factor) / factor
}

interface ToPlanResponseInput {
  readonly planId: string
  readonly asignacionId: string
  readonly fechaCalculo: Date
  readonly estaDesactualizado: boolean
  readonly fichaSnapshot: FichaSnapshotV1
  readonly items: ReadonlyArray<{
    readonly moduloId: string
    readonly seccionId: string
    readonly caracter: CaracterItemPlan
    readonly razon: RazonItemPlan
  }>
  readonly modulosSecciones: readonly ModuloSeccionRef[]
  readonly avance: AvancePlan
  readonly porSeccion: ReadonlyMap<string, AvanceSeccion>
  readonly rol: RolUsuario
}

/**
 * Mapper de respuesta (D-S7-D2). El PARTICIPANTE NO recibe `razon` en items,
 * ni `estaDesactualizado`, ni `fichaSnapshot`. Las claves no aparecen en el
 * objeto (no son `undefined`), para que `Object.hasOwn` retorne `false`.
 */
export function toPlanResponse(
  input: ToPlanResponseInput,
): PlanResponseAdmin | PlanResponseParticipante {
  const refsPorSeccion = new Map(input.modulosSecciones.map((r) => [r.seccionId, r]))
  const itemsPorModulo = agruparPorModulo(input.items, refsPorSeccion)

  if (input.rol === RolUsuario.ADMIN) {
    return construirAdmin(input, itemsPorModulo, refsPorSeccion)
  }
  return construirParticipante(input, itemsPorModulo, refsPorSeccion)
}

function agruparPorModulo(
  items: ToPlanResponseInput["items"],
  refsPorSeccion: ReadonlyMap<string, ModuloSeccionRef>,
): Map<string, ToPlanResponseInput["items"][number][]> {
  const grupo = new Map<string, ToPlanResponseInput["items"][number][]>()
  for (const item of items) {
    const ref = refsPorSeccion.get(item.seccionId)
    if (!ref) {
      continue
    }
    const lista = grupo.get(ref.moduloId) ?? []
    lista.push(item)
    grupo.set(ref.moduloId, lista)
  }
  return grupo
}

function construirAdmin(
  input: ToPlanResponseInput,
  itemsPorModulo: ReadonlyMap<string, readonly ToPlanResponseInput["items"][number][]>,
  refsPorSeccion: ReadonlyMap<string, ModuloSeccionRef>,
): PlanResponseAdmin {
  const modulos: ModuloPlanAdmin[] = []
  for (const [moduloId, items] of itemsPorModulo) {
    const primero = items[0]
    const tituloModulo = primero ? (refsPorSeccion.get(primero.seccionId)?.tituloModulo ?? "") : ""
    const secciones: SeccionPlanItemAdmin[] = items.map((it) => {
      const ref = refsPorSeccion.get(it.seccionId)
      const avance = input.porSeccion.get(it.seccionId)
      return {
        seccionId: it.seccionId,
        titulo: ref?.seccionTitulo ?? "",
        caracter: it.caracter,
        razon: it.razon,
        completada: avance?.completada ?? false,
        avance: {
          bloquesCompletados: avance?.bloquesCompletados ?? 0,
          bloquesTotales: avance?.bloquesTotales ?? 0,
        },
      }
    })
    modulos.push({ moduloId, tituloModulo, secciones })
  }
  return {
    planId: input.planId,
    asignacionId: input.asignacionId,
    fechaCalculo: input.fechaCalculo.toISOString(),
    estaDesactualizado: input.estaDesactualizado,
    fichaSnapshot: input.fichaSnapshot,
    items: modulos,
    avance: input.avance,
  }
}

function construirParticipante(
  input: ToPlanResponseInput,
  itemsPorModulo: ReadonlyMap<string, readonly ToPlanResponseInput["items"][number][]>,
  refsPorSeccion: ReadonlyMap<string, ModuloSeccionRef>,
): PlanResponseParticipante {
  const modulos: ModuloPlanParticipante[] = []
  for (const [moduloId, items] of itemsPorModulo) {
    const primero = items[0]
    const tituloModulo = primero ? (refsPorSeccion.get(primero.seccionId)?.tituloModulo ?? "") : ""
    const secciones: SeccionPlanItemParticipante[] = items.map((it) => {
      const ref = refsPorSeccion.get(it.seccionId)
      const avance = input.porSeccion.get(it.seccionId)
      return {
        seccionId: it.seccionId,
        titulo: ref?.seccionTitulo ?? "",
        caracter: it.caracter,
        completada: avance?.completada ?? false,
        avance: {
          bloquesCompletados: avance?.bloquesCompletados ?? 0,
          bloquesTotales: avance?.bloquesTotales ?? 0,
        },
      }
    })
    modulos.push({ moduloId, tituloModulo, secciones })
  }
  return {
    planId: input.planId,
    asignacionId: input.asignacionId,
    fechaCalculo: input.fechaCalculo.toISOString(),
    items: modulos,
    avance: input.avance,
  }
}

// ===========================================================================
// Diff de plan (P7c, D80, D95)
// ===========================================================================

interface SkillDiffInputItem {
  readonly skillId: string
  /** Mejor intento previo segun snapshot (puede ser null si no habia nota). */
  readonly notaSnapshot: number | null
  readonly estadoSnapshot: EstadoBrechaSnapshot
  readonly notaVigente: number | null
  readonly notaMinima: number
  /**
   * Secciones del plan que ensenan esta skill, con su caracter actual + el
   * conjunto de skills exigidas que cubren (para decidir el impacto seccion).
   */
  readonly seccionesQueEnsenan: ReadonlyArray<{
    readonly seccionId: string
    readonly tituloSeccion: string
    readonly caracterActual: "OBLIGATORIA" | "OPCIONAL"
  }>
}

interface CalcularDiffInput {
  readonly umbralNoCumple: number
  readonly skills: readonly SkillDiffInputItem[]
}

/**
 * Calcula el diff entre la `fichaSnapshot` y las notas vigentes. Solo aparecen
 * skills cuya nota cambio (o cuyo estado cambio). El impacto a nivel de
 * seccion lo determinamos por skill: si la skill pasa a CUMPLE, las secciones
 * que la ensenan podrian dejar de ser obligatorias; si la skill pasa a
 * NO_CUMPLE/CERCA, podrian pasar a obligatorias.
 */
export function calcularDiffPlan(input: CalcularDiffInput): readonly DiffSkillItem[] {
  const diff: DiffSkillItem[] = []
  for (const skill of input.skills) {
    if (skill.notaSnapshot === skill.notaVigente) {
      continue
    }
    const estadoVigente = computarEstado(skill.notaVigente, skill.notaMinima, input.umbralNoCumple)
    const impacto = computarImpactoSkill(skill.estadoSnapshot, estadoVigente)
    const seccionesAfectadas = mapSeccionesAfectadas(skill, impacto)
    diff.push({
      skillId: skill.skillId,
      notaSnapshot: skill.notaSnapshot,
      notaVigente: skill.notaVigente,
      estadoSnapshot: skill.estadoSnapshot,
      estadoVigente,
      impacto,
      seccionesAfectadas,
    })
  }
  return diff
}

function computarEstado(
  nota: number | null,
  notaMinima: number,
  umbralNoCumple: number,
): EstadoBrechaSnapshot {
  const efectiva = nota ?? 0
  const brecha = notaMinima - efectiva
  if (brecha <= 0) {
    return "CUMPLE"
  }
  if (brecha >= umbralNoCumple) {
    return "NO_CUMPLE"
  }
  return "CERCA"
}

function computarImpactoSkill(
  estadoSnapshot: EstadoBrechaSnapshot,
  estadoVigente: EstadoBrechaSnapshot,
): ImpactoDiffSkill {
  const requeriaAntes = estadoSnapshot !== "CUMPLE"
  const requiereAhora = estadoVigente !== "CUMPLE"
  if (requeriaAntes && !requiereAhora) {
    return "SECCION_DEJA_DE_SER_OBLIGATORIA"
  }
  if (!requeriaAntes && requiereAhora) {
    return "SECCION_PASA_A_OBLIGATORIA"
  }
  return "CAMBIO_NOTA_SIN_IMPACTO"
}

function mapSeccionesAfectadas(
  skill: SkillDiffInputItem,
  impacto: ImpactoDiffSkill,
): readonly DiffSeccionAfectada[] {
  if (impacto === "CAMBIO_NOTA_SIN_IMPACTO") {
    return []
  }
  const impactoSeccion =
    impacto === "SECCION_DEJA_DE_SER_OBLIGATORIA" ? "DEJA_DE_SER_OBLIGATORIA" : "PASA_A_OBLIGATORIA"
  const resultado: DiffSeccionAfectada[] = []
  for (const s of skill.seccionesQueEnsenan) {
    if (impacto === "SECCION_DEJA_DE_SER_OBLIGATORIA" && s.caracterActual !== "OBLIGATORIA") {
      continue
    }
    if (impacto === "SECCION_PASA_A_OBLIGATORIA" && s.caracterActual === "OBLIGATORIA") {
      continue
    }
    resultado.push({
      seccionId: s.seccionId,
      tituloSeccion: s.tituloSeccion,
      impactoSeccion,
    })
  }
  return resultado
}

/**
 * Helper para convertir un `Prisma.Decimal | number | null` a number plano.
 * Las columnas `Decimal` llegan como string en runtime via Prisma; este
 * helper centraliza la coercion.
 */
export function decimalAsNumber(valor: Prisma.Decimal | number | string | null): number | null {
  if (valor === null || valor === undefined) {
    return null
  }
  if (typeof valor === "number") {
    return valor
  }
  if (typeof valor === "string") {
    const n = Number(valor)
    return Number.isFinite(n) ? n : null
  }
  return Number(valor.toString())
}
