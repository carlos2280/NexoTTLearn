import { SearchField } from "@/shared/components/ui/search-field"
import { Select } from "@/shared/components/ui/select"
import { cn } from "@/shared/lib/cn"
import { Popover, PopoverContent, PopoverPortal, PopoverTrigger } from "@radix-ui/react-popover"
import { ListFilter, X } from "lucide-react"
import { type ReactNode, useMemo } from "react"
import {
  FILTROS_PERSONAS_INICIAL,
  type FiltroBloqueado,
  type FiltroEstadoEmpleado,
  type FiltroRol,
  type FiltrosPersonas,
} from "../personas.types"

interface PersonasFiltrosProps {
  readonly valor: FiltrosPersonas
  readonly onCambio: (siguiente: FiltrosPersonas) => void
}

interface ChipActivoDescriptor {
  readonly id: keyof FiltrosPersonas
  readonly etiqueta: string
  readonly limpiar: () => void
}

export function PersonasFiltros({ valor, onCambio }: PersonasFiltrosProps) {
  const chips = useMemo(() => construirChips(valor, onCambio), [valor, onCambio])
  const filtrosActivosCount = chips.length

  function limpiarTodo() {
    onCambio({ ...FILTROS_PERSONAS_INICIAL, busqueda: valor.busqueda })
  }

  return (
    <div className="flex flex-1 flex-wrap items-center gap-2">
      <SearchField
        valor={valor.busqueda}
        onCambio={(v) => onCambio({ ...valor, busqueda: v })}
        placeholder="Buscar por nombre o email…"
      />

      <Popover>
        <PopoverTrigger asChild={true}>
          <button
            type="button"
            className={cn(
              "inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg px-3",
              "border border-border-strong bg-surface text-body-sm text-text-secondary shadow-xs",
              "transition-[border-color,box-shadow,color] duration-base ease-default",
              "hover:border-border-emphasis hover:text-text-primary hover:shadow-sm",
              "focus-visible:border-aurora-violet focus-visible:shadow-ring-aurora-soft focus-visible:outline-none",
            )}
            aria-label="Abrir filtros"
          >
            <ListFilter className="h-4 w-4" strokeWidth={1.5} aria-hidden={true} />
            <span>Filtros</span>
            {filtrosActivosCount > 0 ? (
              <span className="tabular font-mono text-aurora-violet text-caption">
                {filtrosActivosCount}
              </span>
            ) : null}
          </button>
        </PopoverTrigger>
        <PopoverPortal>
          <PopoverContent
            side="bottom"
            align="start"
            sideOffset={8}
            collisionPadding={16}
            className="nx-motion-popover z-popover w-[320px] rounded-xl border border-border bg-surface p-4 shadow-overlay"
          >
            <div className="flex flex-col gap-4">
              <CampoFiltro etiqueta="Rol">
                <Select
                  compact={true}
                  value={valor.rol}
                  onChange={(e) => onCambio({ ...valor, rol: e.target.value as FiltroRol })}
                  aria-label="Filtrar por rol"
                >
                  <option value="TODOS">Todos los roles</option>
                  <option value="ADMIN">Administradores</option>
                  <option value="PARTICIPANTE">Participantes</option>
                </Select>
              </CampoFiltro>

              <CampoFiltro etiqueta="Estado de empleo">
                <Select
                  compact={true}
                  value={valor.estadoEmpleado}
                  onChange={(e) =>
                    onCambio({
                      ...valor,
                      estadoEmpleado: e.target.value as FiltroEstadoEmpleado,
                    })
                  }
                  aria-label="Filtrar por estado de empleo"
                >
                  <option value="TODOS">Activos y ex empleados</option>
                  <option value="ACTIVO">Solo activos</option>
                  <option value="EX_EMPLEADO">Solo ex empleados</option>
                </Select>
              </CampoFiltro>

              <CampoFiltro etiqueta="Acceso">
                <Select
                  compact={true}
                  value={valor.bloqueado}
                  onChange={(e) =>
                    onCambio({ ...valor, bloqueado: e.target.value as FiltroBloqueado })
                  }
                  aria-label="Filtrar por bloqueo"
                >
                  <option value="TODOS">Todos</option>
                  <option value="SI">Solo bloqueados</option>
                  <option value="NO">Solo desbloqueados</option>
                </Select>
              </CampoFiltro>
            </div>
          </PopoverContent>
        </PopoverPortal>
      </Popover>

      {chips.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          {chips.map((chip) => (
            <ChipFiltro key={chip.id} etiqueta={chip.etiqueta} onLimpiar={chip.limpiar} />
          ))}
          <button
            type="button"
            onClick={limpiarTodo}
            className="text-caption text-text-tertiary underline-offset-4 transition-colors duration-fast ease-default hover:text-text-primary hover:underline"
          >
            Limpiar
          </button>
        </div>
      ) : null}
    </div>
  )
}

interface CampoFiltroProps {
  readonly etiqueta: string
  readonly children: ReactNode
}

function CampoFiltro({ etiqueta, children }: CampoFiltroProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="nx-eyebrow text-text-tertiary">{etiqueta}</span>
      {children}
    </div>
  )
}

interface ChipFiltroProps {
  readonly etiqueta: string
  readonly onLimpiar: () => void
}

function ChipFiltro({ etiqueta, onLimpiar }: ChipFiltroProps) {
  return (
    <span className="inline-flex items-center gap-1 rounded-pill border border-border bg-subtle py-0.5 pr-1 pl-2.5 text-caption text-text-secondary">
      {etiqueta}
      <button
        type="button"
        onClick={onLimpiar}
        aria-label={`Quitar filtro: ${etiqueta}`}
        className="inline-flex h-4 w-4 cursor-pointer items-center justify-center rounded-pill text-text-tertiary transition-colors duration-fast ease-default hover:bg-muted hover:text-text-primary"
      >
        <X className="h-3 w-3" strokeWidth={2} aria-hidden={true} />
      </button>
    </span>
  )
}

function construirChips(
  valor: FiltrosPersonas,
  onCambio: (siguiente: FiltrosPersonas) => void,
): ChipActivoDescriptor[] {
  const chips: ChipActivoDescriptor[] = []

  if (valor.rol !== "TODOS") {
    chips.push({
      id: "rol",
      etiqueta: valor.rol === "ADMIN" ? "Administradores" : "Participantes",
      limpiar: () => onCambio({ ...valor, rol: "TODOS" }),
    })
  }

  if (valor.estadoEmpleado !== "TODOS") {
    chips.push({
      id: "estadoEmpleado",
      etiqueta: valor.estadoEmpleado === "ACTIVO" ? "Solo activos" : "Solo ex empleados",
      limpiar: () => onCambio({ ...valor, estadoEmpleado: "TODOS" }),
    })
  }

  if (valor.bloqueado !== "TODOS") {
    chips.push({
      id: "bloqueado",
      etiqueta: valor.bloqueado === "SI" ? "Solo bloqueados" : "Solo desbloqueados",
      limpiar: () => onCambio({ ...valor, bloqueado: "TODOS" }),
    })
  }

  return chips
}
