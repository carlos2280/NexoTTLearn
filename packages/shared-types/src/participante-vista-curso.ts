// Participante · Vista del Curso (`/cursos/{id}`).
// Doc canonico: DOCUMENTOS/doc/v2/3-pantallas/participante/mis-cursos/vista-curso.md
//
// Contrato denso pero plano: el back hace TODOS los calculos derivados
// (estado del area, % global ponderado, razones de bloqueo de hitos) y el
// front solo pinta. Cualquier logica de "que se renderiza" vive aca, no en UI.

import { z } from "zod"
import {
  cursoNivelSchema,
  cursoTipoInscripcionSchema,
  gradientePresetSchema,
  iconoCursoPresetSchema,
} from "./participante-mis-cursos"

// ───── Estado del curso (variante del hero) ────────────────────────────────

/**
 * §6 vista-curso.md · variantes del hero (modos visuales / de interaccion).
 */
export const vistaCursoEstadoSchema = z.enum([
  "RECIEN_INSCRITO", // §6.4 sin progreso, primer aterrizaje
  "ACTIVO", // §3 anatomia base
  "COMPLETADO", // §6.1 sellado en expediente
  "ABANDONADO", // §6.2 solo libres
  "CERRADO_SIN_COMPLETAR", // §6.3 admin cerro
])
export type VistaCursoEstado = z.infer<typeof vistaCursoEstadoSchema>

// ───── KPIs personales del curso (§4.2.5) ──────────────────────────────────

export const vistaCursoKpisSchema = z.object({
  /** "{n}/{total}" — modulos completados sobre asignados. */
  modulosCompletados: z.number().int().min(0),
  modulosAsignados: z.number().int().min(0),
  /** Promedio ponderado de notas. null si no hay completados. */
  notaPromedio: z.number().int().min(0).max(100).nullable(),
  /** Horas de dedicacion (entero, redondeado). 0 si no hay sesiones. */
  horasDedicadas: z.number().int().min(0),
  /** Bloques interactuados unicos. */
  contenidosVistos: z.number().int().min(0),
})
export type VistaCursoKpis = z.infer<typeof vistaCursoKpisSchema>

// ───── Siguiente paso (CTA del hero, §4.2.6 / §4.2.7) ──────────────────────

export const vistaCursoSiguientePasoVarianteSchema = z.enum([
  "MODULO", // prio 1-4 (modulo)
  "TRANSVERSAL", // prio 5
  "ENTREVISTA", // prio 6
  "EXPEDIENTE", // prio 7 (curso COMPLETADO)
  "NINGUNO", // prio 8 (sin acciones disponibles)
])
export type VistaCursoSiguientePasoVariante = z.infer<typeof vistaCursoSiguientePasoVarianteSchema>

export const vistaCursoSiguientePasoSchema = z.object({
  variante: vistaCursoSiguientePasoVarianteSchema,
  /** Texto de la hint izquierda: "Siguiente paso: Branching Strategies". */
  hint: z.string().min(1),
  /** Texto del CTA derecho: "Continuar", "Comenzar", "Empezar transversal", "Ver expediente". */
  cta: z.string().min(1),
  /** href ya armado. null si variante=NINGUNO (no hay accion). */
  href: z.string().min(1).nullable(),
  /** Si aplica, el id del modulo que el CTA abrira (variante=MODULO). */
  moduloId: z.string().min(1).nullable(),
})
export type VistaCursoSiguientePaso = z.infer<typeof vistaCursoSiguientePasoSchema>

// ───── Hero del curso (§4.2) ───────────────────────────────────────────────

