import { BadRequestException, InternalServerErrorException } from "@nestjs/common"
import {
  EvidenciaRepoResumen,
  IntentoTransversalAdminResponse,
  IntentoTransversalParticipanteResponse,
  RepoOArtefacto,
  RevisionIa,
  criteriosEvaluacionSchema,
  evidenciaRepoSchema,
  repoOArtefactoSchema,
  revisionIaSchema,
} from "@nexott-learn/shared-types"
import { Prisma } from "@prisma/client"
import { z } from "zod"
import { apiErrorCodes } from "../common/errors/api-error.codes"
import { IntentoTransversalSeleccionado } from "./transversal.types"

/**
 * Los mappers aceptan tanto el payload de detalle (con `evidenciaRepo`) como el
 * del listado (sin `evidenciaRepo`, aligerado). Se modela con el campo opcional.
 */
type IntentoParaMapper = Omit<IntentoTransversalSeleccionado, "evidenciaRepo"> & {
  readonly evidenciaRepo?: Prisma.JsonValue
}

const idempotencyKeyUuidSchema = z.string().uuid()

/**
 * Valida el JSONB `criteriosEvaluacion` (la "Lista a evaluar" del admin) contra
 * el contrato compartido. Null/legacy/corrupto → `[]`: el transversal se trata
 * como sin lista (comportamiento previo). Fuente única de parseo, reutilizada
 * por el GET del transversal y por el job de evaluación.
 */
export function parsearCriteriosEvaluacion(raw: Prisma.JsonValue | null | undefined): string[] {
  const parsed = criteriosEvaluacionSchema.safeParse(raw)
  return parsed.success ? parsed.data : []
}

/**
 * Valida que `Idempotency-Key` venga presente y con shape UUID v4. Patron
 * identico al de intentos-bloque (Slice 7) — el alineamiento es deliberado.
 */
export function requireIdempotencyKeyUuid(headerValue: string | undefined): string {
  if (headerValue === undefined || !idempotencyKeyUuidSchema.safeParse(headerValue).success) {
    throw new BadRequestException({
      code: apiErrorCodes.idempotencyKeyRequerida,
      message: "El header Idempotency-Key es obligatorio y debe ser un UUID v4.",
    })
  }
  return headerValue
}

/**
 * Parsea el campo JSONB `repo_o_artefacto` del intento — el shape vive en el
 * schema Zod compartido y se valida antes de exponer al cliente. Si la fila
 * tiene un JSON corrupto (escenario imposible mientras solo el service inserta),
 * fallback a `null`-equivalente con un placeholder que el caller decide.
 */
export function parsearRepoOArtefacto(
  value: Prisma.JsonValue,
  fallbackUrl: string | null,
): RepoOArtefacto {
  const parsed = repoOArtefactoSchema.safeParse(value)
  if (parsed.success) {
    return parsed.data
  }
  // Soporte legacy: si el body venia solo con `repo_url` (columna nueva del
  // P8a), reconstruimos el shape canonico para no romper el frontend.
  if (fallbackUrl !== null) {
    const reconstituido = { tipo: "URL_GIT" as const, url: fallbackUrl }
    const reparsed = repoOArtefactoSchema.safeParse(reconstituido)
    if (reparsed.success) {
      return reparsed.data
    }
  }
  // Ultimo recurso: devolver un shape inerte (no debe ocurrir, pero evita
  // romper visibilidad de listados ante datos historicos).
  return { tipo: "URL_GIT", url: "about:blank" }
}

/**
 * Decimal -> number con redondeo 2 decimales. Usado por mappers que serializan
 * notas para el cliente.
 */
function decimalAnumero(value: Prisma.Decimal | null): number | null {
  if (value === null) {
    return null
  }
  return Number(value.toString())
}

/**
 * Extrae el informe de la "Revisión con IA" del JSONB `evaluacionesCapas`
 * (clave `cualitativa`). Devuelve `null` si la capa aún no se cargó o si el JSON
 * no cumple el shape esperado (defensa ante datos legacy/corruptos): la pantalla
 * admin trata el `null` como "sin revisión todavía".
 */
function extraerRevisionIa(evaluacionesCapas: Prisma.JsonValue): RevisionIa | null {
  if (
    evaluacionesCapas === null ||
    typeof evaluacionesCapas !== "object" ||
    Array.isArray(evaluacionesCapas)
  ) {
    return null
  }
  const cualitativa = (evaluacionesCapas as Record<string, unknown>).cualitativa
  const parsed = revisionIaSchema.safeParse(cualitativa)
  return parsed.success ? parsed.data : null
}

