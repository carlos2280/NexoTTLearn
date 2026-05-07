import { useCrearCurso } from "@/features/admin-cursos/hooks/use-crear-curso"
import { useCursos } from "@/features/admin-cursos/hooks/use-cursos"
import { ApiError } from "@/shared/api/api-error"
import { RUTAS } from "@/shared/constants/rutas"
import { Combobox } from "@/shared/ui/patterns/combobox"
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/patterns/dialog"
import { FormField } from "@/shared/ui/patterns/form-field"
import { RadioCard, RadioGroup } from "@/shared/ui/patterns/radio-group"
import { Button } from "@/shared/ui/primitives/button"
import { Input } from "@/shared/ui/primitives/input"
import { zodResolver } from "@hookform/resolvers/zod"
import { type CrearCursoInput, crearCursoInputSchema } from "@nexott-learn/shared-types"
import { AlertTriangle } from "lucide-react"
import { useEffect, useMemo } from "react"
import { Controller, useForm } from "react-hook-form"
import { useNavigate } from "react-router-dom"
import { z } from "zod"

interface CreateCourseDialogProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly initialMode?: "scratch" | "duplicate"
  readonly initialDuplicateFromId?: string
}

interface FormValues {
  readonly empresaCliente: string
  readonly titulo: string
  readonly mode: "scratch" | "duplicate"
  readonly duplicarDeId?: string
}

export function CrearCursoDialog({
  open,
  onOpenChange,
  initialMode = "scratch",
  initialDuplicateFromId,
}: CreateCourseDialogProps) {
  const navigate = useNavigate()
  const crear = useCrearCurso()

  const cursosExistentes = useCursos({ pageSize: 50 })
  const cursosOptions = useMemo(() => {
    const items = cursosExistentes.data?.items ?? []
    return items.map((c) => ({
      value: c.id,
      label: c.titulo,
      hint: c.empresaCliente,
    }))
  }, [cursosExistentes.data?.items])

  const clientesOptions = useMemo(() => {
    const items = cursosExistentes.data?.items ?? []
    const set = new Set<string>()
    for (const c of items) {
      set.add(c.empresaCliente)
    }
    return Array.from(set)
      .sort((a, b) => a.localeCompare(b, "es"))
      .map((nombre) => ({ value: nombre, label: nombre }))
  }, [cursosExistentes.data?.items])

  const {
    control,
    register,
    handleSubmit,
    watch,
    setError,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      empresaCliente: "",
      titulo: "",
      mode: initialMode,
      duplicarDeId: initialDuplicateFromId,
    },
  })

  // Reset al abrir/cerrar.
  useEffect(() => {
    if (open) {
      reset({
        empresaCliente: "",
        titulo: "",
        mode: initialMode,
        duplicarDeId: initialDuplicateFromId,
      })
    }
  }, [open, initialMode, initialDuplicateFromId, reset])

  const mode = watch("mode")

  async function onSubmit(values: FormValues) {
    const payload: CrearCursoInput =
      values.mode === "duplicate" && values.duplicarDeId
        ? {
            empresaCliente: values.empresaCliente,
            titulo: values.titulo,
            duplicarDeId: values.duplicarDeId,
          }
        : { empresaCliente: values.empresaCliente, titulo: values.titulo }
    try {
      const created = await crear.mutateAsync(payload)
      onOpenChange(false)
      navigate(RUTAS.admin.cursoEditor(created.id))
    } catch (error) {
      if (error instanceof ApiError) {
        setError("titulo", { message: error.message })
      } else {
        setError("titulo", { message: "No se pudo crear el curso. Intenta de nuevo." })
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader eyebrow="Nuevo curso">
          <DialogTitle>Crear borrador</DialogTitle>
          <DialogDescription>
            Solo necesitamos cliente y título. El detalle (áreas, módulos, pesos) se configura en el
            editor del curso.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} noValidate={true}>
          <DialogBody>
            <FormField
              label="Empresa cliente"
              error={errors.empresaCliente?.message}
              required={true}
            >
              {(controlId) => (
                <Controller
                  control={control}
                  name="empresaCliente"
                  render={({ field }) => (
                    <Combobox
                      id={controlId}
                      value={field.value || undefined}
                      onChange={(v) => field.onChange(v ?? "")}
                      options={clientesOptions}
                      placeholder="Selecciona o escribe un cliente"
                      searchPlaceholder="Buscar cliente..."
                      allowCustomValue={true}
                      onCustomValue={(v) => field.onChange(v)}
                      emptyLabel={
                        <span className="text-text-muted">
                          Escribe un nombre nuevo y presiona Enter
                        </span>
                      }
                      invalid={Boolean(errors.empresaCliente)}
                    />
                  )}
                />
              )}
            </FormField>

            <FormField label="Título del curso" error={errors.titulo?.message} required={true}>
              {(controlId) => (
                <Input
                  id={controlId}
                  placeholder="Ej: Fullstack Developer"
                  {...register("titulo")}
                />
              )}
            </FormField>

            <div className="flex flex-col gap-2">
              <span className="font-medium text-text-secondary text-xs tracking-wide">
                ¿Cómo quieres empezar?
              </span>
              <Controller
                control={control}
                name="mode"
                render={({ field }) => (
                  <RadioGroup
                    value={field.value}
                    onValueChange={(v) => {
                      field.onChange(v)
                      if (v === "scratch") {
                        setValue("duplicarDeId", undefined)
                      }
                    }}
                  >
                    <RadioCard
                      value="scratch"
                      label="Empezar desde cero"
                      description="Curso vacío. Configurarás áreas y módulos en el editor."
                    />
                    <RadioCard
                      value="duplicate"
                      label="Duplicar de otro curso"
                      description="Clona áreas, módulos, secciones y bloques. No clona candidatos ni evaluaciones."
                    />
                  </RadioGroup>
                )}
              />
            </div>

            {mode === "duplicate" ? (
              <FormField
                label="Curso a duplicar"
                error={errors.duplicarDeId?.message}
                hint="Solo se clona el armazón. Lo demás lo configuras tú."
                required={true}
              >
                {(controlId) => (
                  <Controller
                    control={control}
                    name="duplicarDeId"
                    render={({ field }) => (
                      <Combobox
                        id={controlId}
                        value={field.value}
                        onChange={(v) => field.onChange(v)}
                        options={cursosOptions}
                        placeholder="Selecciona un curso"
                        searchPlaceholder="Buscar curso..."
                        invalid={Boolean(errors.duplicarDeId)}
                      />
                    )}
                  />
                )}
              </FormField>
            ) : null}

            {crear.isError && !errors.titulo ? (
              <div className="flex items-start gap-2 rounded-[var(--radius-md)] border border-danger/40 bg-[var(--danger-bg)] p-3 text-danger text-sm">
                <AlertTriangle className="size-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
                <span>No se pudo crear el curso. Intenta de nuevo.</span>
              </div>
            ) : null}
          </DialogBody>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" loading={isSubmitting}>
              Crear borrador
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

const formSchema = crearCursoInputSchema
  .extend({
    mode: z.enum(["scratch", "duplicate"]),
    duplicarDeId: z.string().uuid().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.mode === "duplicate" && !data.duplicarDeId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["duplicarDeId"],
        message: "Selecciona un curso a duplicar",
      })
    }
  })