export const vistaCursoHeroSchema = z.object({
  cursoId: z.string().min(1),
  slug: z.string().min(1),
  titulo: z.string().min(1),
  descripcion: z.string().min(1),
  empresaCliente: z.string().min(1),
  fechaInicioIso: z.string().nullable(),
  deadlineIso: z.string().nullable(),
  /** Solo si COMPLETADO. */
  fechaCompletadoIso: z.string().nullable(),

  nivel: cursoNivelSchema,
  cantidadModulos: z.number().int().min(0),
  tipoInscripcion: cursoTipoInscripcionSchema,
  gradiente: gradientePresetSchema,
  icono: iconoCursoPresetSchema,

  /** §4.2.4 progreso general (0-100). */
  porcentajeProgreso: z.number().int().min(0).max(100),
  /** Solo si COMPLETADO con nota >= 90. */
  excelencia: z.boolean(),

  kpis: vistaCursoKpisSchema,
  siguientePaso: vistaCursoSiguientePasoSchema,

  /** §4.2.2 Menu [⋯]: solo en LIBRE ACTIVA. Si false, el front oculta el boton. */
  permiteAbandonar: z.boolean(),
})
export type VistaCursoHero = z.infer<typeof vistaCursoHeroSchema>

// ───── Modulo dentro del curso (§4.3.3) ────────────────────────────────────

export const vistaModuloEstadoSchema = z.enum(["NO_INICIADO", "EN_PROGRESO", "COMPLETADO"])
export type VistaModuloEstado = z.infer<typeof vistaModuloEstadoSchema>

export const vistaModuloTagAsignacionSchema = z.enum([
  "OBLIGATORIO",
  "RECOMENDADO",
  "OPCIONAL",
  "OPCIONAL_LIBRE", // §4.3.3 color cyan en libres (decision §8 #2)
])
export type VistaModuloTagAsignacion = z.infer<typeof vistaModuloTagAsignacionSchema>

// Mini-proyecto del modulo (§4.3.4 sub-fila)
export const vistaMiniProyectoEstadoSchema = z.enum([
  "BLOQUEADO",
  "DISPONIBLE",
  "EN_REVISION",
  "APROBADO",
  "REPROBADO",
])
export type VistaMiniProyectoEstado = z.infer<typeof vistaMiniProyectoEstadoSchema>

export const vistaMiniProyectoSchema = z.object({
  id: z.string().min(1),
  // Puede venir vacio si el admin aun no nombro el mini; front lo renderiza
  // como "(sin titulo)" sin romper.
  titulo: z.string(),
  estado: vistaMiniProyectoEstadoSchema,
  /** Texto descriptivo del estado para mostrar inline. */
  textoEstado: z.string().min(1),
  /** Solo en APROBADO/REPROBADO. */
  nota: z.number().int().min(0).max(100).nullable(),
  /** Solo en REPROBADO. */
  intentoActual: z.number().int().min(1).nullable(),
  /** href si DISPONIBLE/APROBADO/EN_REVISION/REPROBADO. null si BLOQUEADO. */
  href: z.string().min(1).nullable(),
})
export type VistaMiniProyecto = z.infer<typeof vistaMiniProyectoSchema>

export const vistaModuloSchema = z.object({
  id: z.string().min(1),
  titulo: z.string().min(1),
  /** Numero de orden visible (1, 2, 3...). */
  numero: z.number().int().min(1),
  estado: vistaModuloEstadoSchema,
  porcentajeAvance: z.number().int().min(0).max(100),
  tagAsignacion: vistaModuloTagAsignacionSchema,
  cantidadSecciones: z.number().int().min(0),
  cantidadContenidos: z.number().int().min(0),
  /** Solo si COMPLETADO. null si no. */
  nota: z.number().int().min(0).max(100).nullable(),
  /** Solo en COMPLETADO con nota >= 90 (estrella ✦). */
  excelencia: z.boolean(),
  /** §4.3.3 breathing ring: true solo en el modulo del CTA Continuar. */
  esSiguientePaso: z.boolean(),
  href: z.string().min(1),
  /** §4.3.4: si el modulo tiene mini activo, sub-fila con su estado. */
  miniProyecto: vistaMiniProyectoSchema.nullable(),
})
export type VistaModulo = z.infer<typeof vistaModuloSchema>

// ───── Area con sus modulos (§4.3.1, §4.3.2) ───────────────────────────────

export const vistaAreaEstadoSchema = z.enum([
  "CUMPLIDO", // todos los modulos OBLIG/RECOM completos con nota >= umbral
  "EN_PROGRESO", // hay avance pero falta para cumplir
  "SIN_INICIAR", // ningun modulo del area tiene avance
  "SIN_OBLIGACION", // no hay OBLIG/RECOM en el area para este participante
  "NO_ALCANZADO", // CERRADO_SIN_COMPLETAR y el area no llego al umbral
])
export type VistaAreaEstado = z.infer<typeof vistaAreaEstadoSchema>

