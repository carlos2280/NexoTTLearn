import { Button } from "@/shared/components/ui/button"
import { RUTAS } from "@/shared/constants/rutas"
import type { ResultadoCierreVisible, SiguienteAccion } from "@nexott-learn/shared-types"
import {
  ArrowRight,
  Award,
  Clock,
  Compass,
  type LucideIcon,
  RotateCcw,
  Sparkles,
} from "lucide-react"
import { useNavigate } from "react-router-dom"

interface BandaSiguientePasoProps {
  readonly siguienteAccion: SiguienteAccion | null
  readonly nombreUsuario: string
  readonly saludo: string
}

/**
 * Banda cumbre de la bandeja (doc 02_mi_bandeja §4.2). Una sola jerarquía por
 * pantalla (manifiesto ley 02): este bloque domina visualmente las demás
 * bandas. La atmósfera modula según el momento del producto:
 *
 *  - Cumbre  → aurora (transversal/entrevista disponibles, APTO/COMPLETADO).
 *  - Urgencia → warmth + danger (deadline crítico, caso reabierto, NO_APTO).
 *  - Rutina  → surface plano (continuar, asignación nueva, voluntariado).
 */
export function BandaSiguientePaso({
  siguienteAccion,
  nombreUsuario,
  saludo,
}: BandaSiguientePasoProps) {
  const navigate = useNavigate()
  const titulo = nombreUsuario ? `${saludo}, ${nombreUsuario}.` : `${saludo}.`

  return (
    <section aria-labelledby="siguiente-paso-titulo" className="flex flex-col gap-5">
      <h1 id="siguiente-paso-titulo" className="text-display-md text-text-primary">
        {titulo}
      </h1>
      <CartaSiguienteAccion siguienteAccion={siguienteAccion} navigate={navigate} />
    </section>
  )
}

interface CartaProps {
  readonly siguienteAccion: SiguienteAccion | null
  readonly navigate: ReturnType<typeof useNavigate>
}

function CartaSiguienteAccion({ siguienteAccion, navigate }: CartaProps) {
  if (siguienteAccion === null) {
    return (
      <article className="flex flex-col gap-4 rounded-2xl border border-border border-dashed bg-canvas p-7">
        <span className="nx-eyebrow text-text-tertiary">Aún sin actividad</span>
        <h2 className="text-h2 text-text-primary">No tienes cursos asignados todavía.</h2>
        <p className="max-w-prose text-body text-text-secondary">
          Cuando el administrador te asigne uno, lo verás aquí. Mientras tanto, puedes inscribirte
          por tu cuenta a los cursos abiertos.
        </p>
        <div className="mt-2">
          <Button onClick={() => navigate(RUTAS.participante.catalogo)}>
            <Compass className="mr-2 h-4 w-4" aria-hidden={true} /> Explorar catálogo
          </Button>
        </div>
      </article>
    )
  }

  const copy = obtenerCopy(siguienteAccion)
  return <CartaPorAtmosfera copy={copy} navigate={navigate} />
}

type Atmosfera = "aurora" | "urgencia" | "rutina"

interface CopySiguiente {
  readonly atmosfera: Atmosfera
  readonly eyebrow: string
  readonly titulo: string
  readonly descripcion: string
  readonly cta: string
  readonly ruta: string
  readonly icono: LucideIcon
  readonly porQueAqui: string
}

