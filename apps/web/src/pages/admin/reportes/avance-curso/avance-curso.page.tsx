import { useListarCursos } from "@/features/cursos/hooks/use-listar-cursos"
import { useAvanceCurso } from "@/features/reportes/hooks/use-avance-curso"
import { ApiError } from "@/shared/api/api-error"
import { Banner } from "@/shared/components/ui/banner"
import { Card } from "@/shared/components/ui/card"
import { Pagination } from "@/shared/components/ui/pagination"
import type {
  AvanceCursoQuery,
  CursoResumen,
  EventoHistorico,
  FilaAvanceCurso,
} from "@nexott-learn/shared-types"
import { useEffect, useMemo } from "react"
import { useSearchParams } from "react-router-dom"
import type { CursoOpcion, VistaAvance } from "./avance-curso.types"
import { AvanceFotografiaPendiente } from "./components/avance-fotografia-pendiente"
import { AvanceHeader } from "./components/avance-header"
import { AvanceHistorico } from "./components/avance-historico"
import { AvanceResumen } from "./components/avance-resumen"
import { AvanceTabla } from "./components/avance-tabla"
import { AvanceToolbar } from "./components/avance-toolbar"

const VISTAS_VALIDAS: readonly VistaAvance[] = ["ACTUAL", "FOTOGRAFIA_CIERRE", "HISTORICO"]
const PAGE_SIZE = 20

function parsearVista(raw: string | null): VistaAvance {
  return VISTAS_VALIDAS.includes(raw as VistaAvance) ? (raw as VistaAvance) : "ACTUAL"
}

function toCursoOpcion(c: CursoResumen): CursoOpcion {
  return { id: c.id, titulo: c.titulo }
}

export function AvanceCursoPage() {
  const [searchParams, setSearchParams] = useSearchParams()

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

  const cursoIdParam = searchParams.get("cursoId")
  const cursoId = cursoIdParam ?? cursos[0]?.id ?? ""
  const vista = parsearVista(searchParams.get("vista"))
  const page = Number(searchParams.get("page") ?? "1")

  // Si no hay cursoId en la URL y ya hay cursos cargados, fijamos el primero
  // en la URL para que el estado sea shareable y consistente con la UI.
  useEffect(() => {
    const primero = cursos[0]
    if (!cursoIdParam && primero) {
      const next = new URLSearchParams(searchParams)
      next.set("cursoId", primero.id)
      setSearchParams(next, { replace: true })
    }
  }, [cursoIdParam, cursos, searchParams, setSearchParams])

  const query: AvanceCursoQuery | null = useMemo(() => {
    if (!cursoId) {
      return null
    }
    return { cursoId, vista, page, pageSize: PAGE_SIZE, format: "json" }
  }, [cursoId, vista, page])

  const { data, isLoading, error } = useAvanceCurso(query)

  const actualizarParam = (clave: string, valor: string) => {
    const next = new URLSearchParams(searchParams)
    next.set(clave, valor)
    if (clave !== "page") {
      next.set("page", "1")
    }
    setSearchParams(next, { replace: true })
  }

  const cargandoCursos = cursosQuery.isLoading
  const sinCursos = !cargandoCursos && cursos.length === 0

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

      {!sinCursos &&
        !esFotografiaPendiente &&
        (isLoading || cargandoCursos ? (
          <Skeleton vista={vista} />
        ) : data ? (
          <Contenido data={data} vista={vista} />
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
}

function Contenido({ data, vista }: ContenidoProps) {
  if (vista === "HISTORICO") {
    return <AvanceHistorico eventos={data.data as readonly EventoHistorico[]} />
  }
  const filas = data.data as readonly FilaAvanceCurso[]
  return (
    <>
      <AvanceResumen filas={filas} total={data.meta.total} />
      <AvanceTabla filas={filas} />
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
