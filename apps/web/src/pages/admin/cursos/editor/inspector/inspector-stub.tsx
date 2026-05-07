import { InspectorPanel } from "@/shared/ui/patterns/immersive/inspector"
import { Wrench } from "lucide-react"

interface InspectorStubProps {
  readonly eyebrow: string
  readonly title: string
  readonly description: string
}

/**
 * Placeholder de inspectores que aún no tienen edición funcional. Mantiene
 * visualmente coherente la pantalla en el primer avance, sin esconder que
 * el modo está pendiente de detalle.
 */
export function InspectorStub({ eyebrow, title, description }: InspectorStubProps) {
  return (
    <InspectorPanel eyebrow={eyebrow} title={title}>
      <div className="flex flex-col items-start gap-2 rounded-[var(--radius-md)] border border-glass-border border-dashed bg-glass-1 px-4 py-5">
        <Wrench className="size-4 text-text-muted" strokeWidth={1.6} />
        <p className="text-text-secondary text-xs">{description}</p>
      </div>
    </InspectorPanel>
  )
}
