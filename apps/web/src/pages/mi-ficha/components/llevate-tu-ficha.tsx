import { descargarMiFicha, dispararDescargaFicha } from "@/features/me/api/exportar-ficha.api"
import { Button } from "@/shared/components/ui/button"
import { ArrowDownToLine } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

/**
 * Cierre narrativo de /mi-ficha. La ficha es para leer; este bloque es para
 * llevarsela. CTA aurora cumbre porque es un momento de marca: el reporte
 * PDF condensa el viaje del colaborador con identidad NexoTT y se puede
 * compartir con un manager, RRHH o el propio cliente.
 */
export function LlevateTuFicha() {
  const [descargando, setDescargando] = useState(false)

  async function descargar(): Promise<void> {
    setDescargando(true)
    try {
      const payload = await descargarMiFicha("pdf")
      dispararDescargaFicha(payload)
    } catch (_err) {
      toast.error("No pudimos generar tu reporte. Reintenta en un momento.")
    } finally {
      setDescargando(false)
    }
  }

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-6">
      <header className="flex flex-col gap-1.5">
        <span className="nx-eyebrow text-text-tertiary">Llevate tu ficha</span>
        <h2 className="text-h2 text-text-primary">Tu carta de presentacion en un PDF.</h2>
      </header>

      <p className="text-body-sm text-text-secondary">
        Un reporte de una pagina con tu camino y las capacidades que has demostrado. Comparteselo a
        un manager, a RRHH o al cliente cuando lo necesites.
      </p>

      <div>
        <Button
          variant="aurora"
          size="sm"
          isLoading={descargando}
          disabled={descargando}
          onClick={() => {
            descargar().catch(() => undefined)
          }}
        >
          <ArrowDownToLine className="mr-2 h-4 w-4" aria-hidden={true} />
          Descargar mi reporte
        </Button>
      </div>
    </section>
  )
}
