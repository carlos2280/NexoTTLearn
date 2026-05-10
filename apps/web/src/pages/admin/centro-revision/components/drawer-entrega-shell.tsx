import { RUTAS } from "@/shared/constants/rutas"
import { DrawerFooter, DrawerHeader } from "@/shared/ui/patterns/drawer"
import { Button } from "@/shared/ui/primitives/button"
import type { EntregaBloqueDetalleAdmin } from "@nexott-learn/shared-types"
import { BookOpen, ExternalLink } from "lucide-react"
import { Link } from "react-router-dom"
import { edadRelativa } from "../lib/prioridad"

interface EntregaHeaderProps {
  readonly data: EntregaBloqueDetalleAdmin
  readonly nombreCompleto: string
}

export function EntregaDrawerHeader({ data, nombreCompleto }: EntregaHeaderProps) {
  return (
    <DrawerHeader>
      <p className="font-semibold text-sm text-text-primary">{nombreCompleto}</p>
      <p className="text-text-secondary text-xs">{data.bloque.moduloTitulo}</p>
      <p className="text-text-muted text-xs">
        {data.curso.empresaCliente} · {data.curso.titulo}
      </p>
      <p className="text-text-muted text-xs">
        Intento {data.intento} · {edadRelativa(data.enviadaAt)}
      </p>
      <div className="mt-2">
        <Link
          to={RUTAS.admin.cursoDetalle(data.curso.id)}
          className="inline-flex items-center gap-1.5 text-text-muted text-xs hover:text-text-primary"
        >
          <BookOpen className="size-3.5" strokeWidth={1.75} />
          Ver curso
          <ExternalLink className="size-3" />
        </Link>
      </div>
    </DrawerHeader>
  )
}

interface EntregaFooterProps {
  readonly nota: number | null
  readonly isEvaluando: boolean
  readonly onAprobar: () => void
  readonly onAjustar: () => void
  readonly onSiguiente: () => void
}

export function EntregaDrawerFooter({
  nota,
  isEvaluando,
  onAprobar,
  onAjustar,
  onSiguiente,
}: EntregaFooterProps) {
  return (
    <DrawerFooter>
      <p className="text-text-muted text-xs">
        Nota automática:{" "}
        <span className="font-semibold text-text-primary">
          {nota !== null ? `${nota} / 100` : "—"}
        </span>
      </p>
      <div className="flex gap-2">
        <Button
          variant="primary"
          size="sm"
          full={true}
          disabled={nota === null || isEvaluando}
          onClick={onAprobar}
        >
          {isEvaluando ? "Aprobando..." : `Aprobar (${nota ?? "—"})`}
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
