import type { LineaTerminal } from "@/features/git-ejecucion/use-git-ejercicio"
import { cn } from "@/shared/lib/cn"
import { type ChangeEvent, type FormEvent, useEffect, useRef, useState } from "react"

interface TerminalGitProps {
  readonly historial: readonly LineaTerminal[]
  readonly rama: string
  readonly onEjecutar: (linea: string) => void
}

/**
 * Terminal de git del bloque: historial de comandos + su salida, y una línea de
 * entrada con el prompt de la rama activa. Autoscroll al fondo en cada comando.
 * Es la superficie interactiva; el motor vive en `features/git-ejecucion`.
 */
export function TerminalGit({ historial, rama, onEjecutar }: TerminalGitProps) {
  const [valor, setValor] = useState("")
  const scrollRef = useRef<HTMLDivElement | null>(null)

  const totalLineas = historial.length
  useEffect(() => {
    // `totalLineas` en el cuerpo (además de en las deps) es lo que hace que el
    // efecto se re-ejecute con cada comando nuevo y baje el scroll al fondo.
    const el = scrollRef.current
    if (el && totalLineas >= 0) {
      el.scrollTop = el.scrollHeight
    }
  }, [totalLineas])

  const enviar = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault()
    const linea = valor.trim()
    if (linea.length === 0) {
      return
    }
    onEjecutar(linea)
    setValor("")
  }

  return (
    <section
      aria-label="Terminal de git"
      className="flex flex-col overflow-hidden rounded-lg font-code text-[12.5px] leading-[1.55]"
      style={{ background: "var(--color-code-bg)", color: "var(--color-code-text)" }}
    >
      <div
        ref={scrollRef}
        aria-live="polite"
        aria-atomic={false}
        className="max-h-[240px] min-h-[120px] overflow-y-auto px-4 py-3"
      >
        {historial.length === 0 ? (
          <p className="opacity-70">
            Escribe comandos git y pulsa Enter. Prueba con{" "}
            <span className="text-aurora-cyan">git status</span>.
          </p>
        ) : null}
        {historial.map((linea) => (
          <div key={linea.id} className="mb-1">
            <p>
              <span className="text-aurora-cyan">{rama} $</span> {linea.comando}
            </p>
            {linea.salida.length > 0 ? (
              <pre className={cn("whitespace-pre-wrap", linea.error && "text-danger")}>
                {linea.salida}
              </pre>
            ) : null}
          </div>
        ))}
      </div>
      <form
        onSubmit={enviar}
        className="flex items-center gap-2 border-white/10 border-t px-4 py-2"
      >
        <span aria-hidden={true} className="text-aurora-cyan">
          {rama} $
        </span>
        <input
          value={valor}
          onChange={(event: ChangeEvent<HTMLInputElement>) => setValor(event.target.value)}
          aria-label="Comando git"
          spellCheck={false}
          autoComplete="off"
          autoCapitalize="off"
          className="flex-1 bg-transparent font-code text-[12.5px] outline-none placeholder:opacity-50"
          placeholder="git checkout -b fix/…"
        />
      </form>
    </section>
  )
}
