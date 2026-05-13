import type { TipoBloque } from "@nexott-learn/shared-types"
import {
  Code2,
  FileText,
  FlaskConical,
  HelpCircle,
  Lightbulb,
  type LucideIcon,
  Paperclip,
  Terminal,
  Video,
} from "lucide-react"

interface TipoBloqueMeta {
  readonly etiqueta: string
  readonly icono: LucideIcon
  readonly descripcionCorta: string
}

// Claves en SCREAMING_SNAKE_CASE porque deben coincidir con el enum TipoBloque de Prisma.
// Un biome-ignore por clave es inevitable — las claves son dictadas por el tipo externo.
const META: Record<TipoBloque, TipoBloqueMeta> = {
  // biome-ignore lint/style/useNamingConvention: clave del enum TipoBloque
  PARRAFO: {
    etiqueta: "Lectura",
    icono: FileText,
    descripcionCorta: "Texto rico con código, listas, imágenes y tablas.",
  },
  // biome-ignore lint/style/useNamingConvention: clave del enum TipoBloque
  TIP: {
    etiqueta: "Tip",
    icono: Lightbulb,
    descripcionCorta: "Llamada al margen: info, advertencia o éxito.",
  },
  // biome-ignore lint/style/useNamingConvention: clave del enum TipoBloque
  VIDEO: {
    etiqueta: "Vídeo",
    icono: Video,
    descripcionCorta: "Embebido externo (YouTube, Vimeo, Loom).",
  },
  // biome-ignore lint/style/useNamingConvention: clave del enum TipoBloque
  RECURSO: {
    etiqueta: "Recurso",
    icono: Paperclip,
    descripcionCorta: "Enlace externo o archivo adjunto de apoyo.",
  },
  // biome-ignore lint/style/useNamingConvention: clave del enum TipoBloque
  QUIZ: {
    etiqueta: "Quiz",
    icono: HelpCircle,
    descripcionCorta: "Preguntas de selección con auto-corrección.",
  },
  // biome-ignore lint/style/useNamingConvention: clave del enum TipoBloque
  CODIGO_ILUSTRATIVO: {
    etiqueta: "Código ilustrativo",
    icono: Code2,
    descripcionCorta: "Snippet de código sin evaluar.",
  },
  // biome-ignore lint/style/useNamingConvention: clave del enum TipoBloque
  CODIGO_PREGUNTAS: {
    etiqueta: "Reto de código",
    icono: Terminal,
    descripcionCorta: "Enunciado de un reto de programación.",
  },
  // biome-ignore lint/style/useNamingConvention: clave del enum TipoBloque
  CODIGO_TESTS: {
    etiqueta: "Tests del reto",
    icono: FlaskConical,
    descripcionCorta: "Tests automáticos asociados a un reto.",
  },
}

export function tipoBloqueMeta(tipo: TipoBloque): TipoBloqueMeta {
  return META[tipo]
}

export function tiposBloqueOrdenados(): readonly TipoBloque[] {
  return [
    "PARRAFO",
    "TIP",
    "VIDEO",
    "RECURSO",
    "QUIZ",
    "CODIGO_ILUSTRATIVO",
    "CODIGO_PREGUNTAS",
    "CODIGO_TESTS",
  ]
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: switch exhaustivo sobre todos los TipoBloque — la complejidad es inherente al dominio, no reducible sin perder claridad
export function resumenBloque(
  tipo: TipoBloque,
  contenido: Record<string, unknown> | null | undefined,
): string {
  const meta = META[tipo]
  if (!contenido) {
    return meta.etiqueta
  }
  switch (tipo) {
    case "PARRAFO": {
      const txt = typeof contenido.textoPlano === "string" ? contenido.textoPlano : ""
      return txt.trim().slice(0, 120) || meta.etiqueta
    }
    case "TIP": {
      const html = typeof contenido.html === "string" ? contenido.html : ""
      const txt = html.replace(/<[^>]+>/g, " ").trim()
      return txt.slice(0, 120) || meta.etiqueta
    }
    case "VIDEO": {
      const url = typeof contenido.url === "string" ? contenido.url : ""
      return url || meta.etiqueta
    }
    case "RECURSO": {
      const titulo = typeof contenido.titulo === "string" ? contenido.titulo : ""
      return titulo || meta.etiqueta
    }
    case "QUIZ": {
      const preguntas = Array.isArray(contenido.preguntas) ? contenido.preguntas.length : 0
      return `${preguntas} pregunta${preguntas === 1 ? "" : "s"}`
    }
    case "CODIGO_ILUSTRATIVO":
    case "CODIGO_PREGUNTAS":
    case "CODIGO_TESTS": {
      const lenguaje = typeof contenido.lenguaje === "string" ? contenido.lenguaje : ""
      const enunciado = typeof contenido.enunciado === "string" ? contenido.enunciado : ""
      const descripcion = typeof contenido.descripcion === "string" ? contenido.descripcion : ""
      const resumen = enunciado || descripcion
      const head = lenguaje ? `${lenguaje}: ` : ""
      return resumen ? `${head}${resumen.slice(0, 110)}` : meta.etiqueta
    }
    default:
      return meta.etiqueta
  }
}
