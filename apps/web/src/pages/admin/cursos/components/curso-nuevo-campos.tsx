import { Field } from "@/shared/components/ui/field"
import { Input } from "@/shared/components/ui/input"
import { Select, SelectItem } from "@/shared/components/ui/select"
import type { ClienteResponse } from "@nexott-learn/shared-types"
import type { CursoNuevoForm, ErroresCursoNuevo } from "./curso-nuevo-form-validar"
import { MAX_TITULO_CURSO } from "./curso-nuevo-form-validar"

interface CursoNuevoCamposProps {
  readonly form: CursoNuevoForm
  readonly onCambio: (form: CursoNuevoForm) => void
  readonly clientes: readonly ClienteResponse[]
  readonly cargandoClientes: boolean
  readonly errores: ErroresCursoNuevo
}

export function CursoNuevoCampos({
  form,
  onCambio,
  clientes,
  cargandoClientes,
  errores,
}: CursoNuevoCamposProps) {
  return (
    <>
      <Field label="Título" error={errores.titulo}>
        {(p) => (
          <Input
            {...p}
            value={form.titulo}
            onChange={(e) => onCambio({ ...form, titulo: e.target.value })}
            maxLength={MAX_TITULO_CURSO}
            autoFocus={true}
            hasError={Boolean(errores.titulo)}
            placeholder="Ej. Java Senior – Cliente X"
          />
        )}
      </Field>
      <Field label="Cliente" error={errores.clienteId}>
        {(p) => (
          <Select
            {...p}
            value={form.clienteId === "" ? undefined : form.clienteId}
            onValueChange={(v) => onCambio({ ...form, clienteId: v })}
            hasError={Boolean(errores.clienteId)}
            disabled={cargandoClientes}
            placeholder={cargandoClientes ? "Cargando clientes…" : "Selecciona un cliente"}
          >
            {clientes
              .filter((c) => c.activo)
              .map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.nombre}
                </SelectItem>
              ))}
          </Select>
        )}
      </Field>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Fecha de inicio" error={errores.fechaInicio}>
          {(p) => (
            <Input
              {...p}
              type="date"
              value={form.fechaInicio}
              onChange={(e) => onCambio({ ...form, fechaInicio: e.target.value })}
              hasError={Boolean(errores.fechaInicio)}
            />
          )}
        </Field>
        <Field label="Deadline" error={errores.fechaDeadline}>
          {(p) => (
            <Input
              {...p}
              type="date"
              value={form.fechaDeadline}
              onChange={(e) => onCambio({ ...form, fechaDeadline: e.target.value })}
              hasError={Boolean(errores.fechaDeadline)}
            />
          )}
        </Field>
      </div>
    </>
  )
}
