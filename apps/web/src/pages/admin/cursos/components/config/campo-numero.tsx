import { Field } from "@/shared/components/ui/field"
import { Input } from "@/shared/components/ui/input"

interface CampoNumeroProps {
  readonly label: string
  readonly valor: number
  readonly onCambio: (v: number) => void
  readonly min?: number
  readonly max?: number
  readonly step?: number | string
  readonly disabled?: boolean
}

export function CampoNumero({
  label,
  valor,
  onCambio,
  min = 0,
  max = 100,
  step = "0.01",
  disabled,
}: CampoNumeroProps) {
  return (
    <Field label={label}>
      {(p) => (
        <Input
          {...p}
          type="number"
          step={step}
          min={min}
          max={max}
          value={Number.isFinite(valor) ? valor : 0}
          onChange={(e) => onCambio(Number(e.target.value))}
          disabled={disabled}
        />
      )}
    </Field>
  )
}
