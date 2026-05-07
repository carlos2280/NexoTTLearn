import { useCursos } from "@/features/admin-cursos/hooks/use-cursos"
import { useKpisCursosActivos } from "@/features/admin-seguimiento/hooks/use-kpis-cursos-activos"
import { RUTAS } from "@/shared/constants/rutas"
import { PageHeader } from "@/shared/ui/patterns/page-header"
import { useEffect, useMemo } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { HubMosaico } from "./components/hub-mosaico"
import { type CursoHub, ordenarCursosHub } from "./lib/ordenar-cursos-hub"
import { MatrizSeguimientoPage } from "./matriz.page"

export function HubSeguimientoPage() {
  const [searchParams] = useSearchParams()
  const cursoId = searchParams.get("curso")

  if (cursoId) {
    return <MatrizSeguimientoPage cursoId={cursoId} />
  }

  return <HubVista />
}

function HubVista() {
  const navigate = useNavigate()
  const { data, isLoading, isError, refetch } = useCursos({ estado: "ACTIVO", pageSize: 50 })
  const cursos = useMemo(() => data?.items ?? [], [data?.items])
  const cursoIds = useMemo(() => cursos.map((c) => c.id), [cursos])
  const kpisEntries = useKpisCursosActivos(cursoIds)
  const isLoadingKpis = kpisEntries.some((e) => e.isLoading)

  const items = useMemo<readonly CursoHub[]>(() => {
    const merged: CursoHub[] = cursos.map((curso) => {
      const entry = kpisEntries.find((e) => e.cursoId === curso.id)
      return { curso, kpis: entry?.data ?? null }
    })
    return ordenarCursosHub(merged)
  }, [cursos, kpisEntries])

  // hub.md §1 · auto-redirect cuando hay un solo curso activo.
  useEffect(() => {
    if (!isLoading && cursos.length === 1) {
      const unico = cursos[0]
      if (unico) {
        navigate(`${RUTAS.admin.seguimiento}?curso=${unico.id}`, { replace: true })
      }
    }
  }, [cursos, isLoading, navigate])

  const handleAbrir = (id: string) => {
    navigate(`${RUTAS.admin.seguimiento}?curso=${id}`)
  }
  const handleIrCursos = () => navigate(RUTAS.admin.cursos)

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 md:py-10 lg:px-8">
      <div className="flex flex-col gap-8">
        <PageHeader
          eyebrow="Admin"
          title="Seguimiento"
          subtitle="Elige un curso para ver su matriz de progreso."
        />
        <HubMosaico
          items={items}
          isLoading={isLoading}
          isError={isError}
          isLoadingKpis={isLoadingKpis}
          onRetry={() => {
            refetch()
          }}
          onAbrir={handleAbrir}
          onIrCursos={handleIrCursos}
        />
      </div>
    </main>
  )
}
