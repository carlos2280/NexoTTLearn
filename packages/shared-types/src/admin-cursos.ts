import { z } from "zod"

// MAESTRO §5, §6, §17 · DTOs y tipos del CRUD admin de cursos contra schema v2.
// El curso es la solicitud de un cliente; ver §6.2 para la anatomia completa.
//
// Reglas que viven en este modulo:
// - DTOs de mutacion con `.strict()` (claves desconocidas → 400, no se descartan
//   en silencio; ver feedback `feedback_zod_strict_dtos`).
// - Pesos validados a [0, 100] con tolerancia ±0.01 al sumar (T04, §17.5).
// - Umbrales de logro como enteros [1, 99] estrictamente ascendentes
//   (en_desarrollo < aprobado < excelencia, §9.8).
// - El estado del curso NO se cambia via PATCH: usa POST publicar/despublicar/
//   cerrar. Los DTOs `.strict()` rechazan `estado` con 400 si el cliente lo manda.

export const TOLERANCIA_PESO = 0.01
export const TOTAL_PESO = 100

export const estadoCursoSchema = z.enum(["BORRADOR", "ACTIVO", "CERRADO"])
export type EstadoCurso = z.infer<typeof estadoCursoSchema>

// ─────────────────────────────────────────────────────────────────
// Helpers de validacion
// ─────────────────────────────────────────────────────────────────

const tituloSchema = z
  .string()
  .trim()
  .min(3, "El titulo debe tener al menos 3 caracteres")
  .max(200, "El titulo no puede exceder 200 caracteres")

const empresaClienteSchema = z
  .string()
  .trim()
  .min(2, "La empresa cliente debe tener al menos 2 caracteres")
  .max(200, "La empresa cliente no puede exceder 200 caracteres")

// kebab-case con digitos. Mismo formato que el slugify de cursos.slug.ts.
const slugSchema = z
  .string()
  .trim()
  .min(1, "El slug es obligatorio")
  .max(160, "El slug no puede exceder 160 caracteres")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "El slug solo admite minusculas, numeros y guiones")

const descripcionSchema = z
  .string()
  .trim()
  .max(2000, "La descripcion no puede exceder 2000 caracteres")

const imagenUrlSchema = z
  .string()
  .trim()
  .url("La URL de la imagen no es valida")
  .max(2048, "La URL no puede exceder 2048 caracteres")

const duracionEstimadaSchema = z
  .string()
  .trim()
  .max(80, "La duracion estimada no puede exceder 80 caracteres")

const fechaIsoSchema = z
  .string()
  .datetime({ offset: true, message: "La fecha debe estar en formato ISO 8601" })

const pesoSchema = z
  .number()
  .min(0, "El peso no puede ser menor a 0")
  .max(100, "El peso no puede exceder 100")

// Umbrales de logro (§9.8): enteros [1, 99]. 100 invalida porque la franja
// "excelencia" exige `nota >= umbralExcelencia` (umbral=100 es alcanzable solo
// con nota perfecta y rompe la idea de franja). 0 invalida porque haria
// "insuficiente" inalcanzable.
const umbralLogroSchema = z
  .number()
  .int("El umbral debe ser un entero")
  .min(1, "El umbral debe ser >= 1")
  .max(99, "El umbral debe ser <= 99")

const puntajeObjetivoSchema = z
  .number()
  .int("El puntaje objetivo debe ser un entero")
  .min(1, "El puntaje objetivo debe ser >= 1")
  .max(100, "El puntaje objetivo debe ser <= 100")

const motivoSchema = z
  .string()
  .trim()
  .min(10, "El motivo debe tener al menos 10 caracteres")
  .max(500, "El motivo no puede exceder 500 caracteres")

// ─────────────────────────────────────────────────────────────────
// LECTURA · listado y detalle
// ─────────────────────────────────────────────────────────────────

export const cursoListItemSchema = z.object({
  id: z.string(),
  empresaCliente: z.string(),
  titulo: z.string(),
  slug: z.string(),
  estado: estadoCursoSchema,
  fechaInicio: z.string().nullable(),
  deadline: z.string().nullable(),
  imagenUrl: z.string().nullable(),
  descripcion: z.string().nullable(),
  permiteInscripcionLibre: z.boolean(),
  contadores: z.object({
    areas: z.number().int().min(0),
    modulos: z.number().int().min(0),
    inscripcionesActivas: z.number().int().min(0),
  }),
  createdAt: z.string(),
  updatedAt: z.string(),
})
export type CursoListItem = z.infer<typeof cursoListItemSchema>

