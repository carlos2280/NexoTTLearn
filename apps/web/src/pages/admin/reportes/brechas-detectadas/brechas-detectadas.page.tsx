import { useListarCursos } from "@/features/cursos/hooks/use-listar-cursos"
import { useBrechasDetectadas } from "@/features/reportes/hooks/use-brechas-detectadas"
import { Banner } from "@/shared/components/ui/banner"
import { Card } from "@/shared/components/ui/card"
import type { BrechasDetectadasQuery, CursoResumen } from "@nexott-learn/shared-types"
import { useEffect, useMemo } from "react"
import { useSearchParams } from "react-router-dom"
import { BrechasHeader } from "./components/brechas-header"
import { BrechasKpis } from "./components/brechas-kpis"
import { BrechasTabla } from "./components/brechas-tabla"
import { BrechasToolbar, type CursoOpcion } from "./components/brechas-toolbar"
import { BrechasUmbrales } from "./components/brechas-umbrales"

function toCursoOpcion(c: CursoResumen): CursoOpcion {
  return { id: c.id, titulo: c.titulo }
}

export function BrechasDetectadasPage() {
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

  useEffect(() => {
    const primero = cursos[0]
    if (!cursoIdParam && primero) {
      const next = new URLSearchParams(searchParams)
      next.set("cursoId", primero.id)
      setSearchParams(next, { replace: true })
    }
  }, [cursoIdParam, cursos, searchParams, setSearchParams])

  const query: BrechasDetectadasQuery | null = useMemo(() => {
    if (!cursoId) {
      return null
    }
    return { cursoId, vista: "ACTUAL", format: "json" }
  }, [cursoId])

  const { data, isLoading, error } = useBrechasDetectadas(query)

  const actualizarParam = (clave: string, valor: string) => {
    const next = new URLSearchParams(searchParams)
    next.set(clave, valor)
    setSearchParams(next, { replace: true })
  }

  const cargandoCursos = cursosQuery.isLoading
  const sinCursos = !cargandoCursos && cursos.length === 0

  return (
    <div className="mx-auto flex max-w-[1280px] flex-col gap-10">
      <BrechasHeader frescura={data?.meta.frescura} />

      <BrechasToolbar
        cursos={cursos}
        cursoId={cursoId}
        onCambiarCurso={(id) => actualizarParam("cursoId", id)}
      />

      {sinCursos && (
        <Banner tone="info" title="Aún no hay cursos">
          Crea un curso desde el módulo de cursos para empezar a ver brechas.
        </Banner>
      )}

      {error && (
        <Banner tone="danger" title="No pudimos cargar el reporte">
          {error.message}
        </Banner>
      )}

      {!(sinCursos || error) &&
        (isLoading || cargandoCursos ? (
          <Skeleton />
        ) : data ? (
          <>
            <BrechasKpis skills={data.skills} />
            <BrechasTabla skills={data.skills} />
            <BrechasUmbrales umbrales={data.umbrales} />
          </>
        ) : null)}
    </div>
  )
}

function Skeleton() {
  return (
    <div className="flex flex-col gap-10">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr_1fr]">
        <Card tono="plano" className="h-[200px] animate-pulse" />
        <Card tono="plano" className="h-[200px] animate-pulse" />
        <Card tono="plano" className="h-[200px] animate-pulse" />
      </div>
      <div className="flex flex-col gap-3">
        {Array.from({ length: 4 }, (_, i) => (
          <Card key={`bsk-${i + 1}`} tono="plano" className="h-[140px] animate-pulse" />
        ))}
      </div>
    </div>
  )
}
