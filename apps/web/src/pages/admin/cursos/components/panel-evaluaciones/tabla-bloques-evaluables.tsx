import { useBloquesEvaluables } from "@/features/cursos/hooks/use-bloques-evaluables"
import { Badge } from "@/shared/components/ui/badge"
import { type ColumnaTabla, DataTable } from "@/shared/components/ui/data-table"
import type { BloqueEvaluableAdminItem } from "@nexott-learn/shared-types"
import { ClipboardList } from "lucide-react"
import { useMemo, useState } from "react"
import { DrawerDetalleBloque } from "./drawer-detalle-bloque"
import {
  FILTROS_BLOQUES_INICIAL,
  FiltrosBloquesEvaluables,
  type FiltrosBloquesValor,
} from "./filtros-bloques-evaluables"

interface Props {
  readonly cursoId: string
}

/**
 * Subtab "Bloques" del PanelEvaluaciones. Lista todos los bloques evaluables
 * del curso (no pagina; un curso suele tener < 30 bloques) con stats
 * agregadas. Click en una fila → drawer con detalle por colaborador.
 */
export function TablaBloquesEvaluables({ cursoId }: Props) {
  const { data, isLoading } = useBloquesEvaluables(cursoId)
  const [filtros, setFiltros] = useState<FiltrosBloquesValor>(FILTROS_BLOQUES_INICIAL)
  const [bloqueAbierto, setBloqueAbierto] = useState<BloqueEvaluableAdminItem | null>(null)

  const bloques = data ?? []
  const filtrados = useMemo(() => aplicarFiltros(bloques, filtros), [bloques, filtros])

  const columnas: readonly ColumnaTabla<BloqueEvaluableAdminItem>[] = [
    {
      id: "bloque",
      cabecera: "Bloque",
      accesor: (b) => (
        <div className="flex flex-col">
          <span className="text-text-primary">
            <span className="text-text-tertiary">#{b.orden}</span> {b.tipo}
          </span>
          <span className="text-body-sm text-text-tertiary">
            {b.modulo.titulo} › {b.seccion.titulo}
          </span>
        </div>
      ),
    },
    {
      id: "skill",
      cabecera: "Skill",
      accesor: (b) =>
        b.skill ? <span>{b.skill.etiqueta}</span> : <span className="text-text-tertiary">—</span>,
    },
    {
      id: "umbral",
      cabecera: "Umbral",
      alineado: "derecha",
      accesor: (b) => <span className="tabular">{b.umbralAprobacion}/100</span>,
    },
    {
      id: "intentos",
      cabecera: "Intentos",
      alineado: "derecha",
      accesor: (b) => (
        <span className="tabular text-text-secondary">
          {b.stats.colaboradoresConIntento}{" "}
          <span className="text-text-tertiary">({b.stats.totalIntentos})</span>
        </span>
      ),
    },
    {
      id: "aprobados",
      cabecera: "% aprobados",
      alineado: "derecha",
      accesor: (b) => <BadgePorcentajeAprobados item={b} />,
    },
    {
      id: "media",
      cabecera: "Nota media",
      alineado: "derecha",
      accesor: (b) =>
        b.stats.notaMedia === null ? (
          <span className="text-text-tertiary">—</span>
        ) : (
          <span className="tabular">{b.stats.notaMedia}</span>
        ),
    },
  ]

  return (
    <div className="flex flex-col gap-4">
      <FiltrosBloquesEvaluables bloques={bloques} valor={filtros} onCambio={setFiltros} />
      <DataTable
        columnas={columnas}
        filas={filtrados}
        obtenerKey={(b) => b.bloqueId}
        cargando={isLoading}
        vacioIcono={ClipboardList}
        vacioTitulo="Sin bloques"
        vacioDescripcion="No hay bloques evaluables que coincidan con los filtros."
        onClickFila={(b) => setBloqueAbierto(b)}
      />
      <DrawerDetalleBloque
        cursoId={cursoId}
        bloqueId={bloqueAbierto?.bloqueId ?? null}
        tituloBloque={
          bloqueAbierto
            ? `${bloqueAbierto.modulo.titulo} › ${bloqueAbierto.seccion.titulo} · ${bloqueAbierto.tipo}`
            : ""
        }
        onCerrar={() => setBloqueAbierto(null)}
      />
    </div>
  )
}

function aplicarFiltros(
  bloques: readonly BloqueEvaluableAdminItem[],
  filtros: FiltrosBloquesValor,
): readonly BloqueEvaluableAdminItem[] {
  const busqueda = filtros.busqueda.trim().toLowerCase()
  return bloques.filter((b) => coincideTodosLosFiltros(b, filtros, busqueda))
}

function coincideTodosLosFiltros(
  b: BloqueEvaluableAdminItem,
  filtros: FiltrosBloquesValor,
  busquedaLower: string,
): boolean {
  return (
    coincideModulo(b, filtros) &&
    coincideTipo(b, filtros) &&
    coincideSkill(b, filtros) &&
    coincideConIntentos(b, filtros) &&
    coincideBusqueda(b, busquedaLower)
  )
}

function coincideModulo(b: BloqueEvaluableAdminItem, f: FiltrosBloquesValor): boolean {
  return f.moduloId === "TODOS" || b.modulo.id === f.moduloId
}

function coincideTipo(b: BloqueEvaluableAdminItem, f: FiltrosBloquesValor): boolean {
  return f.tipo === "TODOS" || b.tipo === f.tipo
}

function coincideSkill(b: BloqueEvaluableAdminItem, f: FiltrosBloquesValor): boolean {
  if (f.skillId === "TODOS") {
    return true
  }
  if (f.skillId === "SIN_SKILL") {
    return b.skill === null
  }
  return b.skill?.id === f.skillId
}

function coincideConIntentos(b: BloqueEvaluableAdminItem, f: FiltrosBloquesValor): boolean {
  return !f.soloConIntentos || b.stats.colaboradoresConIntento > 0
}

function coincideBusqueda(b: BloqueEvaluableAdminItem, busquedaLower: string): boolean {
  if (busquedaLower.length === 0) {
    return true
  }
  return `${b.modulo.titulo} ${b.seccion.titulo}`.toLowerCase().includes(busquedaLower)
}

function BadgePorcentajeAprobados({ item }: { readonly item: BloqueEvaluableAdminItem }) {
  if (item.stats.colaboradoresConIntento === 0) {
    return <span className="text-text-tertiary">—</span>
  }
  const pct = Math.round((item.stats.aprobados / item.stats.colaboradoresConIntento) * 100)
  const tono = pct >= 80 ? "success" : pct >= 50 ? "warning" : "danger"
  return (
    <Badge tono={tono} conPunto={false}>
      <span className="tabular">{pct}%</span>
    </Badge>
  )
}
