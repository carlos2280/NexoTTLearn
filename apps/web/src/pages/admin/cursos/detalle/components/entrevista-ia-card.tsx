import { EmptyState } from "@/shared/ui/patterns/empty-state"
import { SectionCard } from "@/shared/ui/patterns/section-card"
import { Alert } from "@/shared/ui/primitives/alert"
import { Divider } from "@/shared/ui/primitives/divider"
import type { EntrevistaIADetalleAdmin } from "@nexott-learn/shared-types"
import { MessageCircle } from "lucide-react"

interface EntrevistaIACardProps {
  readonly activa: boolean
  readonly entrevista: EntrevistaIADetalleAdmin | null | undefined
  readonly loading: boolean
  readonly error: Error | null
}

export function EntrevistaIACard({ activa, entrevista, loading, error }: EntrevistaIACardProps) {
  if (!activa) {
    return (
      <SectionCard
        icon={MessageCircle}
        iconTone="violet"
        title="Entrevista Final IA"
        description="No configurada para este curso."
      >
        <EmptyState
          variant="inline"
          icon={MessageCircle}
          title="Sin entrevista IA"
          description="Activa esta sección si el cliente requiere validación final con IA."
        />
      </SectionCard>
    )
  }

  if (loading) {
    return (
      <SectionCard
        icon={MessageCircle}
        iconTone="violet"
        title="Entrevista Final IA"
        loading={true}
      />
    )
  }

  if (error) {
    return (
      <SectionCard icon={MessageCircle} iconTone="violet" title="Entrevista Final IA">
        <Alert variant="error">
          <p className="font-semibold text-sm">No pudimos cargar la entrevista IA</p>
          <p className="mt-1 text-sm text-text-secondary">{error.message}</p>
        </Alert>
      </SectionCard>
    )
  }

  if (!entrevista) {
    return (
      <SectionCard icon={MessageCircle} iconTone="violet" title="Entrevista Final IA">
        <Alert variant="warning">
          <p className="font-semibold text-sm">Configuración pendiente</p>
          <p className="mt-1 text-sm text-text-secondary">
            La entrevista IA está marcada como activa pero aún no tiene contenido.
          </p>
        </Alert>
      </SectionCard>
    )
  }

  return (
    <SectionCard
      icon={MessageCircle}
      iconTone="violet"
      title="Entrevista Final IA"
      description="Validación final con cliente simulado por IA"
    >
      <CampoTexto label="Perfil del cliente" value={entrevista.perfilCliente} />
      <CampoTexto label="Contexto de negocio" value={entrevista.contextoNegocio} />

      <Divider />

      <div className="flex flex-col gap-3">
        <p className="font-semibold text-[11px] text-text-muted uppercase tracking-wider">
          Parámetros de ejecución
        </p>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
          <ParamItem label="Modo" value={entrevista.modo === "TEXTO" ? "Texto" : "Voz"} />
          <ParamItem label="Preguntas" value={String(entrevista.numeroPreguntas)} />
          <ParamItem label="Máx. intentos" value={String(entrevista.maxIntentos)} />
          <ParamItem label="Umbral aprobación" value={`≥ ${entrevista.umbralAprobacion}`} />
        </div>
      </div>

      <Alert variant="info">
        <p className="font-semibold text-sm">Rúbrica por área del curso</p>
        <p className="mt-1 text-sm text-text-secondary">
          La configuración de pesos por área se habilitará en la siguiente iteración.
        </p>
      </Alert>
    </SectionCard>
  )
}

function CampoTexto({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="font-semibold text-[11px] text-text-muted uppercase tracking-wider">{label}</p>
      <p className="max-w-[70ch] text-sm text-text-secondary leading-relaxed">{value}</p>
    </div>
  )
}

function ParamItem({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-text-muted text-xs">{label}</span>
      <span className="font-bold text-base text-text-primary tabular-nums">{value}</span>
    </div>
  )
}
