import { descargarMiFicha, dispararDescargaFicha } from "@/features/me/api/exportar-ficha.api"
import { Button } from "@/shared/components/ui/button"
import { Tooltip } from "@/shared/components/ui/tooltip"
import type { FormatoExportFicha } from "@nexott-learn/shared-types"
import { Database, FileText, ShieldCheck } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

export function TabPrivacidad() {
  const [descargando, setDescargando] = useState<FormatoExportFicha | null>(null)

  function avisoProximamente(): void {
    toast.info("Función disponible próximamente")
  }

  async function descargar(formato: FormatoExportFicha): Promise<void> {
    setDescargando(formato)
    try {
      const payload = await descargarMiFicha(formato)
      dispararDescargaFicha(payload)
    } catch (_err) {
      toast.error("No se pudo descargar la ficha. Reintenta en un momento.")
    } finally {
      setDescargando(null)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-5 rounded-lg border border-border bg-surface p-5">
        <header className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent-soft text-accent-on-soft">
            <Database className="h-4 w-4" strokeWidth={1.5} aria-hidden={true} />
          </div>
          <div className="flex flex-col">
            <h2 className="text-h3 text-text-primary">Tus datos</h2>
            <p className="text-body-sm text-text-secondary">
              Llévate una copia de tu información cuando la necesites. Incluye skills, cursos y
              evidencia.
            </p>
          </div>
        </header>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            isLoading={descargando === "csv"}
            disabled={descargando !== null}
            onClick={() => {
              descargar("csv").catch(() => undefined)
            }}
          >
            Exportar como CSV
          </Button>
          <Button
            variant="secondary"
            size="sm"
            isLoading={descargando === "pdf"}
            disabled={descargando !== null}
            onClick={() => {
              descargar("pdf").catch(() => undefined)
            }}
          >
            Exportar como PDF
          </Button>
        </div>
      </section>

      <section className="flex flex-col gap-5 rounded-lg border border-border bg-surface p-5">
        <header className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent-soft text-accent-on-soft">
            <ShieldCheck className="h-4 w-4" strokeWidth={1.5} aria-hidden={true} />
          </div>
          <div className="flex flex-col">
            <h2 className="text-h3 text-text-primary">Tus derechos</h2>
            <p className="text-body-sm text-text-secondary">
              NexoTT Learn cumple con la normativa de protección de datos. Como persona registrada,
              tienes derecho a:
            </p>
          </div>
        </header>

        <ul className="flex flex-col gap-2 pl-1 text-body-sm text-text-secondary">
          <li className="flex gap-2">
            <span aria-hidden={true} className="text-text-tertiary">
              ·
            </span>
            Acceder a tus datos personales.
          </li>
          <li className="flex gap-2">
            <span aria-hidden={true} className="text-text-tertiary">
              ·
            </span>
            Solicitar correcciones cuando algo no coincida con la realidad.
          </li>
          <li className="flex gap-2">
            <span aria-hidden={true} className="text-text-tertiary">
              ·
            </span>
            Solicitar la anonimización de tu cuenta (contacta al administrador).
          </li>
          <li className="flex gap-2">
            <span aria-hidden={true} className="text-text-tertiary">
              ·
            </span>
            Exportar tu información (botón de arriba).
          </li>
        </ul>

        <div>
          <Tooltip contenido="Próximamente">
            <button
              type="button"
              onClick={avisoProximamente}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-sm text-accent text-body-sm transition-colors duration-base ease-default hover:underline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
            >
              <FileText className="h-4 w-4" strokeWidth={1.5} aria-hidden={true} />
              Ver política de privacidad
            </button>
          </Tooltip>
        </div>
      </section>

      <p className="text-caption text-text-tertiary">
        Para solicitar la eliminación o corrección de datos personales, escribe al administrador.
      </p>
    </div>
  )
}
