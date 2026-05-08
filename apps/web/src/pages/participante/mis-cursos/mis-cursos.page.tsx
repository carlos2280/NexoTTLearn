import { useMisCursos } from "@/features/participante-mis-cursos/hooks/use-mis-cursos"
import { ApiError } from "@/shared/api/api-error"
import { EmptyState } from "@/shared/ui/patterns/empty-state"
import { Button } from "@/shared/ui/primitives/button"
import { AlertTriangle, BookOpen, RefreshCw } from "lucide-react"
import { useMemo, useState } from "react"
import { type MisCursosFiltro, MisCursosFiltros } from "./components/mis-cursos-filtros"
import { MisCursosGrid } from "./components/mis-cursos-grid"
import { MisCursosHeader } from "./components/mis-cursos-header"
import { MisCursosKpisSection } from "./components/mis-cursos-kpis"
import { MisCursosSkeleton } from "./components/mis-cursos-skeleton"
import { contarPorFiltro, filtrarCursos } from "./lib/filtrar-cursos"

// /cursos · landing del rol PARTICIPANTE para navegar todas sus inscripciones.
// Doc canonico: DOCUMENTOS/doc/v2/3-pantallas/participante/mis-cursos/lista.md
export function MisCursosPage() {
  const query = useMisCursos()
  const [filtro, setFiltro] = useState<MisCursosFiltro>("todos")
  const [busqueda, setBusqueda] = useState("")

  const conteos = useMemo(() => {
    if (!query.data) {
      return { todos: 0, activos: 0, completados: 0 }
    }
    const todos = [...query.data.asignados, ...query.data.libres]
    return contarPorFiltro(todos)
  }, [query.data])

  if (query.isLoading) {
    return <MisCursosSkeleton />
  }

  if (query.isError) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="No pudimos cargar tus cursos"
        description={mensajeError(query.error)}
        action={
          <Button onClick={() => query.refetch()} loading={query.isFetching} variant="secondary">
            <RefreshCw className="size-4" strokeWidth={1.75} />
            Reintentar
          </Button>
        }
      />
    )
  }

  if (!query.data) {
    return null
  }

  const { resumen, kpis, asignados, libres } = query.data

  if (asignados.length === 0 && libres.length === 0) {
    return (
      <div className="mx-auto flex w-full max-w-[1200px] flex-col">
        <MisCursosHeader resumen={resumen} />
        <EmptyState
          icon={BookOpen}
          title="Aun no tienes cursos"
          description="Tu administrador puede asignarte cursos, o puedes explorar el catalogo libre por tu cuenta."
        />
      </div>
    )
  }

  const asignadosFiltrados = filtrarCursos(asignados, filtro, busqueda)
  const libresFiltrados = filtrarCursos(libres, filtro, busqueda)
  const hayBusquedaActiva = busqueda.trim().length > 0 || filtro !== "todos"

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-6">
      <MisCursosHeader resumen={resumen} />
      <MisCursosFiltros
        filtro={filtro}
        onFiltroChange={setFiltro}
        busqueda={busqueda}
        onBusquedaChange={setBusqueda}
        conteos={conteos}
      />
      <MisCursosGrid
        asignados={asignadosFiltrados}
        libres={libresFiltrados}
        hayBusquedaActiva={hayBusquedaActiva}
        onLimpiar={() => {
          setFiltro("todos")
          setBusqueda("")
        }}
      />
      <MisCursosKpisSection kpis={kpis} />
    </div>
  )
}

function mensajeError(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message
  }
  return "Intentalo de nuevo en unos segundos."
}
