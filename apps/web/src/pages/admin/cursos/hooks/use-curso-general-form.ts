import { useActualizarCurso } from "@/features/admin-cursos/hooks/use-actualizar-curso"
import { useCrearCurso } from "@/features/admin-cursos/hooks/use-crear-curso"
import { ApiError } from "@/shared/api/api-error"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  type ActualizarCursoInput,
  type CrearCursoInput,
  type CursoAdminDetalle,
  type EstadoCursoApi,
  type NivelCurso,
  UMBRAL_APROBADO_DEFAULT,
  UMBRAL_EN_DESARROLLO_DEFAULT,
  UMBRAL_EXCELENCIA_DEFAULT,
} from "@nexott-learn/shared-types"
import { useEffect, useRef } from "react"
import { type UseFormSetError, useForm } from "react-hook-form"
import { z } from "zod"

// Schema local del form. Equivale a `crearCursoInputSchema` pero anade la
// regla inter-campo (excelencia > aprobado > enDesarrollo > 0). Asi RHF
// captura el error inline antes de tocar la red.
const cursoGeneralFormSchema = z
  .object({
    titulo: z
      .string()
      .min(3, "El titulo debe tener al menos 3 caracteres")
      .max(200, "El titulo no puede exceder 200 caracteres"),
    slug: z
      .string()
      .min(1, "El slug es obligatorio")
      .max(120, "El slug no puede exceder 120 caracteres")
      .regex(/^[a-z0-9-]+$/, "El slug solo admite minusculas, numeros y guiones"),
    descripcion: z.string().max(2000, "La descripcion no puede exceder 2000 caracteres"),
    nivel: z.enum(["BASICO", "INTERMEDIO", "AVANZADO"]),
    estado: z.enum(["BORRADOR", "PUBLICADO", "DESHABILITADO"]),
    umbralExcelencia: z.number().min(0).max(100),
    umbralAprobado: z.number().min(0).max(100),
    umbralEnDesarrollo: z.number().min(0).max(100),
  })
  .superRefine((data, ctx) => {
    if (data.umbralEnDesarrollo <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        // biome-ignore lint/nursery/noSecrets: nombre de campo del schema, no es secreto
        path: ["umbralEnDesarrollo"],
        message: "Debe ser mayor que 0",
      })
    }
    if (data.umbralAprobado <= data.umbralEnDesarrollo) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["umbralAprobado"],
        message: "Debe ser mayor que el umbral En desarrollo",
      })
    }
    if (data.umbralExcelencia <= data.umbralAprobado) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["umbralExcelencia"],
        message: "Debe ser mayor que el umbral Aprobado",
      })
    }
  })

export type CursoGeneralFormValues = z.infer<typeof cursoGeneralFormSchema>

type ModoForm = { readonly tipo: "crear" } | { readonly tipo: "editar"; readonly id: string }

interface UseCursoGeneralFormOptions {
  readonly modo: ModoForm
  readonly detalle?: CursoAdminDetalle
  readonly onCrearExito: (curso: CursoAdminDetalle) => void
  readonly onEditarExito: () => void
}

// Modo crear: estado siempre BORRADOR (lo decide el back). En modo editar
// cargamos el estado actual del detalle (display only — el form NO lo envia).
const VALORES_INICIALES_CREAR: CursoGeneralFormValues = {
  titulo: "",
  slug: "",
  descripcion: "",
  nivel: "BASICO",
  estado: "BORRADOR",
  umbralExcelencia: UMBRAL_EXCELENCIA_DEFAULT,
  umbralAprobado: UMBRAL_APROBADO_DEFAULT,
  umbralEnDesarrollo: UMBRAL_EN_DESARROLLO_DEFAULT,
}

export function useCursoGeneralForm(options: UseCursoGeneralFormOptions) {
  const { modo, detalle, onCrearExito, onEditarExito } = options

  const crearMutation = useCrearCurso()
  const actualizarMutation = useActualizarCurso()

  // En modo editar el slug viene del back, asi que se considera "tocado"
  // desde el inicio para no auto-pisarlo al cambiar el titulo.
  const slugTocadoRef = useRef<boolean>(modo.tipo === "editar")

  const form = useForm<CursoGeneralFormValues>({
    resolver: zodResolver(cursoGeneralFormSchema),
    defaultValues:
      modo.tipo === "editar" && detalle ? mapearDetalleAForm(detalle) : VALORES_INICIALES_CREAR,
    // onTouched: valida tras el primer blur de cada campo. En modo crear el
    // botón "Crear curso" queda disabled hasta que el usuario interactúe con
    // los campos requeridos (titulo/slug), evitando submits vacios.
    mode: "onTouched",
  })

  const detalleId = detalle?.id

  // Cuando llega el detalle (modo editar carga asincrona), reseteamos el form.
  // Solo dependemos del id porque el detalle completo cambia de referencia en
  // cada refetch sin que el contenido relevante haya cambiado.
  // biome-ignore lint/correctness/useExhaustiveDependencies: reset solo en swap de curso
  useEffect(() => {
    if (modo.tipo === "editar" && detalle) {
      form.reset(mapearDetalleAForm(detalle))
      slugTocadoRef.current = true
    }
  }, [detalleId])

  // Auto-slug desde titulo mientras el usuario no haya tocado el slug a mano.
  // En modo editar slugTocadoRef ya es true (slug viene del back), asi que
  // este watch es un no-op excepto en modo crear.
  const titulo = form.watch("titulo")
  // biome-ignore lint/correctness/useExhaustiveDependencies: solo reactivo a titulo
  useEffect(() => {
    if (slugTocadoRef.current) {
      return
    }
    const slugAuto = slugifyTitulo(titulo)
    form.setValue("slug", slugAuto, { shouldValidate: false, shouldDirty: false })
  }, [titulo])

  const marcarSlugTocado = (): void => {
    slugTocadoRef.current = true
  }

  const enviar = form.handleSubmit(async (values) => {
    try {
      if (modo.tipo === "crear") {
        const cursoCreado = await crearMutation.mutateAsync(construirInputCrear(values))
        onCrearExito(cursoCreado)
        return
      }

      const dirty = form.formState.dirtyFields
      await actualizarMutation.mutateAsync({
        id: modo.id,
        input: construirInputActualizar(values, dirty),
      })
      // Marca el form como pristine respecto al payload recien enviado.
      form.reset(values, { keepValues: true })
      onEditarExito()
    } catch (error) {
      manejarErrorSubmit(error, form.setError)
    }
  })

  return {
    register: form.register,
    formState: form.formState,
    control: form.control,
    setValue: form.setValue,
    watch: form.watch,
    enviar,
    marcarSlugTocado,
    estado: form.watch("estado") as EstadoCursoApi,
    nivel: form.watch("nivel") as NivelCurso,
    isSubmitting: crearMutation.isPending || actualizarMutation.isPending,
  }
}

