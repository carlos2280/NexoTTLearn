import { useMejorIntentoBloque } from "@/features/intentos-bloque/hooks/use-mejor-intento-bloque"
import { cn } from "@/shared/lib/cn"
import { Check, Minus } from "lucide-react"
import { CeldaBloque } from "../ide/celda-bloque"
import type { MarcaCelda } from "../ide/celda-evaluable"

interface BloqueEvaluableCerradoProps {
  readonly bloqueId: string
  readonly colaboradorId: string | null
  readonly marca: MarcaCelda
  readonly notaMinima: number
}

/**
 * Render read-only de un bloque evaluable (QUIZ o CODIGO_PREGUNTAS) cuando el
 * curso esta cerrado (F4 — pantalla 08). Sustituye a `BloqueQuiz` /
 * `BloqueCodigoPreguntas` durante el modo lectura: sin inputs, sin botones.
 * El participante esta consultando, no intentando.
 *
 * Se lee como una celda del archivo (`? quiz` / `> ejercicio`), con el veredicto
 * cualitativo en el cuerpo y la nota numerica discreta en la cabecera. "Aprobado"
 * (color `state-solido`) o "No demostrado" (neutro, sin alarma). Sin dramatismo:
 * el curso ya cerro, esto es historico.
 */
export function BloqueEvaluableCerrado({
  bloqueId,
  colaboradorId,
  marca,
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
  const { etiqueta: etiquetaEstado, icono: IconoEstado, cls } = ESTADO_LECTURA[estado]

  return (
    <CeldaBloque
      glifo={marca.glifo}
      etiqueta={marca.etiqueta}
      derecha={
        nota !== null ? (
          <span className="tabular font-mono text-caption text-text-tertiary">
            {Math.round(nota)}/100
          </span>
        ) : undefined
      }
      bodyClassName="flex items-center gap-3 py-4"
    >
      <span
        aria-hidden={true}
        className={cn("grid h-8 w-8 place-items-center rounded-lg bg-subtle", cls.icon)}
      >
        <IconoEstado className="h-4 w-4" strokeWidth={2} />
      </span>
      <p className={cn("font-medium text-body-sm", cls.label)}>{etiquetaEstado}</p>
    </CeldaBloque>
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
