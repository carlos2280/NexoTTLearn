import { Select } from "@/shared/components/ui/select"
import { useId } from "react"
import type { FiltroEstadoCurso, FiltroRolAsignacion, FiltrosMisCursos } from "../mis-cursos.types"

interface FiltrosMisCursosProps {
  readonly filtros: FiltrosMisCursos
  readonly onEstadoChange: (estado: FiltroEstadoCurso) => void
  readonly onRolChange: (rol: FiltroRolAsignacion) => void
}

const OPCIONES_ESTADO: readonly { readonly value: FiltroEstadoCurso; readonly label: string }[] = [
  { value: "TODOS", label: "Todos los estados" },
  { value: "ACTIVO", label: "Activos" },
  { value: "CERRADO", label: "Cerrados" },
  { value: "ARCHIVADO", label: "Archivados" },
]

const OPCIONES_ROL: readonly { readonly value: FiltroRolAsignacion; readonly label: string }[] = [
  { value: "TODOS", label: "Todos los roles" },
  { value: "ASIGNADO", label: "Asignados" },
  { value: "VOLUNTARIO", label: "Voluntarios" },
]

export function FiltrosMisCursosForm({
  filtros,
  onEstadoChange,
  onRolChange,
}: FiltrosMisCursosProps) {
  const estadoId = useId()
  const rolId = useId()

  return (
    <div className="flex flex-wrap items-center gap-2">
      <FiltroPill
        id={estadoId}
        etiqueta="Estado"
        value={filtros.estado}
        opciones={OPCIONES_ESTADO}
        onChange={(v) => onEstadoChange(v as FiltroEstadoCurso)}
      />
      <FiltroPill
        id={rolId}
        etiqueta="Rol"
        value={filtros.rol}
        opciones={OPCIONES_ROL}
        onChange={(v) => onRolChange(v as FiltroRolAsignacion)}
      />
    </div>
  )
}

interface FiltroPillProps {
  readonly id: string
  readonly etiqueta: string
  readonly value: string
  readonly opciones: readonly { readonly value: string; readonly label: string }[]
  readonly onChange: (value: string) => void
}

function FiltroPill({ id, etiqueta, value, opciones, onChange }: FiltroPillProps) {
  return (
    <label
      htmlFor={id}
      className="inline-flex items-center gap-2 rounded-pill border border-border bg-surface px-3 py-1 transition-colors duration-base ease-default focus-within:border-aurora-violet hover:border-border-strong"
    >
      <span className="nx-eyebrow text-text-tertiary">{etiqueta}</span>
      <Select id={id} variant="ghost" value={value} onChange={(e) => onChange(e.target.value)}>
        {opciones.map((opcion) => (
          <option key={opcion.value} value={opcion.value}>
            {opcion.label}
          </option>
        ))}
      </Select>
    </label>
  )
}