export const cursoListResponseSchema = z.object({
  items: z.array(cursoListItemSchema),
  total: z.number().int().min(0),
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1),
})
export type CursoListResponse = z.infer<typeof cursoListResponseSchema>

const cursoAreaDetalleSchema = z.object({
  id: z.string(),
  areaId: z.string(),
  area: z.object({
    id: z.string(),
    nombre: z.string(),
    color: z.string(),
  }),
  peso: z.number(),
  puntajeObjetivo: z.number().int(),
  orden: z.number().int(),
  modulosCount: z.number().int().min(0),
})
export type CursoAreaDetalle = z.infer<typeof cursoAreaDetalleSchema>

export const cursoDetalleSchema = cursoListItemSchema.extend({
  duracionEstimada: z.string().nullable(),
  // Pesos a nivel curso.
  pesoAreas: z.number(),
  pesoProyectoTransversal: z.number(),
  pesoEntrevistaIA: z.number(),
  // Pesos intra-modulo.
  pesoActividades: z.number(),
  pesoMiniProyecto: z.number(),
  // Umbrales de logro.
  umbralExcelencia: z.number().int(),
  umbralAprobado: z.number().int(),
  umbralEnDesarrollo: z.number().int(),
  // Umbrales de brecha.
  umbralBrechaNoCumple: z.number().int(),
  // Lifecycle.
  publicadoAt: z.string().nullable(),
  cerradoAt: z.string().nullable(),
  duplicadoDeId: z.string().nullable(),
  // Areas con detalle.
  cursoAreas: z.array(cursoAreaDetalleSchema),
  // Activacion de proyecto transversal y entrevista (sin payload completo).
  proyectoTransversal: z.object({ activo: z.boolean() }),
  entrevistaIAConfig: z.object({ activa: z.boolean() }),
})
export type CursoDetalle = z.infer<typeof cursoDetalleSchema>

// ─────────────────────────────────────────────────────────────────
// QUERY · GET /admin/cursos
// ─────────────────────────────────────────────────────────────────

// `estado=all` → no filtra. Cualquier otro valor → filtra por ese estado.
export const filtroEstadoCursoSchema = z.union([estadoCursoSchema, z.literal("all")])
export type FiltroEstadoCurso = z.infer<typeof filtroEstadoCursoSchema>

export const listarCursosQuerySchema = z.object({
  q: z.string().trim().min(1).max(200).optional(),
  estado: filtroEstadoCursoSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})
export type ListarCursosQuery = z.infer<typeof listarCursosQuerySchema>

// ─────────────────────────────────────────────────────────────────
// CREAR
// ─────────────────────────────────────────────────────────────────

export const crearCursoInputSchema = z
  .object({
    empresaCliente: empresaClienteSchema,
    titulo: tituloSchema,
    duplicarDeId: z.string().uuid("duplicarDeId debe ser un UUID valido").optional(),
  })
  .strict()
export type CrearCursoInput = z.infer<typeof crearCursoInputSchema>

// ─────────────────────────────────────────────────────────────────
// PATCH · datos generales + pesos + umbrales
// ─────────────────────────────────────────────────────────────────

// Solo se exponen aqui los campos del editor "modo curso" (modo-curso.md):
// identidad, fechas, descripcion, imagen, duracion, slug manual, flag de
// inscripcion libre, pesos a nivel curso e intra-modulo, umbrales de logro y
// brecha. NO se permite `estado` (transicion via endpoints dedicados) ni
// `cursoAreas` (endpoint PUT /:id/areas).
export const actualizarCursoInputSchema = z
  .object({
    empresaCliente: empresaClienteSchema,
    titulo: tituloSchema,
    slug: slugSchema,
    descripcion: descripcionSchema.nullable(),
    imagenUrl: imagenUrlSchema.nullable(),
    duracionEstimada: duracionEstimadaSchema.nullable(),
    fechaInicio: fechaIsoSchema.nullable(),
    deadline: fechaIsoSchema.nullable(),
    permiteInscripcionLibre: z.boolean(),
    pesoAreas: pesoSchema,
    pesoProyectoTransversal: pesoSchema,
    pesoEntrevistaIA: pesoSchema,
    pesoActividades: pesoSchema,
    pesoMiniProyecto: pesoSchema,
    umbralExcelencia: umbralLogroSchema,
    umbralAprobado: umbralLogroSchema,
    umbralEnDesarrollo: umbralLogroSchema,
    umbralBrechaNoCumple: z.number().int().min(0).max(100),
  })
  .partial()
  .strict()
  .superRefine((data, ctx) => {
    // Si vienen los 3 umbrales juntos, validamos orden estricto. Si solo viene
    // uno, dejamos que el service compare contra los persistidos antes de
    // aplicar (la tabla MAESTRO §9.8 deja los defaults 50/70/90 ordenados).
    const tieneTodos =
      typeof data.umbralExcelencia === "number" &&
      typeof data.umbralAprobado === "number" &&
      typeof data.umbralEnDesarrollo === "number"
    if (
      tieneTodos &&
      !(
        (data.umbralEnDesarrollo as number) < (data.umbralAprobado as number) &&
        (data.umbralAprobado as number) < (data.umbralExcelencia as number)
      )
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["umbralAprobado"],
        message:
          "Los umbrales deben cumplir umbralEnDesarrollo < umbralAprobado < umbralExcelencia",
      })
    }
    if (data.fechaInicio && data.deadline) {
      if (new Date(data.deadline) <= new Date(data.fechaInicio)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["deadline"],
          message: "El deadline debe ser posterior a la fecha de inicio",
        })
      }
    }
  })
