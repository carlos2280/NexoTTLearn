import { Button } from "@/shared/ui/primitives/button"
import { ArrowLeft } from "lucide-react"

interface EditorErrorProps {
  readonly onBack: () => void
}

export function EditorError({ onBack }: EditorErrorProps) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-surface-0">
      <div className="flex max-w-sm flex-col items-center gap-3 rounded-[var(--radius-lg)] border border-danger/30 bg-danger/5 px-6 py-6 text-center">
        <p className="font-medium text-danger text-sm">No se pudo cargar el curso</p>
        <Button variant="outline" size="sm" onClick={onBack}>
          <ArrowLeft className="size-3.5" />
          Volver a la lista
        </Button>
      </div>
    </div>
  )
}
