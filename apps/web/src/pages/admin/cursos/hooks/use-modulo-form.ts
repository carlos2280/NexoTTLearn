import { useActualizarModulo } from "@/features/admin-modulos/hooks/use-actualizar-modulo"
import { useCrearModulo } from "@/features/admin-modulos/hooks/use-crear-modulo"
import { ApiError } from "@/shared/api/api-error"
import { zodResolver } from "@hookform/resolvers/zod"
import type {
  ActualizarModuloInput,
  CrearModuloInput,
  ModuloAdminItem,
} from "@nexott-learn/shared-types"
import { useEffect, useRef } from "react"
import { type UseFormSetError, useForm } from "react-hook-form"
import { z } from "zod"

// Schema local del form. Los numericos viven como `number | null` en estado
// (null = "sin definir") y `areaId` como string ("" = "sin area"; al
// construir el input la string vacia se convierte a null).
const moduloFormSchema = z.object({
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
  duracionEstimada: z.number().int("Debe ser un numero entero").min(0, "Debe ser >= 0").nullable(),
  peso: z.number().min(0, "Debe ser >= 0").max(100, "Debe ser <= 100").nullable(),
  puntajeObjetivo: z.number().min(0, "Debe ser >= 0").max(100, "Debe ser <= 100").nullable(),
  areaId: z.string(),
  estado: z.enum(["BORRADOR", "PUBLICADO"]),
})

export type ModuloFormValues = z.infer<typeof moduloFormSchema>

type ModoForm = { readonly tipo: "crear" } | { readonly tipo: "editar"; readonly moduloId: string }

interface UseModuloFormOptions {
  readonly cursoId: string
  readonly modo: ModoForm
  // En modo editar, item del modulo a precargar. En modo crear queda undefined.
  readonly modulo?: ModuloAdminItem
  readonly onCrearExito: (modulo: ModuloAdminItem) => void
  readonly onEditarExito: (modulo: ModuloAdminItem) => void
}

// Defaults sensatos para modo crear: estado BORRADOR, todos los numericos
// en null (no 0 — null preserva la semantica "sin definir"), areaId = ""
// (sin area). El back hara default("BORRADOR") por si el campo no llega.
const VALORES_INICIALES_CREAR: ModuloFormValues = {
  titulo: "",
  slug: "",
  descripcion: "",
  duracionEstimada: null,
  peso: null,
  puntajeObjetivo: null,
  areaId: "",
  estado: "BORRADOR",
}

export function useModuloForm(options: UseModuloFormOptions) {
  const { cursoId, modo, modulo, onCrearExito, onEditarExito } = options

  const crearMutation = useCrearModulo()
  const actualizarMutation = useActualizarModulo()

  // En modo editar el slug viene del back: lo consideramos "tocado" para
  // no auto-pisarlo cuando el usuario edita el titulo. En modo crear arranca
  // false y se marca en el primer onChange manual del campo slug.
  const slugTocadoRef = useRef<boolean>(modo.tipo === "editar")

  const form = useForm<ModuloFormValues>({
    resolver: zodResolver(moduloFormSchema),
    defaultValues:
      modo.tipo === "editar" && modulo ? mapearItemAForm(modulo) : VALORES_INICIALES_CREAR,
    // onTouched: valida tras el primer blur. En crear, el boton "Crear modulo"
    // queda disabled hasta que el usuario haya tocado los campos requeridos.
    mode: "onTouched",
  })

  const moduloId = modulo?.id

  // En modo editar, cuando el item llega o cambia, reseteamos el form con
  // los nuevos valores como NUEVOS defaults. Asi formState.isDirty queda en
  // false hasta que el usuario modifique algo. Solo re-corremos cuando
  // cambia el id del modulo (no en cada referencia nueva del item).
  // biome-ignore lint/correctness/useExhaustiveDependencies: reset solo en swap de modulo
  useEffect(() => {
    if (modo.tipo === "editar" && modulo) {
      form.reset(mapearItemAForm(modulo))
      slugTocadoRef.current = true
    }
  }, [moduloId])

  // Auto-slug desde titulo mientras el usuario no haya tocado el slug a mano.
  // En editar slugTocadoRef arranca true, asi que este watch es no-op.
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
        const moduloCreado = await crearMutation.mutateAsync({
          cursoId,
          input: construirInputCrear(values),
        })
        onCrearExito(moduloCreado)
        return
      }

      const dirty = form.formState.dirtyFields
      const moduloActualizado = await actualizarMutation.mutateAsync({
        cursoId,
        moduloId: modo.moduloId,
        input: construirInputActualizar(values, dirty),
      })
      // Tras guardar, los valores actuales se vuelven los nuevos defaults:
      // form queda pristine hasta el proximo cambio.
      form.reset(values, { keepValues: true })
      onEditarExito(moduloActualizado)
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
    getValues: form.getValues,
    enviar,
    marcarSlugTocado,
    isSubmitting: crearMutation.isPending || actualizarMutation.isPending,
  }
}

