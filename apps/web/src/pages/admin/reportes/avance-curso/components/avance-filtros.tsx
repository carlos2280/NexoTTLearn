import { estadosDisponibles } from "@/features/asignaciones/lib/estados-filtro"
import { type AyudaContenido, AyudaPopover } from "@/shared/components/ui/ayuda-popover"
import { SearchField } from "@/shared/components/ui/search-field"
import { Select, SelectItem } from "@/shared/components/ui/select"
import type { RolAvanceFiltro } from "@nexott-learn/shared-types"
import { ListFilter, type LucideIcon, Users } from "lucide-react"
import { ROLES_FILTRO } from "../avance-curso.filtros"

// Radix Select prohibe un item con value="". Usamos un centinela para la opcion
// "todos los estados" y lo traducimos a "" (sin filtro) de cara al hook.
const ESTADO_TODOS = "__todos__"

// Ayudas para que el admin distinga ROL (como entro la persona) de ESTADO (en
// que etapa va). Son la misma palabra "Asignado" en dos ejes distintos.
const AYUDA_ROL: AyudaContenido = {
  queEs:
    "Cómo llegó la persona al curso. Asignado: la empresa se lo asignó y va camino a un veredicto (Apto o No apto). Voluntario: se inscribió por su cuenta, sin veredicto.",
  siCambias:
    "Acotas la tabla a asignados, voluntarios o todos. Por defecto se muestran solo los asignados.",
  ejemplo: "Elige “Voluntarios” para ver solo a quienes se inscribieron por interés propio.",
}

const AYUDA_ESTADO: AyudaContenido = {
  queEs:
    "En qué etapa del recorrido va la persona: Sin iniciar → En progreso → Listo → cierre (Apto o No apto si es asignado; Completado si es voluntario). Las etapas dependen del rol.",
  siCambias: "Filtras por una etapa puntual, por ejemplo solo quienes están “En progreso”.",
  ejemplo: "Selecciona “No apto” para revisar a quienes no aprobaron el curso.",
}

interface AvanceFiltrosProps {
  readonly rol: RolAvanceFiltro
  readonly estado: string
  readonly busqueda: string
  readonly onCambiarRol: (rol: RolAvanceFiltro) => void
  readonly onCambiarEstado: (estado: string) => void
  readonly onCambiarBusqueda: (busqueda: string) => void
}

/**
 * Filtros de la vista ACTUAL del reporte de avance. Por defecto el rol es
 * `ASIGNADO` (asignados); el admin puede pedir voluntarios o ambos. El estado
 * se acota al enum del rol elegido (`estadosDisponibles`). La busqueda
 * (nombre/email) usa el debounce interno de `SearchField`.
 */
export function AvanceFiltros({
  rol,
  estado,
  busqueda,
  onCambiarRol,
  onCambiarEstado,
  onCambiarBusqueda,
}: AvanceFiltrosProps) {
  const opcionesEstado = [
    { id: ESTADO_TODOS, etiqueta: "Todos los estados" },
    ...estadosDisponibles(rol),
  ]
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface px-5 py-4 shadow-[var(--shadow-card-resting)] md:flex-row md:items-center md:justify-between">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
        <SelectFiltro
          icono={Users}
          etiqueta="Rol"
          ayuda={AYUDA_ROL}
          valor={rol}
          opciones={ROLES_FILTRO}
          onCambio={(v) => onCambiarRol(v as RolAvanceFiltro)}
          ariaLabel="Filtrar por rol de asignación"
        />
        <SelectFiltro
          icono={ListFilter}
          etiqueta="Estado"
          ayuda={AYUDA_ESTADO}
          valor={estado || ESTADO_TODOS}
          opciones={opcionesEstado}
          onCambio={(v) => onCambiarEstado(v === ESTADO_TODOS ? "" : v)}
          ariaLabel="Filtrar por estado de la asignación"
        />
      </div>

      <SearchField
        valor={busqueda}
        onCambio={onCambiarBusqueda}
        placeholder="Buscar por nombre o email…"
        ariaLabel="Buscar colaborador por nombre o email"
      />
    </div>
  )
}

interface SelectFiltroProps {
  readonly icono: LucideIcon
  readonly etiqueta: string
  readonly ayuda?: AyudaContenido
  readonly valor: string
  readonly opciones: readonly { readonly id: string; readonly etiqueta: string }[]
  readonly onCambio: (valor: string) => void
  readonly ariaLabel: string
}

function SelectFiltro({
  icono: Icono,
  etiqueta,
  ayuda,
  valor,
  opciones,
  onCambio,
  ariaLabel,
}: SelectFiltroProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-subtle text-text-secondary">
        <Icono className="h-[16px] w-[16px]" aria-hidden={true} />
      </span>
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="flex items-center gap-1">
          <span className="nx-eyebrow text-text-tertiary">{etiqueta}</span>
          {ayuda ? (
            <AyudaPopover contenido={ayuda} etiquetaAria={`Qué es el filtro ${etiqueta}`} />
          ) : null}
        </span>
        <Select
          variant="ghost"
          value={valor}
          onValueChange={onCambio}
          aria-label={ariaLabel}
          className="w-auto pr-0 pl-0 focus-visible:underline focus-visible:decoration-2 focus-visible:decoration-aurora-violet focus-visible:underline-offset-4"
        >
          {opciones.map((o) => (
            <SelectItem key={o.id} value={o.id}>
              {o.etiqueta}
            </SelectItem>
          ))}
        </Select>
      </span>
    </div>
  )
}
