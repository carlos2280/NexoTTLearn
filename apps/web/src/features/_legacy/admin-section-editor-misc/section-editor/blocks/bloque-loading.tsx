import { NxtSkeleton } from "@carlos2280/nexott-ui/react"

// Placeholder visual mientras se carga el payload del contenido. Un solo
// skeleton de altura proporcional al editor; el detalle real lo monta el
// componente del bloque al llegar la query.
export function BloqueLoading() {
  return (
    <div className="bloque-loading">
      <NxtSkeleton variant="card" />
    </div>
  )
}
