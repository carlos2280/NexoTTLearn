import { RUTAS } from "@/shared/constants/rutas"
import type { TipoEventoNotif } from "@nexott-learn/shared-types"

/**
 * Tono visual del item de notificacion. Mapea al sistema de feedback
 * semantico de la identidad (capa 3 — feedback, no marca ni accion).
 */
export type TonoNotif = "neutral" | "info" | "warning"

export interface CopyNotif {
  readonly titulo: string
  readonly subtitulo?: (payload: Record<string, unknown>) => string | null
  readonly cta: {
    readonly texto: string
    /**
     * Devuelve `null` si el payload no trae lo necesario para navegar (ej.
     * cursoId ausente). En ese caso el item queda sin CTA — sigue siendo
     * marcable como leida/archivada.
     */
    readonly ruta: (payload: Record<string, unknown>) => string | null
  }
  readonly tono: TonoNotif
}

function leerString(payload: Record<string, unknown>, clave: string): string | null {
  const valor = payload[clave]
  return typeof valor === "string" && valor.length > 0 ? valor : null
}

function rutaCurso(payload: Record<string, unknown>): string | null {
  const cursoId = leerString(payload, "cursoId")
  return cursoId ? RUTAS.participante.cursoDetalle(cursoId) : null
}

function subtituloCurso(payload: Record<string, unknown>): string | null {
  const titulo = leerString(payload, "cursoTitulo")
  return titulo ? `Curso: ${titulo}` : null
}

/**
 * Catalogo D88 — copy + cta + tono por tipo de evento. `ReadonlyMap` (no
 * `Record`) porque las keys son SCREAMING_SNAKE y Biome flag-ea naming
 * convention; el `Map` con literales no entra en esa regla.
 */
export const COPY_NOTIFICACION: ReadonlyMap<TipoEventoNotif, CopyNotif> = new Map([
  // Participante — criticos
  [
    "ASIGNACION_CURSO",
    {
      titulo: "Se te asignó un curso nuevo",
      subtitulo: subtituloCurso,
      cta: { texto: "Ver curso", ruta: rutaCurso },
      tono: "info",
    },
  ],
  [
    "CASO_REABIERTO",
    {
      titulo: "Tu caso fue reabierto",
      subtitulo: subtituloCurso,
      cta: { texto: "Ver", ruta: rutaCurso },
      tono: "warning",
    },
  ],
  [
    "RESULTADO_CIERRE",
    {
      titulo: "Hay un veredicto en tu curso",
      subtitulo: subtituloCurso,
      cta: { texto: "Ver veredicto", ruta: rutaCurso },
      tono: "info",
    },
  ],
  // Participante — informativos
  [
    "TRANSVERSAL_DISPONIBLE",
    {
      titulo: "Tu transversal está disponible",
      subtitulo: subtituloCurso,
      cta: { texto: "Empezar", ruta: rutaCurso },
      tono: "info",
    },
  ],
  [
    "ENTREVISTA_IA_DISPONIBLE",
    {
      titulo: "Desbloqueaste la entrevista IA",
      subtitulo: subtituloCurso,
      cta: { texto: "Iniciar", ruta: rutaCurso },
      tono: "info",
    },
  ],
  [
    "RECORDATORIO_DEADLINE",
    {
      titulo: "Tienes un deadline cerca",
      subtitulo: subtituloCurso,
      cta: { texto: "Ver curso", ruta: rutaCurso },
      tono: "warning",
    },
  ],
  [
    "PLAN_RECALCULADO",
    {
      titulo: "Tu plan de estudio se recalculó",
      subtitulo: subtituloCurso,
      cta: { texto: "Ver plan", ruta: rutaCurso },
      tono: "neutral",
    },
  ],
  [
    "CURSO_DEADLINE",
    {
      titulo: "Tu curso tiene una fecha nueva",
      subtitulo: subtituloCurso,
      cta: { texto: "Ver curso", ruta: rutaCurso },
      tono: "neutral",
    },
  ],
  // Admin — criticos
  [
    "EXCEL_CARGADO",
    {
      titulo: "La carga del Excel terminó",
      cta: { texto: "Ver resultado", ruta: () => RUTAS.admin.personas },
      tono: "info",
    },
  ],
  [
    "MODULO_HUERFANO_SKILL",
    {
      titulo: "Hay un módulo sin skill",
      cta: { texto: "Revisar catálogo", ruta: () => RUTAS.admin.catalogo },
      tono: "warning",
    },
  ],
  // Admin — informativos
  [
    "COLABORADOR_LISTO",
    {
      titulo: "Un colaborador completó su evaluación",
      cta: { texto: "Ver personas", ruta: () => RUTAS.admin.personas },
      tono: "info",
    },
  ],
  [
    "PLANES_DESACTUALIZADOS",
    {
      titulo: "Hay planes que requieren recalculo",
      cta: { texto: "Ver cursos", ruta: () => RUTAS.admin.cursos },
      tono: "warning",
    },
  ],
  [
    "CENTRO_REVISION",
    {
      titulo: "Hay items pendientes de revisión",
      cta: { texto: "Ir al centro", ruta: () => RUTAS.admin.inicio },
      tono: "neutral",
    },
  ],
])

/**
 * Atajo defensivo para tipos que pueda enviar el backend que aun no esten
 * mapeados (catalogo crece). Devuelve un copy minimo con titulo legible.
 */
export function copyParaTipo(tipo: TipoEventoNotif): CopyNotif {
  return (
    COPY_NOTIFICACION.get(tipo) ?? {
      titulo: tipo.toLowerCase().replace(/_/g, " "),
      cta: { texto: "Ver", ruta: () => null },
      tono: "neutral",
    }
  )
}
