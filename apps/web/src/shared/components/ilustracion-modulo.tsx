import { cn } from "@/shared/lib/cn"
import type { ReactElement } from "react"

/**
 * Ilustraciones hero por módulo — SVG mono-trazo en aurora-violet.
 *
 * Filosofía: trazo limpio, geometría calmada, currentColor para que el
 * wrapper decida el color (manifiesto §05 — tokens). Tamaño base 96x96
 * para coincidir con el header editorial; se escala vía className.
 *
 * Mapeo `tituloModulo` → tema por keywords. Si no matchea ningún tema,
 * el componente devuelve null (no rompe). Añadir un módulo nuevo: añadir
 * keyword en `detectarTema` y entrada en `SVG_POR_TEMA`.
 */

type TemaModulo =
  | "bienvenida"
  | "git"
  | "web"
  | "javascript"
  | "typescript"
  | "react-base"
  | "react-datos"
  | "ia"
  | "cierre"

interface IlustracionModuloProps {
  readonly tituloModulo: string
  readonly className?: string
}

export function IlustracionModulo({ tituloModulo, className }: IlustracionModuloProps) {
  const tema = detectarTema(tituloModulo)
  if (!tema) {
    return null
  }
  const Svg = SVG_POR_TEMA[tema]
  return (
    <Svg aria-hidden={true} className={cn("h-14 w-14 shrink-0 text-aurora-violet", className)} />
  )
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: matcher por keywords; cada rama es una palabra, partirlo en helpers sólo dispersa el mapping.
function detectarTema(titulo: string): TemaModulo | null {
  const t = titulo.toLowerCase()
  if (t.includes("bienvenida") || t.includes("pánico") || t.includes("panico")) {
    if (t.includes("git")) {
      return "git"
    }
    return "bienvenida"
  }
  if (t.includes("git")) {
    return "git"
  }
  if (t.includes("web") && (t.includes("dentro") || t.includes("html") || t.includes("css"))) {
    return "web"
  }
  if (t.includes("typescript")) {
    return "typescript"
  }
  if (t.includes("javascript")) {
    return "javascript"
  }
  if (t.includes("react") && (t.includes("datos") || t.includes("servidor"))) {
    return "react-datos"
  }
  if (t.includes("react")) {
    return "react-base"
  }
  if (t.includes("ia ") || t.includes("copiloto") || t.includes("inteligencia artificial")) {
    return "ia"
  }
  if (
    t.includes("entrega") ||
    t.includes("calidad") ||
    t.includes("cierre") ||
    t.includes("proyecto")
  ) {
    return "cierre"
  }
  return null
}

interface SvgProps {
  readonly className?: string
  readonly "aria-hidden"?: boolean
}

const COMUN_PROPS = {
  viewBox: "0 0 96 96",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
}

function SvgBienvenida(props: SvgProps) {
  return (
    // biome-ignore lint/a11y/noSvgWithoutTitle: ilustración decorativa; el wrapper pasa aria-hidden.
    <svg {...COMUN_PROPS} {...props}>
      <circle cx="48" cy="48" r="34" opacity="0.35" />
      <circle cx="48" cy="48" r="22" />
      <circle cx="48" cy="26" r="3.5" fill="currentColor" stroke="none" />
      <circle cx="48" cy="48" r="2" fill="currentColor" stroke="none" />
    </svg>
  )
}

function SvgGit(props: SvgProps) {
  return (
    // biome-ignore lint/a11y/noSvgWithoutTitle: ilustración decorativa; el wrapper pasa aria-hidden.
    <svg {...COMUN_PROPS} {...props}>
      <line x1="30" y1="18" x2="30" y2="78" />
      <circle cx="30" cy="22" r="4.5" />
      <circle cx="30" cy="48" r="4.5" />
      <circle cx="30" cy="74" r="4.5" />
      <path d="M 30 48 Q 50 48 60 58 L 60 70" />
      <circle cx="60" cy="74" r="4.5" />
    </svg>
  )
}

function SvgWeb(props: SvgProps) {
  return (
    // biome-ignore lint/a11y/noSvgWithoutTitle: ilustración decorativa; el wrapper pasa aria-hidden.
    <svg {...COMUN_PROPS} {...props}>
      <rect x="14" y="20" width="68" height="56" rx="4" />
      <line x1="14" y1="32" x2="82" y2="32" />
      <circle cx="20" cy="26" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="26" cy="26" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="32" cy="26" r="1.5" fill="currentColor" stroke="none" />
      <line x1="24" y1="46" x2="72" y2="46" />
      <line x1="24" y1="56" x2="60" y2="56" opacity="0.6" />
      <line x1="24" y1="66" x2="68" y2="66" opacity="0.6" />
    </svg>
  )
}

function SvgJavascript(props: SvgProps) {
  return (
    // biome-ignore lint/a11y/noSvgWithoutTitle: ilustración decorativa; el wrapper pasa aria-hidden.
    <svg {...COMUN_PROPS} {...props}>
      <path d="M 32 20 Q 22 20 22 30 L 22 42 Q 22 48 16 48 Q 22 48 22 54 L 22 66 Q 22 76 32 76" />
      <path d="M 64 20 Q 74 20 74 30 L 74 42 Q 74 48 80 48 Q 74 48 74 54 L 74 66 Q 74 76 64 76" />
      <circle cx="40" cy="48" r="2.5" fill="currentColor" stroke="none" />
      <circle cx="48" cy="48" r="2.5" fill="currentColor" stroke="none" />
      <circle cx="56" cy="48" r="2.5" fill="currentColor" stroke="none" />
    </svg>
  )
}

function SvgTypescript(props: SvgProps) {
  return (
    // biome-ignore lint/a11y/noSvgWithoutTitle: ilustración decorativa; el wrapper pasa aria-hidden.
    <svg {...COMUN_PROPS} {...props}>
      <path d="M 48 14 L 76 24 L 76 50 Q 76 68 48 82 Q 20 68 20 50 L 20 24 Z" />
      <path d="M 34 48 L 44 58 L 62 38" />
    </svg>
  )
}

function SvgReactBase(props: SvgProps) {
  return (
    // biome-ignore lint/a11y/noSvgWithoutTitle: ilustración decorativa; el wrapper pasa aria-hidden.
    <svg {...COMUN_PROPS} {...props}>
      <ellipse cx="48" cy="48" rx="32" ry="12" />
      <ellipse cx="48" cy="48" rx="32" ry="12" transform="rotate(60 48 48)" />
      <ellipse cx="48" cy="48" rx="32" ry="12" transform="rotate(120 48 48)" />
      <circle cx="48" cy="48" r="4" fill="currentColor" stroke="none" />
    </svg>
  )
}

function SvgReactDatos(props: SvgProps) {
  return (
    // biome-ignore lint/a11y/noSvgWithoutTitle: ilustración decorativa; el wrapper pasa aria-hidden.
    <svg {...COMUN_PROPS} {...props}>
      <rect x="14" y="28" width="22" height="40" rx="2" />
      <line x1="20" y1="38" x2="30" y2="38" />
      <line x1="20" y1="48" x2="30" y2="48" />
      <line x1="20" y1="58" x2="26" y2="58" />
      <rect x="60" y="28" width="22" height="40" rx="2" />
      <ellipse cx="71" cy="48" rx="9" ry="4" />
      <circle cx="71" cy="48" r="2" fill="currentColor" stroke="none" />
      <path d="M 38 48 L 56 48" strokeDasharray="3 3" />
      <path d="M 52 44 L 56 48 L 52 52" />
    </svg>
  )
}

function SvgIa(props: SvgProps) {
  return (
    // biome-ignore lint/a11y/noSvgWithoutTitle: ilustración decorativa; el wrapper pasa aria-hidden.
    <svg {...COMUN_PROPS} {...props}>
      <path d="M 48 16 L 53 38 L 76 43 L 56 50 L 60 72 L 48 58 L 36 72 L 40 50 L 20 43 L 43 38 Z" />
      <circle cx="76" cy="20" r="2" fill="currentColor" stroke="none" />
      <circle cx="22" cy="74" r="2" fill="currentColor" stroke="none" />
      <circle cx="80" cy="68" r="1.5" fill="currentColor" stroke="none" opacity="0.6" />
    </svg>
  )
}

function SvgCierre(props: SvgProps) {
  return (
    // biome-ignore lint/a11y/noSvgWithoutTitle: ilustración decorativa; el wrapper pasa aria-hidden.
    <svg {...COMUN_PROPS} {...props}>
      <path d="M 24 30 L 48 18 L 72 30 L 72 58 L 48 70 L 24 58 Z" />
      <path d="M 24 30 L 48 42 L 72 30" />
      <line x1="48" y1="42" x2="48" y2="70" />
      <path d="M 38 50 L 44 56 L 58 42" opacity="0.65" />
    </svg>
  )
}

const SVG_POR_TEMA: Record<TemaModulo, (props: SvgProps) => ReactElement> = {
  bienvenida: SvgBienvenida,
  git: SvgGit,
  web: SvgWeb,
  javascript: SvgJavascript,
  typescript: SvgTypescript,
  "react-base": SvgReactBase,
  "react-datos": SvgReactDatos,
  ia: SvgIa,
  cierre: SvgCierre,
}
