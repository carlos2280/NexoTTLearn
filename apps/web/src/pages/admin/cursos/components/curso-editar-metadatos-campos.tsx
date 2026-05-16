import { Field } from "@/shared/components/ui/field"
import { Input } from "@/shared/components/ui/input"
import { Select } from "@/shared/components/ui/select"
import { Textarea } from "@/shared/components/ui/textarea"
import type { ClienteResponse } from "@nexott-learn/shared-types"
import type { FormMetadatos } from "./curso-editar-metadatos-validar"

interface CursoEditarMetadatosCamposProps {
  readonly form: FormMetadatos
  readonly onCambio: (form: FormMetadatos) => void
  readonly clientes: readonly ClienteResponse[]
  readonly exigeMotivo: boolean
  readonly motivo: string
  readonly onMotivo: (v: string) => void
}

export function CursoEditarMetadatosCampos({
  form,
  onCambio,
  clientes,
  exigeMotivo,
  motivo,
  onMotivo,
}: CursoEditarMetadatosCamposProps) {
  return (
    <>
      <Field label="Título">
        {(p) => (
          <Input
            {...p}
            value={form.titulo}
            onChange={(e) => onCambio({ ...form, titulo: e.target.value })}
            maxLength={200}
            autoFocus={true}
          />
        )}
      </Field>
      <Field label="Cliente">
        {(p) => (
          <Select
            {...p}
            value={form.clienteId}
            onChange={(e) => onCambio({ ...form, clienteId: e.target.value })}
          >
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </Select>
        )}
      </Field>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Fecha de inicio">
          {(p) => (
            <Input
              {...p}
              type="date"
              value={form.fechaInicio}
              onChange={(e) => onCambio({ ...form, fechaInicio: e.target.value })}
            />
          )}
        </Field>
        <Field label="Deadline">
          {(p) => (
            <Input
              {...p}
              type="date"
              value={form.fechaDeadline}
              onChange={(e) => onCambio({ ...form, fechaDeadline: e.target.value })}
            />
          )}
        </Field>
      </div>
      {exigeMotivo ? (
        <Field label="Motivo (obligatorio en curso no-borrador)">
          {(p) => (
            <Textarea {...p} value={motivo} onChange={(e) => onMotivo(e.target.value)} rows={2} />
          )}
        </Field>
      ) : null}
    </>
  )
}
