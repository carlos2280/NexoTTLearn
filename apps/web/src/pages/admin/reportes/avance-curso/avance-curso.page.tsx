import { useListarCursos } from "@/features/cursos/hooks/use-listar-cursos"
import { useAvanceCurso } from "@/features/reportes/hooks/use-avance-curso"
import { ApiError } from "@/shared/api/api-error"
import { Banner } from "@/shared/components/ui/banner"
import { Card } from "@/shared/components/ui/card"
import { Pagination } from "@/shared/components/ui/pagination"
import type { CursoResumen, EventoHistorico, FilaAvanceCurso } from "@nexott-learn/shared-types"
import { useMemo } from "react"
import type { CursoOpcion, VistaAvance } from "./avance-curso.types"
import { AvanceFiltros } from "./components/avance-filtros"
import { AvanceFotografiaPendiente } from "./components/avance-fotografia-pendiente"
import { AvanceHeader } from "./components/avance-header"
import { AvanceHistorico } from "./components/avance-historico"
import { AvanceResumen } from "./components/avance-resumen"
import { AvanceTabla } from "./components/avance-tabla"
import { AvanceToolbar } from "./components/avance-toolbar"
import { useAvanceFiltros } from "./hooks/use-avance-filtros"

function toCursoOpcion(c: CursoResumen): CursoOpcion {
  return { id: c.id, titulo: c.titulo }
}

export function AvanceCursoPage() {
  const cursosQuery = useListarCursos({
    page: 1,
    pageSize: 50,
    sort: "createdAt",
    incluirArchivados: false,
  })
  const cursos = useMemo<readonly CursoOpcion[]>(
    () => (cursosQuery.data?.data ?? []).map(toCursoOpcion),
    [cursosQuery.data],
  )

  const { cursoId, vista, rol, busqueda, query, actualizarParam, actualizarBusqueda } =
    useAvanceFiltros(cursos)
  const { data, isLoading, error } = useAvanceCurso(query)

  const cargandoCursos = cursosQuery.isLoading
  const sinCursos = !cargandoCursos && cursos.length === 0
  // ASIGNADO es el default, pero igual excluye voluntarios: solo TODOS sin
  // busqueda muestra el curso completo, asi que cualquier otra cosa es "filtro".
  const hayFiltro = rol !== "TODOS" || busqueda.trim().length > 0

  const esFotografiaPendiente =
    vista === "FOTOGRAFIA_CIERRE" &&
    error instanceof ApiError &&
    error.code === "FOTOGRAFIA_NO_ENCONTRADA"

  return (
    <div className="mx-auto flex max-w-[1280px] flex-col gap-10">
      <AvanceHeader frescura={data?.meta ? new Date().toISOString() : undefined} />

      <AvanceToolbar
        cursos={cursos}
        cursoId={cursoId}
        vista={vista}
        onCambiarCurso={(id) => actualizarParam("cursoId", id)}
        onCambiarVista={(v) => actualizarParam("vista", v)}
      />

      {vista === "ACTUAL" && !sinCursos && (
        <AvanceFiltros
          rol={rol}
          busqueda={busqueda}
          onCambiarRol={(r) => actualizarParam("rol", r)}
          onCambiarBusqueda={actualizarBusqueda}
        />
      )}

      {sinCursos && (
        <Banner tone="info" title="Aún no hay cursos">
          Crea un curso desde el módulo de cursos para empezar a ver su avance.
        </Banner>
      )}

      {esFotografiaPendiente && <AvanceFotografiaPendiente />}

      {error && !esFotografiaPendiente && (
        <Banner tone="danger" title="No pudimos cargar el reporte">
          {error.message}
        </Banner>
      )}

      {!(sinCursos || esFotografiaPendiente) &&
        (isLoading || cargandoCursos ? (
          <Skeleton vista={vista} />
        ) : data ? (
          <Contenido data={data} vista={vista} hayFiltro={hayFiltro} />
        ) : null)}

      {data && data.meta.totalPages > 1 && (
        <Pagination
          page={data.meta.page}
          pageSize={data.meta.pageSize}
          total={data.meta.total}
          onCambiarPage={(p) => actualizarParam("page", String(p))}
        />
      )}
    </div>
  )
}

interface ContenidoProps {
  readonly data: {
    readonly data: readonly (FilaAvanceCurso | EventoHistorico)[]
    readonly meta: { readonly total: number }
  }
  readonly vista: VistaAvance
  readonly hayFiltro: boolean
}

function Contenido({ data, vista, hayFiltro }: ContenidoProps) {
  if (vista === "HISTORICO") {
    return <AvanceHistorico eventos={data.data as readonly EventoHistorico[]} />
  }
  const filas = data.data as readonly FilaAvanceCurso[]
  return (
    <>
      <AvanceResumen filas={filas} total={data.meta.total} />
      <AvanceTabla filas={filas} hayFiltro={hayFiltro} />
    </>
  )
}

function Skeleton({ vista }: { readonly vista: VistaAvance }) {
  if (vista === "HISTORICO") {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 4 }, (_, i) => (
          <Card key={`hsk-${i + 1}`} tono="plano" className="h-[110px] animate-pulse" />
        ))}
      </div>
    )
  }
  return (
    <div className="flex flex-col gap-6">
      <Card tono="plano" className="h-[100px] animate-pulse" />
      <Card tono="plano" className="h-[420px] animate-pulse" />
    </div>
  )
}
