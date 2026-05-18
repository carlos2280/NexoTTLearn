import { Field } from "@/shared/components/ui/field"
import { Select, SelectItem } from "@/shared/components/ui/select"
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
            onValueChange={(v) => onCambio({ ...valores, filosofia: v as FilosofiaEntrevista })}
          >
            <SelectItem value="PREPARACION">Preparación</SelectItem>
            <SelectItem value="FILTRO">Filtro</SelectItem>
          </Select>
        )}
      </Field>
      <Field label="Profundidad">
        {(p) => (
          <Select
            {...p}
            compact={true}
            value={valores.profundidad}
            onValueChange={(v) => onCambio({ ...valores, profundidad: v as ProfundidadEntrevista })}
          >
            <SelectItem value="JUNIOR">Junior</SelectItem>
            <SelectItem value="SEMI_SENIOR">Semi-senior</SelectItem>
            <SelectItem value="SENIOR">Senior</SelectItem>
          </Select>
        )}
      </Field>
      <Field label="Duración (minutos)">
        {(p) => (
          <Select
            {...p}
            compact={true}
            value={String(valores.duracionMinutos)}
            onValueChange={(v) =>
              onCambio({ ...valores, duracionMinutos: Number(v) as 15 | 30 | 45 })
            }
          >
            <SelectItem value="15">15</SelectItem>
            <SelectItem value="30">30</SelectItem>
            <SelectItem value="45">45</SelectItem>
          </Select>
        )}
      </Field>
      <Field label="Tono">
        {(p) => (
          <Select
            {...p}
            compact={true}
            value={valores.tono}
            onValueChange={(v) => onCambio({ ...valores, tono: v as TonoEntrevista })}
          >
            <SelectItem value="CONVERSACIONAL">Conversacional</SelectItem>
            <SelectItem value="FORMAL">Formal</SelectItem>
          </Select>
        )}
      </Field>
    </div>
  )
}
