import { Badge } from "@/shared/components/ui/badge"
import { Button } from "@/shared/components/ui/button"
import { RUTAS } from "@/shared/constants/rutas"
import type { ModuloResponse } from "@nexott-learn/shared-types"
import { ChevronLeft, Eye } from "lucide-react"
import { Link } from "react-router-dom"
import { useGuardadoBuilder } from "../contexto-guardado"
import { IndicadorGuardado } from "../editores/shared/indicador-guardado"

interface BuilderTopbarProps {
  readonly modulo: ModuloResponse
}

/**
 * Barra superior del builder inmersivo. Minimalista: salida, identidad del
 * modulo, badge de estado, indicador de guardado y accesos a "vista previa"
 * y "balance" (deshabilitados en B0).
 */
export function BuilderTopbar({ modulo }: BuilderTopbarProps) {
  const { estado } = useGuardadoBuilder()
  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-border border-b bg-surface px-4">
      <Button asChild={true} variant="ghost" size="sm">
        <Link to={RUTAS.admin.catalogo} aria-label="Salir del builder">
          <ChevronLeft className="h-4 w-4" strokeWidth={1.5} aria-hidden={true} />
          Salir
        </Link>
      </Button>

      <div className="h-5 w-px bg-border" aria-hidden={true} />

      <div className="flex min-w-0 flex-1 items-center gap-3">
        <h1 className="truncate font-medium text-body-sm text-text-primary">{modulo.titulo}</h1>
        {modulo.estado === "ACTIVO" ? (
          <Badge tono="success" conPunto={true}>
            Activo
          </Badge>
        ) : (
          <Badge tono="neutro" conPunto={true}>
            Archivado
          </Badge>
        )}
      </div>

      <IndicadorGuardado estado={estado} />

      <div className="h-5 w-px bg-border" aria-hidden={true} />

      <Button variant="ghost" size="sm" disabled={true} title="Vista previa — próximamente">
        <Eye className="h-4 w-4" strokeWidth={1.5} aria-hidden={true} />
        Vista previa
      </Button>
    </header>
  )
}
