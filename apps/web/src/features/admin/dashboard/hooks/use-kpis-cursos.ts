import type { KpiPulso } from "@/pages/admin/inicio/inicio.types"
import type { CursoResumen } from "@nexott-learn/shared-types"
import { Archive, BookOpen, CalendarClock, FileEdit } from "lucide-react"
import { useMemo } from "react"
import { useCursosDashboard } from "./use-cursos-dashboard"

const DIAS_VENTANA_DEADLINE = 14
const MS_POR_DIA = 24 * 60 * 60 * 1000

function diasHasta(fechaIso: string): number {
  const fecha = new Date(fechaIso).getTime()
  return Math.ceil((fecha - Date.now()) / MS_POR_DIA)
}

function construirKpis(cursos: readonly CursoResumen[]): readonly KpiPulso[] {
  const activos = cursos.filter((c) => c.estado === "ACTIVO")
  const borrador = cursos.filter((c) => c.estado === "BORRADOR")
  const archivados = cursos.filter((c) => c.estado === "ARCHIVADO")
  const proximosDeadline = activos.filter((c) => {
    const dias = diasHasta(c.fechaDeadline)
    return dias >= 0 && dias <= DIAS_VENTANA_DEADLINE
  })

  return [
    {
      id: "cursos-activos",
      etiqueta: "Cursos activos",
      valor: activos.length,
      tono: "acento",
      icono: BookOpen,
      nota:
        activos.length === 0
          ? "Aún no hay cursos publicados"
          : `${activos.length} en curso ahora mismo`,
    },
    {
      id: "cursos-borrador",
      etiqueta: "Borradores",
      valor: borrador.length,
      tono: borrador.length > 0 ? "warning" : "success",
      icono: FileEdit,
      nota: borrador.length === 0 ? "Sin pendientes" : "Pendientes de publicar",
    },
    {
      id: "deadline-proximo",
      etiqueta: "Deadline próximo",
      valor: proximosDeadline.length,
      tono: proximosDeadline.length > 0 ? "warning" : "success",
      icono: CalendarClock,
      nota: `≤ ${DIAS_VENTANA_DEADLINE} días`,
    },
    {
      id: "cursos-archivados",
      etiqueta: "Archivados",
      valor: archivados.length,
      tono: "acento",
      icono: Archive,
      nota:
        archivados.length === 1 ? "1 curso archivado" : `${archivados.length} cursos archivados`,
    },
  ]
}

interface UseKpisCursosResult {
  readonly kpis: readonly KpiPulso[]
  readonly isLoading: boolean
}

export function useKpisCursos(): UseKpisCursosResult {
  const { data, isLoading } = useCursosDashboard()
  const kpis = useMemo(() => construirKpis(data?.data ?? []), [data])
  return { kpis, isLoading }
}
