import { useVitrina } from "@/features/participante-catalogo/hooks/use-vitrina"
import { ApiError } from "@/shared/api/api-error"
import { EmptyState } from "@/shared/ui/patterns/empty-state"
import { Button } from "@/shared/ui/primitives/button"
import { AlertTriangle, Compass, RefreshCw, SearchX } from "lucide-react"
import { useCallback, useMemo } from "react"
import { useSearchParams } from "react-router-dom"
import { CatalogoFiltros, FiltrosResumenLimpiar } from "./components/catalogo-filtros"
import { CatalogoGrid } from "./components/catalogo-grid"
import { CatalogoHeader } from "./components/catalogo-header"
import { CatalogoSkeleton } from "./components/catalogo-skeleton"
import {
  type FiltrosVitrina,
  escribirFiltrosEnUrl,
  filtrosAQuery,
  filtrosVacios,
  leerFiltrosDesdeUrl,
} from "./lib/parsear-filtros-url"

// /catalogo · vitrina de cursos libres autoinscribibles.
// Doc canonico: DOCUMENTOS/doc/v2/3-pantallas/participante/catalogo/vitrina.md
export function VitrinaCatalogoPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const filtros = useMemo(() => leerFiltrosDesdeUrl(searchParams), [searchParams])
  const query = useVitrina(filtrosAQuery(filtros))

  const updateFiltros = useCallback(
    (next: FiltrosVitrina) => {
      setSearchParams(escribirFiltrosEnUrl(next), { replace: false })
    },
    [setSearchParams],
  )

  if (query.isLoading) {
    return <CatalogoSkeleton />
  }

  if (query.isError) {
    return (
      <div className="mx-auto flex w-full max-w-[1200px] flex-col">
        <CatalogoHeader
          q={filtros.q}
          onChangeQ={(q) => updateFiltros({ ...filtros, q })}
          totalDisponibles={0}
        />
        <EmptyState
          icon={AlertTriangle}
          title="No pudimos cargar el catalogo"
          description={mensajeError(query.error)}
          action={
            <Button onClick={() => query.refetch()} loading={query.isFetching} variant="secondary">
              <RefreshCw className="size-4" strokeWidth={1.75} />
              Reintentar
            </Button>
          }
        />
      </div>
    )
  }

  if (!query.data) {
    return null
  }

  const { items, totalDisponibles, totalSinFiltros, filtros: disponibles } = query.data
  const sinFiltrosAplicados = filtrosVacios(filtros)

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-6">
      <CatalogoHeader
        q={filtros.q}
        onChangeQ={(q) => updateFiltros({ ...filtros, q })}
        totalDisponibles={totalDisponibles}
      />

      <CatalogoFiltros filtros={filtros} disponibles={disponibles} onChange={updateFiltros} />

      <FiltrosResumenLimpiar
        filtros={filtros}
        onLimpiar={() => updateFiltros({ q: "", area: null, duracion: null, pestana: "todos" })}
      />

      {items.length > 0 ? (
        <CatalogoGrid items={items} />
      ) : (
        <VitrinaEmptyState
          totalSinFiltros={totalSinFiltros}
          sinFiltrosAplicados={sinFiltrosAplicados}
          onLimpiarFiltros={() =>
            updateFiltros({ q: "", area: null, duracion: null, pestana: "todos" })
          }
        />
      )}
    </div>
  )
}

interface VitrinaEmptyStateProps {
  readonly totalSinFiltros: number
  readonly sinFiltrosAplicados: boolean
  readonly onLimpiarFiltros: () => void
}

function VitrinaEmptyState({
  totalSinFiltros,
  sinFiltrosAplicados,
  onLimpiarFiltros,
}: VitrinaEmptyStateProps) {
  const { titulo, descripcion } = mensajesEmpty(totalSinFiltros, sinFiltrosAplicados)
  const action = sinFiltrosAplicados ? undefined : (
    <Button variant="secondary" onClick={onLimpiarFiltros}>
      Limpiar filtros
    </Button>
  )
  return (
    <EmptyState
      icon={sinFiltrosAplicados ? Compass : SearchX}
      title={titulo}
      description={descripcion}
      action={action}
    />
  )
}

function mensajesEmpty(
  totalSinFiltros: number,
  sinFiltrosAplicados: boolean,
): { titulo: string; descripcion: string } {
  if (totalSinFiltros === 0) {
    return {
      titulo: "No hay cursos disponibles en este momento",
      descripcion: "Vuelve mas tarde o contacta a tu lider de capacitacion",
    }
  }
  if (sinFiltrosAplicados) {
    return {
      titulo: "Ya estas inscrito en todos los cursos disponibles",
      descripcion: "Revisa tu seccion Mis Cursos",
    }
  }
  return {
    titulo: "No encontramos cursos con esos filtros",
    descripcion: "Prueba con otros filtros o limpia los actuales",
  }
}

function mensajeError(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message
  }
  if (error instanceof Error) {
    return error.message
  }
  return "Error desconocido"
}
