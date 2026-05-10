import type { CursoCard } from "@nexott-learn/shared-types"
import type { MisCursosFiltro } from "../components/mis-cursos-filtros"

const RE_DIACRITICOS = /\p{Diacritic}/gu

function normalizar(texto: string): string {
  return texto.toLowerCase().normalize("NFD").replace(RE_DIACRITICOS, "")
}

export function aplicaFiltroEstado(curso: CursoCard, filtro: MisCursosFiltro): boolean {
  switch (filtro) {
    case "todos":
      return true
    case "activos":
      return curso.estado.tipo === "EN_PROGRESO" || curso.estado.tipo === "NO_INICIADO"
    case "completados":
      return curso.estado.tipo === "COMPLETADO"
    default: {
      const _exhaustive: never = filtro
      return _exhaustive
    }
  }
}

export function aplicaBusqueda(curso: CursoCard, busqueda: string): boolean {
  if (busqueda.trim().length === 0) {
    return true
  }
  const q = normalizar(busqueda)
  return normalizar(curso.titulo).includes(q) || normalizar(curso.descripcionCorta).includes(q)
}

export function filtrarCursos(
  cursos: readonly CursoCard[],
  filtro: MisCursosFiltro,
  busqueda: string,
): readonly CursoCard[] {
  return cursos.filter((c) => aplicaFiltroEstado(c, filtro) && aplicaBusqueda(c, busqueda))
}

export function contarPorFiltro(cursos: readonly CursoCard[]): Record<MisCursosFiltro, number> {
  return {
    todos: cursos.length,
    activos: cursos.filter((c) => aplicaFiltroEstado(c, "activos")).length,
    completados: cursos.filter((c) => aplicaFiltroEstado(c, "completados")).length,
  }
}
