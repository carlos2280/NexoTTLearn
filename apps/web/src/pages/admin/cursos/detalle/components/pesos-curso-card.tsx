import { NxtCard, NxtProgress, NxtTag, NxtText } from "@carlos2280/nexott-ui/react"
import { Box, Stack } from "@carlos2280/nexott-ui/react-primitives"
import type { CursoDetalle } from "@nexott-learn/shared-types"
import { formatPeso } from "../lib/format"

interface PesoFila {
  readonly label: string
  readonly valor: number
  readonly activa: boolean
}

interface PesoRowProps {
  readonly fila: PesoFila
}

// Fila reutilizable: label fijo · barra crece · % alineado a la derecha.
function PesoRow({ fila }: PesoRowProps) {
  return (
    <Stack direction="row" gap="md" align="center">
      <Box style={{ width: "168px", flexShrink: 0 }}>
        <Stack direction="row" gap="sm" align="center">
          <NxtText size="md" weight="medium" tone={fila.activa ? "default" : "muted"}>
            {fila.label}
          </NxtText>
          {fila.activa ? null : (
            <NxtTag variant="neutral" size="sm">
              Inactivo
            </NxtTag>
          )}
        </Stack>
      </Box>
      <Box style={{ flex: "1 1 auto", minWidth: 0 }}>
        <NxtProgress variant="bar" value={fila.valor} max={100} size="sm" color="brand" />
      </Box>
      <Box style={{ width: "48px", textAlign: "right", flexShrink: 0 }}>
        <NxtText size="md" weight="semibold">
          {formatPeso(fila.valor)}
        </NxtText>
      </Box>
    </Stack>
  )
}

interface PesosCursoCardProps {
  readonly curso: CursoDetalle
}

// MAESTRO §9.7 · Pesos a nivel curso (Áreas + Transversal + Entrevista IA).
// Suma debe dar 100% (T04 §17.5). Read-only en Capa 2.
export function PesosCursoCard({ curso }: PesosCursoCardProps) {
  const filas: readonly PesoFila[] = [
    { label: "Áreas", valor: curso.pesoAreas, activa: true },
    {
      label: "Proyecto Transversal",
      valor: curso.pesoProyectoTransversal,
      activa: curso.proyectoTransversal.activo,
    },
    {
      label: "Entrevista Final IA",
      valor: curso.pesoEntrevistaIA,
      activa: curso.entrevistaIAConfig.activa,
    },
  ]
  const suma = filas.reduce((acc, f) => acc + f.valor, 0)
  const pesosOk = Math.abs(suma - 100) < 0.01

  return (
    <NxtCard
      variant="surface"
      padding="lg"
      title="Pesos a nivel curso"
      description="Cómo combinan áreas, proyecto y entrevista en la nota final."
      icon="bar-chart"
      iconColor="violet"
    >
      <Stack direction="column" gap="md">
        {filas.map((fila) => (
          <PesoRow key={fila.label} fila={fila} />
        ))}
        <Stack direction="row" gap="sm" align="center" justify="end">
          <NxtText size="sm" tone="muted">
            Suma total
          </NxtText>
          <NxtTag variant={pesosOk ? "success" : "warning"} size="sm">
            {formatPeso(suma)}
          </NxtTag>
        </Stack>
      </Stack>
    </NxtCard>
  )
}

interface PesosIntraModuloCardProps {
  readonly curso: CursoDetalle
}

// MAESTRO §9.5 · Pesos intra-módulo (mismos para todos los módulos del curso).
export function PesosIntraModuloCard({ curso }: PesosIntraModuloCardProps) {
  const filas: readonly PesoFila[] = [
    { label: "Actividades (bloques)", valor: curso.pesoActividades, activa: true },
    { label: "Mini proyecto", valor: curso.pesoMiniProyecto, activa: true },
  ]
  const suma = curso.pesoActividades + curso.pesoMiniProyecto
  const pesosOk = Math.abs(suma - 100) < 0.01

  return (
    <NxtCard
      variant="surface"
      padding="lg"
      title="Pesos intra-módulo"
      description="Cómo se combina dentro de cada módulo (actividades + mini proyecto)."
      icon="layers"
      iconColor="emerald"
    >
      <Stack direction="column" gap="md">
        {filas.map((fila) => (
          <PesoRow key={fila.label} fila={fila} />
        ))}
        <Stack direction="row" gap="sm" align="center" justify="end">
          <NxtText size="sm" tone="muted">
            Suma total
          </NxtText>
          <NxtTag variant={pesosOk ? "success" : "warning"} size="sm">
            {formatPeso(suma)}
          </NxtTag>
        </Stack>
      </Stack>
    </NxtCard>
  )
}
