import { Button } from "@/shared/components/ui/button"
import { Kbd } from "@/shared/components/ui/kbd"
import { cn } from "@/shared/lib/cn"
import { ArrowUp } from "lucide-react"
import { type FormEvent, type KeyboardEvent, useEffect, useRef, useState } from "react"

interface InputEntrevistaProps {
  readonly onEnviar: (mensaje: string) => void
  readonly deshabilitado: boolean
  readonly placeholder?: string
}

const MAX_LARGO = 4000
const RGX_MAC = /Mac|iPhone|iPad|iPod/

/**
 * Input del chat de entrevista IA. Textarea auto-grow sin borde tradicional;
 * solo halo aurora sutil al focus. Atajo Cmd/Ctrl+Enter para enviar; pista
 * `Kbd` visible solo cuando esta focused y hay contenido.
 *
 * Sin contador de chars salvo al acercarse a `MAX_LARGO` (regla del manifiesto:
 * no metricas innecesarias). Auto-grow hasta 6 lineas; despues scroll interno.
 */
export function InputEntrevista({ onEnviar, deshabilitado, placeholder }: InputEntrevistaProps) {
  const [valor, setValor] = useState("")
  const [enfocado, setEnfocado] = useState(false)
  const ref = useRef<HTMLTextAreaElement | null>(null)

  // Auto-grow del textarea ajustando height segun scrollHeight. `valor` se usa
  // como trigger (cada cambio de contenido recalcula altura).
  // biome-ignore lint/correctness/useExhaustiveDependencies: valor es trigger, no read.
  useEffect(() => {
    const el = ref.current
    if (!el) {
      return
    }
    el.style.height = "auto"
    const maxAlto = 6 * 24 + 16 // ~6 lineas a leading 24 + padding
    el.style.height = `${Math.min(el.scrollHeight, maxAlto)}px`
  }, [valor])

  const enviar = (): void => {
    const limpio = valor.trim()
    if (limpio.length === 0 || deshabilitado) {
      return
    }
    onEnviar(limpio)
    setValor("")
  }

  const onSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault()
    enviar()
  }

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>): void => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault()
      enviar()
    }
  }

  const cercaDelLimite = valor.length > MAX_LARGO - 200
  const puedeEnviar = !deshabilitado && valor.trim().length > 0

  return (
    <form
      onSubmit={onSubmit}
      className="border-border border-t bg-canvas/40 px-6 py-4 backdrop-blur-sm"
    >
      <div
        className={cn(
          "flex items-end gap-3 rounded-2xl border bg-surface px-4 py-3",
          "transition-[border-color,box-shadow] duration-base ease-default",
          enfocado
            ? "border-aurora-violet/40 shadow-ring-aurora-soft"
            : "border-border hover:border-border-emphasis",
        )}
      >
        <textarea
          ref={ref}
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          onFocus={() => setEnfocado(true)}
          onBlur={() => setEnfocado(false)}
          onKeyDown={onKeyDown}
          maxLength={MAX_LARGO}
          rows={1}
          placeholder={placeholder ?? "Escribe tu respuesta…"}
          disabled={deshabilitado}
          className={cn(
            "flex-1 resize-none border-0 bg-transparent text-input text-text-primary leading-6",
            "placeholder:text-text-tertiary focus:outline-none disabled:opacity-50",
          )}
        />
        <Button
          type="submit"
          size="icon"
          variant={puedeEnviar ? "aurora" : "ghost"}
          disabled={!puedeEnviar}
          aria-label="Enviar respuesta"
        >
          <ArrowUp className="h-4 w-4" aria-hidden={true} />
        </Button>
      </div>
      <div className="mt-2 flex items-center justify-between gap-3 px-1">
        <span className="text-caption text-text-tertiary">
          {enfocado ? (
            <>
              <Kbd>{esMac() ? "⌘" : "Ctrl"}</Kbd>
              <span className="mx-1 text-text-disabled">+</span>
              <Kbd>Enter</Kbd>
              <span className="ml-2 text-text-tertiary">para enviar</span>
            </>
          ) : (
            "Tomate tu tiempo para responder."
          )}
        </span>
        {cercaDelLimite ? (
          <span className="tabular font-mono text-caption text-text-tertiary">
            {valor.length}/{MAX_LARGO}
          </span>
        ) : null}
      </div>
    </form>
  )
}

function esMac(): boolean {
  if (typeof navigator === "undefined") {
    return false
  }
  return RGX_MAC.test(navigator.platform)
}
