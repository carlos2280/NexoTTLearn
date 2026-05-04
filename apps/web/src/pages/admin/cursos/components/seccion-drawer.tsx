import {
  NxtButton,
  NxtCard,
  NxtDrawer,
  NxtEyebrow,
  NxtInputField,
  NxtText,
} from "@carlos2280/nexott-ui/react"
import { Stack } from "@carlos2280/nexott-ui/react-primitives"
import type { SeccionAdminItem } from "@nexott-learn/shared-types"
import { useSeccionForm } from "../hooks/use-seccion-form"

type ModoDrawer =
  | { readonly tipo: "crear" }
  | { readonly tipo: "editar"; readonly seccionId: string }

interface SeccionDrawerProps {
  readonly abierto: boolean
  readonly cursoId: string
  readonly moduloId: string
  readonly modo: ModoDrawer
  // En modo editar, item a precargar.
  readonly seccion?: SeccionAdminItem
  readonly onCerrar: () => void
  readonly onCrearExito: (seccion: SeccionAdminItem) => void
  readonly onEditarExito: (seccion: SeccionAdminItem) => void
}

// Drawer minimo: 1 campo (titulo). Sigue el mismo patron que
// `<CursoModuloDrawer>`: el form se monta SOLO cuando el drawer esta abierto
// para que cada apertura tenga estado limpio (sin defaults residuales en
// "crear" ni effect-resets en "editar").
export function SeccionDrawer(props: SeccionDrawerProps) {
  const { abierto, onCerrar } = props

  const titulo = props.modo.tipo === "crear" ? "Nueva seccion" : "Renombrar seccion"

  return (
    <NxtDrawer open={abierto} side="right" size="sm" title={titulo} onNxtDrawerClose={onCerrar}>
      {abierto ? <FormDrawer {...props} /> : null}
    </NxtDrawer>
  )
}

function FormDrawer({
  cursoId,
  moduloId,
  modo,
  seccion,
  onCerrar,
  onCrearExito,
  onEditarExito,
}: SeccionDrawerProps) {
  const form = useSeccionForm({
    cursoId,
    moduloId,
    modo,
    seccion,
    onCrearExito,
    onEditarExito,
  })

  const { register, formState, enviar } = form
  const errors = formState.errors

  // En crear basta con form valido. En editar exigimos que haya cambios.
  const puedeGuardar =
    !form.isSubmitting && formState.isValid && (modo.tipo === "crear" || formState.isDirty)

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        enviar()
      }}
      noValidate={true}
    >
      <Stack gap="lg">
        <NxtEyebrow accent="bar">Informacion de la seccion</NxtEyebrow>

        <NxtInputField
          variant="filled"
          label="Titulo"
          required={true}
          placeholder="Ej: Conceptos de branching"
          {...register("titulo")}
          state={errors.titulo ? "error" : ""}
          helper={errors.titulo?.message ?? "Aparece en el hub y en el editor"}
        />

        {errors.root && (
          <NxtCard variant="surface" padding="md" accent="rose">
            <NxtText size="sm" tone="default">
              {errors.root.message}
            </NxtText>
          </NxtCard>
        )}

        <Stack direction="row" justify="end" gap="md">
          <NxtButton variant="ghost" onNxtButtonClick={onCerrar}>
            Cancelar
          </NxtButton>
          <NxtButton
            variant="primary"
            disabled={!puedeGuardar}
            loading={form.isSubmitting}
            onNxtButtonClick={() => enviar()}
          >
            {modo.tipo === "crear" ? "Crear seccion" : "Guardar cambios"}
          </NxtButton>
        </Stack>
      </Stack>
    </form>
  )
}
