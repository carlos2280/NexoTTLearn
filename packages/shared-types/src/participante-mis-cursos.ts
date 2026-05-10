// Participante · Mis Cursos · lista (`/cursos`).
// Doc canonico: DOCUMENTOS/doc/v2/3-pantallas/participante/mis-cursos/lista.md

import { z } from "zod"

// Presets de gradiente del curso (IDENTIDAD §02.4). El back elige uno; el
// front lo mapea a clases Tailwind tokenizadas. NO viajan hex.
export const gradientePresetSchema = z.enum([
  "violet",
  "indigo",
  "emerald",
  "rose",
  "sky",
  "amber",
  "fuchsia",
  "slate",
  "spectral",
])
export type GradientePreset = z.infer<typeof gradientePresetSchema>

// Presets de icono del curso (Lucide). Default fallback.
export const iconoCursoPresetSchema = z.enum([
  "git",
  "react",
  "typescript",
  "docker",
  "cloud",
  "ai",
  "security",
  "database",
  "design",
  "default",
])
export type IconoCursoPreset = z.infer<typeof iconoCursoPresetSchema>

export const cursoNivelSchema = z.enum(["BASICO", "INTERMEDIO", "AVANZADO"])
export type CursoNivel = z.infer<typeof cursoNivelSchema>

export const cursoTipoInscripcionSchema = z.enum(["SOLICITUD", "LIBRE"])
export type CursoTipoInscripcion = z.infer<typeof cursoTipoInscripcionSchema>

// §4.5.2 estado del progreso. Discriminated union.
export const cursoEstadoSchema = z.discriminatedUnion("tipo", [
  z.object({ tipo: z.literal("NO_INICIADO") }),
  z.object({
    tipo: z.literal("EN_PROGRESO"),
    porcentajeAvance: z.number().int().min(1).max(99),
  }),
  z.object({
    tipo: z.literal("COMPLETADO"),
    nota: z.number().int().min(0).max(100),
    excelencia: z.boolean(),
    fechaCompletadoIso: z.string().min(1),
  }),
  z.object({ tipo: z.literal("ABANDONADO") }),
  z.object({ tipo: z.literal("CERRADO_SIN_COMPLETAR") }),
])
export type CursoEstado = z.infer<typeof cursoEstadoSchema>

// §4.5.3 footer hint. El back arma el texto; el front solo lo pinta.
export const cursoHintTipoSchema = z.enum([
  "COMENZAR_POR",
  "SIGUIENTE",
  "NOTA_FINAL",
  "ABANDONADO",
  "CERRADO",
])
export type CursoHintTipo = z.infer<typeof cursoHintTipoSchema>

export const cursoHintSchema = z.object({
  tipo: cursoHintTipoSchema,
  /** Texto formateado: "Branching Strategies", "Comienza por: Conceptos basicos". */
  texto: z.string().min(1),
})
export type CursoHint = z.infer<typeof cursoHintSchema>

export const cursoCardSchema = z.object({
  id: z.string().min(1),
  inscripcionId: z.string().min(1),
  titulo: z.string().min(1),
  /** Maximo 120 caracteres aprox, se renderiza en 2 lineas con line-clamp. */
  descripcionCorta: z.string().min(1),
  gradiente: gradientePresetSchema,
  icono: iconoCursoPresetSchema,
  nivel: cursoNivelSchema,
  cantidadModulos: z.number().int().min(0),
  tipoInscripcion: cursoTipoInscripcionSchema,
  estado: cursoEstadoSchema,
  hint: cursoHintSchema,
  /** Solo presente en SOLICITUD COMPLETADA (overlay esquina hero §4.5.4). */
  cliente: z.string().nullable(),
  /** Dot rose §6.5: SOLICITUD ACTIVA y nunca abierto. */
  recienAsignado: z.boolean(),
  /** Glow espectral permanente §6.6: completado <= hace 7 dias. */
  recienCompletado: z.boolean(),
  /** href ya armado por el back: /cursos/{id}. */
  href: z.string().min(1),
})
export type CursoCard = z.infer<typeof cursoCardSchema>

export const misCursosResumenSchema = z.object({
  activos: z.number().int().min(0),
  completados: z.number().int().min(0),
  total: z.number().int().min(0),
})
export type MisCursosResumen = z.infer<typeof misCursosResumenSchema>

export const misCursosKpisSchema = z.object({
  enCurso: z.number().int().min(0),
  completados: z.number().int().min(0),
  total: z.number().int().min(0),
  /** null si no hay cursos completados. */
  notaPromedio: z.number().int().min(0).max(100).nullable(),
})
export type MisCursosKpis = z.infer<typeof misCursosKpisSchema>

export const participanteMisCursosResponseSchema = z.object({
  resumen: misCursosResumenSchema,
  kpis: misCursosKpisSchema,
  asignados: z.array(cursoCardSchema),
  libres: z.array(cursoCardSchema),
})
export type ParticipanteMisCursosResponse = z.infer<typeof participanteMisCursosResponseSchema>
