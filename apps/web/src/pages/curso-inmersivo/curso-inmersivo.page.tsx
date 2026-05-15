import { useUsuarioActual } from "@/features/auth/hooks/use-usuario-actual"
import { Button } from "@/shared/components/ui/button"
import { RUTAS } from "@/shared/constants/rutas"
import { Navigate, useNavigate, useParams } from "react-router-dom"
import { CanvasSeccion } from "./components/canvas-seccion"
import { CursoInmersivoSkeleton } from "./components/curso-inmersivo-skeleton"
import { FooterPreviewInscripcion } from "./components/footer-preview-inscripcion"
import { PanelContexto } from "./components/panel-contexto"
import { SidebarPlan } from "./components/sidebar-plan"
import { TopbarInmersivo } from "./components/topbar-inmersivo"
import { useAtajosCurso } from "./hooks/use-atajos-curso"
import { useCursoInmersivo } from "./hooks/use-curso-inmersivo"
import { useEfectoApertura } from "./hooks/use-efecto-apertura"
import { useSeccionActiva } from "./hooks/use-seccion-activa"

/**
 * Página inmersiva del curso. Vive FUERA del `ParticipanteShell` — pantalla
 * completa para que el participante pase aquí el grueso del tiempo sin ruido
 * de navegación de producto.
 *
 * Tres modos unificados (decididos por `GET /me/cursos/:cursoId/arbol`):
 *
 *  - `asignado`   — 3 columnas: sidebar plan · canvas · panel contexto.
 *                   Plan personal completo, bloques evaluables activos.
 *  - `voluntario` — 3 columnas idem, pero sidebar muestra TOC del catalogo
 *                   (no plan; D-AS-1). Avance y disponibilidades de
 *                   transversal/IA siguen activos para autoevaluacion.
 *  - `preview`    — 2 columnas: sidebar TOC · canvas. Footer sticky con CTA
 *                   "Inscribirme como voluntario". Bloques evaluables se
 *                   muestran en lectura con candado.
 */
export function CursoInmersivoPage() {
  const navigate = useNavigate()
  const { cursoId } = useParams<{ cursoId: string }>()
  const { data: usuario } = useUsuarioActual()
  const detalle = useCursoInmersivo(cursoId ?? "")
  const seccion = useSeccionActiva({
    arbol: detalle.arbol,
    plan: detalle.plan,
    avance: detalle.avance,
  })
  useEfectoApertura({
    asignacionId: detalle.asignacionId,
    seccionActiva: seccion.seccionActiva,
  })
  useAtajosCurso({
    arbol: detalle.arbol?.modulos ?? [],
    seccionActivaId: seccion.seccionActiva?.seccionId ?? null,
    onSeleccionar: seccion.seleccionar,
    onSalir: () => navigate(RUTAS.bandeja),
  })

  if (!cursoId) {
    return <Navigate to={RUTAS.bandeja} replace={true} />
  }
  if (detalle.cargandoBasico) {
    return <CursoInmersivoSkeleton />
  }
  if (detalle.noTieneAcceso) {
    return (
      <PantallaError
        titulo="No tienes acceso a este curso."
        descripcion="O no estás inscrito en él, o el curso ya no está disponible. Vuelve a tu bandeja para ver tus cursos activos."
        onVolver={() => navigate(RUTAS.bandeja)}
      />
    )
  }
  if (detalle.errorBasico || !detalle.arbol || !detalle.modo) {
    return (
      <PantallaError
        titulo="No pudimos cargar el curso."
        descripcion="Reintenta en un momento. Si persiste, avisa al administrador."
        onVolver={() => navigate(RUTAS.bandeja)}
      />
    )
  }

  if (!(detalle.arbol && detalle.modo)) {
    return null
  }
  return (
    <CursoInmersivoLayout
      arbol={detalle.arbol}
      modo={detalle.modo}
      avance={detalle.avance}
      transversal={detalle.transversal}
      entrevistaIa={detalle.entrevistaIa}
      plan={detalle.plan}
      errorPlan={detalle.errorPlan}
      seccionActiva={seccion.seccionActiva}
      onSeleccionar={seccion.seleccionar}
      colaboradorId={usuario?.colaboradorId ?? null}
    />
  )
}

interface CursoInmersivoLayoutProps {
  readonly arbol: NonNullable<ReturnType<typeof useCursoInmersivo>["arbol"]>
  readonly modo: NonNullable<ReturnType<typeof useCursoInmersivo>["modo"]>
  readonly avance: ReturnType<typeof useCursoInmersivo>["avance"]
  readonly transversal: ReturnType<typeof useCursoInmersivo>["transversal"]
  readonly entrevistaIa: ReturnType<typeof useCursoInmersivo>["entrevistaIa"]
  readonly plan: ReturnType<typeof useCursoInmersivo>["plan"]
  readonly errorPlan: ReturnType<typeof useCursoInmersivo>["errorPlan"]
  readonly seccionActiva: ReturnType<typeof useSeccionActiva>["seccionActiva"]
  readonly onSeleccionar: (seccionId: string) => void
  readonly colaboradorId: string | null
}

function CursoInmersivoLayout(props: CursoInmersivoLayoutProps) {
  const {
    arbol,
    modo,
    avance,
    transversal,
    entrevistaIa,
    plan,
    errorPlan,
    seccionActiva,
    onSeleccionar,
    colaboradorId,
  } = props
  const seccionActivaId = seccionActiva?.seccionId ?? null
  const esPreview = modo === "preview"
  const muestraPanelContexto = !esPreview && avance !== undefined
  const grid = muestraPanelContexto
    ? "grid flex-1 grid-cols-[280px_minmax(0,1fr)_320px] overflow-hidden"
    : "grid flex-1 grid-cols-[280px_minmax(0,1fr)] overflow-hidden"

  return (
    <div className="nx-motion-immersive flex h-screen flex-col bg-canvas">
      <TopbarInmersivo
        cursoTitulo={arbol.curso.titulo}
        clienteNombre={arbol.curso.cliente.nombre}
        porcentajeAvance={avance?.porcentajeAvance ?? null}
      />
      <div className={grid}>
        <SidebarPlan
          modo={modo}
          arbol={arbol.modulos}
          plan={plan}
          errorPlan={errorPlan}
          seccionActivaId={seccionActivaId}
          onSeleccionar={onSeleccionar}
        />
        <CanvasSeccion
          seccionActiva={seccionActiva}
          modo={modo}
          cursoId={arbol.curso.id}
          colaboradorId={colaboradorId}
        />
        {muestraPanelContexto && avance ? (
          <PanelContexto
            avance={avance}
            transversal={transversal}
            entrevistaIa={entrevistaIa}
            seccionActivaId={seccionActivaId}
            onIrASiguiente={onSeleccionar}
          />
        ) : null}
      </div>
      {esPreview ? (
        <FooterPreviewInscripcion
          cursoId={arbol.curso.id}
          cursoTitulo={arbol.curso.titulo}
          areaCodigo={arbol.curso.areaPrincipal?.codigo ?? null}
        />
      ) : null}
    </div>
  )
}

interface PantallaErrorProps {
  readonly titulo: string
  readonly descripcion: string
  readonly onVolver: () => void
}

function PantallaError({ titulo, descripcion, onVolver }: PantallaErrorProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-6">
      <article className="flex max-w-md flex-col items-center gap-3 text-center">
        <h2 className="text-h2 text-text-primary">{titulo}</h2>
        <p className="text-body text-text-secondary">{descripcion}</p>
        <div className="mt-2">
          <Button onClick={onVolver}>Volver a la bandeja</Button>
        </div>
      </article>
    </div>
  )
}
