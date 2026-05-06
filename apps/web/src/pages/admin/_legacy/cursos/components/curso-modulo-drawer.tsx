import { useAreasCompetencia } from "@/features/admin-areas-competencia/hooks/use-areas-competencia"
import {
  NxtButton,
  NxtCard,
  NxtDrawer,
  NxtEyebrow,
  NxtInputField,
  NxtSelect,
  NxtSelectOption,
  NxtText,
} from "@carlos2280/nexott-ui/react"
import { Grid, Stack } from "@carlos2280/nexott-ui/react-primitives"
import type { EstadoModuloApi, ModuloAdminItem } from "@nexott-learn/shared-types"
import { Controller } from "react-hook-form"
import { useModuloForm } from "../hooks/use-modulo-form"

type ModoDrawer =
  | { readonly tipo: "crear" }
  | { readonly tipo: "editar"; readonly moduloId: string }

interface CursoModuloDrawerProps {
  readonly abierto: boolean
  readonly cursoId: string
  readonly modo: ModoDrawer
  // En modo editar, item a precargar (mismo objeto de la lista).
  readonly modulo?: ModuloAdminItem
  readonly onCerrar: () => void
  readonly onCrearExito: (modulo: ModuloAdminItem) => void
  readonly onEditarExito: (modulo: ModuloAdminItem) => void
}

export function CursoModuloDrawer(props: CursoModuloDrawerProps) {
  const { abierto, onCerrar } = props

  const titulo = props.modo.tipo === "crear" ? "Nuevo modulo" : "Editar modulo"

  return (
    <NxtDrawer open={abierto} side="right" size="md" title={titulo} onNxtDrawerClose={onCerrar}>
      {abierto ? <FormDrawer {...props} /> : null}
    </NxtDrawer>
  )
}

