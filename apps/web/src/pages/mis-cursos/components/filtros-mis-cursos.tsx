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
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex flex-col gap-1">
        <label htmlFor={estadoId} className="text-caption text-text-tertiary">
          Estado
        </label>
        <div className="w-44">
          <Select
            id={estadoId}
            compact={true}
            value={filtros.estado}
            onChange={(e) => onEstadoChange(e.target.value as FiltroEstadoCurso)}
          >
            {OPCIONES_ESTADO.map((opcion) => (
              <option key={opcion.value} value={opcion.value}>
                {opcion.label}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor={rolId} className="text-caption text-text-tertiary">
          Rol
        </label>
        <div className="w-44">
          <Select
            id={rolId}
            compact={true}
            value={filtros.rol}
            onChange={(e) => onRolChange(e.target.value as FiltroRolAsignacion)}
          >
            {OPCIONES_ROL.map((opcion) => (
              <option key={opcion.value} value={opcion.value}>
                {opcion.label}
              </option>
            ))}
          </Select>
        </div>
      </div>
    </div>
  )
}
