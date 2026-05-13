import { SearchField } from "@/shared/components/ui/search-field"
import { Select } from "@/shared/components/ui/select"
import type {
  FiltroBloqueado,
  FiltroEstadoEmpleado,
  FiltroRol,
  FiltrosPersonas,
} from "../personas.types"

interface PersonasFiltrosProps {
  readonly valor: FiltrosPersonas
  readonly onCambio: (siguiente: FiltrosPersonas) => void
}

export function PersonasFiltros({ valor, onCambio }: PersonasFiltrosProps) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
      <SearchField
        valor={valor.busqueda}
        onCambio={(v) => onCambio({ ...valor, busqueda: v })}
        placeholder="Buscar por nombre o email…"
      />
      <Select
        compact={true}
        value={valor.rol}
        onChange={(e) => onCambio({ ...valor, rol: e.target.value as FiltroRol })}
        aria-label="Filtrar por rol"
        className="min-w-[160px]"
      >
        <option value="TODOS">Todos los roles</option>
        <option value="ADMIN">Administradores</option>
        <option value="PARTICIPANTE">Participantes</option>
      </Select>
      <Select
        compact={true}
        value={valor.estadoEmpleado}
        onChange={(e) =>
          onCambio({ ...valor, estadoEmpleado: e.target.value as FiltroEstadoEmpleado })
        }
        aria-label="Filtrar por estado de empleo"
        className="min-w-[160px]"
      >
        <option value="TODOS">Activos y ex empleados</option>
        <option value="ACTIVO">Solo activos</option>
        <option value="EX_EMPLEADO">Solo ex empleados</option>
      </Select>
      <Select
        compact={true}
        value={valor.bloqueado}
        onChange={(e) => onCambio({ ...valor, bloqueado: e.target.value as FiltroBloqueado })}
        aria-label="Filtrar por bloqueo"
        className="min-w-[160px]"
      >
        <option value="TODOS">Acceso: todos</option>
        <option value="SI">Solo bloqueados</option>
        <option value="NO">Solo desbloqueados</option>
      </Select>
    </div>
  )
}
