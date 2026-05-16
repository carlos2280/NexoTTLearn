import { ApiError } from "@/shared/api/api-error"
import { Button } from "@/shared/components/ui/button"
import { Dialog, DialogFooter } from "@/shared/components/ui/dialog"
import { Field } from "@/shared/components/ui/field"
import { Input } from "@/shared/components/ui/input"
import { Select } from "@/shared/components/ui/select"
import { type FormEvent, useEffect, useState } from "react"
import { type ErroresPersonaForm, validarPersonaForm } from "./persona-crear-form-validar"

interface PersonaCrearDialogProps {
  readonly abierto: boolean
  readonly onCambiarAbierto: (abierto: boolean) => void
  readonly enviando: boolean
  readonly onCrear: (input: {
    readonly nombre: string
    readonly email: string
    readonly rol: "ADMIN" | "PARTICIPANTE"
    readonly habilitarMfa: boolean
  }) => Promise<void>
}

export function PersonaCrearDialog({
  abierto,
  onCambiarAbierto,
  enviando,
  onCrear,
}: PersonaCrearDialogProps) {
  const [nombre, setNombre] = useState("")
  const [email, setEmail] = useState("")
  const [rol, setRol] = useState<"ADMIN" | "PARTICIPANTE">("PARTICIPANTE")
  const [habilitarMfa, setHabilitarMfa] = useState(false)
  const [errores, setErrores] = useState<ErroresPersonaForm>({})

  useEffect(() => {
    if (abierto) {
      setNombre("")
      setEmail("")
      setRol("PARTICIPANTE")
      setHabilitarMfa(false)
      setErrores({})
    }
  }, [abierto])

  async function manejarSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const validacion = validarPersonaForm({ nombre, email, rol, habilitarMfa })
    if (validacion) {
      setErrores(validacion)
      return
    }
    setErrores({})
    try {
      await onCrear({
        nombre: nombre.trim(),
        email: email.trim().toLowerCase(),
        rol,
        habilitarMfa,
      })
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setErrores({ email: "Ya existe un colaborador con ese email." })
        return
      }
      setErrores({ general: err instanceof Error ? err.message : "No se pudo crear" })
    }
  }

  return (
    <Dialog
      abierto={abierto}
      onCambiarAbierto={onCambiarAbierto}
      titulo="Nuevo colaborador"
      descripcion="Quedará activo y recibirá una contraseña inicial de un solo uso."
    >
      <form onSubmit={manejarSubmit} className="flex flex-col gap-4">
        <Field label="Nombre completo" error={errores.nombre}>
          {(p) => (
            <Input
              {...p}
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              maxLength={200}
              autoFocus={true}
              hasError={Boolean(errores.nombre)}
            />
          )}
        </Field>
        <Field label="Email corporativo" error={errores.email}>
          {(p) => (
            <Input
              {...p}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              maxLength={254}
              hasError={Boolean(errores.email)}
            />
          )}
        </Field>
        <Field label="Rol">
          {(p) => (
            <Select
              {...p}
              value={rol}
              onChange={(e) => setRol(e.target.value as "ADMIN" | "PARTICIPANTE")}
            >
              <option value="PARTICIPANTE">Participante</option>
              <option value="ADMIN">Administrador</option>
            </Select>
          )}
        </Field>
        <label className="flex cursor-pointer items-center gap-2 text-body-sm text-text-secondary">
          <input
            type="checkbox"
            checked={habilitarMfa}
            onChange={(e) => setHabilitarMfa(e.target.checked)}
            className="h-4 w-4 cursor-pointer accent-accent"
          />
          Forzar setup de MFA en el primer acceso
        </label>
        {errores.general ? (
          <p role="alert" className="text-body-sm text-danger-on-soft">
            {errores.general}
          </p>
        ) : null}
        <DialogFooter>
          <Button
            variant="secondary"
            size="sm"
            type="button"
            onClick={() => onCambiarAbierto(false)}
          >
            Cancelar
          </Button>
          <Button variant="primary" size="sm" type="submit" isLoading={enviando}>
            Crear colaborador
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}
