import { z } from "zod"

// Subset de iconColor que entiende <NxlCourseCardAdmin> en nexott-ui.
// Mantener sincronizado con IconColor del componente.
const iconColorSchema = z.enum(["indigo", "emerald", "violet", "amber", "rose", "cyan"])

export const cursoStatusSchema = z.enum(["draft", "published", "disabled"])
export type CursoStatus = z.infer<typeof cursoStatusSchema>

export const cursoAdminItemSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  description: z.string().optional(),
  iconInitials: z.string().min(1).max(3),
  iconColor: iconColorSchema,
  modules: z.number().int().min(0),
  status: cursoStatusSchema,
  participantsCount: z.number().int().min(0),
  // Tasa de completitud del grupo 0-100. 0 cuando no hay participantes.
  completionRate: z.number().int().min(0).max(100),
})
export type CursoAdminItem = z.infer<typeof cursoAdminItemSchema>

export const obtenerCursosAdminResponseSchema = z.object({
  items: z.array(cursoAdminItemSchema),
})
export type ObtenerCursosAdminResponse = z.infer<typeof obtenerCursosAdminResponseSchema>

// ─────────────────────────────────────────────────────────────────
// Detalle del curso (AD03 — Editar Curso, tab General)
// ─────────────────────────────────────────────────────────────────

// Espejo del enum Prisma NivelCurso. Se mantiene en shared-types para que el
// frontend no dependa de @prisma/client.
export const nivelCursoSchema = z.enum(["BASICO", "INTERMEDIO", "AVANZADO"])
export type NivelCurso = z.infer<typeof nivelCursoSchema>

// Estado nativo Prisma EstadoCurso. El detalle expone el enum BD directamente
// (a diferencia de cursoAdminItemSchema que mapea a "draft"/"published"/...).
// Razon: el formulario de edicion necesita el valor exacto de la BD para
// poder enviarlo de vuelta sin re-mapear.
export const estadoCursoSchema = z.enum(["BORRADOR", "PUBLICADO", "DESHABILITADO"])
export type EstadoCursoApi = z.infer<typeof estadoCursoSchema>

// Slug normalizado: solo minusculas, numeros y guiones. Mismo regex que el
// usado por el slugify del frontend para que el round-trip sea estable.
const slugSchema = z
  .string()
  .min(1, "El slug es obligatorio")
  .max(120, "El slug no puede exceder 120 caracteres")
  .regex(/^[a-z0-9-]+$/, "El slug solo admite minusculas, numeros y guiones")

const umbralSchema = z
  .number()
  .min(0, "El umbral no puede ser menor a 0")
  .max(100, "El umbral no puede exceder 100")

// ─────────────────────────────────────────────────────────────────
// Pesos del curso (decision P3.1)
// Dos niveles: 'modulo' (suma intra-modulo) y 'curso' (proyecto/entrevista).
// Ver DOCUMENTOS/NEXOTT-LEARN/AUDITORIA/MAESTRO-DECISIONES.md (P3.1) y
// DOCUMENTOS/NEXOTT-LEARN/ANALISIS/08-SISTEMA-EVALUACION.md (formula).
// Definidos antes de cursoAdminDetalleSchema porque el detalle los embebe.
// ─────────────────────────────────────────────────────────────────

// Tipos validos por nivel. Estos arrays son la fuente de verdad: tanto el
// frontend como el backend los usan para construir formularios y validar.
export const TIPOS_PESO_INTRA_MODULO = ["quiz", "ejercicio", "codigo", "mini_proyecto"] as const
export type TipoPesoIntraModulo = (typeof TIPOS_PESO_INTRA_MODULO)[number]

export const TIPOS_PESO_NIVEL_CURSO = ["proyecto", "entrevista"] as const
export type TipoPesoNivelCurso = (typeof TIPOS_PESO_NIVEL_CURSO)[number]

export const tipoPesoSchema = z.enum([...TIPOS_PESO_INTRA_MODULO, ...TIPOS_PESO_NIVEL_CURSO])
export type TipoPeso = z.infer<typeof tipoPesoSchema>

