import { NxtNumberInput, NxtText } from "@carlos2280/nexott-ui/react"
import { Stack } from "@carlos2280/nexott-ui/react-primitives"

interface CursoUmbralesProps {
  readonly excelencia: number
  readonly aprobado: number
  readonly enDesarrollo: number
  readonly errorExcelencia?: string
  readonly errorAprobado?: string
  readonly errorEnDesarrollo?: string
  readonly disabled?: boolean
  readonly onCambioExcelencia: (valor: number) => void
  readonly onCambioAprobado: (valor: number) => void
  readonly onCambioEnDesarrollo: (valor: number) => void
}

// Las 4 filas del bloque "Umbrales de Logro". Layout plano sobre la card padre:
// barra vertical de color + titulo + descripcion + valor a la derecha. Sin pills
// individuales — todas las filas viven en la misma card del form.
// La cuarta (Insuficiente) es derivada: < enDesarrollo. Se muestra readonly.
export function CursoUmbrales({
  excelencia,
  aprobado,
  enDesarrollo,
  errorExcelencia,
  errorAprobado,
  errorEnDesarrollo,
  disabled = false,
  onCambioExcelencia,
  onCambioAprobado,
  onCambioEnDesarrollo,
}: CursoUmbralesProps) {
  return (
    <Stack gap="md">
      <FilaUmbral
        color="var(--nx-emerald, #10B981)"
        nombre="Excelencia"
        descripcion="Nota destacada"
        operador="≥"
        valor={excelencia}
        onCambio={onCambioExcelencia}
        error={errorExcelencia}
        disabled={disabled}
      />
      <FilaUmbral
        color="#6EE7B7"
        nombre="Aprobado"
        descripcion="Cumple el objetivo"
        operador="≥"
        valor={aprobado}
        onCambio={onCambioAprobado}
        error={errorAprobado}
        disabled={disabled}
      />
      <FilaUmbral
        color="var(--nx-amber, #F59E0B)"
        nombre="En desarrollo"
        descripcion="Necesita refuerzo"
        operador="≥"
        valor={enDesarrollo}
        onCambio={onCambioEnDesarrollo}
        error={errorEnDesarrollo}
        disabled={disabled}
      />
      <FilaUmbral
        color="var(--nx-rose, #F43F5E)"
        nombre="Insuficiente"
        descripcion="Requiere repetir"
        operador="<"
        valor={enDesarrollo}
        readonly={true}
      />
    </Stack>
  )
}

interface FilaUmbralProps {
  readonly color: string
  readonly nombre: string
  readonly descripcion: string
  readonly operador: "≥" | "<"
  readonly valor: number
  readonly error?: string
  readonly disabled?: boolean
  readonly readonly?: boolean
  readonly onCambio?: (valor: number) => void
}

function FilaUmbral({
  color,
  nombre,
  descripcion,
  operador,
  valor,
  error,
  disabled = false,
  readonly = false,
  onCambio,
}: FilaUmbralProps) {
  return (
    <Stack direction="row" align="center" justify="between" gap="md">
      <Stack direction="row" align="stretch" gap="md" style={{ flex: 1, minWidth: 0 }}>
        {/* Barra vertical de color que identifica el umbral. 3px ancho,
            altura sigue al contenido (align="stretch" del Stack padre). */}
        <div
          aria-hidden={true}
          style={{
            width: 3,
            borderRadius: 2,
            background: color,
            flexShrink: 0,
            alignSelf: "stretch",
          }}
        />
        <Stack gap="none" style={{ flex: 1, minWidth: 0 }}>
          <NxtText size="sm" weight="semibold">
            {nombre}
          </NxtText>
          <NxtText size="xs" tone="dim">
            {descripcion}
          </NxtText>
        </Stack>
      </Stack>

      {readonly ? (
        // Insuficiente: valor calculado, no editable. Render plano para
        // diferenciarlo visualmente de las filas con input.
        <Stack direction="row" align="center" gap="xs" style={{ flexShrink: 0 }}>
          <NxtText size="sm" tone="dim">
            {operador}
          </NxtText>
          <NxtText size="md" weight="bold">
            {valor}
          </NxtText>
        </Stack>
      ) : (
        <NxtNumberInput
          value={valor}
          min={0}
          max={100}
          prefix={operador}
          size="sm"
          disabled={disabled}
          state={error ? "error" : ""}
          helper={error ?? ""}
          onNxtNumberChange={onCambio ? (event) => onCambio(event.detail.value) : undefined}
        />
      )}
    </Stack>
  )
}
