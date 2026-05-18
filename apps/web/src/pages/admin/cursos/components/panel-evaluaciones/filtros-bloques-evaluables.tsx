import { SearchField } from "@/shared/components/ui/search-field"
import { Select, SelectItem } from "@/shared/components/ui/select"
import type { BloqueEvaluableAdminItem } from "@nexott-learn/shared-types"
import { useMemo } from "react"

export interface FiltrosBloquesValor {
  readonly busqueda: string
  readonly moduloId: string // "TODOS" o id
  readonly tipo: string // "TODOS" o TipoBloque
  readonly skillId: string // "TODOS" | "SIN_SKILL" | id
  readonly soloConIntentos: boolean
}

export const FILTROS_BLOQUES_INICIAL: FiltrosBloquesValor = {
  busqueda: "",
  moduloId: "TODOS",
  tipo: "TODOS",
  skillId: "TODOS",
  soloConIntentos: false,
}

interface OpcionesProps {
  readonly bloques: readonly BloqueEvaluableAdminItem[]
  readonly valor: FiltrosBloquesValor
  readonly onCambio: (v: FiltrosBloquesValor) => void
}

/**
 * Filtros del subtab "Bloques" del PanelEvaluaciones. Los selects se
 * construyen dinámicamente a partir de la lista de bloques cargada (no
 * dependemos de catálogos externos): así nunca aparecen opciones vacías.
 */
export function FiltrosBloquesEvaluables({ bloques, valor, onCambio }: OpcionesProps) {
  const modulos = useMemo(() => extraerOpcionesUnicas(bloques, (b) => b.modulo), [bloques])
  const tipos = useMemo(
    () => [...new Set(bloques.map((b) => b.tipo))].sort((a, b) => a.localeCompare(b)),
    [bloques],
  )
  const skills = useMemo(() => {
    const conSkill = bloques.flatMap((b) => (b.skill ? [b.skill] : []))
    return extraerOpcionesUnicasPorIdEtiqueta(conSkill)
  }, [bloques])
  const haySinSkill = useMemo(() => bloques.some((b) => b.skill === null), [bloques])

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="min-w-[260px] flex-1">
        <SearchField
          valor={valor.busqueda}
          onCambio={(v) => onCambio({ ...valor, busqueda: v })}
          placeholder="Buscar por sección o módulo..."
        />
      </div>
      <Select
        variant="ghost"
        value={valor.moduloId}
        onValueChange={(v) => onCambio({ ...valor, moduloId: v })}
        aria-label="Filtrar por módulo"
        placeholder="Módulo"
      >
        <SelectItem value="TODOS">Todos los módulos</SelectItem>
        {modulos.map((m) => (
          <SelectItem key={m.id} value={m.id}>
            {m.titulo}
          </SelectItem>
        ))}
      </Select>
      <Select
        variant="ghost"
        value={valor.tipo}
        onValueChange={(v) => onCambio({ ...valor, tipo: v })}
        aria-label="Filtrar por tipo"
        placeholder="Tipo"
      >
        <SelectItem value="TODOS">Todos los tipos</SelectItem>
        {tipos.map((t) => (
          <SelectItem key={t} value={t}>
            {t}
          </SelectItem>
        ))}
      </Select>
      <Select
        variant="ghost"
        value={valor.skillId}
        onValueChange={(v) => onCambio({ ...valor, skillId: v })}
        aria-label="Filtrar por skill"
        placeholder="Skill"
      >
        <SelectItem value="TODOS">Todas las skills</SelectItem>
        {haySinSkill ? <SelectItem value="SIN_SKILL">Sin skill</SelectItem> : null}
        {skills.map((s) => (
          <SelectItem key={s.id} value={s.id}>
            {s.titulo}
          </SelectItem>
        ))}
      </Select>
      <label className="inline-flex cursor-pointer items-center gap-2 text-body-sm text-text-secondary">
        <input
          type="checkbox"
          className="h-4 w-4 cursor-pointer accent-aurora-violet"
          checked={valor.soloConIntentos}
          onChange={(e) => onCambio({ ...valor, soloConIntentos: e.target.checked })}
        />
        Solo con intentos
      </label>
    </div>
  )
}

function extraerOpcionesUnicas<T extends { id: string; titulo: string }>(
  bloques: readonly BloqueEvaluableAdminItem[],
  getter: (b: BloqueEvaluableAdminItem) => T,
): readonly T[] {
  const map = new Map<string, T>()
  for (const b of bloques) {
    const v = getter(b)
    if (!map.has(v.id)) {
      map.set(v.id, v)
    }
  }
  return [...map.values()].sort((a, b) => a.titulo.localeCompare(b.titulo))
}

function extraerOpcionesUnicasPorIdEtiqueta(
  items: readonly { id: string; etiqueta: string }[],
): readonly { id: string; titulo: string }[] {
  const map = new Map<string, { id: string; titulo: string }>()
  for (const it of items) {
    if (!map.has(it.id)) {
      map.set(it.id, { id: it.id, titulo: it.etiqueta })
    }
  }
  return [...map.values()].sort((a, b) => a.titulo.localeCompare(b.titulo))
}
