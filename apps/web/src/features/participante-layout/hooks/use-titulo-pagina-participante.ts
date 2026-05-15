import { RUTAS } from "@/shared/constants/rutas"
import { useLocation } from "react-router-dom"

interface TituloPagina {
  readonly eyebrow: string
  readonly titulo: string
}

const TITULOS: ReadonlyArray<{ readonly match: (path: string) => boolean } & TituloPagina> = [
  { match: (p) => p === RUTAS.bandeja, eyebrow: "Tu día", titulo: "Bandeja" },
  {
    match: (p) => p === RUTAS.participante.misCursos,
    eyebrow: "Aprendizaje",
    titulo: "Mis cursos",
  },
  { match: (p) => p === RUTAS.participante.miFicha, eyebrow: "Tu perfil", titulo: "Mi ficha" },
  { match: (p) => p === RUTAS.participante.catalogo, eyebrow: "Explorar", titulo: "Catálogo" },
  {
    match: (p) => p.startsWith("/cursos/"),
    eyebrow: "Curso en marcha",
    titulo: "Detalle del curso",
  },
]

const FALLBACK: TituloPagina = { eyebrow: "NexoTT Learn", titulo: "" }

/**
 * Resuelve el eyebrow + título visible en el topbar según la ruta actual.
 * Si la ruta no encaja, devuelve fallback sin título (topbar respira sin
 * mostrar texto incorrecto).
 */
export function useTituloPaginaParticipante(): TituloPagina {
  const { pathname } = useLocation()
  return TITULOS.find((t) => t.match(pathname)) ?? FALLBACK
}
