import {
  NxtCard,
  NxtEyebrow,
  NxtInputField,
  NxtSelect,
  NxtSelectOption,
  NxtText,
} from "@carlos2280/nexott-ui/react"
import { Grid, Stack } from "@carlos2280/nexott-ui/react-primitives"
import type { EstadoCursoApi, NivelCurso } from "@nexott-learn/shared-types"
import { Controller } from "react-hook-form"
import type { useCursoGeneralForm } from "../hooks/use-curso-general-form"
import { CursoUmbrales } from "./curso-umbrales"

type FormApi = ReturnType<typeof useCursoGeneralForm>

interface CursoFormGeneralProps {
  readonly form: FormApi
  readonly modo: "crear" | "editar"
}

const NIVELES: ReadonlyArray<{ readonly value: NivelCurso; readonly label: string }> = [
  { value: "BASICO", label: "Basico" },
  { value: "INTERMEDIO", label: "Intermedio" },
  { value: "AVANZADO", label: "Avanzado" },
]

const ESTADOS: ReadonlyArray<{ readonly value: EstadoCursoApi; readonly label: string }> = [
  { value: "BORRADOR", label: "Borrador" },
  { value: "PUBLICADO", label: "Publicado" },
  { value: "DESHABILITADO", label: "Deshabilitado" },
]

export function CursoFormGeneral({ form, modo }: CursoFormGeneralProps) {
  const { register, formState, control, setValue, marcarSlugTocado } = form
  const errors = formState.errors

  const slugRegister = register("slug")

  return (
    <Stack gap="xl">
      <NxtCard variant="surface" padding="lg">
        <Stack gap="lg">
          <NxtEyebrow accent="bar">Informacion del Curso</NxtEyebrow>

          <NxtInputField
            variant="filled"
            label="Titulo"
            required={true}
            placeholder="Ej: Fundamentos de Git"
            {...register("titulo")}
            state={errors.titulo ? "error" : ""}
            helper={errors.titulo?.message ?? ""}
          />

          <NxtInputField
            variant="filled"
            label="Slug"
            required={true}
            placeholder="fundamentos-de-git"
            {...slugRegister}
            onChange={(event) => {
              marcarSlugTocado()
              slugRegister.onChange(event)
            }}
            state={errors.slug ? "error" : ""}
            helper={errors.slug?.message ?? "Se usara en la URL: /cursos/<slug>"}
          />

          <NxtInputField
            variant="filled"
            label="Descripcion"
            placeholder="Breve descripcion del curso"
            multiline={true}
            rows={4}
            {...register("descripcion")}
            state={errors.descripcion ? "error" : ""}
            helper={errors.descripcion?.message ?? ""}
          />

          <Grid columns={{ base: 1, md: 2 }} gap="md">
            <Controller
              control={control}
              name="nivel"
              render={({ field }) => (
                <NxtSelect
                  label="Nivel"
                  required={true}
                  value={field.value}
                  name={field.name}
                  state={errors.nivel ? "error" : ""}
                  helper={errors.nivel?.message ?? ""}
                  onNxtSelectChange={(event) =>
                    setValue("nivel", event.detail.value as NivelCurso, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                >
                  {NIVELES.map((nivel) => (
                    <NxtSelectOption key={nivel.value} value={nivel.value}>
                      {nivel.label}
                    </NxtSelectOption>
                  ))}
                </NxtSelect>
              )}
            />

            {/* Estado: el back NO acepta cambio de estado via PATCH /admin/cursos/:id.
                La transicion (publicar / deshabilitar) se hara en endpoints
                dedicados con sus propias reglas (>=1 modulo + seccion + contenido).
                Por eso el select queda disabled y solo refleja el estado actual.
                TODO(estado): conectar al endpoint de transicion cuando exista. */}
            <Controller
              control={control}
              name="estado"
              render={({ field }) => (
                <NxtSelect
                  label="Estado"
                  value={field.value}
                  name={field.name}
                  disabled={true}
                  helper={
                    modo === "crear"
                      ? "Los cursos nuevos se crean en Borrador."
                      : "El cambio de estado se hara desde un endpoint dedicado."
                  }
                  onNxtSelectChange={(event) =>
                    setValue("estado", event.detail.value as EstadoCursoApi)
                  }
                >
                  {ESTADOS.map((estado) => (
                    <NxtSelectOption key={estado.value} value={estado.value}>
                      {estado.label}
                    </NxtSelectOption>
                  ))}
                </NxtSelect>
              )}
            />
          </Grid>
        </Stack>
      </NxtCard>

      <NxtCard variant="surface" padding="lg">
        <Stack gap="lg">
          <Stack gap="xs">
            <NxtEyebrow accent="bar">Umbrales de Logro</NxtEyebrow>
            <NxtText size="sm" tone="dim">
              Definen como se clasifica la nota final de cada participante.
            </NxtText>
          </Stack>

          <Controller
            control={control}
            name="umbralExcelencia"
            render={({ field: excelencia }) => (
              <Controller
                control={control}
                name="umbralAprobado"
                render={({ field: aprobado }) => (
                  <Controller
                    control={control}
                    name="umbralEnDesarrollo"
                    render={({ field: enDesarrollo }) => (
                      <CursoUmbrales
                        excelencia={excelencia.value}
                        aprobado={aprobado.value}
                        enDesarrollo={enDesarrollo.value}
                        errorExcelencia={errors.umbralExcelencia?.message}
                        errorAprobado={errors.umbralAprobado?.message}
                        errorEnDesarrollo={errors.umbralEnDesarrollo?.message}
                        onCambioExcelencia={(valor) =>
                          setValue("umbralExcelencia", valor, {
                            shouldDirty: true,
                            shouldValidate: true,
                          })
                        }
                        onCambioAprobado={(valor) =>
                          setValue("umbralAprobado", valor, {
                            shouldDirty: true,
                            shouldValidate: true,
                          })
                        }
                        onCambioEnDesarrollo={(valor) =>
                          // biome-ignore lint/nursery/noSecrets: nombre de campo del schema, no es secreto
                          setValue("umbralEnDesarrollo", valor, {
                            shouldDirty: true,
                            shouldValidate: true,
                          })
                        }
                      />
                    )}
                  />
                )}
              />
            )}
          />
        </Stack>
      </NxtCard>

      {errors.root && (
        <NxtCard variant="surface" padding="md" accent="rose">
          <NxtText size="sm" tone="default">
            {errors.root.message}
          </NxtText>
        </NxtCard>
      )}
    </Stack>
  )
}