export type ActualizarCursoInput = z.infer<typeof actualizarCursoInputSchema>

// ─────────────────────────────────────────────────────────────────
// PUT areas
// ─────────────────────────────────────────────────────────────────

const cursoAreaInputSchema = z
  .object({
    areaId: z.string().uuid("areaId debe ser un UUID valido"),
    peso: pesoSchema,
    puntajeObjetivo: puntajeObjetivoSchema,
    orden: z.number().int().min(0),
  })
  .strict()
export type CursoAreaInput = z.infer<typeof cursoAreaInputSchema>

export const actualizarCursoAreasInputSchema = z
  .object({
    areas: z.array(cursoAreaInputSchema).min(1, "Debe incluirse al menos un area"),
  })
  .strict()
  .superRefine((data, ctx) => {
    // Sin duplicados de areaId.
    const ids = new Set<string>()
    for (let i = 0; i < data.areas.length; i += 1) {
      const item = data.areas[i]
      if (!item) {
        continue
      }
      if (ids.has(item.areaId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["areas", i, "areaId"],
          message: `El area '${item.areaId}' esta duplicada`,
        })
      }
      ids.add(item.areaId)
    }
    // Suma 100 ±0.01.
    const suma = data.areas.reduce((acc, a) => acc + a.peso, 0)
    if (Math.abs(suma - TOTAL_PESO) > TOLERANCIA_PESO) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["areas"],
        message: `La suma de pesos por area debe ser 100 (recibido: ${suma})`,
      })
    }
  })
export type ActualizarCursoAreasInput = z.infer<typeof actualizarCursoAreasInputSchema>

// ─────────────────────────────────────────────────────────────────
// PUBLICAR · checklist de validacion (MAESTRO §5.1)
// ─────────────────────────────────────────────────────────────────

// 10 reglas evaluadas (publicar.md §3 + MAESTRO §5.1). Cada regla aporta un
// item con id estable para que el front sepa a donde llevar al admin con CTA.
export const checklistItemIdSchema = z.enum([
  "cliente_titulo",
  "fechas",
  "areas_min_1",
  "areas_pesos_100",
  "areas_objetivo",
  "area_tiene_modulo",
  "modulo_tiene_contenido",
  "pesos_intra_modulo",
  "pesos_curso_100",
  "umbrales_logro",
])
export type ChecklistItemId = z.infer<typeof checklistItemIdSchema>

// Targets a los que cada faltante puede llevar al admin. El editor mapea estos
// strings a posiciones del canvas/inspector. Para items que apuntan a un nodo
// concreto del arbol (modulo o seccion) se serializa un objeto.
export const checklistCtaTargetSchema = z.union([
  z.enum(["identidad", "fechas", "areas", "pesosCurso", "pesosIntraModulo", "umbralesLogro"]),
  z.object({ tipo: z.literal("modulo"), moduloId: z.string() }),
  z.object({ tipo: z.literal("seccion"), seccionId: z.string() }),
])
export type ChecklistCtaTarget = z.infer<typeof checklistCtaTargetSchema>

export const checklistItemResultSchema = z.object({
  id: checklistItemIdSchema,
  label: z.string(),
  cumplido: z.boolean(),
  ctaTarget: checklistCtaTargetSchema.optional(),
  detalle: z.string().optional(),
})
export type ChecklistItemResult = z.infer<typeof checklistItemResultSchema>

export const publicarResumenSchema = z.object({
  areas: z.number().int().min(0),
  modulos: z.number().int().min(0),
  secciones: z.number().int().min(0),
  bloques: z.number().int().min(0),
  miniActivos: z.number().int().min(0),
  transversalActivo: z.boolean(),
  entrevistaActiva: z.boolean(),
})
export type PublicarResumen = z.infer<typeof publicarResumenSchema>

