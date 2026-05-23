import { useUsuarioActual } from "@/features/auth/hooks/use-usuario-actual"
import { RUTAS } from "@/shared/constants/rutas"
import { useCallback, useState } from "react"
import { Navigate, useNavigate, useParams } from "react-router-dom"
import { CanvasHito } from "./components/canvas-hito"
import { CanvasSeccion } from "./components/canvas-seccion"
import { CursoInmersivoSkeleton } from "./components/curso-inmersivo-skeleton"
import { FooterPreviewInscripcion } from "./components/footer-preview-inscripcion"
import { PanelContexto } from "./components/panel-contexto"
import { PantallaError } from "./components/pantalla-error"
import { SidebarPlan } from "./components/sidebar-plan"
import { TopbarInmersivo } from "./components/topbar-inmersivo"
import { useAtajosCurso } from "./hooks/use-atajos-curso"
import { useCursoInmersivo } from "./hooks/use-curso-inmersivo"
import { useEfectoApertura } from "./hooks/use-efecto-apertura"
import { useSeccionActiva } from "./hooks/use-seccion-activa"

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
      seccionActiva={seccion.seccionActiva}
      hitoActivo={hitoActivo}
      onSeleccionarSeccion={seleccionarSeccion}
      onAbrirHito={abrirHito}
      colaboradorId={usuario?.colaboradorId ?? null}
      soloLectura={detalle.avance?.estaCerrado ?? false}
      asignacionId={detalle.asignacionId}
      modoFocus={chatEntrevistaIaActivo}
      onChatEntrevistaIaActivo={setChatEntrevistaIaActivo}
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
  readonly hitoActivo: HitoTipo | null
  readonly onSeleccionarSeccion: (seccionId: string) => void
  readonly onAbrirHito: (hito: HitoTipo) => void
  readonly colaboradorId: string | null
  readonly soloLectura: boolean
  readonly asignacionId: string | null
  readonly modoFocus: boolean
  readonly onChatEntrevistaIaActivo: (activo: boolean) => void
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
    hitoActivo,
    onSeleccionarSeccion,
    onAbrirHito,
    colaboradorId,
    soloLectura,
    asignacionId,
    modoFocus,
    onChatEntrevistaIaActivo,
  } = props
  const seccionActivaId = hitoActivo === null ? (seccionActiva?.seccionId ?? null) : null
  const esPreview = modo === "preview"
  const muestraPanelContexto = !esPreview && avance !== undefined
  const grid = muestraPanelContexto
    ? "grid flex-1 grid-cols-[280px_minmax(0,1fr)_320px] overflow-hidden"
    : "grid flex-1 grid-cols-[280px_minmax(0,1fr)] overflow-hidden"

  return (
    <div className="nx-motion-immersive flex h-screen flex-col bg-canvas">
      <TopbarInmersivo
        cursoId={arbol.curso.id}
        cursoTitulo={arbol.curso.titulo}
        clienteNombre={arbol.curso.cliente.nombre}
        areaPrincipal={arbol.curso.areaPrincipal}
        porcentajeAvance={avance?.porcentajeAvance ?? null}
        estaCerrado={avance?.estaCerrado ?? false}
        etiquetaCualitativaFinal={avance?.etiquetaCualitativaFinal ?? null}
        atenuado={modoFocus}
      />
      <div className={grid}>
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
          seccionesAbiertasIds={avance?.seccionesAbiertasIds ?? []}
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
        {muestraPanelContexto && avance ? (
          <PanelContexto
            avance={avance}
            transversal={transversal}
            entrevistaIa={entrevistaIa}
            seccionActivaId={seccionActivaId}
            onIrASiguiente={onSeleccionarSeccion}
            onAbrirHito={onAbrirHito}
            atenuado={modoFocus}
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