function mapearItemAForm(item: ModuloAdminItem): ModuloFormValues {
  return {
    titulo: item.titulo,
    slug: item.slug,
    descripcion: item.descripcion ?? "",
    duracionEstimada: item.duracionEstimada,
    peso: item.peso,
    puntajeObjetivo: item.puntajeObjetivo,
    // null en BD → "" en el select ("Sin area"). El handler del submit
    // vuelve a convertir "" → null antes de enviarlo.
    areaId: item.area?.id ?? "",
    estado: item.estado,
  }
}

function construirInputCrear(values: ModuloFormValues): CrearModuloInput {
  const descripcion = values.descripcion.trim()
  const areaIdNormalizado = normalizarAreaId(values.areaId)

  return {
    titulo: values.titulo,
    slug: values.slug,
    descripcion: descripcion === "" ? undefined : descripcion,
    duracionEstimada: values.duracionEstimada,
    peso: values.peso,
    puntajeObjetivo: values.puntajeObjetivo,
    areaId: areaIdNormalizado,
    estado: values.estado,
  }
}

// PATCH parcial: enviamos SOLO los campos modificados. dirtyFields nos da
// flags por campo; mappers consistentes con la semantica del back:
//  - descripcion: "" -> null (borra el valor en BD)
//  - areaId: "" -> null (borra la asociacion)
//  - numericos nullable: si esta dirty, mandamos el valor (null incluido)
function construirInputActualizar(
  values: ModuloFormValues,
  dirty: Partial<Record<keyof ModuloFormValues, boolean>>,
): ActualizarModuloInput {
  const input: ActualizarModuloInput = {}

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
  if (dirty.duracionEstimada) {
    input.duracionEstimada = values.duracionEstimada
  }
  if (dirty.peso) {
    input.peso = values.peso
  }
  if (dirty.puntajeObjetivo) {
    input.puntajeObjetivo = values.puntajeObjetivo
  }
  if (dirty.areaId) {
    input.areaId = normalizarAreaId(values.areaId)
  }
  if (dirty.estado) {
    input.estado = values.estado
  }

  return input
}

function normalizarAreaId(areaId: string): string | null {
  return areaId.trim() === "" ? null : areaId
}

function slugifyTitulo(titulo: string): string {
  return titulo
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120)
}

function manejarErrorSubmit(error: unknown, setError: UseFormSetError<ModuloFormValues>): void {
  if (!(error instanceof ApiError)) {
    setError("root", { message: "No pudimos guardar el modulo. Reintenta en unos segundos." })
    return
  }

  // Slug duplicado dentro del curso: el back devuelve 409 CONFLICT.
  if (error.status === 409 || error.code === "CONFLICT") {
    setError("slug", { message: "Ya existe un modulo con ese slug en este curso." })
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
  setError: UseFormSetError<ModuloFormValues>,
): void {
  for (const [campo, mensajes] of Object.entries(fieldErrors)) {
    const mensaje = mensajes[0]
    if (mensaje && esCampoForm(campo)) {
      setError(campo, { message: mensaje })
    }
  }
}

const CAMPOS_FORM: readonly (keyof ModuloFormValues)[] = [
  "titulo",
  "slug",
  "descripcion",
  "duracionEstimada",
  "peso",
  "puntajeObjetivo",
  "areaId",
  "estado",
]

function esCampoForm(valor: string): valor is keyof ModuloFormValues {
  return (CAMPOS_FORM as readonly string[]).includes(valor)
}