/**
 * Parsea una columna JSONB que guarda un informe (`reporteIa` / `reporteFinal`,
 * Fase 4b ③) directamente como `RevisionIa`. `null` si aún no existe o no cumple
 * el shape (defensa ante legacy/corrupto).
 */
function parsearReporte(value: Prisma.JsonValue | null): RevisionIa | null {
  if (value === null || value === undefined) {
    return null
  }
  const parsed = revisionIaSchema.safeParse(value)
  return parsed.success ? parsed.data : null
}

/**
 * Extrae el RESUMEN de la evidencia del repo (sin el `contenido` pesado) para el
 * detalle admin. Valida contra el shape completo y descarta el contenido; `null`
 * si aún no hay evidencia o el JSON no cumple el contrato.
 */
function extraerEvidenciaResumen(
  value: Prisma.JsonValue | null | undefined,
): EvidenciaRepoResumen | null {
  if (value === null || value === undefined) {
    return null
  }
  const parsed = evidenciaRepoSchema.safeParse(value)
  if (!parsed.success) {
    return null
  }
  const { commit, archivos, truncado, bytesTotales } = parsed.data
  return { commit, archivos, truncado, bytesTotales }
}

export function toIntentoAdmin(intento: IntentoParaMapper): IntentoTransversalAdminResponse {
  // Invariante de dominio: todo ProyectoTransversal pertenece a un Curso
  // (Curso.transversalId @unique). La relacion inversa es nullable en Prisma
  // por el orden de cascada al borrar — en runtime no puede faltar.
  if (intento.transversal.curso === null) {
    throw new InternalServerErrorException({
      code: apiErrorCodes.errorInterno,
      message: `Intento ${intento.id} apunta a un transversal sin curso asociado.`,
    })
  }
  return {
    intentoId: intento.id,
    estado: intento.estado,
    fecha: intento.fecha.toISOString(),
    repoOArtefacto: parsearRepoOArtefacto(intento.repoOArtefacto, intento.repoUrl),
    comentarioColaborador: intento.comentarioColaborador,
    notaCapaTests: decimalAnumero(intento.notaCapaTests),
    notaCapaCualitativa: decimalAnumero(intento.notaCapaCualitativa),
    notaCapaComprension: decimalAnumero(intento.notaCapaComprension),
    notaGlobal: decimalAnumero(intento.notaGlobal),
    aprobado: intento.aprobado,
    anulado: intento.anulado,
    motivoAnulacion: intento.motivoAnulacion,
    revisionIa: extraerRevisionIa(intento.evaluacionesCapas),
    reporteIa: parsearReporte(intento.reporteIa),
    reporteFinal: parsearReporte(intento.reporteFinal),
    evidenciaRepo: extraerEvidenciaResumen(intento.evidenciaRepo),
    validadoPor: intento.validadoPor ?? null,
    fechaValidacion: intento.fechaValidacion?.toISOString() ?? null,
    colaborador: intento.colaborador,
    curso: intento.transversal.curso,
    transversal: {
      id: intento.transversal.id,
      descripcion: intento.transversal.descripcion,
      umbralAprobacion: Number(intento.transversal.umbralAprobacion.toString()),
    },
    // El cupo de intentos es un dato de asignación (no del intento). El mapper
    // se mantiene puro devolviendo `null`; solo el endpoint de detalle lo puebla
    // (Fase 4b ②). Los mappers de listado/capas lo dejan en `null`.
    cupoIntentos: null,
  }
}

/**
 * Visibilidad PARTICIPANTE — `detalleCapas` NUNCA se expone (D-S8-C2/C3).
 * Solo al FINALIZADO se le suma `notaGlobal` + `aprobado`.
 */
export function toIntentoParticipante(
  intento: IntentoParaMapper,
): IntentoTransversalParticipanteResponse {
  const finalizado = intento.estado === "FINALIZADO"
  return {
    intentoId: intento.id,
    estado: intento.estado,
    fecha: intento.fecha.toISOString(),
    repoOArtefacto: parsearRepoOArtefacto(intento.repoOArtefacto, intento.repoUrl),
    comentarioColaborador: intento.comentarioColaborador,
    notaGlobal: finalizado ? decimalAnumero(intento.notaGlobal) : null,
    aprobado: finalizado ? intento.aprobado : null,
    // El informe FINAL curado por el admin (Fase 4b ③). Solo al FINALIZADO — antes
    // el participante no ve nada del informe. Nunca el crudo ni la evidencia.
    informe: finalizado ? parsearReporte(intento.reporteFinal) : null,
  }
}