export const publicarCasoASchema = z.object({
  caso: z.literal("A_FALTANTES"),
  faltantes: z.array(checklistItemResultSchema),
  cumplidos: z.array(checklistItemResultSchema),
  opcionales: z.array(checklistItemResultSchema),
})
export type PublicarCasoA = z.infer<typeof publicarCasoASchema>

export const publicarCasoBSchema = z.object({
  caso: z.literal("B_OK"),
  curso: cursoDetalleSchema,
  resumen: publicarResumenSchema,
})
export type PublicarCasoB = z.infer<typeof publicarCasoBSchema>

export const publicarResponseSchema = z.discriminatedUnion("caso", [
  publicarCasoASchema,
  publicarCasoBSchema,
])
export type PublicarResponse = z.infer<typeof publicarResponseSchema>

// ─────────────────────────────────────────────────────────────────
// DESPUBLICAR / CERRAR · body con motivo opcional
// ─────────────────────────────────────────────────────────────────

// MAESTRO §17.2 · motivo opcional pero, si viene, tras trim 10..500 chars.
export const transicionEstadoCursoInputSchema = z
  .object({
    motivo: motivoSchema.optional(),
  })
  .strict()
export type TransicionEstadoCursoInput = z.infer<typeof transicionEstadoCursoInputSchema>

// ─────────────────────────────────────────────────────────────────
// DELETE response
// ─────────────────────────────────────────────────────────────────

export const cursoDeleteResponseSchema = z.object({
  tipo: z.literal("ELIMINADA"),
  id: z.string(),
})
export type CursoDeleteResponse = z.infer<typeof cursoDeleteResponseSchema>

// ─────────────────────────────────────────────────────────────────
// ÁREAS INDIVIDUALES · POST /areas, PATCH /areas/:id, DELETE, GET, reemplazar
// ─────────────────────────────────────────────────────────────────

// POST :cursoId/areas — agrega UN área al curso.
export const agregarCursoAreaInputSchema = z
  .object({
    areaId: z.string().uuid("areaId debe ser un UUID valido"),
    peso: pesoSchema,
    puntajeObjetivo: puntajeObjetivoSchema,
    orden: z.number().int().min(0).optional(),
  })
  .strict()
export type AgregarCursoAreaInput = z.infer<typeof agregarCursoAreaInputSchema>

// PATCH :cursoId/areas/:cursoAreaId — edita peso, puntajeObjetivo u orden.
export const actualizarCursoAreaInputSchema = z
  .object({
    peso: pesoSchema,
    puntajeObjetivo: puntajeObjetivoSchema,
    orden: z.number().int().min(0),
  })
  .partial()
  .strict()
export type ActualizarCursoAreaInput = z.infer<typeof actualizarCursoAreaInputSchema>

// POST :cursoId/areas/:cursoAreaId/reemplazar
export const reemplazarCursoAreaInputSchema = z
  .object({
    nuevoAreaId: z.string().uuid("nuevoAreaId debe ser un UUID valido"),
  })
  .strict()
export type ReemplazarCursoAreaInput = z.infer<typeof reemplazarCursoAreaInputSchema>

// Módulo resumido incluido en el GET :cursoAreaId.
export const moduloResumenSchema = z.object({
  id: z.string(),
  titulo: z.string(),
  seccionesCount: z.number().int().min(0),
  evaluablesCount: z.number().int().min(0),
})
export type ModuloResumen = z.infer<typeof moduloResumenSchema>

// Respuesta del GET :cursoId/areas/:cursoAreaId.
export const cursoAreaIndividualDetalleSchema = z.object({
  id: z.string(),
  areaId: z.string(),
  area: z.object({
    id: z.string(),
    nombre: z.string(),
    color: z.string(),
    descripcion: z.string().nullable(),
    estado: z.enum(["ACTIVA", "OBSOLETA"]),
  }),
  peso: z.number(),
  puntajeObjetivo: z.number().int(),
  orden: z.number().int(),
  modulos: z.array(moduloResumenSchema),
})
export type CursoAreaIndividualDetalle = z.infer<typeof cursoAreaIndividualDetalleSchema>

// Respuesta del POST y PATCH de área individual (incluye sumaPesosActual).
export const cursoAreaMutacionResponseSchema = z.object({
  cursoArea: cursoAreaDetalleSchema,
  sumaPesosActual: z.number(),
})
export type CursoAreaMutacionResponse = z.infer<typeof cursoAreaMutacionResponseSchema>

// ─────────────────────────────────────────────────────────────────
// MÓDULOS · CRUD dentro de un curso
// ─────────────────────────────────────────────────────────────────

