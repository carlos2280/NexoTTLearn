import { useCrearArea } from "@/features/admin-areas/hooks/use-mutaciones-area"
import { ApiError } from "@/shared/api/api-error"
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
import { Button } from "@/shared/ui/primitives/button"
import { Input } from "@/shared/ui/primitives/input"
import { zodResolver } from "@hookform/resolvers/zod"
import { type CrearAreaInput, crearAreaSchema } from "@nexott-learn/shared-types"
import { useEffect } from "react"
import { Controller, useForm } from "react-hook-form"
import { AreaColorPicker } from "./area-color-picker"

interface DialogCrearAreaProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
}

const DEFAULT_VALUES: CrearAreaInput = {
  nombre: "",
  color: "violet",
  descripcion: "",
  orden: 0,
}

export function DialogCrearArea({ open, onOpenChange }: DialogCrearAreaProps) {
  const crear = useCrearArea()
  const {
    control,
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CrearAreaInput>({
    resolver: zodResolver(crearAreaSchema),
    defaultValues: DEFAULT_VALUES,
  })

  useEffect(() => {
    if (open) {
      reset(DEFAULT_VALUES)
    }
  }, [open, reset])

  const onSubmit = handleSubmit(async (values) => {
    try {
      await crear.mutateAsync({
        ...values,
        descripcion: values.descripcion?.trim() || undefined,
      })
      onOpenChange(false)
    } catch (err) {
      if (err instanceof ApiError && err.code === "CONFLICT") {
        setError("nombre", { type: "server", message: "Ya existe un área con ese nombre" })
        return
      }
      setError("root", { type: "server", message: "No se pudo crear el área. Reintenta." })
    }
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md">
        <DialogHeader eyebrow="Mantenedores">
          <DialogTitle>Nueva área</DialogTitle>
          <DialogDescription>
            Las áreas son catálogo global. Los cursos en BORRADOR pueden agregarlas.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit}>
          <DialogBody>
            <FormField label="Nombre" required={true} error={errors.nombre?.message}>
              {(id) => <Input id={id} autoFocus={true} {...register("nombre")} />}
            </FormField>
            <FormField label="Color" error={errors.color?.message}>
              {(id) => (
                <Controller
                  control={control}
                  name="color"
                  render={({ field }) => (
                    <AreaColorPicker id={id} value={field.value} onChange={field.onChange} />
                  )}
                />
              )}
            </FormField>
            <FormField label="Descripción" error={errors.descripcion?.message}>
              {(id) => <Input id={id} {...register("descripcion")} />}
            </FormField>
            <FormField label="Orden" error={errors.orden?.message}>
              {(id) => (
                <Input
                  id={id}
                  type="number"
                  min={0}
                  {...register("orden", { valueAsNumber: true })}
                />
              )}
            </FormField>
            {errors.root ? <p className="text-danger text-xs">{errors.root.message}</p> : null}
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
              Crear área
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
