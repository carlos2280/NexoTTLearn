import { useActualizarUsuario } from "@/features/admin-usuarios/hooks/use-mutaciones-usuario"
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
import {
  type ActualizarUsuarioInput,
  type UsuarioAdmin,
  actualizarUsuarioSchema,
} from "@nexott-learn/shared-types"
import { useEffect } from "react"
import { Controller, useForm } from "react-hook-form"

interface DialogEditarUsuarioProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly usuario: UsuarioAdmin | undefined
  readonly onUpdated: () => void
}

interface FormValues {
  nombre: string
  apellido: string
  rol: UsuarioAdmin["rol"]
}

export function DialogEditarUsuario({
  open,
  onOpenChange,
  usuario,
  onUpdated,
}: DialogEditarUsuarioProps) {
  const actualizar = useActualizarUsuario()
  const {
    control,
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(actualizarUsuarioSchema),
  })

  useEffect(() => {
    if (open && usuario) {
      reset({ nombre: usuario.nombre, apellido: usuario.apellido, rol: usuario.rol })
    }
  }, [open, usuario, reset])

  if (!usuario) {
    return null
  }

  const onSubmit = handleSubmit(async (values) => {
    const patch: ActualizarUsuarioInput = {}
    if (values.nombre !== usuario.nombre) {
      patch.nombre = values.nombre
    }
    if (values.apellido !== usuario.apellido) {
      patch.apellido = values.apellido
    }
    if (values.rol !== usuario.rol) {
      patch.rol = values.rol
    }
    try {
      await actualizar.mutateAsync({ id: usuario.id, input: patch })
      onOpenChange(false)
      onUpdated()
    } catch {
      setError("root", { type: "server", message: "No se pudo guardar. Reintenta." })
    }
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md">
        <DialogHeader eyebrow="Editar usuario">
          <DialogTitle>{`${usuario.nombre} ${usuario.apellido}`}</DialogTitle>
          <DialogDescription>
            El email no se puede cambiar. Para resetear password o MFA usa el menú de la fila.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit}>
          <DialogBody>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Nombre" required={true} error={errors.nombre?.message}>
                {(id) => <Input id={id} autoFocus={true} {...register("nombre")} />}
              </FormField>
              <FormField label="Apellido" required={true} error={errors.apellido?.message}>
                {(id) => <Input id={id} {...register("apellido")} />}
              </FormField>
            </div>
            <FormField label="Rol" required={true} error={errors.rol?.message}>
              {() => (
                <Controller
                  control={control}
                  name="rol"
                  render={({ field }) => (
                    <RadioGroup value={field.value} onValueChange={field.onChange}>
                      <RadioCard value="PARTICIPANTE" label="Participante" />
                      <RadioCard value="ADMIN" label="Administrador" />
                    </RadioGroup>
                  )}
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
