import type { PreviewCambioAreaResponse } from "@nexott-learn/shared-types"

export function SkillsPreviewImpacto({ preview }: { readonly preview: PreviewCambioAreaResponse }) {
  return (
    <div className="flex flex-col gap-3 rounded-md border border-border bg-subtle/40 px-4 py-3">
      <p className="text-body-sm text-text-secondary">
        <strong className="tabular text-text-primary">{preview.impacto.totalReferencias}</strong>{" "}
        referencias se verán afectadas:
      </p>
      <ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-caption text-text-secondary">
        <li>
          <span className="text-text-tertiary">Cursos:</span>{" "}
          <span className="tabular text-text-primary">
            {preview.impacto.cursosAfectados.length}
          </span>
        </li>
        <li>
          <span className="text-text-tertiary">Módulos:</span>{" "}
          <span className="tabular text-text-primary">
            {preview.impacto.modulosAfectados.length}
          </span>
        </li>
        <li>
          <span className="text-text-tertiary">Secciones:</span>{" "}
          <span className="tabular text-text-primary">{preview.impacto.seccionesAfectadas}</span>
        </li>
        <li>
          <span className="text-text-tertiary">Bloques:</span>{" "}
          <span className="tabular text-text-primary">{preview.impacto.bloquesAfectados}</span>
        </li>
      </ul>
    </div>
  )
}
