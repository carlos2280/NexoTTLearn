import { UnprocessableEntityException } from "@nestjs/common"
import { DesbloqueoCurso, Prisma } from "@prisma/client"
import { apiErrorCodes } from "../common/errors/api-error.codes"

/**
 * Contextos posibles del codigo unificado `VALIDACION_PESO_NO_SUMA_100`
 * (D-CUR-11). Viaja en `details.contexto` para que el cliente distinga
 * la fuente del fallo sin duplicar codigos.
 */
export type ContextoSumaPesos =
  | "AREAS"
  | "PESOS_INTRA_SKILL"
  | "CAPAS_TRANSVERSAL"
  | "RUBRICA_ENTREVISTA"

/**
 * Comparacion exacta `toFixed(2) === "100.00"` (D-CUR-5). El wizard del front
 * normaliza los inputs y el contrato exige suma = 100. Si emerge friccion por
 * redondeos, relajar a tolerancia 0.01 en FIX dedicado.
 *
 * Acepta `number` o `Prisma.Decimal` para reusar en validaciones que mezclan
 * valores nuevos del input con valores actuales del curso (Decimal de BD).
 */
export function validarSumaPesosCien(
  valores: ReadonlyArray<number | Prisma.Decimal>,
  contexto: ContextoSumaPesos,
): void {
  const suma = valores.reduce<number>((acc, v) => acc + Number(v), 0)
  if (suma.toFixed(2) !== "100.00") {
    throw new UnprocessableEntityException({
      code: apiErrorCodes.validacionPesoNoSuma100,
      message: `La suma de pesos debe ser 100 (contexto: ${contexto}).`,
      details: { contexto, sumaActual: Number(suma.toFixed(2)) },
    })
  }
}

/**
 * Diff de composite keys (D-CUR-6, patron heredado D-CAT-21). Calcula el
 * conjunto de claves a eliminar y a agregar dados un estado actual y un
 * estado deseado. La interseccion se devuelve para procesar updates puntuales
 * cuando ademas hay columnas extra (peso, notaMinima, puntajeObjetivo).
 */
export function calcularDiffComposite<T extends string>(
  enBD: ReadonlySet<T>,
  enInput: ReadonlySet<T>,
): {
  readonly aEliminar: readonly T[]
  readonly aAgregar: readonly T[]
  readonly interseccion: readonly T[]
} {
  const aEliminar = [...enBD].filter((v) => !enInput.has(v))
  const aAgregar = [...enInput].filter((v) => !enBD.has(v))
  const interseccion = [...enInput].filter((v) => enBD.has(v))
  return { aEliminar, aAgregar, interseccion }
}

/**
 * Validacion de monotonia para umbrales de logro: excelencia >= solido >=
 * enDesarrollo, todos en [0,100]. Lanza 422 si se viola.
 */
export function validarMonotoniaUmbralesLogro(valores: {
  readonly excelencia: number
  readonly solido: number
  readonly enDesarrollo: number
}): void {
  if (!(valores.excelencia >= valores.solido && valores.solido >= valores.enDesarrollo)) {
    throw new UnprocessableEntityException({
      code: apiErrorCodes.validacionUmbralesLogroMonotonia,
      message: "Los umbrales de logro deben cumplir excelencia >= solido >= enDesarrollo.",
      details: valores,
    })
  }
}

/**
 * Validacion de duracion de entrevista IA: solo se aceptan 15, 30 o 45 min.
 */
export function validarDuracionEntrevistaIa(duracionMinutos: number): void {
  if (!(duracionMinutos === 15 || duracionMinutos === 30 || duracionMinutos === 45)) {
    throw new UnprocessableEntityException({
      code: apiErrorCodes.validacionDuracionEntrevistaInvalida,
      message: "La duracion de la entrevista IA debe ser 15, 30 o 45 minutos.",
      details: { duracionMinutos },
    })
  }
}