export const nivelPesoSchema = z.enum(["modulo", "curso"])
export type NivelPeso = z.infer<typeof nivelPesoSchema>

// Peso individual: rango 0-100. 0 indica desactivado (toggle off para los
// niveles 'curso'). El front deriva `activo = peso > 0` en lectura.
const pesoValorSchema = z
  .number()
  .min(0, "El peso no puede ser menor a 0")
  .max(100, "El peso no puede exceder 100")

// Lectura: el detalle del curso devuelve un array de pesos con `activo`
// derivado (peso > 0) — el front lo usa para pintar toggles sin recalcular.
export const cursoTipoPesoSchema = z.object({
  tipo: tipoPesoSchema,
  peso: pesoValorSchema,
  nivel: nivelPesoSchema,
  activo: z.boolean(),
})
export type CursoTipoPeso = z.infer<typeof cursoTipoPesoSchema>

// Defaults que aplican al crear un curso o al hacer seed. Suman 100 en
// intra-modulo (regla estricta) y 30 en nivel curso (modulos absorben 70).
export const PESO_QUIZ_DEFAULT = 20
export const PESO_EJERCICIO_DEFAULT = 35
export const PESO_CODIGO_DEFAULT = 15
export const PESO_MINI_PROYECTO_DEFAULT = 30
export const PESO_PROYECTO_DEFAULT = 20
export const PESO_ENTREVISTA_DEFAULT = 10

// Tolerancia para comparar sumas con floats. La BD guarda Float, el front
// puede mandar 33.33 + 33.33 + 33.34 = 100 — sin tolerancia eso falla.
const SUMA_INTRA_MODULO_OBJETIVO = 100
const SUMA_NIVEL_CURSO_MAXIMA = 100
const TOLERANCIA_SUMA = 0.01

// Item del input de actualizacion. Validacion cruzada (tipo vs nivel) se hace
// con superRefine en el array para reportar errores con `path` correcto.
const itemPesoInputSchema = z.object({
  tipo: tipoPesoSchema,
  peso: pesoValorSchema,
  nivel: nivelPesoSchema,
})

type ItemPesoInput = z.infer<typeof itemPesoInputSchema>

// Helpers de validacion. Se extraen del superRefine para bajar la complejidad
// cognitiva del closure (regla biome noExcessiveCognitiveComplexity).
function validarCoherenciaTipoNivel(pesos: ItemPesoInput[], ctx: z.RefinementCtx): void {
  for (let i = 0; i < pesos.length; i += 1) {
    const item = pesos[i]
    if (!item) {
      continue
    }
    const esIntra = (TIPOS_PESO_INTRA_MODULO as readonly string[]).includes(item.tipo)
    if (esIntra && item.nivel !== "modulo") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["pesos", i, "nivel"],
        message: `El tipo '${item.tipo}' debe tener nivel 'modulo'`,
      })
      continue
    }
    const esCurso = (TIPOS_PESO_NIVEL_CURSO as readonly string[]).includes(item.tipo)
    if (esCurso && item.nivel !== "curso") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["pesos", i, "nivel"],
        message: `El tipo '${item.tipo}' debe tener nivel 'curso'`,
      })
    }
  }
}

function validarSinDuplicados(pesos: ItemPesoInput[], ctx: z.RefinementCtx): void {
  const tiposVistos = new Set<string>()
  for (let i = 0; i < pesos.length; i += 1) {
    const item = pesos[i]
    if (!item) {
      continue
    }
    if (tiposVistos.has(item.tipo)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["pesos", i, "tipo"],
        message: `El tipo '${item.tipo}' esta duplicado`,
      })
    }
    tiposVistos.add(item.tipo)
  }
}

