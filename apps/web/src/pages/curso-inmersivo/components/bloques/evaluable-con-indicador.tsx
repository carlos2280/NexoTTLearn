import { useMejorIntentoBloque } from "@/features/intentos-bloque/hooks/use-mejor-intento-bloque"
import { tiempoRelativo } from "@/shared/lib/tiempo-relativo"
import { CheckCircle2 } from "lucide-react"
import type { ReactNode } from "react"

interface EvaluableConIndicadorProps {
  readonly bloqueId: string
  readonly colaboradorId: string
  readonly notaMinima: number
  readonly children: ReactNode
}

/**
 * Envuelve un bloque evaluable (Quiz o reto de codigo) para mostrar SIEMPRE
 * el bloque expandido. Si el participante ya tiene un mejor intento aprobado,
 * añade arriba un chip discreto con nota + cuando aprobo — para que sepa que
 * ya lo realizo sin perder el acceso a reintentarlo.
 *
 * Decision de producto (override de la ley 07 del manifiesto): mantenemos la
 * consistencia visual del bloque expandido en vez de colapsarlo. El indicador
 * permanente reemplaza el "cumplido se desvanece" del manifiesto en este
 * caso concreto, porque la version colapsada generaba confusion (info
 * presente colapsado, ausente al expandir).
 */
export function EvaluableConIndicador({
  bloqueId,
  colaboradorId,
  notaMinima,
  children,
}: EvaluableConIndicadorProps) {
  const mejor = useMejorIntentoBloque({ colaboradorId, bloqueId })
  const aprobado = (mejor.data?.nota ?? -1) >= notaMinima

  return (
    <div className="flex flex-col gap-2">
      {aprobado && mejor.data ? (
        <ChipAprobado nota={mejor.data.nota} fecha={mejor.data.fecha} />
      ) : null}
      {children}
    </div>
  )
}

interface ChipAprobadoProps {
  readonly nota: number
  readonly fecha: string
}

function ChipAprobado({ nota, fecha }: ChipAprobadoProps) {
  return (
    <div className="inline-flex w-fit items-center gap-2 self-start rounded-pill border border-success/30 bg-success-soft px-3 py-1">
      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-success" aria-hidden={true} />
      <span className="flex flex-wrap items-center gap-x-2 text-caption text-success-on-soft">
        <span>Ya lo realizaste</span>
        <span aria-hidden={true}>·</span>
        <span className="tabular font-medium font-mono">{Math.round(nota)}%</span>
        <span aria-hidden={true}>·</span>
        <span>{tiempoRelativo(fecha)}</span>
      </span>
    </div>
  )
}
