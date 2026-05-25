import { useMejorIntentoBloque } from "@/features/intentos-bloque/hooks/use-mejor-intento-bloque"
import { cn } from "@/shared/lib/cn"
import { Check, Minus } from "lucide-react"

interface BloqueEvaluableCerradoProps {
  readonly bloqueId: string
  readonly colaboradorId: string | null
  readonly titulo: string
  readonly notaMinima: number
}

/**
 * Render read-only de un bloque evaluable (QUIZ o CODIGO_PREGUNTAS) cuando el
 * curso esta cerrado (F4 — pantalla 08). Sustituye a `BloqueQuiz` /
 * `BloqueCodigoPreguntas` durante el modo lectura: sin inputs, sin botones.
 * El participante esta consultando, no intentando.
 *
 * Filosofia: cualitativo manda, nota numerica discreta al lado. "Aprobado"
 * (color `state-solido`) o "No demostrado" (neutro, sin alarma). Sin
 * dramatismo — el curso ya cerro, esto es historico.
 */
export function BloqueEvaluableCerrado({
  bloqueId,
  colaboradorId,
  titulo,
  notaMinima,
}: BloqueEvaluableCerradoProps) {
  const mejor = useMejorIntentoBloque({
    colaboradorId: colaboradorId ?? undefined,
    bloqueId,
  })

  const intento = mejor.data ?? null
  const nota = intento?.nota ?? null
  const aprobado = nota !== null && nota >= notaMinima
  const estado: EstadoLectura =
    nota === null ? "sin-intento" : aprobado ? "aprobado" : "no-demostrado"
  const { etiqueta, icono: IconoEstado, cls } = ESTADO_LECTURA[estado]

  return (
    <article className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-subtle px-5 py-5">
      <div className="flex items-center gap-4">
        <span
          aria-hidden={true}
          className={cn("grid h-10 w-10 place-items-center rounded-xl bg-surface", cls.icon)}
        >
          <IconoEstado className="h-4 w-4" strokeWidth={2} />
        </span>
        <div className="flex flex-col gap-0.5">
          <span className="nx-eyebrow text-text-tertiary">{titulo}</span>
          <p className={cn("font-medium text-body-sm", cls.label)}>{etiqueta}</p>
        </div>
      </div>
      {nota !== null ? (
        <span className="tabular font-mono text-caption text-text-tertiary">
          {Math.round(nota)}/100
        </span>
      ) : null}
    </article>
  )
}

type EstadoLectura = "aprobado" | "no-demostrado" | "sin-intento"

const ESTADO_LECTURA: Record<
  EstadoLectura,
  {
    readonly etiqueta: string
    readonly icono: typeof Check
    readonly cls: { readonly icon: string; readonly label: string }
  }
> = {
  aprobado: {
    etiqueta: "Aprobado",
    icono: Check,
    cls: { icon: "text-state-solido", label: "text-state-solido-on-soft" },
  },
  "no-demostrado": {
    etiqueta: "No demostrado",
    icono: Minus,
    cls: { icon: "text-text-tertiary", label: "text-text-secondary" },
  },
  "sin-intento": {
    etiqueta: "Sin intento",
    icono: Minus,
    cls: { icon: "text-text-tertiary", label: "text-text-tertiary" },
  },
}
