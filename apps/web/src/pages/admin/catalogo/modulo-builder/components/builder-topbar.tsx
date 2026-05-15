import { Badge } from "@/shared/components/ui/badge"
import { Button } from "@/shared/components/ui/button"
import { RUTAS } from "@/shared/constants/rutas"
import type { ModuloResponse } from "@nexott-learn/shared-types"
import { ChevronLeft } from "lucide-react"
import { Link } from "react-router-dom"
import { useGuardadoBuilder } from "../contexto-guardado"
import { IndicadorGuardado } from "../editores/shared/indicador-guardado"

interface BuilderTopbarProps {
  readonly modulo: ModuloResponse
}

/**
 * Barra superior del builder inmersivo.
 *
 * Lenguaje del shell admin: h-16, firma aurora 1px en el borde inferior,
 * sin divisores duros. Salida con breadcrumb hacia el origen ("Catálogo"),
 * título del módulo con peso editorial, estado a su lado y guardado a la
 * derecha como información sutil (no CTA).
 */
export function BuilderTopbar({ modulo }: BuilderTopbarProps) {
  const { estado } = useGuardadoBuilder()

  return (
    <header className="relative flex h-16 shrink-0 items-center gap-4 bg-surface px-4 lg:px-6">
      <Button asChild={true} variant="ghost" size="sm">
        <Link to={RUTAS.admin.catalogo} aria-label="Volver al catálogo">
          <ChevronLeft className="h-4 w-4" strokeWidth={1.75} aria-hidden={true} />
          Catálogo
        </Link>
      </Button>

      <div className="flex min-w-0 flex-1 items-center gap-3">
        <h1 className="truncate font-medium text-body text-text-primary">{modulo.titulo}</h1>
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

      <div
        aria-hidden={true}
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-[image:var(--gradient-aurora)] opacity-25"
      />
    </header>
  )
}