function CartaPorAtmosfera({
  copy,
  navigate,
}: { readonly copy: CopySiguiente; readonly navigate: ReturnType<typeof useNavigate> }) {
  if (copy.atmosfera === "aurora") {
    return (
      <article
        className="relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-accent/20 p-7"
        style={{
          background: "var(--gradient-card-acento)",
          boxShadow: "var(--shadow-card-elevated)",
        }}
      >
        <HaloAurora />
        <div className="relative flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <copy.icono className="h-4 w-4 text-aurora-violet" aria-hidden={true} />
            <span className="nx-eyebrow text-aurora-violet">{copy.eyebrow}</span>
          </div>
          <h2 className="text-display-md text-text-primary leading-tight">{copy.titulo}</h2>
          <p className="max-w-prose text-body text-text-secondary">{copy.descripcion}</p>
          <div className="mt-2 flex items-center gap-3">
            <Button variant="aurora" onClick={() => navigate(copy.ruta)}>
              {copy.cta} <ArrowRight className="ml-2 h-4 w-4" aria-hidden={true} />
            </Button>
            <span className="text-caption text-text-tertiary">{copy.porQueAqui}</span>
          </div>
        </div>
      </article>
    )
  }

  if (copy.atmosfera === "urgencia") {
    return (
      <article
        className="relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-warmth/40 bg-surface p-7"
        style={{ boxShadow: "var(--shadow-card-elevated)" }}
      >
        <span aria-hidden={true} className="absolute inset-y-0 left-0 w-1 bg-warmth" />
        <div className="flex items-center gap-2">
          <copy.icono className="h-4 w-4 text-warmth" aria-hidden={true} />
          <span className="nx-eyebrow text-warmth">{copy.eyebrow}</span>
        </div>
        <h2 className="text-h1 text-text-primary leading-tight">{copy.titulo}</h2>
        <p className="max-w-prose text-body text-text-secondary">{copy.descripcion}</p>
        <div className="mt-2 flex items-center gap-3">
          <Button onClick={() => navigate(copy.ruta)}>
            {copy.cta} <ArrowRight className="ml-2 h-4 w-4" aria-hidden={true} />
          </Button>
          <span className="text-caption text-text-tertiary">{copy.porQueAqui}</span>
        </div>
      </article>
    )
  }

  return (
    <article
      className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-7"
      style={{ boxShadow: "var(--shadow-card-resting)" }}
    >
      <div className="flex items-center gap-2">
        <copy.icono className="h-4 w-4 text-text-tertiary" aria-hidden={true} />
        <span className="nx-eyebrow text-text-tertiary">{copy.eyebrow}</span>
      </div>
      <h2 className="text-h1 text-text-primary leading-tight">{copy.titulo}</h2>
      <p className="max-w-prose text-body text-text-secondary">{copy.descripcion}</p>
      <div className="mt-2 flex items-center gap-3">
        <Button onClick={() => navigate(copy.ruta)}>
          {copy.cta} <ArrowRight className="ml-2 h-4 w-4" aria-hidden={true} />
        </Button>
        <span className="text-caption text-text-tertiary">{copy.porQueAqui}</span>
      </div>
    </article>
  )
}

function HaloAurora() {
  return (
    <div
      aria-hidden={true}
      className="-top-24 -right-24 pointer-events-none absolute h-56 w-56 rounded-full opacity-40 blur-3xl"
      style={{ background: "var(--gradient-aurora-soft)" }}
    />
  )
}

