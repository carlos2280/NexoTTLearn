import { X } from "lucide-react"
import { MENSAJE_MAX, type RolTurno, type TurnoBorrador } from "../hooks/comprension-validar"

const ETIQUETA_ROL: ReadonlyMap<RolTurno, string> = new Map([
  ["ASISTENTE", "Asistente IA"],
  ["COLABORADOR", "Colaborador"],
])

interface TurnoComprensionItemProps {
  readonly indice: number
  readonly turno: TurnoBorrador
  readonly onActualizar: (parcial: Partial<TurnoBorrador>) => void
  readonly onEliminar: () => void
}

/**
 * Item de la lista de turnos del dialog "Cargar capa comprension". Encapsula
 * el `<select>` de rol + textarea de mensaje + boton para eliminar el turno.
 */
export function TurnoComprensionItem({
  indice,
  turno,
  onActualizar,
  onEliminar,
}: TurnoComprensionItemProps) {
  return (
    <li className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <select
          aria-label={`Rol del turno ${indice + 1}`}
          value={turno.rol}
          onChange={(e) => onActualizar({ rol: e.target.value as RolTurno })}
          className="h-8 rounded-md border border-border-strong bg-surface px-2 text-body-sm text-text-primary focus:border-accent focus:outline-none"
        >
          <option value="ASISTENTE">{ETIQUETA_ROL.get("ASISTENTE")}</option>
          <option value="COLABORADOR">{ETIQUETA_ROL.get("COLABORADOR")}</option>
        </select>
        <button
          type="button"
          onClick={onEliminar}
          aria-label={`Eliminar turno ${indice + 1}`}
          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-text-tertiary transition-colors hover:bg-subtle hover:text-danger focus-visible:outline-2 focus-visible:outline-accent"
        >
          <X className="h-4 w-4" aria-hidden={true} />
        </button>
      </div>
      <textarea
        aria-label={`Mensaje del turno ${indice + 1}`}
        value={turno.mensaje}
        onChange={(e) => onActualizar({ mensaje: e.target.value })}
        rows={2}
        maxLength={MENSAJE_MAX}
        placeholder="Mensaje del turno…"
        className="resize-vertical w-full rounded-md border border-border-strong bg-surface px-3 py-2 text-body-sm text-text-primary placeholder:text-text-tertiary focus:border-accent focus:shadow-ring-accent-soft focus:outline-none"
      />
    </li>
  )
}
