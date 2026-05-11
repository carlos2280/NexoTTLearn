import type { CursoDetalle } from "@nexott-learn/shared-types"

interface CursoDetalleResumenProps {
  readonly curso: CursoDetalle
  readonly nombreCliente: string | undefined
}

function formatearFecha(iso: string): string {
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

interface FilaDato {
  readonly etiqueta: string
  readonly valor: string
}

export function CursoDetalleResumen({ curso, nombreCliente }: CursoDetalleResumenProps) {
  const datos: readonly FilaDato[] = [
    { etiqueta: "Cliente", valor: nombreCliente ?? curso.clienteId },
    { etiqueta: "Fecha de inicio", valor: formatearFecha(curso.fechaInicio) },
    { etiqueta: "Deadline", valor: formatearFecha(curso.fechaDeadline) },
    {
      etiqueta: "Voluntarios habilitados",
      valor: curso.toggleVoluntarios ? "Sí" : "No",
    },
    {
      etiqueta: "Cierre automático",
      valor: curso.toggleCierreAutomatico ? "Sí" : "No",
    },
    {
      etiqueta: "Umbral No cumple",
      valor: `${curso.umbralNoCumple}%`,
    },
    {
      etiqueta: "Pesos (bloques / transversal / entrevista)",
      valor: `${curso.pesoBloques}% / ${curso.pesoTransversal}% / ${curso.pesoEntrevista}%`,
    },
    { etiqueta: "Desbloqueo", valor: curso.desbloqueo },
  ]

  return (
    <div className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
      {datos.map((d) => (
        <div key={d.etiqueta} className="flex flex-col">
          <span className="text-caption text-text-tertiary uppercase tracking-wide">
            {d.etiqueta}
          </span>
          <span className="text-body-sm text-text-primary">{d.valor}</span>
        </div>
      ))}
    </div>
  )
}