// ============================================================================
// P4c — Precondiciones de publicacion (D63, D-CUR-9)
// ============================================================================

/**
 * Falla individual recolectada por `validarPrecondicionesPublicacion`.
 * Viaja en `details.validacionesFallidas` del 422.
 */
export interface ValidacionFallida {
  readonly codigo: string
  readonly mensaje: string
  readonly detalles?: Record<string, unknown>
}

export type ResultadoPublicacion =
  | { readonly ok: true }
  | { readonly ok: false; readonly validacionesFallidas: readonly ValidacionFallida[] }

/**
 * Snapshot del curso necesario para validar las 8 precondiciones D63 en una
 * sola pasada (D-CUR-9). Mantenemos el shape minimo y desacoplado del cliente
 * Prisma: el service hace una sola lectura dentro del `$transaction` y arma
 * este objeto antes de invocar al helper puro.
 *
 * El helper NO consulta BD. La cobertura D82 (skill -> modulo habilitado) se
 * pre-calcula por el service via `calcularSkillsSinCobertura` y se pasa como
 * `skillsSinCobertura`.
 */
export interface CursoPublicacionSnapshot {
  readonly clienteId: string | null
  readonly fechaInicio: Date
  readonly fechaDeadline: Date
  readonly fechaDesbloqueo: Date | null
  readonly desbloqueo: DesbloqueoCurso
  readonly pesoBloques: Prisma.Decimal | number
  readonly pesoTransversal: Prisma.Decimal | number
  readonly pesoEntrevista: Prisma.Decimal | number
  readonly areasExigidas: ReadonlyArray<{
    readonly areaId: string
    readonly peso: Prisma.Decimal | number
    readonly puntajeObjetivo: Prisma.Decimal | number
  }>
  readonly skillsExigidas: ReadonlyArray<{ readonly skillId: string }>
  readonly skillsSinCobertura: ReadonlyArray<{
    readonly skillId: string
    readonly etiquetaVisible: string
  }>
  readonly transversal: {
    readonly umbralAprobacion: Prisma.Decimal | number
    readonly pesoCapaTests: Prisma.Decimal | number
    readonly pesoCapaCualitativa: Prisma.Decimal | number
    readonly pesoCapaComprension: Prisma.Decimal | number
  } | null
  readonly entrevistaIa: {
    readonly umbralAprobacion: Prisma.Decimal | number
    readonly duracionMinutos: number
    readonly rubrica: ReadonlyArray<{
      readonly areaId: string
      readonly peso: Prisma.Decimal | number
    }>
  } | null
}

function sumarPesos(valores: ReadonlyArray<Prisma.Decimal | number>): number {
  return Number(valores.reduce<number>((acc, v) => acc + Number(v), 0).toFixed(2))
}

function enRango0a100(valor: Prisma.Decimal | number): boolean {
  const n = Number(valor)
  return Number.isFinite(n) && n >= 0 && n <= 100
}

/**
 * D-CUR-9 / D63: valida las 8 precondiciones de publicacion en una sola pasada
 * y devuelve TODAS las fallas (sin early-exit) para que el admin pueda corregir
 * el curso completo en una edicion.
 */
export function validarPrecondicionesPublicacion(
  curso: CursoPublicacionSnapshot,
): ResultadoPublicacion {
  const fallas: ValidacionFallida[] = []
  validarCliente(curso, fallas)
  validarAreas(curso, fallas)
  validarCoberturaSkills(curso, fallas)
  validarPesosIntraSkill(curso, fallas)
  validarTransversalSiAplica(curso, fallas)
  validarEntrevistaIaSiAplica(curso, fallas)
  validarFechas(curso, fallas)
  if (fallas.length === 0) {
    return { ok: true }
  }
  return { ok: false, validacionesFallidas: fallas }
}

function validarCliente(curso: CursoPublicacionSnapshot, fallas: ValidacionFallida[]): void {
  if (!curso.clienteId) {
    fallas.push({
      codigo: apiErrorCodes.clienteNoEncontrado,
      mensaje: "El curso debe tener un cliente declarado.",
    })
  }
}

