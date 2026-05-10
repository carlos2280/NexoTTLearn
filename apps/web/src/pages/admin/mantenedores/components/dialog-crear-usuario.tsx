import { useCrearUsuario } from "@/features/admin-usuarios/hooks/use-mutaciones-usuario"
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
import { RadioCard, RadioGroup } from "@/shared/ui/patterns/radio-group"
import { Button } from "@/shared/ui/primitives/button"
import { Input } from "@/shared/ui/primitives/input"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  type CrearUsuarioInput,
  type UsuarioConCredenciales,
  crearUsuarioSchema,
} from "@nexott-learn/shared-types"
import { useEffect } from "react"
import { Controller, useForm } from "react-hook-form"

interface DialogCrearUsuarioProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly onCreated: (response: UsuarioConCredenciales) => void
}

const DEFAULT_VALUES: CrearUsuarioInput = {
  nombre: "",
  apellido: "",
  email: "",
  rol: "PARTICIPANTE",
  activarMfa: false,
}

export function DialogCrearUsuario({ open, onOpenChange, onCreated }: DialogCrearUsuarioProps) {
  const crear = useCrearUsuario()
  const {
    control,
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CrearUsuarioInput>({
    resolver: zodResolver(crearUsuarioSchema),
    defaultValues: DEFAULT_VALUES,
  })

  useEffect(() => {
    if (open) {
      reset(DEFAULT_VALUES)
    }
  }, [open, reset])

  const onSubmit = handleSubmit(async (values) => {
    try {
      const response = await crear.mutateAsync(values)
      onOpenChange(false)
      onCreated(response)
    } catch (err) {
      if (err instanceof ApiError && err.code === "CONFLICT") {
        setError("email", { type: "server", message: "Ya existe un usuario con ese email" })
        return
      }
      setError("root", { type: "server", message: "No se pudo crear el usuario. Reintenta." })
    }
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md">
        <DialogHeader eyebrow="Mantenedores">
          <DialogTitle>Nuevo usuario</DialogTitle>
          <DialogDescription>
            Generaremos una password temporal que tendrás que comunicar al usuario.
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
            <FormField label="Email" required={true} error={errors.email?.message}>
              {(id) => <Input id={id} type="email" {...register("email")} />}
            </FormField>
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
            <Controller
              control={control}
              name="activarMfa"
              render={({ field }) => (
                <label className="flex cursor-pointer items-center gap-2 text-sm text-text-secondary">
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                    className="size-4 cursor-pointer rounded border-glass-border bg-glass-1 accent-brand-violet"
                  />
                  Solicitar MFA al primer login
                </label>
              )}
            />
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
              Crear usuario
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
