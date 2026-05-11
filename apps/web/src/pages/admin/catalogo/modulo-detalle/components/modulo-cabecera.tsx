import { Badge } from "@/shared/components/ui/badge"
import { RUTAS } from "@/shared/constants/rutas"
import type { ModuloResponse } from "@nexott-learn/shared-types"
import { ChevronLeft } from "lucide-react"
import { Link } from "react-router-dom"

interface ModuloCabeceraProps {
  readonly modulo: ModuloResponse
}

export function ModuloCabecera({ modulo }: ModuloCabeceraProps) {
  return (
    <header className="flex flex-col gap-3">
      <Link
        to={RUTAS.admin.catalogo}
        className="inline-flex w-fit items-center gap-1 text-body-sm text-text-secondary hover:text-text-primary"
      >
        <ChevronLeft className="h-4 w-4" strokeWidth={1.5} aria-hidden={true} />
        Volver al catálogo
      </Link>
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-3">
          <h1 className="text-h1 text-text-primary">{modulo.titulo}</h1>
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
        {modulo.descripcion ? (
          <p className="max-w-3xl text-body text-text-secondary">{modulo.descripcion}</p>
        ) : null}
      </div>
    </header>
  )
}
