import { RUTAS } from "@/shared/constants/rutas"
import type { ResultadoCierreVisible } from "@nexott-learn/shared-types"
import { ArrowRight, Award, Clock, Compass, HourglassIcon, RotateCcw, Sparkles } from "lucide-react"
import type { CopySiguiente, SiguienteAccionConRevision } from "../types"

export interface ContextoAreaCurso {
  readonly areaCodigo: string | null
  readonly areaNombre: string | null
}

/**
 * Mapeo puro `SiguienteAccion → copy + atmósfera + variante de CTA`.
 *
 * El `contextoArea` opcional viene del page (busca el área principal del
 * `cursoId` destino en `cursosActivos`). Enriquece el copy con eyebrow
 * `ÁREA · CURSO` y barra superior en color del área. Si la acción no
 * apunta a un curso (EXPLORAR_VOLUNTARIADO) o el curso no se encuentra,
 * el copy se devuelve sin firma de área.
 *
 * Reglas del el_viaje_colaborador.md (pantalla 01, bloque 1):
 *  - **Aurora solo en culminaciones** (APTO / COMPLETADO). Resto, índigo
 *    o secondary. Aurora no es atmósfera por defecto.
 *  - Deadline crítico usa warmth (urgencia honesta, sin pánico visual).
 *  - Esperando revisión es atmósfera calmada + CTA ghost.
 *  - Sin emojis, sin "¡Genial!", sin microcopy gamificado.
 */
export function obtenerCopy(
  accion: SiguienteAccionConRevision,
  contextoArea?: ContextoAreaCurso,
): CopySiguiente {
  const base = obtenerCopyBase(accion)
  if (accion.tipo === "EXPLORAR_VOLUNTARIADO" || !contextoArea?.areaCodigo) {
    return base
  }
  return {
    ...base,
    areaCodigo: contextoArea.areaCodigo,
    areaNombre: contextoArea.areaNombre,
    cursoTituloEyebrow: "cursoTitulo" in accion ? accion.cursoTitulo : null,
  }
}

function obtenerCopyBase(accion: SiguienteAccionConRevision): CopySiguiente {
  switch (accion.tipo) {
    case "CASO_REABIERTO":
      return {
        atmosfera: "rutina",
        ctaVariant: "primary",
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
        atmosfera: "rutina",
        ctaVariant: "primary",
        eyebrow: "Entrevista de simulacro",
        titulo: "Tu último paso te espera.",
        descripcion: `Completaste todo lo previo de «${accion.cursoTitulo}». Práctica, no examen: simulamos la entrevista del cliente y cerramos el curso.`,
        cta: "Empezar entrevista",
        ruta: RUTAS.participante.cursoDetalle(accion.cursoId),
        icono: Sparkles,
        porQueAqui: "Plan y transversal aprobados.",
      }
    case "TRANSVERSAL_DISPONIBLE":
      return {
        atmosfera: "rutina",
        ctaVariant: "primary",
        eyebrow: "Proyecto integrador disponible",
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
        ctaVariant: "primary",
        eyebrow: textoDeadlineEyebrow(accion.diasRestantes),
        titulo: accion.cursoTitulo,
        descripcion: `Llevas ${Math.round(accion.porcentajeAvance)}% de avance y el deadline está cerca. Vuelve y avanza un poco hoy.`,
        cta: "Continuar curso",
        ruta: RUTAS.participante.cursoDetalle(accion.cursoId),
        icono: Clock,
        porQueAqui: "Deadline próximo · avance bajo el 80%.",
      }
    case "ASIGNACION_NUEVA":
      return {
        atmosfera: "rutina",
        ctaVariant: "primary",
        eyebrow: "Curso nuevo asignado",
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
        ctaVariant: "primary",
        eyebrow: "Sigue donde lo dejaste",
        titulo: accion.siguienteSeccionTitulo ?? accion.cursoTitulo,
        descripcion: `Continúa con «${accion.cursoTitulo}». Llevas ${Math.round(accion.porcentajeAvance)}% de avance.`,
        cta: "Continuar",
        ruta: RUTAS.participante.cursoDetalle(accion.cursoId),
        icono: ArrowRight,
        porQueAqui: "Curso activo con deadline más cercano.",
      }
    case "EXPLORAR_VOLUNTARIADO":
      return {
        atmosfera: "rutina",
        ctaVariant: "secondary",
        eyebrow: "Explora cursos abiertos",
        titulo: "Aprende algo por tu cuenta.",
        descripcion: `Hay ${accion.totalCursosAbiertos} curso${accion.totalCursosAbiertos === 1 ? "" : "s"} abierto${accion.totalCursosAbiertos === 1 ? "" : "s"} a voluntariado. Lo que demuestres queda en tu ficha de skills.`,
        cta: "Explorar catálogo",
        ruta: RUTAS.participante.catalogo,
        icono: Compass,
        porQueAqui: "Ahora mismo no tienes cursos asignados.",
      }
    case "ESPERANDO_REVISION":
      return {
        atmosfera: "calmada",
        ctaVariant: "ghost",
        eyebrow: "Esperando revisión",
        titulo: accion.cursoTitulo,
        descripcion:
          accion.enRevision === "transversal"
            ? "Tu proyecto transversal está en revisión. Te avisaremos en cuanto tengamos el veredicto."
            : "Tu entrevista IA está en revisión. Te avisaremos en cuanto tengamos el veredicto.",
        cta: "Ver curso",
        ruta: RUTAS.participante.cursoDetalle(accion.cursoId),
        icono: HourglassIcon,
        porQueAqui: "En manos del evaluador · sin acción tuya pendiente.",
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
      ctaVariant: "aurora",
      eyebrow: "Curso completado",
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
      ctaVariant: "aurora",
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
    ctaVariant: "secondary",
    eyebrow: "Resultado disponible",
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
    return "Te queda hoy"
  }
  if (dias === 1) {
    return "Te queda 1 día"
  }
  return `Te quedan ${dias} días`
}
