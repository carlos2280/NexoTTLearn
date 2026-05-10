import { Button } from "@/shared/ui/primitives/button"
import { Tooltip } from "@/shared/ui/primitives/tooltip"
import { ArrowRight } from "lucide-react"

interface BotonIrSeguimientoProps {
  readonly cursoId: string | undefined
  readonly habilitado: boolean
  readonly onClick: (id: string) => void
}

export function BotonIrSeguimiento({ cursoId, habilitado, onClick }: BotonIrSeguimientoProps) {
  if (!habilitado) {
    return (
      <Tooltip content="Disponible cuando el paso 3 esté completo">
        <span>
          <Button size="sm" disabled={true}>
            Ir a Seguimiento
            <ArrowRight className="size-4" aria-hidden="true" />
          </Button>
        </span>
      </Tooltip>
    )
  }
  return (
    <Button size="sm" onClick={() => cursoId && onClick(cursoId)}>
      Ir a Seguimiento
      <ArrowRight className="size-4" aria-hidden="true" />
    </Button>
  )
}