function obtenerCopy(accion: SiguienteAccion): CopySiguiente {
  switch (accion.tipo) {
    case "CASO_REABIERTO":
      return {
        atmosfera: "urgencia",
        eyebrow: "Tu caso fue reabierto",
        titulo: accion.cursoTitulo,
        descripcion: accion.motivo
          ? `Motivo registrado por el administrador: «${accion.motivo}». Revisa y completa lo necesario para volver a cerrarlo.`
          : "El administrador reabrió tu caso. Revisa el curso y completa lo necesario para volver a cerrarlo.",
        cta: "Abrir curso",
        ruta: RUTAS.participante.cursoDetalle(accion.cursoId),
        icono: RotateCcw,
        porQueAqui: "Reapertura reciente · requiere tu atención.",
      }
    case "RESULTADO_CIERRE_LISTO":
      return obtenerCopyResultadoCierre(accion)
    case "ENTREVISTA_IA_DISPONIBLE":
      return {
        atmosfera: "aurora",
        eyebrow: "Entrevista IA disponible",
        titulo: "Tu último paso te espera.",
        descripcion: `Completaste todo lo previo de «${accion.cursoTitulo}». Cuando estés listo, simulamos la entrevista del cliente y cerramos el curso.`,
        cta: "Empezar entrevista",
        ruta: RUTAS.participante.cursoDetalle(accion.cursoId),
        icono: Sparkles,
        porQueAqui: "Plan y transversal aprobados.",
      }
    case "TRANSVERSAL_DISPONIBLE":
      return {
        atmosfera: "aurora",
        eyebrow: "Transversal disponible",
        titulo: "Hora del proyecto integrador.",
        descripcion: `Completaste el plan de «${accion.cursoTitulo}». Entrega el repo cuando estés listo: lo evaluamos en tres capas.`,
        cta: "Abrir transversal",
        ruta: RUTAS.participante.cursoDetalle(accion.cursoId),
        icono: Sparkles,
        porQueAqui: "Plan personal completado.",
      }
    case "DEADLINE_CRITICO":
      return {
        atmosfera: "urgencia",
        eyebrow: textoDeadlineEyebrow(accion.diasRestantes),
        titulo: accion.cursoTitulo,
        descripcion: `Llevas ${accion.porcentajeAvance}% de avance y el deadline está cerca. Vuelve y avanza un poco hoy.`,
        cta: "Continuar curso",
        ruta: RUTAS.participante.cursoDetalle(accion.cursoId),
        icono: Clock,
        porQueAqui: "Deadline próximo · avance bajo el 80%.",
      }
    case "ASIGNACION_NUEVA":
      return {
        atmosfera: "rutina",
        eyebrow: "Tienes un curso nuevo",
        titulo: accion.cursoTitulo,
        descripcion:
          "El administrador te asignó este curso. Échale un vistazo y haz tu primera sección — la inercia ayuda.",
        cta: "Empezar",
        ruta: RUTAS.participante.cursoDetalle(accion.cursoId),
        icono: Sparkles,
        porQueAqui: "Asignación reciente sin iniciar.",
      }
    case "CONTINUAR_CURSO":
      return {
        atmosfera: "rutina",
        eyebrow: "Tu siguiente paso",
        titulo: accion.cursoTitulo,
        descripcion: `Continúa desde donde lo dejaste. Llevas ${accion.porcentajeAvance}% de avance.`,
        cta: "Continuar",
        ruta: RUTAS.participante.cursoDetalle(accion.cursoId),
        icono: ArrowRight,
        porQueAqui: "Curso activo con deadline más cercano.",
      }
    case "EXPLORAR_VOLUNTARIADO":
      return {
        atmosfera: "rutina",
        eyebrow: "Sin asignaciones activas",
        titulo: "Aprende algo por tu cuenta.",
        descripcion: `Hay ${accion.totalCursosAbiertos} curso${accion.totalCursosAbiertos === 1 ? "" : "s"} abierto${accion.totalCursosAbiertos === 1 ? "" : "s"} a voluntariado. Lo que demuestres queda en tu ficha de skills.`,
        cta: "Explorar catálogo",
        ruta: RUTAS.participante.catalogo,
        icono: Compass,
        porQueAqui: "Ahora mismo no tienes cursos asignados.",
      }
    default: {
      const _exhaustivo: never = accion
      throw new Error(`SiguienteAccion no manejada: ${JSON.stringify(_exhaustivo)}`)
    }
  }
}

function obtenerCopyResultadoCierre(accion: {
  readonly cursoId: string
  readonly cursoTitulo: string
  readonly resultado: ResultadoCierreVisible
}): CopySiguiente {
  if (accion.resultado === "APTO") {
    return {
      atmosfera: "aurora",
      eyebrow: "Apto · curso cerrado",
      titulo: "Listo para presentarte al cliente.",
      descripcion: `Cerraste «${accion.cursoTitulo}» como APTO. La consultora decide si te presenta a la entrevista real.`,
      cta: "Ver resultado",
      ruta: RUTAS.participante.cursoDetalle(accion.cursoId),
      icono: Award,
      porQueAqui: "Cierre reciente como APTO.",
    }
  }
  if (accion.resultado === "COMPLETADO") {
    return {
      atmosfera: "aurora",
      eyebrow: "Curso completado",
      titulo: "Lo que aprendiste quedó en tu ficha.",
      descripcion: `Terminaste «${accion.cursoTitulo}» como voluntario. Las skills demostradas suman a tu ficha personal.`,
      cta: "Ver resultado",
      ruta: RUTAS.participante.cursoDetalle(accion.cursoId),
      icono: Award,
      porQueAqui: "Cierre reciente como voluntario.",
    }
  }
  return {
    atmosfera: "rutina",
    eyebrow: "No apto · curso cerrado",
    titulo: accion.cursoTitulo,
    descripcion:
      "El curso cerró con resultado no apto. Revisa observaciones y áreas a reforzar; el administrador puede reabrir tu caso si conviene.",
    cta: "Ver detalle",
    ruta: RUTAS.participante.cursoDetalle(accion.cursoId),
    icono: RotateCcw,
    porQueAqui: "Cierre reciente como NO APTO.",
  }
}

function textoDeadlineEyebrow(dias: number): string {
  if (dias < 0) {
    return `Deadline vencido hace ${Math.abs(dias)} día${Math.abs(dias) === 1 ? "" : "s"}`
  }
  if (dias === 0) {
    return "Deadline hoy"
  }
  if (dias === 1) {
    return "Queda 1 día"
  }
  return `Quedan ${dias} días`
}