function mapearDetalleAForm(detalle: CursoAdminDetalle): CursoGeneralFormValues {
  return {
    titulo: detalle.title,
    slug: detalle.slug,
    descripcion: detalle.description ?? "",
    nivel: detalle.nivel,
    estado: detalle.estado,
    umbralExcelencia: detalle.umbralExcelencia,
    umbralAprobado: detalle.umbralAprobado,
    umbralEnDesarrollo: detalle.umbralEnDesarrollo,
  }
}

function construirInputCrear(values: CursoGeneralFormValues): CrearCursoInput {
  const descripcion = values.descripcion.trim()
  return {
    titulo: values.titulo,
    slug: values.slug,
    descripcion: descripcion === "" ? undefined : descripcion,
    nivel: values.nivel,
    umbralExcelencia: values.umbralExcelencia,
    umbralAprobado: values.umbralAprobado,
    umbralEnDesarrollo: values.umbralEnDesarrollo,
  }
}

// PATCH: enviamos solo los campos modificados (dirtyFields).
// descripcion vacia se envia como null para borrar el valor en BD.
function construirInputActualizar(
  values: CursoGeneralFormValues,
  dirty: Partial<Record<keyof CursoGeneralFormValues, boolean>>,
): ActualizarCursoInput {
  const input: ActualizarCursoInput = {}
  if (dirty.titulo) {
    input.titulo = values.titulo
  }
  if (dirty.slug) {
    input.slug = values.slug
  }
  if (dirty.descripcion) {
    const descripcion = values.descripcion.trim()
    input.descripcion = descripcion === "" ? null : descripcion
  }
  if (dirty.nivel) {
    input.nivel = values.nivel
  }
  if (dirty.umbralExcelencia) {
    input.umbralExcelencia = values.umbralExcelencia
  }
  if (dirty.umbralAprobado) {
    input.umbralAprobado = values.umbralAprobado
  }
  if (dirty.umbralEnDesarrollo) {
    input.umbralEnDesarrollo = values.umbralEnDesarrollo
  }
  return input
}

// Slugify minimal para titulos en castellano: minusculas, separadores a "-",
// quita acentos basicos. No es exhaustivo (no maneja chinos/japones) — el
// usuario siempre puede editar el slug a mano si el auto no le sirve.
function slugifyTitulo(titulo: string): string {
  // \p{Diacritic} cubre los marks combinantes que aparecen tras .normalize("NFD")
  // (ej. tildes y dieresis). Mas robusto que un rango Unicode hardcodeado.
  return titulo
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120)
}

function manejarErrorSubmit(
  error: unknown,
  setError: UseFormSetError<CursoGeneralFormValues>,
): void {
  if (!(error instanceof ApiError)) {
    setError("root", { message: "No pudimos guardar el curso. Reintenta en unos segundos." })
    return
  }

  // Slug duplicado: el back devuelve 409 CONFLICT.
  if (error.status === 409 || error.code === "CONFLICT") {
    setError("slug", { message: "Ya existe un curso con ese slug. Elige otro." })
    return
  }

  if (error.fieldErrors) {
    aplicarFieldErrors(error.fieldErrors, setError)
    return
  }

  setError("root", { message: error.message })
}

function aplicarFieldErrors(
  fieldErrors: Record<string, readonly string[]>,
  setError: UseFormSetError<CursoGeneralFormValues>,
): void {
  for (const [campo, mensajes] of Object.entries(fieldErrors)) {
    const mensaje = mensajes[0]
    if (mensaje && esCampoForm(campo)) {
      setError(campo, { message: mensaje })
    }
  }
}

const CAMPOS_FORM: readonly (keyof CursoGeneralFormValues)[] = [
  "titulo",
  "slug",
  "descripcion",
  "nivel",
  "estado",
  "umbralExcelencia",
  "umbralAprobado",
  // biome-ignore lint/nursery/noSecrets: nombre de campo del schema, no es secreto
  "umbralEnDesarrollo",
]

function esCampoForm(valor: string): valor is keyof CursoGeneralFormValues {
  return (CAMPOS_FORM as readonly string[]).includes(valor)
}
