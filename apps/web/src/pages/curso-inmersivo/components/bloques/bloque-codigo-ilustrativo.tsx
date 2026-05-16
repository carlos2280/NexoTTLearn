import { CodeEditorNexott } from "@/shared/components/ui/code-editor-nexott"
import { contenidoCodigoIlustrativoSchema } from "@nexott-learn/shared-types"

interface BloqueCodigoIlustrativoProps {
  readonly contenido: Record<string, unknown> | null
}

/**
 * Render del bloque CODIGO_ILUSTRATIVO. Snippet read-only con el editor
 * NexoTT (Prism + tema). El participante puede leerlo y copiarlo, pero no
 * editarlo. La descripción opcional se muestra debajo como pie técnico.
 */
export function BloqueCodigoIlustrativo({ contenido }: BloqueCodigoIlustrativoProps) {
  const parsed = contenidoCodigoIlustrativoSchema.safeParse(contenido)
  if (!parsed.success || parsed.data.codigo.trim().length === 0) {
    return null
  }
  const { lenguaje, codigo, descripcion } = parsed.data
  const lineas = codigo.split("\n").length

  return (
    <figure className="flex flex-col gap-2">
      <CodeEditorNexott
        value={codigo}
        lenguaje={lenguaje}
        readOnly={true}
        rows={Math.min(Math.max(lineas, 4), 24)}
      />
      {descripcion.trim().length > 0 ? (
        <figcaption className="text-body-sm text-text-secondary">{descripcion}</figcaption>
      ) : null}
    </figure>
  )
}