const moduloTituloSchema = z
  .string()
  .trim()
  .min(3, "El titulo debe tener al menos 3 caracteres")
  .max(200, "El titulo no puede exceder 200 caracteres")

const moduloDescripcionSchema = z
  .string()
  .trim()
  .max(2000, "La descripcion no puede exceder 2000 caracteres")

export const crearModuloAdminInputSchema = z
  .object({
    titulo: moduloTituloSchema,
    areaId: z.string().uuid("areaId debe ser un UUID valido"),
    descripcion: moduloDescripcionSchema.optional(),
    orden: z.number().int().min(0).optional(),
    miniProyectoActivo: z.boolean().optional(),
  })
  .strict()
export type CrearModuloAdminInput = z.infer<typeof crearModuloAdminInputSchema>

export const actualizarModuloAdminInputSchema = z
  .object({
    titulo: moduloTituloSchema,
    descripcion: moduloDescripcionSchema,
    areaId: z.string().uuid("areaId debe ser un UUID valido"),
    orden: z.number().int().min(0),
    miniProyectoActivo: z.boolean(),
    umbralMiniOverride: z.number().int().min(1).max(100).nullable(),
  })
  .partial()
  .strict()
export type ActualizarModuloAdminInput = z.infer<typeof actualizarModuloAdminInputSchema>

export const reordenarModulosAdminInputSchema = z
  .object({
    items: z
      .array(
        z
          .object({
            id: z.string().uuid("id debe ser un UUID valido"),
            orden: z.number().int().min(0),
          })
          .strict(),
      )
      .min(1, "La lista de items no puede estar vacia"),
  })
  .strict()
export type ReordenarModulosAdminInput = z.infer<typeof reordenarModulosAdminInputSchema>

export const moduloDetalleAdminSchema = z.object({
  id: z.string(),
  cursoId: z.string(),
  areaId: z.string(),
  titulo: z.string(),
  descripcion: z.string().nullable(),
  orden: z.number().int(),
  miniProyectoActivo: z.boolean(),
  umbralMiniOverride: z.number().int().nullable(),
  archivadoAt: z.string().nullable(),
  clonadoDeId: z.string().nullable(),
  seccionesCount: z.number().int().min(0),
  evaluablesCount: z.number().int().min(0),
  tieneEntregas: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
})
export type ModuloDetalleAdmin = z.infer<typeof moduloDetalleAdminSchema>

export const moduloListAdminResponseSchema = z.array(moduloDetalleAdminSchema)
export type ModuloListAdminResponse = z.infer<typeof moduloListAdminResponseSchema>

export const moduloDeleteAdminResponseSchema = z.object({
  tipo: z.literal("ELIMINADO"),
  id: z.string(),
})
export type ModuloDeleteAdminResponse = z.infer<typeof moduloDeleteAdminResponseSchema>

// ─────────────────────────────────────────────────────────────────
// SECCIONES · CRUD dentro de un módulo
// ─────────────────────────────────────────────────────────────────

const seccionTituloSchema = z
  .string()
  .trim()
  .min(3, "El titulo debe tener al menos 3 caracteres")
  .max(200, "El titulo no puede exceder 200 caracteres")

export const crearSeccionAdminInputSchema = z
  .object({
    titulo: seccionTituloSchema,
    orden: z.number().int().min(0).optional(),
  })
  .strict()
export type CrearSeccionAdminInput = z.infer<typeof crearSeccionAdminInputSchema>

export const actualizarSeccionAdminInputSchema = z
  .object({
    titulo: seccionTituloSchema,
    orden: z.number().int().min(0),
  })
  .partial()
  .strict()
export type ActualizarSeccionAdminInput = z.infer<typeof actualizarSeccionAdminInputSchema>

export const reordenarSeccionesAdminInputSchema = z
  .object({
    items: z
      .array(
        z
          .object({
            id: z.string().uuid("id debe ser un UUID valido"),
            orden: z.number().int().min(0),
          })
          .strict(),
      )
      .min(1, "La lista de items no puede estar vacia"),
  })
  .strict()
export type ReordenarSeccionesAdminInput = z.infer<typeof reordenarSeccionesAdminInputSchema>

export const seccionDetalleAdminSchema = z.object({
  id: z.string(),
  moduloId: z.string(),
  titulo: z.string(),
  orden: z.number().int(),
  archivadoAt: z.string().nullable(),
  bloquesCount: z.number().int().min(0),
  evaluablesCount: z.number().int().min(0),
  tieneEntregas: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
})
export type SeccionDetalleAdmin = z.infer<typeof seccionDetalleAdminSchema>

