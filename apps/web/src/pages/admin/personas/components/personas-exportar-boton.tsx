import { useExportarPersonas } from "@/features/personas/hooks/use-exportar-personas"
import { ApiError } from "@/shared/api/api-error"
import { Button } from "@/shared/components/ui/button"
import { MenuAcciones } from "@/shared/components/ui/menu-acciones"
import type {
  ExportarColaboradoresQuery,
  FormatoExportColaboradores,
} from "@nexott-learn/shared-types"
import { Download, FileSpreadsheet, FileText } from "lucide-react"
import { toast } from "sonner"

interface PersonasExportarBotonProps {
  readonly construirQuery: (formato: FormatoExportColaboradores) => ExportarColaboradoresQuery
}

export function PersonasExportarBoton({ construirQuery }: PersonasExportarBotonProps) {
  const exportar = useExportarPersonas()

  async function descargar(formato: FormatoExportColaboradores) {
    try {
      const payload = await exportar.mutateAsync(construirQuery(formato))
      toast.success(`Descargado «${payload.nombreArchivo}»`)
    } catch (err) {
      if (err instanceof ApiError || err instanceof Error) {
        toast.error(err.message)
        return
      }
      toast.error("No se pudo descargar")
    }
  }

  const grupos = [
    [
      {
        id: "csv",
        etiqueta: "Descargar CSV",
        icono: FileText,
        onClick: () => {
          descargar("csv").catch(() => undefined)
        },
      },
      {
        id: "xlsx",
        etiqueta: "Descargar Excel (XLSX)",
        icono: FileSpreadsheet,
        onClick: () => {
          descargar("xlsx").catch(() => undefined)
        },
      },
    ],
  ] as const

  return (
    <MenuAcciones
      etiquetaAria="Exportar colaboradores"
      grupos={grupos}
      trigger={
        <Button variant="secondary" size="sm" isLoading={exportar.isPending}>
          <Download className="h-4 w-4" strokeWidth={1.5} aria-hidden={true} />
          Exportar
        </Button>
      }
    />
  )
}
