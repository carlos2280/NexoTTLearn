import { DrawerFooter, DrawerHeader } from "@/shared/ui/patterns/drawer"
import { Button } from "@/shared/ui/primitives/button"
import type { EntregaProyectoDetalleAdmin } from "@nexott-learn/shared-types"
import { ExternalLink, GitBranch } from "lucide-react"
import { edadRelativa } from "../lib/prioridad"

interface ProyectoHeaderProps {
  readonly data: EntregaProyectoDetalleAdmin
  readonly nombreCompleto: string
}

export function ProyectoDrawerHeader({ data, nombreCompleto }: ProyectoHeaderProps) {
  return (
    <DrawerHeader>
      <p className="font-semibold text-sm text-text-primary">{nombreCompleto}</p>
      <p className="text-text-secondary text-xs">
        {data.miniProyecto?.titulo ?? data.transversal?.titulo ?? "Proyecto"}
      </p>
      <p className="text-text-muted text-xs">
        {data.curso.empresaCliente} · {data.curso.titulo}
      </p>
      <p className="text-text-muted text-xs">
        Intento {data.intento} · {edadRelativa(data.enviadaAt)}
      </p>
      <div className="mt-2">
        <a
          href={data.urlRepo}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-text-muted text-xs hover:text-text-primary"
        >
          <GitBranch className="size-3.5" strokeWidth={1.75} />
          {data.rama}
          <ExternalLink className="size-3" />
        </a>
      </div>
    </DrawerHeader>
  )
}

interface ProyectoFooterProps {
  readonly notaAgregada: number | null | undefined
  readonly notaCapa1: number | null
  readonly isEvaluando: boolean
  readonly onAceptar: () => void
  readonly onAjustar: () => void
  readonly onSiguiente: () => void
}

export function ProyectoDrawerFooter({
  notaAgregada,
  notaCapa1,
  isEvaluando,
  onAceptar,
  onAjustar,
  onSiguiente,
}: ProyectoFooterProps) {
  return (
    <DrawerFooter>
      <p className="text-text-muted text-xs">
        Nota agregada:{" "}
        <span className="font-semibold text-text-primary">
          {notaAgregada !== null && notaAgregada !== undefined ? `${notaAgregada} / 100` : "—"}
        </span>
      </p>
      <div className="flex gap-2">
        <Button
          variant="primary"
          size="sm"
          full={true}
          disabled={notaCapa1 === null || isEvaluando}
          onClick={onAceptar}
        >
          {isEvaluando ? "Confirmando..." : `Aceptar nota (${notaAgregada ?? "—"})`}
        </Button>
        <Button variant="secondary" size="sm" onClick={onAjustar}>
          Ajustar
        </Button>
      </div>
      <Button variant="ghost" size="sm" onClick={onSiguiente}>
        → Siguiente sin decidir
      </Button>
    </DrawerFooter>
  )
}
