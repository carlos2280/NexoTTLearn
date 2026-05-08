import { useActualizarArea } from "@/features/admin-areas/hooks/use-mutaciones-area"
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
import {
  type ActualizarAreaInput,
  type Area,
  actualizarAreaSchema,
} from "@nexott-learn/shared-types"
import { useEffect } from "react"
import { Controller, useForm } from "react-hook-form"
import { AreaColorPicker } from "./area-color-picker"

interface DialogEditarAreaProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly area: Area | undefined
}

interface FormValues {
  nombre: string
  color: string
  descripcion: string
  orden: number
}

export function DialogEditarArea({ open, onOpenChange, area }: DialogEditarAreaProps) {
  const actualizar = useActualizarArea()
  const {
    control,
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(actualizarAreaSchema),
  })

  useEffect(() => {
    if (open && area) {
      reset({
        nombre: area.nombre,
        color: area.color,
        descripcion: area.descripcion ?? "",
        orden: area.orden,
      })
    }
  }, [open, area, reset])

  if (!area) {
    return null
  }

  const onSubmit = handleSubmit(async (values) => {
    const patch: ActualizarAreaInput = {}
    if (values.nombre !== area.nombre) {
      patch.nombre = values.nombre
    }
    if (values.color !== area.color) {
      patch.color = values.color
    }
    const desc = values.descripcion.trim()
    if (desc !== (area.descripcion ?? "")) {
      patch.descripcion = desc.length > 0 ? desc : null
    }
    if (values.orden !== area.orden) {
      patch.orden = values.orden
    }
    try {
      await actualizar.mutateAsync({ id: area.id, input: patch })
      onOpenChange(false)
    } catch {
      setError("root", { type: "server", message: "No se pudo guardar. Reintenta." })
    }
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md">
        <DialogHeader eyebrow="Editar área">
          <DialogTitle>{area.nombre}</DialogTitle>
          <DialogDescription>
            Para marcar el área como obsoleta usa el menú de la lista.
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
            <Button type="submit" loading={isSubmitting} disabled={!isDirty}>
              Guardar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
