import { useChecklistCacheado } from "@/features/admin-cursos/hooks/use-editor-curso"
import { PublishBanner } from "@/shared/ui/patterns/immersive/publish-banner"
import type { CursoDetalle } from "@nexott-learn/shared-types"
import { ChevronDown, Sparkles } from "lucide-react"
import { formatDate } from "../lib/format-date"
import { useEditorStore } from "../use-editor-store"

interface EditorBannerProps {
  readonly curso: CursoDetalle
  readonly cursoId: string
  readonly onPublish: () => void
}

export function EditorBanner({ curso, cursoId, onPublish }: EditorBannerProps) {
  const openChecklist = useEditorStore((s) => s.openChecklist)
  const checklist = useChecklistCacheado(cursoId)

  if (curso.estado === "ACTIVO") {
    return (
      <PublishBanner
        variant="activo"
        message={`Curso ACTIVO desde ${formatDate(curso.publicadoAt)}`}
        secondary={`${curso.contadores.inscripcionesActivas} candidatos`}
      />
    )
  }
  if (curso.estado === "CERRADO") {
    return (
      <PublishBanner
        variant="cerrado"
        message={`Cerrado el ${formatDate(curso.cerradoAt)}`}
        secondary="Solo lectura"
      />
    )
  }

  // BORRADOR · 3 sub-estados segun cache del checklist.
  if (checklist?.caso === "A_FALTANTES") {
    const total = checklist.faltantes.length + checklist.cumplidos.length
    const listos = checklist.cumplidos.length
    return (
      <PublishBanner
        variant="borrador-falta"
        message={`${listos}/${total} listo para publicar`}
        secondary={`${checklist.faltantes.length} faltantes`}
        action={<ChecklistCta label="Ver checklist" onClick={openChecklist} icon="caret" />}
      />
    )
  }
  if (checklist?.caso === "B_OK") {
    return (
      <PublishBanner
        variant="borrador-listo"
        message="Listo para publicar"
        action={<ChecklistCta label="Publicar curso →" onClick={onPublish} icon="spark" />}
      />
    )
  }
  return (
    <PublishBanner
      variant="borrador-falta"
      message="Borrador en armado"
      secondary="Verifica el checklist antes de publicar"
      action={<ChecklistCta label="Verificar checklist" onClick={openChecklist} icon="caret" />}
    />
  )
}

function ChecklistCta({
  label,
  onClick,
  icon,
}: {
  readonly label: string
  readonly onClick: () => void
  readonly icon: "caret" | "spark"
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 font-semibold text-[11px] text-brand-violet-soft uppercase tracking-wider hover:text-brand-violet"
    >
      {icon === "spark" ? (
        <Sparkles className="size-3" strokeWidth={2} />
      ) : (
        <ChevronDown className="size-3" strokeWidth={2} />
      )}
      {label}
    </button>
  )
}