export const seccionListAdminResponseSchema = z.array(seccionDetalleAdminSchema)
export type SeccionListAdminResponse = z.infer<typeof seccionListAdminResponseSchema>

export const seccionDeleteAdminResponseSchema = z.object({
  tipo: z.literal("ELIMINADO"),
  id: z.string(),
})
export type SeccionDeleteAdminResponse = z.infer<typeof seccionDeleteAdminResponseSchema>

// ─────────────────────────────────────────────────────────────────
// BLOQUES · CRUD dentro de una sección
// ─────────────────────────────────────────────────────────────────
//
// MAESTRO §3.3, §3.4 · el bloque es heterogéneo: el shape del payload depende
// del `tipo`. Modelamos crear/actualizar como discriminatedUnion para que el
// 400 sea el mismo punto donde el caller se equivoca de forma. Iter A1:
// `orden` NO se acepta en PATCH; se cambia exclusivamente vía /reordenar.

export const tipoBloqueSchema = z.enum(["PARRAFO", "TIP", "VIDEO", "RECURSO", "CODIGO", "QUIZ"])
export type TipoBloque = z.infer<typeof tipoBloqueSchema>

export const codigoUbicacionSchema = z.enum(["INLINE", "SEPARADO"])
export type CodigoUbicacion = z.infer<typeof codigoUbicacionSchema>

export const codigoInteractivoSchema = z.enum(["SOLO_VER", "EDITABLE"])
export type CodigoInteractivo = z.infer<typeof codigoInteractivoSchema>

export const codigoEvaluableSchema = z.enum(["NINGUNO", "PREGUNTAS", "TESTS"])
export type CodigoEvaluable = z.infer<typeof codigoEvaluableSchema>

export const lenguajeCodigoSchema = z.enum(["PYTHON", "JAVASCRIPT", "TYPESCRIPT", "REACT"])
export type LenguajeCodigo = z.infer<typeof lenguajeCodigoSchema>

export const tipVarianteSchema = z.enum(["info", "warning", "best-practice", "gotcha"])
export type TipVariante = z.infer<typeof tipVarianteSchema>

// ─────────────────────────────────────────────────────────────────
// Payload por tipo
// ─────────────────────────────────────────────────────────────────

const payloadParrafoSchema = z
  .object({
    contenidoTiptap: z.record(z.unknown()),
  })
  .strict()

const payloadTipSchema = z
  .object({
    variante: tipVarianteSchema,
    texto: z.string().trim().min(1, "El texto del tip no puede estar vacio"),
  })
  .strict()

const payloadVideoSchema = z
  .object({
    url: z.string().trim().url("La URL del video no es valida"),
    proveedor: z.string().trim().min(1, "El proveedor es obligatorio"),
  })
  .strict()

const payloadRecursoSchema = z
  .object({
    url: z.string().trim().url("La URL del recurso no es valida"),
    esDescarga: z.boolean(),
    descripcion: z.string().trim().max(500).optional(),
  })
  .strict()

const archivoCodigoSchema = z
  .object({
    nombre: z.string().trim().min(1, "El nombre del archivo es obligatorio"),
    contenido: z.string(),
    lenguaje: lenguajeCodigoSchema.optional(),
  })
  .strict()

const preguntaCodigoSchema = z
  .object({
    enunciado: z.string().trim().min(1, "El enunciado es obligatorio"),
    opciones: z.array(z.string()).min(2, "Una pregunta debe tener al menos 2 opciones"),
    correcta: z.union([z.number().int().min(0), z.array(z.number().int().min(0)).min(1)]),
    tipo: z.enum(["unica", "multiple"]),
  })
  .strict()

const payloadCodigoSchema = z
  .object({
    archivos: z.array(archivoCodigoSchema).min(1, "Debe incluir al menos un archivo"),
    pistas: z.array(z.string()).optional(),
    solucionReferencia: z.string().optional(),
    metadata: z.record(z.unknown()).optional(),
    preguntas: z.array(preguntaCodigoSchema).optional(),
    tests: z.string().optional(),
  })
  .strict()

const preguntaQuizSchema = z
  .object({
    enunciado: z.string().trim().min(1, "El enunciado es obligatorio"),
    opciones: z.array(z.string()).min(2, "Una pregunta debe tener al menos 2 opciones"),
    correcta: z.union([z.number().int().min(0), z.array(z.number().int().min(0)).min(1)]),
    tipo: z.enum(["unica", "multiple"]),
  })
  .strict()

const payloadQuizSchema = z
  .object({
    preguntas: z.array(preguntaQuizSchema).min(1, "El quiz debe tener al menos 1 pregunta"),
  })
  .strict()

