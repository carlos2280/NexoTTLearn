import { useFichaCatalogo } from "@/features/participante-catalogo/hooks/use-ficha-catalogo"
import { useInscribirse } from "@/features/participante-catalogo/hooks/use-inscribirse"
import { ApiError } from "@/shared/api/api-error"
import { EmptyState } from "@/shared/ui/patterns/empty-state"
import { Button } from "@/shared/ui/primitives/button"
import { AlertTriangle, RefreshCw } from "lucide-react"
import { useRef } from "react"
import { useParams } from "react-router-dom"
import { FichaBreadcrumb } from "./components/ficha-breadcrumb"
import { FichaContenido } from "./components/ficha-contenido"
import { FichaCtaInline } from "./components/ficha-cta-inline"
import { FichaHero } from "./components/ficha-hero"
import { FichaHitos } from "./components/ficha-hitos"
import { FichaSkeleton } from "./components/ficha-skeleton"
import { FichaSobreCurso } from "./components/ficha-sobre-curso"
import { FichaStickyCta } from "./components/ficha-sticky-cta"
import { FichaYaInscritoBanner } from "./components/ficha-ya-inscrito-banner"

// /catalogo/{slug} · ficha del curso libre antes de auto-inscripcion.
// Doc canonico: DOCUMENTOS/doc/v2/3-pantallas/participante/catalogo/ficha-curso-libre.md
export function FichaCursoLibrePage() {
  const { slug = "" } = useParams<{ slug: string }>()
  const query = useFichaCatalogo(slug)
  const inscripcion = useInscribirse()
  const heroRef = useRef<HTMLDivElement | null>(null)

  if (query.isLoading) {
    return <FichaSkeleton />
  }

  if (query.isError) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="No pudimos cargar el curso"
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

  const { hero, descripcionLarga, objetivos, areasConModulos, hitos, yaInscrito, vistaCursoHref } =
    query.data

  const onInscribirse = () => inscripcion.mutate(slug)

  return (
    <div className="mx-auto flex w-full max-w-[760px] flex-col gap-6">
      <FichaBreadcrumb tituloCurso={hero.titulo} />
      <div ref={heroRef}>
        <FichaHero hero={hero} />
      </div>

      <FichaSobreCurso descripcionLarga={descripcionLarga} objetivos={objetivos} />
      <FichaContenido areas={areasConModulos} />
      <FichaHitos hitos={hitos} />

      {yaInscrito && vistaCursoHref ? (
        <FichaYaInscritoBanner vistaCursoHref={vistaCursoHref} />
      ) : (
        <FichaCtaInline onInscribirse={onInscribirse} cargando={inscripcion.isPending} />
      )}

      {yaInscrito ? null : (
        <FichaStickyCta
          heroRef={heroRef}
          onInscribirse={onInscribirse}
          cargando={inscripcion.isPending}
        />
      )}
    </div>
  )
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
