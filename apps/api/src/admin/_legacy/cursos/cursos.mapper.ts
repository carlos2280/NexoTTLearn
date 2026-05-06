import type {
  CursoAdminDetalle,
  CursoAdminItem,
  CursoStatus,
  CursoTipoPeso as CursoTipoPesoApi,
} from "@nexott-learn/shared-types"
import type { EstadoCurso, NivelCurso } from "@prisma/client"
import { ICON_COLORS, ICON_INITIALS_MAX, PALABRAS_REGEX } from "./cursos.types"

// Forma minima del registro Prisma que el mapper necesita. Tipar la entrada
// asi (en lugar de Curso completo) deja claro que selects son requeridos en
// el service y previene leer campos no incluidos.
export type CursoAdminRow = {
  id: string
  titulo: string
  slug: string
  descripcion: string | null
  estado: EstadoCurso
  _count: {
    modulos: number
    inscripciones: number
  }
  inscripciones: ReadonlyArray<{
    progresoCurso: { estado: string } | null
  }>
}

/**
 * Convierte el enum Prisma EstadoCurso al status que entiende el frontend.
 * Usar switch en lugar de Record para no chocar con la regla de
 * useNamingConvention (las claves UPPER_SNAKE del enum no son camelCase).
 */
function mapEstadoAStatus(estado: EstadoCurso): CursoStatus {
  switch (estado) {
    case "PUBLICADO":
      return "published"
    case "DESHABILITADO":
      return "disabled"
    default:
      return "draft"
  }
}

/**
 * Convierte una fila Prisma de Curso (con counts e inscripciones) en el item
 * que consume el frontend. Funcion pura, sin efectos — facil de testear.
 */
export function mapCursoARow(row: CursoAdminRow): CursoAdminItem {
  return {
    id: row.id,
    slug: row.slug,
    title: row.titulo,
    description: row.descripcion ?? undefined,
    iconInitials: derivarIniciales(row.titulo),
    iconColor: derivarColor(row.titulo),
    modules: row._count.modulos,
    status: mapEstadoAStatus(row.estado),
    participantsCount: row._count.inscripciones,
    completionRate: calcularCompletionRate(row.inscripciones),
  }
}

// Forma minima del registro Prisma necesaria para construir el detalle del
// curso (vista AD03). Extiende los campos de la lista con los del tab General:
// nivel, estado BD, y los tres umbrales de logro.
export type CursoAdminDetalleRow = CursoAdminRow & {
  nivel: NivelCurso
  umbralExcelencia: number
  umbralAprobado: number
  umbralEnDesarrollo: number
  tipoPesos: ReadonlyArray<{ tipo: string; peso: number; nivel: string }>
}

/**
 * Convierte una fila Prisma de Curso al detalle completo que consume el
 * formulario de edicion del admin. Reusa la base de mapCursoARow y agrega los
 * campos del tab General (nivel, umbrales, estado BD nativo) mas los pesos
 * (decision P3.1).
 */
export function mapCursoADetalle(row: CursoAdminDetalleRow): CursoAdminDetalle {
  return {
    ...mapCursoARow(row),
    nivel: row.nivel,
    estado: row.estado,
    umbralExcelencia: row.umbralExcelencia,
    umbralAprobado: row.umbralAprobado,
    umbralEnDesarrollo: row.umbralEnDesarrollo,
    tipoPesos: row.tipoPesos.map(mapTipoPeso),
  }
}

// Mapea una fila de la tabla `curso_tipo_pesos` al shape del shared-types.
// `activo = peso > 0` se deriva aqui (no se persiste) para que el toggle del
// formulario lea el valor sin recalcularlo en el front.
function mapTipoPeso(row: { tipo: string; peso: number; nivel: string }): CursoTipoPesoApi {
  // Cast a los enums de shared-types: el service garantiza que las filas
  // creadas desde el endpoint son validas. Filas legacy con tipo/nivel fuera
  // del enum se filtrarian aqui en lugar de explotar al validar la respuesta.
  return {
    tipo: row.tipo as CursoTipoPesoApi["tipo"],
    peso: row.peso,
    nivel: row.nivel as CursoTipoPesoApi["nivel"],
    activo: row.peso > 0,
  }
}

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

// TODO(schema): cuando se agregue columna `iconInitials` al modelo Curso,
// leer de BD y eliminar este helper.
function derivarIniciales(titulo: string): string {
  const limpio = titulo.trim()
  if (limpio.length === 0) {
    return "??"
  }
  // Toma la primera letra de hasta dos palabras significativas.
  const palabras = limpio.split(PALABRAS_REGEX).filter((p) => p.length > 1)
  if (palabras.length >= 2) {
    const ini = palabras[0]?.[0] ?? ""
    const fin = palabras[1]?.[0] ?? ""
    return (ini + fin).toUpperCase().slice(0, ICON_INITIALS_MAX)
  }
  return limpio.slice(0, ICON_INITIALS_MAX).toUpperCase()
}

// TODO(schema): cuando se agregue columna `iconColor` al modelo Curso,
// leer de BD y eliminar este helper.
function derivarColor(titulo: string): CursoAdminItem["iconColor"] {
  // Hash deterministico simple: misma cadena -> mismo color siempre.
  // No criptografico, solo distribucion estable entre los 6 colores.
  let hash = 0
  for (let i = 0; i < titulo.length; i += 1) {
    hash = (hash * 31 + titulo.charCodeAt(i)) | 0
  }
  const indice = Math.abs(hash) % ICON_COLORS.length
  // Acceso seguro: indice esta en rango por el modulo, pero TS necesita el cast.
  return ICON_COLORS[indice] as CursoAdminItem["iconColor"]
}

function calcularCompletionRate(
  inscripciones: ReadonlyArray<{ progresoCurso: { estado: string } | null }>,
): number {
  if (inscripciones.length === 0) {
    return 0
  }
  const completados = inscripciones.filter((i) => i.progresoCurso?.estado === "COMPLETADO").length
  return Math.round((completados / inscripciones.length) * 100)
}
