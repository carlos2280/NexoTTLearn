import { Banner } from "@/shared/components/ui/banner"
import { Button } from "@/shared/components/ui/button"
import { Download } from "lucide-react"
import { useState } from "react"
import { useDescargarTemplate } from "../hooks/use-mutaciones-evaluacion"

interface FlujoPasoDescargarProps {
  readonly cursoId: string
  readonly nombreCurso: string
  readonly onContinuar: () => void
}

function disparaDescarga(blob: Blob, nombre: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = nombre
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function slugCurso(nombre: string): string {
  return nombre
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60)
}

export function FlujoPasoDescargar({ cursoId, nombreCurso, onContinuar }: FlujoPasoDescargarProps) {
  const descargar = useDescargarTemplate()
  const [descargado, setDescargado] = useState(false)
  const errorApi = descargar.error

  async function manejarDescarga(): Promise<void> {
    try {
      const blob = await descargar.mutateAsync(cursoId)
      const hoy = new Date().toISOString().slice(0, 10)
      disparaDescarga(blob, `eval-inicial-${slugCurso(nombreCurso)}-${hoy}.xlsx`)
      setDescargado(true)
    } catch {
      // El error queda en descargar.error
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-body-sm text-text-secondary">
        Descarga el template Excel con los asignados del curso y las skills exigidas. Cuando lo
        tengas relleno, vuelve aquí para subirlo.
      </p>

      {errorApi ? (
        <Banner tone="danger" title="No se pudo generar el template">
          {errorApi.message}
        </Banner>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={manejarDescarga}
          isLoading={descargar.isPending}
        >
          <Download className="h-4 w-4" strokeWidth={1.5} aria-hidden={true} />
          Descargar template
        </Button>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={!descargado}
          onClick={onContinuar}
        >
          Ya lo tengo relleno, continuar
        </Button>
      </div>
    </div>
  )
}
