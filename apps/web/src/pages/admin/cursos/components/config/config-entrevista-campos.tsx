import { Field } from "@/shared/components/ui/field"
import { Select } from "@/shared/components/ui/select"
import type {
  FilosofiaEntrevista,
  ProfundidadEntrevista,
  TonoEntrevista,
} from "@nexott-learn/shared-types"

export interface EntrevistaParametros {
  readonly filosofia: FilosofiaEntrevista
  readonly profundidad: ProfundidadEntrevista
  readonly duracionMinutos: 15 | 30 | 45
  readonly tono: TonoEntrevista
}

interface ConfigEntrevistaCamposProps {
  readonly valores: EntrevistaParametros
  readonly onCambio: (v: EntrevistaParametros) => void
}

export function ConfigEntrevistaCampos({ valores, onCambio }: ConfigEntrevistaCamposProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <Field label="Filosofía">
        {(p) => (
          <Select
            {...p}
            compact={true}
            value={valores.filosofia}
            onChange={(e) =>
              onCambio({ ...valores, filosofia: e.target.value as FilosofiaEntrevista })
            }
          >
            <option value="PREPARACION">Preparación</option>
            <option value="FILTRO">Filtro</option>
          </Select>
        )}
      </Field>
      <Field label="Profundidad">
        {(p) => (
          <Select
            {...p}
            compact={true}
            value={valores.profundidad}
            onChange={(e) =>
              onCambio({ ...valores, profundidad: e.target.value as ProfundidadEntrevista })
            }
          >
            <option value="JUNIOR">Junior</option>
            <option value="SEMI_SENIOR">Semi-senior</option>
            <option value="SENIOR">Senior</option>
          </Select>
        )}
      </Field>
      <Field label="Duración (minutos)">
        {(p) => (
          <Select
            {...p}
            compact={true}
            value={String(valores.duracionMinutos)}
            onChange={(e) =>
              onCambio({
                ...valores,
                duracionMinutos: Number(e.target.value) as 15 | 30 | 45,
              })
            }
          >
            <option value="15">15</option>
            <option value="30">30</option>
            <option value="45">45</option>
          </Select>
        )}
      </Field>
      <Field label="Tono">
        {(p) => (
          <Select
            {...p}
            compact={true}
            value={valores.tono}
            onChange={(e) => onCambio({ ...valores, tono: e.target.value as TonoEntrevista })}
          >
            <option value="CONVERSACIONAL">Conversacional</option>
            <option value="FORMAL">Formal</option>
          </Select>
        )}
      </Field>
    </div>
  )
}
