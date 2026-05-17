import { useUsuarioActual } from "@/features/auth/hooks/use-usuario-actual"
import { useResumenCierre } from "@/features/me/hooks/use-resumen-cierre"
import { Banner } from "@/shared/components/ui/banner"
import { Navigate, useParams } from "react-router-dom"
import { AccionesCierre } from "./components/acciones-cierre"
import { AreasPorTrabajar } from "./components/areas-por-trabajar"
import { ComentarioAdminCard } from "./components/comentario-admin-card"
import { CosechaSkills } from "./components/cosecha-skills"
import { HeroVeredicto } from "./components/hero-veredicto"

export function CursoCerradoPage() {
  const { cursoId } = useParams<{ cursoId: string }>()
  const { data: usuario } = useUsuarioActual()
  const { data, isLoading, error } = useResumenCierre(cursoId)

  if (!cursoId) {
    return <Navigate to="/bandeja" replace={true} />
  }

  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-canvas px-6 py-16">
      <div className="flex w-full max-w-2xl flex-col items-center gap-10">
        {isLoading ? <p className="text-body-sm text-text-tertiary">Cargando veredicto…</p> : null}

        {error ? (
          <Banner tone="danger">
            No pudimos cargar el cierre del curso. Reintenta en un momento.
          </Banner>
        ) : null}

        {data && usuario ? (
          <>
            <HeroVeredicto
              nombreUsuario={usuario.nombre}
              cursoTitulo={data.cursoTitulo}
              resultado={data.resultado}
              etiquetaCualitativa={data.etiquetaCualitativaFinal}
            />
            {data.comentarioAdmin ? (
              <ComentarioAdminCard comentario={data.comentarioAdmin} />
            ) : null}
            <CosechaSkills skills={data.skillsDemostradasNuevas} />
            {data.resultado === "NO_APTO" ? (
              <AreasPorTrabajar areas={data.areasPorTrabajar} />
            ) : null}
            <AccionesCierre cursoId={data.cursoId} />
          </>
        ) : null}
      </div>
    </main>
  )
}
