import { useActualizarArea } from "@/features/admin-areas/hooks/use-actualizar-area"
import { useCrearArea } from "@/features/admin-areas/hooks/use-crear-area"
import { ApiError } from "@/shared/api/api-error"
import {
  NxtButton,
  NxtInputField,
  NxtModal,
  NxtSelect,
  NxtSelectOption,
  toast,
} from "@carlos2280/nexott-ui/react"
import { Stack } from "@carlos2280/nexott-ui/react-primitives"
import { zodResolver } from "@hookform/resolvers/zod"
import { type Area, type CrearAreaInput, crearAreaSchema } from "@nexott-learn/shared-types"
import { Controller, useForm } from "react-hook-form"

interface AreaFormModalProps {
  readonly abierto: boolean
  readonly area?: Area
  readonly onCerrar: () => void
}

// Colores que el DS reconoce como áreas (admin-modulos.ts → areaColorSchema).
// El backend acepta también HEX libre, pero el form se centra en estos para
// mantener consistencia visual con el resto de la app.
const COLORES_DS = [
  { value: "indigo", label: "Indigo" },
  { value: "emerald", label: "Emerald" },
  { value: "violet", label: "Violet" },
  { value: "amber", label: "Amber" },
  { value: "rose", label: "Rose" },
  { value: "cyan", label: "Cyan" },
  { value: "sky", label: "Sky" },
  { value: "slate", label: "Slate" },
] as const

const VALORES_INICIALES_VACIO: CrearAreaInput = {
  nombre: "",
  color: "indigo",
  descripcion: "",
  orden: 0,
}

// Modal shell · monta el form solo cuando está abierto. El `key` por id (o
// "nuevo") fuerza remount al cambiar de área editada, así RHF arranca con
// defaults limpios sin necesidad de useEffect + reset.
export function AreaFormModal({ abierto, area, onCerrar }: AreaFormModalProps) {
  const titulo = area ? "Editar área" : "Nueva área"
  const formKey = area?.id ?? "nuevo"

  return (
    <NxtModal
      open={abierto}
      size="md"
      title={titulo}
      description="Las áreas son el catálogo global. Pesos y umbrales se configuran después en cada curso."
      onNxtModalClose={onCerrar}
    >
      {abierto ? <FormBody key={formKey} area={area} onCerrar={onCerrar} /> : null}
    </NxtModal>
  )
}

interface FormBodyProps {
  readonly area?: Area
  readonly onCerrar: () => void
}

function FormBody({ area, onCerrar }: FormBodyProps) {
  const esEdicion = area !== undefined

  const crearMutation = useCrearArea()
  const actualizarMutation = useActualizarArea()
  const enviando = crearMutation.isPending || actualizarMutation.isPending

  const valoresIniciales: CrearAreaInput = area
    ? {
        nombre: area.nombre,
        color: area.color,
        descripcion: area.descripcion ?? "",
        orden: area.orden,
      }
    : VALORES_INICIALES_VACIO

  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isValid, isDirty },
  } = useForm<CrearAreaInput>({
    resolver: zodResolver(crearAreaSchema),
    mode: "onChange",
    defaultValues: valoresIniciales,
  })

  const submit = handleSubmit(async (input) => {
    try {
      if (esEdicion && area) {
        await actualizarMutation.mutateAsync({ id: area.id, input })
        toast.success("Área actualizada")
      } else {
        await crearMutation.mutateAsync(input)
        toast.success("Área creada")
      }
      onCerrar()
    } catch (err) {
      const mensaje =
        err instanceof ApiError ? err.message : "No pudimos guardar el área. Intenta nuevamente."
      toast.error(mensaje)
    }
  })

  // Wrapper sin `void`: handleSubmit ya devuelve Promise<void>; ignoramos
  // ese resultado de forma explícita asignándolo a `_`.
  const handleClickGuardar = async (): Promise<void> => {
    await submit()
  }

  return (
    <>
      <form onSubmit={(event) => event.preventDefault()} noValidate={true}>
        <Stack gap="lg">
          <NxtInputField
            variant="filled"
            label="Nombre"
            required={true}
            placeholder="Ej: Backend"
            {...register("nombre")}
            state={errors.nombre ? "error" : ""}
            helper={errors.nombre?.message ?? ""}
          />

          <Controller
            control={control}
            name="color"
            render={({ field }) => (
              <NxtSelect
                label="Color"
                required={true}
                value={field.value}
                state={errors.color ? "error" : ""}
                helper={errors.color?.message ?? ""}
                onNxtSelectChange={(event) => field.onChange(event.detail.value)}
              >
                {COLORES_DS.map((c) => (
                  <NxtSelectOption key={c.value} value={c.value}>
                    {c.label}
                  </NxtSelectOption>
                ))}
              </NxtSelect>
            )}
          />

          <NxtInputField
            variant="filled"
            label="Descripción"
            placeholder="Qué cubre esta área (opcional)"
            {...register("descripcion")}
            state={errors.descripcion ? "error" : ""}
            helper={errors.descripcion?.message ?? ""}
          />

          <NxtInputField
            variant="filled"
            label="Orden"
            type="number"
            min={0}
            {...register("orden", { valueAsNumber: true })}
            state={errors.orden ? "error" : ""}
            helper={errors.orden?.message ?? "Posición en listados; menor primero."}
          />
        </Stack>
      </form>

      <div slot="footer">
        <NxtButton variant="ghost" onNxtButtonClick={onCerrar} disabled={enviando}>
          Cancelar
        </NxtButton>
        <NxtButton
          variant="primary"
          disabled={!isValid || enviando || (esEdicion && !isDirty)}
          loading={enviando}
          onNxtButtonClick={handleClickGuardar}
        >
          {esEdicion ? "Guardar cambios" : "Crear área"}
        </NxtButton>
      </div>
    </>
  )
}