function validarAreas(curso: CursoPublicacionSnapshot, fallas: ValidacionFallida[]): void {
  if (curso.areasExigidas.length === 0) {
    fallas.push({
      codigo: apiErrorCodes.validacionPesoNoSuma100,
      mensaje: "Se requiere al menos un area exigida con suma de pesos = 100.",
      detalles: { contexto: "AREAS", sumaActual: 0 },
    })
    return
  }
  const suma = sumarPesos(curso.areasExigidas.map((a) => a.peso))
  if (suma !== 100) {
    fallas.push({
      codigo: apiErrorCodes.validacionPesoNoSuma100,
      mensaje: "La suma de pesos de areas debe ser 100.",
      detalles: { contexto: "AREAS", sumaActual: suma },
    })
  }
  const fueraDeRango = curso.areasExigidas.filter((a) => !enRango0a100(a.puntajeObjetivo))
  if (fueraDeRango.length > 0) {
    fallas.push({
      codigo: apiErrorCodes.validacionAreaPuntajeObjetivoFueraDeRango,
      mensaje: "Cada area exigida debe tener puntajeObjetivo en [0, 100].",
      detalles: {
        areas: fueraDeRango.map((a) => ({
          areaId: a.areaId,
          puntajeObjetivo: Number(a.puntajeObjetivo),
        })),
      },
    })
  }
}

function validarCoberturaSkills(
  curso: CursoPublicacionSnapshot,
  fallas: ValidacionFallida[],
): void {
  if (curso.skillsSinCobertura.length === 0) {
    return
  }
  fallas.push({
    codigo: apiErrorCodes.validacionSkillSinCobertura,
    mensaje: "Cada skill exigida debe estar cubierta por al menos un modulo habilitado activo.",
    detalles: { skills: curso.skillsSinCobertura.map((s) => ({ ...s })) },
  })
}

function validarPesosIntraSkill(
  curso: CursoPublicacionSnapshot,
  fallas: ValidacionFallida[],
): void {
  const suma = sumarPesos([curso.pesoBloques, curso.pesoTransversal, curso.pesoEntrevista])
  if (suma !== 100) {
    fallas.push({
      codigo: apiErrorCodes.validacionPesoNoSuma100,
      mensaje: "La suma pesoBloques + pesoTransversal + pesoEntrevista debe ser 100.",
      detalles: { contexto: "PESOS_INTRA_SKILL", sumaActual: suma },
    })
  }
}

function validarTransversalSiAplica(
  curso: CursoPublicacionSnapshot,
  fallas: ValidacionFallida[],
): void {
  const t = curso.transversal
  if (!t) {
    return
  }
  const suma = sumarPesos([t.pesoCapaTests, t.pesoCapaCualitativa, t.pesoCapaComprension])
  if (suma !== 100) {
    fallas.push({
      codigo: apiErrorCodes.validacionPesoNoSuma100,
      mensaje: "La suma de pesos de capas del transversal debe ser 100.",
      detalles: { contexto: "CAPAS_TRANSVERSAL", sumaActual: suma },
    })
  }
  if (!enRango0a100(t.umbralAprobacion)) {
    fallas.push({
      codigo: apiErrorCodes.validacionUmbralFueraDeRango,
      mensaje: "El umbral de aprobacion del transversal debe estar en [0, 100].",
      detalles: { contexto: "CAPAS_TRANSVERSAL", umbralAprobacion: Number(t.umbralAprobacion) },
    })
  }
}

