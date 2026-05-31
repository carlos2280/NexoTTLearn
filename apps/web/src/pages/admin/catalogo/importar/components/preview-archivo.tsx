import { Button } from "@/shared/components/ui/button"

interface PreviewArchivoProps {
  readonly nombre: string
  readonly tamanoBytes: number
  readonly contenido: string
  readonly onQuitar: () => void
}

/**
 * Resumen del archivo cargado: nombre + tamaño + preview de las primeras
 * 20 líneas del MD. El admin valida visualmente que sea el archivo correcto
 * antes de pulsar "Importar".
 */
export function PreviewArchivo({ nombre, tamanoBytes, contenido, onQuitar }: PreviewArchivoProps) {
  const primerasLineas = contenido.split("\n").slice(0, 20).join("\n")
  const tamanoKb = (tamanoBytes / 1024).toFixed(1)

  return (
    <div className="rounded-xl border border-border bg-surface">
      <div className="flex items-center justify-between gap-3 border-border border-b px-5 py-3">
        <div className="flex flex-col">
          <span className="font-medium text-body text-text-primary">{nombre}</span>
          <span className="text-caption text-text-tertiary">{tamanoKb} KB</span>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={onQuitar}>
          Quitar
        </Button>
      </div>
      <pre className="max-h-[280px] overflow-auto rounded-b-xl bg-subtle px-5 py-4 font-mono text-caption text-text-secondary">
        {primerasLineas}
        {contenido.split("\n").length > 20 ? "\n…" : ""}
      </pre>
    </div>
  )
}
