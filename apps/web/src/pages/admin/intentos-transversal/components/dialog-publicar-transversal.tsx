import { Button } from "@/shared/components/ui/button"
import { Dialog, DialogFooter } from "@/shared/components/ui/dialog"
import { Field } from "@/shared/components/ui/field"
import { Input } from "@/shared/components/ui/input"
import { useEffect, useRef, useState } from "react"
import {
  MOTIVO_AJUSTE_MAX,
  NOTA_MAX,
  NOTA_MIN,
  derivarPublicacion,
} from "../hooks/publicar-transversal.helpers"

interface DialogPublicarTransversalProps {
  readonly abierto: boolean
  readonly onCambiarAbierto: (abierto: boolean) => void
  /** Nota que calculó la IA de las capas, o `null` si no fue computable. */
  readonly notaCalculada: number | null
  readonly umbral: number
  readonly enviando: boolean
  readonly onPublicar: (body: {
    notaAjustada?: number
    motivoAjuste?: string
  }) => Promise<void>
}

const CLASE_TEXTAREA =
  "resize-vertical w-full rounded-md border border-border-strong bg-surface px-3 py-2 text-input text-text-primary placeholder:text-text-tertiary focus:border-accent focus:shadow-ring-accent-soft focus:outline-none"

/**
 * Diálogo de "Publicar y cerrar" (B-nota): muestra la nota que calculó la IA y
 * deja al admin corregirla antes de publicar. Si la cambia (o la IA no dio nota),
 * el motivo es obligatorio. Al publicar sin cambios, no manda ajuste. La lógica
 * vive en `derivarPublicacion` (pura + testeada).
 */
export function DialogPublicarTransversal({
  abierto,
  onCambiarAbierto,
  notaCalculada,
  umbral,
  enviando,
  onPublicar,
}: DialogPublicarTransversalProps) {
  const [notaStr, setNotaStr] = useState("")
  const [motivo, setMotivo] = useState("")
  const [error, setError] = useState<string | null>(null)
  const estabaAbierto = useRef(false)

  // Prellenar SOLO en la transición cerrado→abierto, no cuando `notaCalculada`
  // cambia con el diálogo ya abierto (un refetch en background pisaría lo que el
  // admin ya escribió — la publicación no se puede deshacer).
  useEffect(() => {
    if (abierto && !estabaAbierto.current) {
      setNotaStr(notaCalculada === null ? "" : String(notaCalculada))
      setMotivo("")
      setError(null)
    }
    estabaAbierto.current = abierto
  }, [abierto, notaCalculada])

  const estado = derivarPublicacion({ notaStr, motivo, notaCalculada, umbral })

  async function manejarPublicar() {
    setError(null)
    if (!estado.puedePublicar) {
      return
    }
    try {
      await onPublicar(estado.body)
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo publicar.")
    }
  }

  return (
    <Dialog
      abierto={abierto}
      onCambiarAbierto={onCambiarAbierto}
      titulo="Publicar y cerrar"
      descripcion="El alumno verá esta nota y el informe que editaste; el caso queda cerrado. No se puede deshacer."
    >
      <form
        onSubmit={async (e) => {
          e.preventDefault()
          await manejarPublicar()
        }}
        className="flex flex-col gap-4"
      >
        <p className="text-body-sm text-text-secondary">
          {notaCalculada === null
            ? "La IA no pudo calcular una nota. Fija una a mano para publicar."
            : `Nota calculada por la IA: ${notaCalculada}/100.`}
        </p>
        <Field
          label={`Nota final (${NOTA_MIN}–${NOTA_MAX})`}
          error={estado.errorNota ?? undefined}
          hint={
            estado.aprobaria === null
              ? undefined
              : estado.aprobaria
                ? `Aprobado · umbral ${umbral}`
                : `No aprobado · umbral ${umbral}`
          }
        >
          {(attrs) => (
            <Input
              {...attrs}
              type="number"
              min={NOTA_MIN}
              max={NOTA_MAX}
              step={1}
              inputMode="numeric"
              value={notaStr}
              onChange={(e) => setNotaStr(e.target.value)}
              hasError={estado.errorNota !== null}
            />
          )}
        </Field>
        {estado.ajustada ? (
          // aria-live: al cambiar la nota aparece este campo obligatorio; se anuncia
          // al lector de pantalla de quien acaba de editar la nota con teclado.
          <div aria-live="polite">
            <Field label="Motivo del ajuste" error={estado.errorMotivo ?? undefined}>
              {(attrs) => (
                <textarea
                  {...attrs}
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  rows={3}
                  maxLength={MOTIVO_AJUSTE_MAX}
                  placeholder="Por qué cambias la nota que propuso la IA (queda en la auditoría)…"
                  className={CLASE_TEXTAREA}
                />
              )}
            </Field>
          </div>
        ) : null}
        {error ? (
          <p role="alert" className="text-body-sm text-danger-on-soft">
            {error}
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
          <Button
            variant="primary"
            size="sm"
            type="submit"
            isLoading={enviando}
            disabled={!estado.puedePublicar}
          >
            Publicar y cerrar
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}
