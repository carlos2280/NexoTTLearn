import { useCrearPersonasLote } from "@/features/personas/hooks/use-mutaciones-personas"
import { ApiError } from "@/shared/api/api-error"
import { Banner } from "@/shared/components/ui/banner"
import { Button } from "@/shared/components/ui/button"
import { Dialog, DialogFooter } from "@/shared/components/ui/dialog"
import { Field } from "@/shared/components/ui/field"
import { Select, SelectItem } from "@/shared/components/ui/select"
import { Textarea } from "@/shared/components/ui/textarea"
import { MAX_COLABORADORES_LOTE } from "@nexott-learn/shared-types"
import type { AltaColaboradoresLoteResponse } from "@nexott-learn/shared-types"
import { type FormEvent, useState } from "react"
import { parsearLoteColaboradores } from "../parsear-lote"
import { PersonaLoteResultado } from "./persona-lote-resultado"

interface PersonaLoteDialogProps {
  readonly abierto: boolean
  readonly onCambiarAbierto: (abierto: boolean) => void
}

const PLACEHOLDER = "ana.perez@emeal.nttdata.com, Ana Pérez\nbeto.soto@emeal.nttdata.com, Beto Soto"

export function PersonaLoteDialog({ abierto, onCambiarAbierto }: PersonaLoteDialogProps) {
  const mutacion = useCrearPersonasLote()
  const [texto, setTexto] = useState("")
  const [rol, setRol] = useState<"ADMIN" | "PARTICIPANTE">("PARTICIPANTE")
  const [errores, setErrores] = useState<readonly string[]>([])
  const [resultado, setResultado] = useState<AltaColaboradoresLoteResponse | null>(null)

  async function manejarSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const { filas, errores: erroresParseo } = parsearLoteColaboradores(texto)
    if (erroresParseo.length > 0) {
      setErrores(erroresParseo)
      return
    }
    if (filas.length === 0) {
      setErrores(['Pega al menos una línea con formato "email, nombre".'])
      return
    }
    if (filas.length > MAX_COLABORADORES_LOTE) {
      setErrores([`Máximo ${MAX_COLABORADORES_LOTE} por tanda (pegaste ${filas.length}).`])
      return
    }
    setErrores([])
    try {
      const respuesta = await mutacion.mutateAsync({
        rol,
        habilitarMfa: false,
        colaboradores: [...filas],
      })
      setResultado(respuesta)
    } catch (err) {
      setErrores([err instanceof ApiError ? err.message : "No se pudo crear la tanda."])
    }
  }

  return (
    <Dialog
      abierto={abierto}
      onCambiarAbierto={onCambiarAbierto}
      titulo="Carga masiva de colaboradores"
      descripcion="Pega una lista de email y nombre. Cada cuenta nace con contraseña temporal de un solo uso."
    >
      {resultado ? (
        <PersonaLoteResultado resultado={resultado} onCerrar={() => onCambiarAbierto(false)} />
      ) : (
        <form onSubmit={manejarSubmit} className="flex flex-col gap-4">
          <Banner tone="info" title="Una fila por persona: email, nombre">
            Se crearán con el rol elegido y una contraseña temporal. Solo se aceptan dominios
            corporativos permitidos; máximo {MAX_COLABORADORES_LOTE} por tanda.
          </Banner>
          <Field
            label="Colaboradores (email, nombre — uno por línea)"
            error={errores.length > 0 ? "Corrige lo indicado abajo." : undefined}
          >
            {(p) => (
              <Textarea
                {...p}
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                rows={8}
                placeholder={PLACEHOLDER}
                autoFocus={true}
                hasError={errores.length > 0}
              />
            )}
          </Field>
          <Field label="Rol para toda la tanda">
            {(p) => (
              <Select
                {...p}
                value={rol}
                onValueChange={(v) => setRol(v as "ADMIN" | "PARTICIPANTE")}
              >
                <SelectItem value="PARTICIPANTE">Participante</SelectItem>
                <SelectItem value="ADMIN">Administrador</SelectItem>
              </Select>
            )}
          </Field>
          {errores.length > 0 ? (
            <ul role="alert" className="flex flex-col gap-1 text-body-sm text-danger-on-soft">
              {errores.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
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
            <Button variant="primary" size="sm" type="submit" isLoading={mutacion.isPending}>
              Crear colaboradores
            </Button>
          </DialogFooter>
        </form>
      )}
    </Dialog>
  )
}