function validarSumaIntraModulo(pesos: ItemPesoInput[], ctx: z.RefinementCtx): void {
  const intraModulo = pesos.filter((p) => p.nivel === "modulo")
  if (intraModulo.length === 0) {
    return
  }
  const suma = intraModulo.reduce((acc, p) => acc + p.peso, 0)
  if (Math.abs(suma - SUMA_INTRA_MODULO_OBJETIVO) > TOLERANCIA_SUMA) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["pesos"],
      message: `La suma de pesos intra-modulo debe ser 100 (recibido: ${suma})`,
    })
  }
}

function validarSumaNivelCurso(pesos: ItemPesoInput[], ctx: z.RefinementCtx): void {
  const nivelCurso = pesos.filter((p) => p.nivel === "curso")
  if (nivelCurso.length === 0) {
    return
  }
  const suma = nivelCurso.reduce((acc, p) => acc + p.peso, 0)
  if (suma - SUMA_NIVEL_CURSO_MAXIMA > TOLERANCIA_SUMA) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["pesos"],
      message: `La suma de pesos a nivel curso no puede exceder 100 (recibido: ${suma})`,
    })
  }
}

export const actualizarPesosCursoInputSchema = z
  .object({
    pesos: z.array(itemPesoInputSchema),
  })
  .superRefine((data, ctx) => {
    validarCoherenciaTipoNivel(data.pesos, ctx)
    validarSinDuplicados(data.pesos, ctx)
    validarSumaIntraModulo(data.pesos, ctx)
    validarSumaNivelCurso(data.pesos, ctx)
  })
export type ActualizarPesosCursoInput = z.infer<typeof actualizarPesosCursoInputSchema>

// ─────────────────────────────────────────────────────────────────
// Detalle del curso (incluye pesos)
// ─────────────────────────────────────────────────────────────────

export const cursoAdminDetalleSchema = cursoAdminItemSchema.extend({
  nivel: nivelCursoSchema,
  estado: estadoCursoSchema,
  umbralExcelencia: umbralSchema,
  umbralAprobado: umbralSchema,
  umbralEnDesarrollo: umbralSchema,
  tipoPesos: z.array(cursoTipoPesoSchema),
})
export type CursoAdminDetalle = z.infer<typeof cursoAdminDetalleSchema>

// Defaults alineados con el modelo Prisma (Curso.umbral* @default(...)).
// Si la BD cambia, actualizar aqui tambien.
export const UMBRAL_EXCELENCIA_DEFAULT = 90
export const UMBRAL_APROBADO_DEFAULT = 70
export const UMBRAL_EN_DESARROLLO_DEFAULT = 50

export const crearCursoInputSchema = z.object({
  titulo: z
    .string()
    .min(3, "El titulo debe tener al menos 3 caracteres")
    .max(200, "El titulo no puede exceder 200 caracteres"),
  slug: slugSchema,
  descripcion: z.string().max(2000).optional(),
  nivel: nivelCursoSchema.default("BASICO"),
  umbralExcelencia: umbralSchema.default(UMBRAL_EXCELENCIA_DEFAULT),
  umbralAprobado: umbralSchema.default(UMBRAL_APROBADO_DEFAULT),
  umbralEnDesarrollo: umbralSchema.default(UMBRAL_EN_DESARROLLO_DEFAULT),
})
export type CrearCursoInput = z.infer<typeof crearCursoInputSchema>

// PATCH parcial: todos los campos son opcionales. El service solo aplica los
// que vienen definidos. No incluye `estado` aqui — la transicion de estado
// (publicar / deshabilitar) se hara en endpoints dedicados con sus propias
// reglas de negocio (al menos 1 modulo + 1 seccion + 1 contenido).
export const actualizarCursoInputSchema = z
  .object({
    titulo: z.string().min(3).max(200),
    slug: slugSchema,
    descripcion: z.string().max(2000).nullable(),
    nivel: nivelCursoSchema,
    umbralExcelencia: umbralSchema,
    umbralAprobado: umbralSchema,
    umbralEnDesarrollo: umbralSchema,
  })
  .partial()
export type ActualizarCursoInput = z.infer<typeof actualizarCursoInputSchema>
