import { useCursosDisponiblesVoluntario } from "@/features/cursos/hooks/use-cursos-disponibles-voluntario"
import { Banner } from "@/shared/components/ui/banner"
import { Pagination } from "@/shared/components/ui/pagination"
import type { CursoDisponibleVoluntario } from "@nexott-learn/shared-types"
import { useState } from "react"
import { CatalogoCard } from "./components/catalogo-card"
import { CatalogoEmpty } from "./components/catalogo-empty"
import { CatalogoSkeleton } from "./components/catalogo-skeleton"

/**
 * Catalogo de voluntariado del participante (D8.1 / D8.2 / D90).
 *
 * Lista cursos ACTIVO con `toggleVoluntarios=true` donde el usuario aun no esta
 * asignado. El click en una card abre el curso inmersivo en modo `preview` —
 * desde alli el participante explora y decide inscribirse (Capa 2). La card en
 * si NO inscribe: solo navega al detalle.
 */
export function CatalogoPage() {
  const [page, setPage] = useState(1)
  const { data, isLoading, error } = useCursosDisponiblesVoluntario({ page })

  return (
    <div className="mx-auto flex max-w-[1180px] flex-col gap-8 px-6 py-10">
      <header className="flex flex-col gap-1.5">
        <span className="nx-eyebrow text-text-tertiary">Aprende por tu cuenta</span>
        <h1 className="text-h1 text-text-primary">Catálogo</h1>
        <p className="max-w-2xl text-body text-text-secondary">
          Cursos abiertos a voluntariado. Explora cada uno y, si te suma, inscríbete por iniciativa
          propia. Suman a tu ficha; no cuentan para el reporte de un cliente.
        </p>
      </header>

      {error ? (
        <Banner tone="danger" title="No pudimos cargar el catálogo">
          Hubo un problema al recuperar los cursos. Recarga la página o vuelve más tarde.
        </Banner>
      ) : null}

      {isLoading && !data ? (
        <CatalogoSkeleton />
      ) : data && data.data.length === 0 ? (
        <CatalogoEmpty />
      ) : data ? (
        <CursosGrid cursos={data.data} />
      ) : null}

      {data && data.meta.totalPages > 1 ? (
        <Pagination
          page={data.meta.page}
          pageSize={data.meta.pageSize}
          total={data.meta.total}
          onCambiarPage={setPage}
        />
      ) : null}
    </div>
  )
}

interface CursosGridProps {
  readonly cursos: readonly CursoDisponibleVoluntario[]
}

function CursosGrid({ cursos }: CursosGridProps) {
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
      {cursos.map((curso) => (
        <CatalogoCard key={curso.cursoId} curso={curso} />
      ))}
    </div>
  )
}
