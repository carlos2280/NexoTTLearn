import { useUsuarioActual } from "@/features/auth/hooks/use-usuario-actual"
import { RUTAS } from "@/shared/constants/rutas"
import { useCallback, useState } from "react"
import { Navigate, useNavigate, useParams } from "react-router-dom"
import { CanvasHito } from "./components/canvas-hito"
import { CanvasSeccion } from "./components/canvas-seccion"
import { CursoInmersivoSkeleton } from "./components/curso-inmersivo-skeleton"
import { FooterPreviewInscripcion } from "./components/footer-preview-inscripcion"
import { IdeActivityBar } from "./components/ide/ide-activity-bar"
import { IdeStatusbar } from "./components/ide/ide-statusbar"
import { IdeTitlebar } from "./components/ide/ide-titlebar"
import { PanelAvance } from "./components/panel-avance"
import { PantallaError } from "./components/pantalla-error"
import { SidebarPlan } from "./components/sidebar-plan"
import { useAtajosCurso } from "./hooks/use-atajos-curso"
import { useCursoInmersivo } from "./hooks/use-curso-inmersivo"
import { useEfectoApertura } from "./hooks/use-efecto-apertura"
import { usePanelAvance } from "./hooks/use-panel-avance"
import { useSeccionActiva } from "./hooks/use-seccion-activa"
import { useSidebarColapsado } from "./hooks/use-sidebar-colapsado"

type HitoTipo = "transversal" | "entrevistaIa"