// Schema reutilizable para validar el payload contra un tipo dado.
// Lo usamos en el service para revalidar en PATCH (donde no viene `tipo`
// porque lo leemos de DB) y al crear (lo abrazamos en discriminada).
export function payloadParaTipo(tipo: TipoBloque) {
  switch (tipo) {
    case "PARRAFO":
      return payloadParrafoSchema
    case "TIP":
      return payloadTipSchema
    case "VIDEO":
      return payloadVideoSchema
    case "RECURSO":
      return payloadRecursoSchema
    case "CODIGO":
      return payloadCodigoSchema
    case "QUIZ":
      return payloadQuizSchema
    default: {
      const exhaustive: never = tipo
      throw new Error(`Tipo de bloque no soportado: ${String(exhaustive)}`)
    }
  }
}

// ─────────────────────────────────────────────────────────────────
// CREAR · discriminada por `tipo`
// ─────────────────────────────────────────────────────────────────

const crearBloqueParrafoSchema = z
  .object({
    tipo: z.literal("PARRAFO"),
    payload: payloadParrafoSchema,
    orden: z.number().int().min(0).optional(),
  })
  .strict()

const crearBloqueTipSchema = z
  .object({
    tipo: z.literal("TIP"),
    payload: payloadTipSchema,
    orden: z.number().int().min(0).optional(),
  })
  .strict()

const crearBloqueVideoSchema = z
  .object({
    tipo: z.literal("VIDEO"),
    payload: payloadVideoSchema,
    orden: z.number().int().min(0).optional(),
  })
  .strict()

const crearBloqueRecursoSchema = z
  .object({
    tipo: z.literal("RECURSO"),
    payload: payloadRecursoSchema,
    orden: z.number().int().min(0).optional(),
  })
  .strict()

const crearBloqueCodigoSchema = z
  .object({
    tipo: z.literal("CODIGO"),
    payload: payloadCodigoSchema,
    orden: z.number().int().min(0).optional(),
    codigoUbicacion: codigoUbicacionSchema,
    codigoInteractivo: codigoInteractivoSchema,
    codigoEvaluable: codigoEvaluableSchema,
    codigoLenguaje: lenguajeCodigoSchema,
    solucionReferencia: z.string().nullable().optional(),
  })
  .strict()

const crearBloqueQuizSchema = z
  .object({
    tipo: z.literal("QUIZ"),
    payload: payloadQuizSchema,
    orden: z.number().int().min(0).optional(),
  })
  .strict()

export const crearBloqueAdminInputSchema = z.discriminatedUnion("tipo", [
  crearBloqueParrafoSchema,
  crearBloqueTipSchema,
  crearBloqueVideoSchema,
  crearBloqueRecursoSchema,
  crearBloqueCodigoSchema,
  crearBloqueQuizSchema,
])
export type CrearBloqueAdminInput = z.infer<typeof crearBloqueAdminInputSchema>

// ─────────────────────────────────────────────────────────────────
// ACTUALIZAR (PATCH) · sin `tipo`, sin `orden`
// ─────────────────────────────────────────────────────────────────
//
// El payload se valida aqui de forma permisiva (z.record) y el service
// re-valida con la discriminada del tipo persistido. Asi atrapamos el caso
// "campo del tipo X enviado a un bloque de tipo Y" con el mensaje correcto.
// `.strict()` rechaza llaves desconocidas (incluido `tipo` y `orden`).
export const actualizarBloqueAdminInputSchema = z
  .object({
    payload: z.record(z.unknown()),
    codigoUbicacion: codigoUbicacionSchema,
    codigoInteractivo: codigoInteractivoSchema,
    codigoEvaluable: codigoEvaluableSchema,
    codigoLenguaje: lenguajeCodigoSchema,
    solucionReferencia: z.string().nullable(),
  })
  .partial()
  .strict()
export type ActualizarBloqueAdminInput = z.infer<typeof actualizarBloqueAdminInputSchema>

// ─────────────────────────────────────────────────────────────────
// REORDENAR
// ─────────────────────────────────────────────────────────────────

export const reordenarBloquesAdminInputSchema = z
  .object({
    items: z
      .array(
        z
          .object({
            id: z.string().uuid("id debe ser un UUID valido"),
            orden: z.number().int().min(0),
          })
          .strict(),
      )
      .min(1, "La lista de items no puede estar vacia"),
  })
  .strict()
export type ReordenarBloquesAdminInput = z.infer<typeof reordenarBloquesAdminInputSchema>

// ─────────────────────────────────────────────────────────────────
// LECTURA · detalle y listado
// ─────────────────────────────────────────────────────────────────

