import { useActualizarSeccion } from "@/features/admin-secciones/hooks/use-actualizar-seccion"
import { useCrearSeccion } from "@/features/admin-secciones/hooks/use-crear-seccion"
import { ApiError } from "@/shared/api/api-error"
import { zodResolver } from "@hookform/resolvers/zod"
import type {
  ActualizarSeccionInput,
  CrearSeccionInput,
  SeccionAdminItem,
} from "@nexott-learn/shared-types"
import { useEffect } from "react"
import { type UseFormSetError, useForm } from "react-hook-form"
import { z } from "zod"

// Schema local del form de seccion. Hoy solo `titulo` es editable; el back
// expone `actualizarSeccionInputSchema` parcial para que en el futuro se
// puedan agregar campos sin romper el contrato. El min/max coincide con el
// schema de shared-types (3..200) para que cliente y servidor validen igual.
const seccionFormSchema = z.object({
  titulo: z
    .string()
    .min(3, "El titulo debe tener al menos 3 caracteres")
    .max(200, "El titulo no puede exceder 200 caracteres"),
})

export type SeccionFormValues = z.infer<typeof seccionFormSchema>

type ModoForm = { readonly tipo: "crear" } | { readonly tipo: "editar"; readonly seccionId: string }

interface UseSeccionFormOptions {
  readonly cursoId: string
  readonly moduloId: string
  readonly modo: ModoForm
  readonly seccion?: SeccionAdminItem
  readonly onCrearExito: (seccion: SeccionAdminItem) => void
  readonly onEditarExito: (seccion: SeccionAdminItem) => void
}

const VALORES_INICIALES_CREAR: SeccionFormValues = {
  titulo: "",
}

export function useSeccionForm(options: UseSeccionFormOptions) {
  const { cursoId, moduloId, modo, seccion, onCrearExito, onEditarExito } = options

  const crearMutation = useCrearSeccion()
  const actualizarMutation = useActualizarSeccion()

  const form = useForm<SeccionFormValues>({
    resolver: zodResolver(seccionFormSchema),
    defaultValues:
      modo.tipo === "editar" && seccion ? mapearItemAForm(seccion) : VALORES_INICIALES_CREAR,
    mode: "onTouched",
  })

  const seccionId = seccion?.id

  // En modo editar, cuando el item llega o cambia, reseteamos el form con
  // los nuevos valores como NUEVOS defaults (isDirty queda en false hasta
  // que el usuario modifique algo).
  // biome-ignore lint/correctness/useExhaustiveDependencies: reset solo en swap de seccion
  useEffect(() => {
    if (modo.tipo === "editar" && seccion) {
      form.reset(mapearItemAForm(seccion))
    }
  }, [seccionId])

  const enviar = form.handleSubmit(async (values) => {
    try {
      if (modo.tipo === "crear") {
        const seccionCreada = await crearMutation.mutateAsync({
          cursoId,
          moduloId,
          input: construirInputCrear(values),
        })
        onCrearExito(seccionCreada)
        return
      }

      const dirty = form.formState.dirtyFields
      const seccionActualizada = await actualizarMutation.mutateAsync({
        cursoId,
        moduloId,
        seccionId: modo.seccionId,
        input: construirInputActualizar(values, dirty),
      })
      form.reset(values, { keepValues: true })
      onEditarExito(seccionActualizada)
    } catch (error) {
      manejarErrorSubmit(error, form.setError)
    }
  })

  return {
    register: form.register,
    formState: form.formState,
    enviar,
    isSubmitting: crearMutation.isPending || actualizarMutation.isPending,
  }
}

function mapearItemAForm(item: SeccionAdminItem): SeccionFormValues {
  return {
    titulo: item.titulo,
  }
}

function construirInputCrear(values: SeccionFormValues): CrearSeccionInput {
  return {
    titulo: values.titulo.trim(),
  }
}

// PATCH parcial: enviamos SOLO los campos modificados. Si el usuario no toco
// el titulo (raro porque es el unico campo editable, pero defensivo) el
// back recibe un body vacio y devuelve el item sin cambios.
function construirInputActualizar(
  values: SeccionFormValues,
  dirty: Partial<Record<keyof SeccionFormValues, boolean>>,
): ActualizarSeccionInput {
  const input: ActualizarSeccionInput = {}
  if (dirty.titulo) {
    input.titulo = values.titulo.trim()
  }
  return input
}

function manejarErrorSubmit(error: unknown, setError: UseFormSetError<SeccionFormValues>): void {
  if (!(error instanceof ApiError)) {
    setError("root", { message: "No pudimos guardar la seccion. Reintenta en unos segundos." })
    return
  }

  if (error.fieldErrors) {
    aplicarFieldErrors(error.fieldErrors, setError)
    return
  }

  setError("root", { message: error.message })
}

function aplicarFieldErrors(
  fieldErrors: Record<string, string[]>,
  setError: UseFormSetError<SeccionFormValues>,
): void {
  for (const [campo, mensajes] of Object.entries(fieldErrors)) {
    const mensaje = mensajes[0]
    if (mensaje && esCampoForm(campo)) {
      setError(campo, { message: mensaje })
    }
  }
}

const CAMPOS_FORM: readonly (keyof SeccionFormValues)[] = ["titulo"]

function esCampoForm(valor: string): valor is keyof SeccionFormValues {
  return (CAMPOS_FORM as readonly string[]).includes(valor)
}