/**
 * Página inmersiva del curso. Vive FUERA del `ParticipanteShell` — pantalla
 * completa para que el participante pase aquí el grueso del tiempo sin ruido
 * de navegación de producto.
 *
 * Coordina dos "lugares" del canvas central:
 *  - Sección normal (`seccion.seccionActiva`) — lectura + evaluables.
 *  - Hito de cierre (`hitoActivo`) — Transversal o Entrevista IA, canvas
 *    especializado SIN cambio de ruta (decisión 2026-05-15).
 *
 * Tres modos unificados (decididos por `GET /me/cursos/:cursoId/arbol`):
 *  - `asignado`   — 3 columnas: sidebar plan · canvas · panel contexto.
 *  - `voluntario` — 3 columnas idem, sidebar TOC del catálogo (D-AS-1).
 *  - `preview`    — 2 columnas, footer con CTA inscripción.
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
  const [hitoActivo, setHitoActivo] = useState<HitoTipo | null>(null)
  const [chatEntrevistaIaActivo, setChatEntrevistaIaActivo] = useState(false)
  const { colapsado: sidebarColapsado, toggle: toggleSidebar } = useSidebarColapsado()
  const { abierto: panelAvanceAbierto, toggle: togglePanelAvance } = usePanelAvance()

  const seleccionarSeccion = useCallback(
    (seccionId: string) => {
      setHitoActivo(null)
      setChatEntrevistaIaActivo(false)
      seccion.seleccionar(seccionId)
    },
    [seccion],
  )

  const abrirHito = useCallback((hito: HitoTipo) => {
    setHitoActivo(hito)
  }, [])

  useEfectoApertura({
    asignacionId: detalle.asignacionId,
    seccionActiva: seccion.seccionActiva,
  })
  useAtajosCurso({
    arbol: detalle.arbol?.modulos ?? [],
    seccionActivaId: seccion.seccionActiva?.seccionId ?? null,
    onSeleccionar: seleccionarSeccion,
    onSalir: () => navigate(RUTAS.bandeja),
    onToggleSidebar: toggleSidebar,
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

  return (
    <CursoInmersivoLayout
      arbol={detalle.arbol}
      modo={detalle.modo}
      avance={detalle.avance}
      transversal={detalle.transversal}
      entrevistaIa={detalle.entrevistaIa}
      plan={detalle.plan}
      errorPlan={detalle.errorPlan}
      errorAvance={detalle.errorAvance}
      seccionActiva={seccion.seccionActiva}
      hitoActivo={hitoActivo}
      onSeleccionarSeccion={seleccionarSeccion}
      onAbrirHito={abrirHito}
      colaboradorId={usuario?.colaboradorId ?? null}
      soloLectura={detalle.avance?.estaCerrado ?? false}
      asignacionId={detalle.asignacionId}
      modoFocus={chatEntrevistaIaActivo}
      onChatEntrevistaIaActivo={setChatEntrevistaIaActivo}
      sidebarColapsado={sidebarColapsado}
      onToggleSidebar={toggleSidebar}
      panelAvanceAbierto={panelAvanceAbierto}
      onTogglePanelAvance={togglePanelAvance}
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
  readonly errorAvance: ReturnType<typeof useCursoInmersivo>["errorAvance"]
  readonly seccionActiva: ReturnType<typeof useSeccionActiva>["seccionActiva"]
  readonly hitoActivo: HitoTipo | null
  readonly onSeleccionarSeccion: (seccionId: string) => void
  readonly onAbrirHito: (hito: HitoTipo) => void
  readonly colaboradorId: string | null
  readonly soloLectura: boolean
  readonly asignacionId: string | null
  readonly modoFocus: boolean
  readonly onChatEntrevistaIaActivo: (activo: boolean) => void
  readonly sidebarColapsado: boolean
  readonly onToggleSidebar: () => void
  readonly panelAvanceAbierto: boolean
  readonly onTogglePanelAvance: () => void
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
    errorAvance,
    seccionActiva,
    hitoActivo,
    onSeleccionarSeccion,
    onAbrirHito,
    colaboradorId,
    soloLectura,
    asignacionId,
    modoFocus,
    onChatEntrevistaIaActivo,
    sidebarColapsado,
    onToggleSidebar,
    panelAvanceAbierto,
    onTogglePanelAvance,
  } = props
  const seccionActivaId = hitoActivo === null ? (seccionActiva?.seccionId ?? null) : null
  const esPreview = modo === "preview"
  const muestraAvance = !esPreview && avance !== undefined
  const anchoSidebar = sidebarColapsado ? "0px" : "320px"
  const gridTemplate = `48px ${anchoSidebar} minmax(0,1fr)`

  return (
    <div className="nx-ide nx-motion-immersive flex h-screen flex-col bg-canvas">
      <IdeTitlebar
        cursoId={arbol.curso.id}
        cursoTitulo={arbol.curso.titulo}
        clienteNombre={arbol.curso.cliente.nombre}
        areaPrincipal={arbol.curso.areaPrincipal}
        estaCerrado={avance?.estaCerrado ?? false}
        etiquetaCualitativaFinal={avance?.etiquetaCualitativaFinal ?? null}
        atenuado={modoFocus}
      />
      <div
        className="relative grid flex-1 overflow-hidden transition-[grid-template-columns] duration-base ease-default"
        style={{ gridTemplateColumns: gridTemplate }}
      >
        <IdeActivityBar
          sidebarColapsado={sidebarColapsado}
          onTogglePlan={onToggleSidebar}
          atenuado={modoFocus}
        />
        <SidebarPlan
          modo={modo}
          arbol={arbol.modulos}
          plan={plan}
          errorPlan={errorPlan}
          seccionActivaId={seccionActivaId}
          onSeleccionar={onSeleccionarSeccion}
          transversal={transversal}
          entrevistaIa={entrevistaIa}
          hitoActivo={hitoActivo}
          onAbrirHito={onAbrirHito}
          avance={avance}
          errorAvance={errorAvance}
          soloLectura={soloLectura}
          atenuado={modoFocus}
        />
        {hitoActivo === null ? (
          <CanvasSeccion
            seccionActiva={seccionActiva}
            modo={modo}
            cursoId={arbol.curso.id}
            colaboradorId={colaboradorId}
            soloLectura={soloLectura}
          />
        ) : (
          <CanvasHito
            hito={hitoActivo}
            cursoId={arbol.curso.id}
            asignacionId={asignacionId}
            tieneEntrevistaIa={entrevistaIa !== undefined}
            onChatEntrevistaIaActivo={onChatEntrevistaIaActivo}
          />
        )}
      </div>
      {muestraAvance && avance && panelAvanceAbierto ? (
        <PanelAvance
          avance={avance}
          seccionActivaId={seccionActivaId}
          onIrASiguiente={onSeleccionarSeccion}
          onCerrar={onTogglePanelAvance}
          atenuado={modoFocus}
        />
      ) : null}
      <PieInmersivo
        esPreview={esPreview}
        cursoId={arbol.curso.id}
        cursoTitulo={arbol.curso.titulo}
        areaCodigo={arbol.curso.areaPrincipal?.codigo ?? null}
        modo={modo}
        porcentajeAvance={avance?.porcentajeAvance ?? null}
        soloLectura={soloLectura}
        atenuado={modoFocus}
        panelAvance={
          muestraAvance ? { abierto: panelAvanceAbierto, onToggle: onTogglePanelAvance } : undefined
        }
      />
    </div>
  )
}

interface PieInmersivoProps {
  readonly esPreview: boolean
  readonly cursoId: string
  readonly cursoTitulo: string
  readonly areaCodigo: string | null
  readonly modo: CursoInmersivoLayoutProps["modo"]
  readonly porcentajeAvance: number | null
  readonly soloLectura: boolean
  readonly atenuado: boolean
  readonly panelAvance?: { readonly abierto: boolean; readonly onToggle: () => void }
}

/**
 * Pie del modo inmersivo: barra de estado del IDE (asignado/voluntario) o el
 * footer de inscripción (preview). Extraído del layout para mantener su
 * complejidad cognitiva bajo el límite.
 */
function PieInmersivo({
  esPreview,
  cursoId,
  cursoTitulo,
  areaCodigo,
  modo,
  porcentajeAvance,
  soloLectura,
  atenuado,
  panelAvance,
}: PieInmersivoProps) {
  if (esPreview) {
    return (
      <FooterPreviewInscripcion
        cursoId={cursoId}
        cursoTitulo={cursoTitulo}
        areaCodigo={areaCodigo}
      />
    )
  }
  return (
    <IdeStatusbar
      modo={modo}
      porcentajeAvance={porcentajeAvance}
      soloLectura={soloLectura}
      atenuado={atenuado}
      panelAvance={panelAvance}
    />
  )
}