// Encapsulamos el form en su propio componente y lo montamos solo cuando el
// drawer esta abierto. Asi cada apertura crea una instancia limpia de
// useForm: en modo "crear" arranca con defaults vacios cada vez (sin estado
// residual de aperturas anteriores) y en "editar" carga el item nuevo sin
// depender del effect de reset ante cambios de identidad.
function FormDrawer({
  cursoId,
  modo,
  modulo,
  onCerrar,
  onCrearExito,
  onEditarExito,
}: CursoModuloDrawerProps) {
  const areasQuery = useAreasCompetencia()
  const areas = areasQuery.data?.items ?? []

  const form = useModuloForm({
    cursoId,
    modo,
    modulo,
    onCrearExito: (moduloCreado) => {
      onCrearExito(moduloCreado)
    },
    onEditarExito: (moduloActualizado) => {
      onEditarExito(moduloActualizado)
    },
  })

  const { register, formState, control, setValue, marcarSlugTocado } = form
  const errors = formState.errors

  const slugRegister = register("slug")

  // En crear basta con form valido. En editar exigimos que haya cambios.
  const puedeGuardar =
    !form.isSubmitting && formState.isValid && (modo.tipo === "crear" || formState.isDirty)

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        form.enviar()
      }}
      noValidate={true}
    >
      <Stack gap="lg">
        <NxtEyebrow accent="bar">Informacion del modulo</NxtEyebrow>

        <NxtInputField
          variant="filled"
          label="Titulo"
          required={true}
          placeholder="Ej: Fundamentos de Python"
          {...register("titulo")}
          state={errors.titulo ? "error" : ""}
          helper={errors.titulo?.message ?? ""}
        />

        <NxtInputField
          variant="filled"
          label="Slug"
          required={true}
          placeholder="modulo-x"
          {...slugRegister}
          onChange={(event) => {
            marcarSlugTocado()
            slugRegister.onChange(event)
          }}
          state={errors.slug ? "error" : ""}
          helper={errors.slug?.message ?? "Identificador del modulo dentro del curso"}
        />

        <NxtInputField
          variant="filled"
          label="Descripcion"
          placeholder="Breve descripcion del modulo"
          multiline={true}
          rows={3}
          {...register("descripcion")}
          state={errors.descripcion ? "error" : ""}
          helper={errors.descripcion?.message ?? ""}
        />

        <NxtEyebrow accent="bar">Configuracion</NxtEyebrow>

        <Grid columns={{ base: 1, md: 2 }} gap="md">
          <Controller
            control={control}
            name="duracionEstimada"
            render={({ field }) => (
              <NxtInputField
                variant="filled"
                label="Duracion (min)"
                type="number"
                min={0}
                placeholder="Sin definir"
                value={field.value === null ? "" : String(field.value)}
                name={field.name}
                onChange={(event) =>
                  setValue("duracionEstimada", parsearEntero(event.target.value), {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
                onBlur={() => field.onBlur()}
                state={errors.duracionEstimada ? "error" : ""}
                helper={errors.duracionEstimada?.message ?? ""}
              />
            )}
          />

          <Controller
            control={control}
            name="peso"
            render={({ field }) => (
              <NxtInputField
                variant="filled"
                label="Peso (%)"
                type="number"
                min={0}
                max={100}
                placeholder="Sin definir"
                value={field.value === null ? "" : String(field.value)}
                name={field.name}
                onChange={(event) =>
                  setValue("peso", parsearDecimal(event.target.value), {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
                onBlur={() => field.onBlur()}
                state={errors.peso ? "error" : ""}
                helper={errors.peso?.message ?? ""}
              />
            )}
          />

          <Controller
            control={control}
            name="puntajeObjetivo"
            render={({ field }) => (
              <NxtInputField
                variant="filled"
                label="Puntaje objetivo"
                type="number"
                min={0}
                max={100}
                placeholder="Sin definir"
                value={field.value === null ? "" : String(field.value)}
                name={field.name}
                onChange={(event) =>
                  setValue("puntajeObjetivo", parsearDecimal(event.target.value), {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
                onBlur={() => field.onBlur()}
                state={errors.puntajeObjetivo ? "error" : ""}
                helper={errors.puntajeObjetivo?.message ?? ""}
              />
            )}
          />

          <Controller
            control={control}
            name="areaId"
            render={({ field }) => (
              <NxtSelect
                label="Area de competencia"
                value={field.value}
                name={field.name}
                disabled={areasQuery.isLoading}
                helper={areasQuery.isError ? "No pudimos cargar las areas." : ""}
                state={areasQuery.isError ? "error" : ""}
                onNxtSelectChange={(event) =>
                  setValue("areaId", event.detail.value, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
              >
                <NxtSelectOption value="">Sin area</NxtSelectOption>
                {areas.map((area) => (
                  <NxtSelectOption key={area.id} value={area.id}>
                    {area.nombre}
                  </NxtSelectOption>
                ))}
              </NxtSelect>
            )}
          />
        </Grid>

        <Controller
          control={control}
          name="estado"
          render={({ field }) => (
            <NxtSelect
              label="Estado"
              value={field.value}
              name={field.name}
              onNxtSelectChange={(event) =>
                setValue("estado", event.detail.value as EstadoModuloApi, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
            >
              <NxtSelectOption value="BORRADOR">Borrador</NxtSelectOption>
              <NxtSelectOption value="PUBLICADO">Publicado</NxtSelectOption>
            </NxtSelect>
          )}
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
            onNxtButtonClick={() => form.enviar()}
          >
            {modo.tipo === "crear" ? "Crear modulo" : "Guardar cambios"}
          </NxtButton>
        </Stack>
      </Stack>
    </form>
  )
}

// Parsea un string a entero o null si esta vacio. Devuelve NaN para input
// invalido (que zod marcara como error de tipo) — pero como el input
// type="number" del browser ya filtra letras, en la practica solo llegan
// numeros validos o "".
function parsearEntero(valor: string): number | null {
  const limpio = valor.trim()
  if (limpio === "") {
    return null
  }
  const numero = Number.parseInt(limpio, 10)
  return Number.isNaN(numero) ? null : numero
}

function parsearDecimal(valor: string): number | null {
  const limpio = valor.trim()
  if (limpio === "") {
    return null
  }
  const numero = Number.parseFloat(limpio)
  return Number.isNaN(numero) ? null : numero
}
