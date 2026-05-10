import { PageHeader } from "@/shared/ui/patterns/page-header"
import { useParams } from "react-router-dom"

export function FichaParticipantePage() {
  const { id } = useParams<{ id: string }>()

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 md:py-10 lg:px-8">
      <div className="flex flex-col gap-8">
        <PageHeader
          eyebrow="Seguimiento"
          title="Ficha del participante"
          subtitle={id ? `Participante: ${id}` : "Sin id."}
        />
      </div>
    </main>
  )
}
