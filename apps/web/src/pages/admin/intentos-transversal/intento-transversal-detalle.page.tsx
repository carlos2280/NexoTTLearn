import { useObtenerIntentoTransversalAdmin } from "@/features/transversal/hooks/use-obtener-intento-transversal-admin"
import { AlertCircle, Loader2 } from "lucide-react"
import { useParams } from "react-router-dom"
import { AccionesAdminTransversal } from "./components/acciones-admin-transversal"
import { CapasCard } from "./components/capas-card"
import { EntregaCard } from "./components/entrega-card"
import { HeaderIntentoTransversal } from "./components/header-intento-transversal"
import { VeredictoCard } from "./components/veredicto-card"

/**
 * `/admin/intentos-transversal/:intentoId` — vista admin del intento del
 * proyecto transversal. Reune contexto (colaborador + curso + proyecto), lo
 * entregado (repo + comentario), veredicto (estado + nota global), las 3
 * capas de evaluacion (con sus dialogs) y las acciones (finalizar / anular).
 */
export function IntentoTransversalDetallePage() {
  const { intentoId } = useParams<{ intentoId: string }>()
  const intento = useObtenerIntentoTransversalAdmin(intentoId ?? null)

  if (intento.isLoading) {
    return <EstadoCargando />
  }
  if (intento.error || !intento.data) {
    return <EstadoError />
  }
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-10">
      <HeaderIntentoTransversal intento={intento.data} />
      <EntregaCard intento={intento.data} />
      <VeredictoCard intento={intento.data} />
      <CapasCard intento={intento.data} />
      <AccionesAdminTransversal intento={intento.data} />
    </main>
  )
}

function EstadoCargando() {
  return (
    <main className="flex flex-1 items-center justify-center py-20">
      <Loader2 className="h-5 w-5 animate-spin text-text-tertiary" aria-label="Cargando intento" />
    </main>
  )
}

function EstadoError() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col items-start gap-3 px-6 py-20">
      <span className="nx-eyebrow inline-flex items-center gap-2 text-text-tertiary">
        <AlertCircle className="h-3.5 w-3.5" aria-hidden={true} />
        Intento no disponible
      </span>
      <h1 className="text-h1 text-text-primary">No pudimos cargar este intento.</h1>
      <p className="text-body-sm text-text-secondary">
        Puede haber sido borrado o no tienes permisos para verlo. Reintenta en un momento.
      </p>
    </main>
  )
}