function validarEntrevistaIaSiAplica(
  curso: CursoPublicacionSnapshot,
  fallas: ValidacionFallida[],
): void {
  const e = curso.entrevistaIa
  if (!e) {
    return
  }
  if (e.rubrica.length === 0) {
    fallas.push({
      codigo: apiErrorCodes.validacionPesoNoSuma100,
      mensaje: "La rubrica de la entrevista IA debe tener al menos un area y sumar 100.",
      detalles: { contexto: "RUBRICA_ENTREVISTA", sumaActual: 0 },
    })
  } else {
    const suma = sumarPesos(e.rubrica.map((r) => r.peso))
    if (suma !== 100) {
      fallas.push({
        codigo: apiErrorCodes.validacionPesoNoSuma100,
        mensaje: "La suma de pesos de la rubrica de entrevista IA debe ser 100.",
        detalles: { contexto: "RUBRICA_ENTREVISTA", sumaActual: suma },
      })
    }
  }
  if (!enRango0a100(e.umbralAprobacion)) {
    fallas.push({
      codigo: apiErrorCodes.validacionUmbralFueraDeRango,
      mensaje: "El umbral de aprobacion de la entrevista IA debe estar en [0, 100].",
      detalles: { contexto: "RUBRICA_ENTREVISTA", umbralAprobacion: Number(e.umbralAprobacion) },
    })
  }
  if (!(e.duracionMinutos === 15 || e.duracionMinutos === 30 || e.duracionMinutos === 45)) {
    fallas.push({
      codigo: apiErrorCodes.validacionDuracionEntrevistaInvalida,
      mensaje: "La duracion de la entrevista IA debe ser 15, 30 o 45 minutos.",
      detalles: { duracionMinutos: e.duracionMinutos },
    })
  }
}

function validarFechas(curso: CursoPublicacionSnapshot, fallas: ValidacionFallida[]): void {
  if (curso.fechaInicio.getTime() >= curso.fechaDeadline.getTime()) {
    fallas.push({
      codigo: apiErrorCodes.validacionCursoFechas,
      mensaje: "fechaInicio debe ser anterior a fechaDeadline.",
      detalles: { campo: "fechaInicio" },
    })
  }
  if (curso.desbloqueo === DesbloqueoCurso.DESDE_FECHA) {
    if (!curso.fechaDesbloqueo) {
      fallas.push({
        codigo: apiErrorCodes.validacionCursoFechas,
        mensaje: "fechaDesbloqueo es requerida cuando desbloqueo='DESDE_FECHA'.",
        detalles: { campo: "fechaDesbloqueo" },
      })
    } else if (curso.fechaDesbloqueo.getTime() > curso.fechaDeadline.getTime()) {
      fallas.push({
        codigo: apiErrorCodes.validacionCursoFechas,
        mensaje: "fechaDesbloqueo no puede ser posterior a fechaDeadline.",
        detalles: { campo: "fechaDesbloqueo" },
      })
    }
  }
}

/**
 * Construye el subset de pesos a actualizar para PATCH /cursos/:id/pesos
 * incluyendo unicamente las claves presentes en el input (H-11). El resultado
 * sirve como `data` para `tx.curso.update` y como `pesosNuevos` para el
 * `previewImpacto` del log: ambos deben quedar simetricos para evitar drift.
 */
export function construirPesosCambiados(input: {
  readonly pesoBloques?: number
  readonly pesoTransversal?: number
  readonly pesoEntrevista?: number
  readonly umbralNoCumple?: number
}): Partial<
  Record<"pesoBloques" | "pesoTransversal" | "pesoEntrevista" | "umbralNoCumple", number>
> {
  const out: Partial<
    Record<"pesoBloques" | "pesoTransversal" | "pesoEntrevista" | "umbralNoCumple", number>
  > = {}
  if (input.pesoBloques !== undefined) {
    out.pesoBloques = input.pesoBloques
  }
  if (input.pesoTransversal !== undefined) {
    out.pesoTransversal = input.pesoTransversal
  }
  if (input.pesoEntrevista !== undefined) {
    out.pesoEntrevista = input.pesoEntrevista
  }
  if (input.umbralNoCumple !== undefined) {
    out.umbralNoCumple = input.umbralNoCumple
  }
  return out
}
