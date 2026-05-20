import { Card } from "@/shared/components/ui/card"
import { Skeleton } from "@/shared/components/ui/skeleton"
import type { EficaciaPlataformaResponse } from "@nexott-learn/shared-types"
import { FunnelRutaColaborador } from "./funnel-ruta-colaborador"

interface SeccionRutaColaboradorProps {
  readonly data: EficaciaPlataformaResponse | undefined
  readonly isLoading: boolean
}

export function SeccionRutaColaborador({ data, isLoading }: SeccionRutaColaboradorProps) {
  if (isLoading || !data) {
    return <Skeleton className="h-[340px] rounded-2xl" />
  }

  const totalEvaluados = data.aptos.total + data.noAptos.total
  const presentados = data.presentadosCliente
  const pasaron = data.aptos.pasaron + data.noAptos.pasaronIgual
  const noPasaron =
    data.aptos.total -
    data.aptos.pasaron -
    data.aptos.pendientes +
    (data.noAptos.presentadosIgual - data.noAptos.pasaronIgual)

  const etapas = [
    {
      key: "evaluados",
      etiqueta: "Colaboradores evaluados",
      valor: totalEvaluados,
      tono: "neutral" as const,
    },
    {
      key: "aptos",
      etiqueta: "Calificados como apto",
      valor: data.aptos.total,
      tono: "accent" as const,
    },
    {
      key: "presentados",
      etiqueta: "Presentados al cliente",
      valor: presentados,
      tono: "accent" as const,
    },
    {
      key: "pasaron",
      etiqueta: "Aceptados por el cliente",
      valor: pasaron,
      tono: "aurora" as const,
    },
    {
      key: "noPasaron",
      etiqueta: "Rechazados por el cliente",
      valor: Math.max(0, noPasaron),
      tono: "danger" as const,
    },
  ]

  return (
    <Card tono="plano" densidad="generosa" className="flex flex-col gap-5">
      <header className="flex flex-col gap-1">
        <span className="nx-eyebrow text-aurora-violet">Ruta del colaborador</span>
        <h2 className="text-h2 text-text-primary">
          De evaluado a cliente<span className="text-aurora-violet">.</span>
        </h2>
        <p className="max-w-[640px] text-body-sm text-text-secondary">
          Conversión etapa a etapa del flujo end-to-end. La aurora marca el destino: aceptación por
          el cliente.
        </p>
      </header>
      <FunnelRutaColaborador etapas={etapas} />
    </Card>
  )
}
