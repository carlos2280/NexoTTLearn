import { useListarAreas } from "@/features/catalogo/hooks/use-listar-areas"
import { useObtenerIntentoEntrevistaIaAdmin } from "@/features/entrevista-ia/hooks/use-obtener-intento-entrevista-ia-admin"
import { Button } from "@/shared/components/ui/button"
import { AlertCircle, Loader2 } from "lucide-react"
import { useParams } from "react-router-dom"
import { HeaderIntento } from "./components/header-intento"
import { NotasPorAreaCard } from "./components/notas-por-area-card"
import { ReporteEvaluadorCard } from "./components/reporte-evaluador-card"
import { SeccionTranscripcion } from "./components/seccion-transcripcion"
import { TarjetaVeredicto } from "./components/tarjeta-veredicto"

/**
 * `/admin/intentos-entrevista-ia/:intentoId` — vista admin del intento de
 * entrevista IA. Reune en una pantalla el contexto (colaborador + curso),
 * el veredicto (nota global, aprobado, ajuste manual si aplica), la rubrica
 * (notas por area) y la transcripcion completa.
 *
 * Acciones (ajustar nota, anular) llegan en la siguiente iteracion.
 */
export function IntentoEntrevistaIaDetallePage() {
  const { intentoId } = useParams<{ intentoId: string }>()
  const intento = useObtenerIntentoEntrevistaIaAdmin(intentoId ?? null)
  const areas = useListarAreas({ page: 1, pageSize: 100 })

  if (intento.isLoading || areas.isLoading) {
    return <EstadoCargando />
  }
  if (intento.error || !intento.data) {
    return <EstadoError />
  }
  const listaAreas = areas.data?.data ?? []
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-10">
      <HeaderIntento intento={intento.data} />
      <TarjetaVeredicto intento={intento.data} />
      <NotasPorAreaCard notasPorArea={intento.data.notasPorArea} areas={listaAreas} />
      <ReporteEvaluadorCard reporte={intento.data.reporteEvaluador} />
      <AccionesAdminPlaceholder />
      <SeccionTranscripcion turnos={intento.data.transcripcion} />
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

function AccionesAdminPlaceholder() {
  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-border border-dashed bg-subtle/40 p-6">
      <div className="flex flex-col gap-1">
        <span className="nx-eyebrow text-text-tertiary">Acciones</span>
        <h2 className="text-h3 text-text-primary">Ajustar o anular</h2>
        <p className="text-body-sm text-text-secondary">
          Disponible en la proxima iteracion. Por ahora la nota se calcula automaticamente desde la
          rubrica.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" size="sm" disabled={true}>
          Ajustar nota
        </Button>
        <Button variant="ghost" size="sm" disabled={true}>
          Anular intento
        </Button>
      </div>
    </section>
  )
}