export const vistaAreaSchema = z.object({
  id: z.string().min(1),
  nombre: z.string().min(1),
  /** Color HEX del area (catalogo global). Front lo usa para acentos sutiles. */
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  /** Peso del area dentro del curso, %. */
  peso: z.number().min(0).max(100),
  /** Puntaje objetivo del area (0-100). */
  puntajeObjetivo: z.number().int().min(0).max(100),
  estado: vistaAreaEstadoSchema,
  /** Texto largo del estado: "En progreso · 65 (faltan 5 puntos)". */
  textoEstado: z.string().min(1),
  /** Nota proyectada del area (promedio ponderado de modulos completados). null si SIN_INICIAR. */
  notaProyectada: z.number().int().min(0).max(100).nullable(),
  modulos: z.array(vistaModuloSchema).min(1),
})
export type VistaArea = z.infer<typeof vistaAreaSchema>

// ───── Hitos del curso (§4.4) ──────────────────────────────────────────────

export const vistaHitoEstadoSchema = z.enum([
  "BLOQUEADO",
  "DISPONIBLE",
  "EN_REVISION",
  "APROBADO",
  "REPROBADO_PUEDE_REINTENTAR",
  "REPROBADO_SIN_INTENTOS",
])
export type VistaHitoEstado = z.infer<typeof vistaHitoEstadoSchema>

/** §4.4.2 · checklist de razones (✓ cumplido / ✗ pendiente). */
export const vistaHitoRequisitoSchema = z.object({
  cumplido: z.boolean(),
  texto: z.string().min(1),
  /** href de "ir al sitio donde corregir". null si cumplido o no hay accion. */
  hrefAccion: z.string().min(1).nullable(),
})
export type VistaHitoRequisito = z.infer<typeof vistaHitoRequisitoSchema>

const vistaHitoBaseSchema = z.object({
  estado: vistaHitoEstadoSchema,
  textoEstado: z.string().min(1),
  /** §4.4.2 lista de requisitos. Vacia cuando estado != BLOQUEADO. */
  requisitos: z.array(vistaHitoRequisitoSchema),
  /** Solo en APROBADO/REPROBADO_*. */
  nota: z.number().int().min(0).max(100).nullable(),
  intentoActual: z.number().int().min(1).nullable(),
  intentosMax: z.number().int().min(1).nullable(),
  /** Lleva al hito si DISPONIBLE/REPROBADO_PUEDE_REINTENTAR/APROBADO/EN_REVISION. */
  href: z.string().min(1).nullable(),
})

export const vistaHitoTransversalSchema = vistaHitoBaseSchema.extend({
  variante: z.literal("TRANSVERSAL"),
  titulo: z.string().min(1),
  /** Resumen corto del enunciado (max 200 chars). */
  resumen: z.string().min(1),
})
export type VistaHitoTransversal = z.infer<typeof vistaHitoTransversalSchema>

export const vistaHitoEntrevistaSchema = vistaHitoBaseSchema.extend({
  variante: z.literal("ENTREVISTA"),
  titulo: z.string().min(1),
  resumen: z.string().min(1),
})
export type VistaHitoEntrevista = z.infer<typeof vistaHitoEntrevistaSchema>

export const vistaCursoHitosSchema = z.object({
  /** null si el curso no tiene transversal activo (§6.2 MAESTRO). */
  transversal: vistaHitoTransversalSchema.nullable(),
  /** null si el curso no tiene entrevista IA activa. */
  entrevista: vistaHitoEntrevistaSchema.nullable(),
})
export type VistaCursoHitos = z.infer<typeof vistaCursoHitosSchema>

// ───── Response top-level ──────────────────────────────────────────────────

export const participanteVistaCursoResponseSchema = z.object({
  estado: vistaCursoEstadoSchema,
  hero: vistaCursoHeroSchema,
  areas: z.array(vistaAreaSchema),
  hitos: vistaCursoHitosSchema,
})
export type ParticipanteVistaCursoResponse = z.infer<typeof participanteVistaCursoResponseSchema>