export const bloqueDetalleAdminSchema = z.object({
  id: z.string(),
  seccionId: z.string(),
  tipo: tipoBloqueSchema,
  orden: z.number().int(),
  codigoUbicacion: codigoUbicacionSchema.nullable(),
  codigoInteractivo: codigoInteractivoSchema.nullable(),
  codigoEvaluable: codigoEvaluableSchema.nullable(),
  codigoLenguaje: lenguajeCodigoSchema.nullable(),
  payload: z.record(z.unknown()),
  solucionReferencia: z.string().nullable(),
  archivadoAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
})
export type BloqueDetalleAdmin = z.infer<typeof bloqueDetalleAdminSchema>

export const bloqueListAdminResponseSchema = z.array(bloqueDetalleAdminSchema)
export type BloqueListAdminResponse = z.infer<typeof bloqueListAdminResponseSchema>

export const bloqueDeleteAdminResponseSchema = z.object({
  tipo: z.literal("ELIMINADO"),
  id: z.string(),
})
export type BloqueDeleteAdminResponse = z.infer<typeof bloqueDeleteAdminResponseSchema>

// =============================================================================
// MINI PROYECTO (§3.6, §10.1, §10.5)
// Relación: Modulo 1-1 MiniProyecto (moduloId unique).
// umbralAprobacion no existe en este modelo — lo hereda del área (CursoArea.puntajeObjetivo)
// o del override del módulo (Modulo.umbralMiniOverride).
// =============================================================================

// ─────────────────────────────────────────────────────────────────
// PUT (upsert) · crea si no existe, actualiza si existe
// ─────────────────────────────────────────────────────────────────

export const upsertMiniProyectoAdminInputSchema = z
  .object({
    titulo: z.string().min(1, "El titulo es obligatorio").max(200),
    enunciado: z.string().min(1, "El enunciado es obligatorio"),
  })
  .strict()
export type UpsertMiniProyectoAdminInput = z.infer<typeof upsertMiniProyectoAdminInputSchema>

// ─────────────────────────────────────────────────────────────────
// PATCH · actualización parcial
// ─────────────────────────────────────────────────────────────────

export const actualizarMiniProyectoAdminInputSchema = z
  .object({
    titulo: z.string().min(1).max(200),
    enunciado: z.string().min(1),
  })
  .partial()
  .strict()
  .refine((v) => Object.keys(v).length > 0, { message: "Al menos un campo es requerido" })
export type ActualizarMiniProyectoAdminInput = z.infer<
  typeof actualizarMiniProyectoAdminInputSchema
>

// ─────────────────────────────────────────────────────────────────
// POST /pesos · ajusta las 3 capas (deben sumar 100 ±0.01)
// ─────────────────────────────────────────────────────────────────

export const ajustarPesosMiniProyectoInputSchema = z
  .object({
    pesoCapa1: z.number().min(0).max(100),
    pesoCapa2: z.number().min(0).max(100),
    pesoCapa3: z.number().min(0).max(100),
  })
  .strict()
  .refine((v) => Math.abs(v.pesoCapa1 + v.pesoCapa2 + v.pesoCapa3 - 100) <= 0.01, {
    message: "Los pesos de las 3 capas deben sumar 100 (±0.01)",
  })
export type AjustarPesosMiniProyectoInput = z.infer<typeof ajustarPesosMiniProyectoInputSchema>

// ─────────────────────────────────────────────────────────────────
// POST /umbral · ajusta el override de umbral del módulo
// ─────────────────────────────────────────────────────────────────

export const ajustarUmbralMiniProyectoInputSchema = z
  .object({
    umbralMiniOverride: z.number().int().min(0).max(100).nullable(),
  })
  .strict()
export type AjustarUmbralMiniProyectoInput = z.infer<typeof ajustarUmbralMiniProyectoInputSchema>

// ─────────────────────────────────────────────────────────────────
// LECTURA · detalle
// ─────────────────────────────────────────────────────────────────

export const miniProyectoDetalleAdminSchema = z.object({
  id: z.string(),
  moduloId: z.string(),
  titulo: z.string(),
  enunciado: z.string(),
  pesoCapa1: z.number(),
  pesoCapa2: z.number(),
  pesoCapa3: z.number(),
  umbralMiniOverride: z.number().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
})
export type MiniProyectoDetalleAdmin = z.infer<typeof miniProyectoDetalleAdminSchema>

export const miniProyectoDeleteAdminResponseSchema = z.object({
  tipo: z.literal("ELIMINADO"),
  id: z.string(),
})
export type MiniProyectoDeleteAdminResponse = z.infer<typeof miniProyectoDeleteAdminResponseSchema>
