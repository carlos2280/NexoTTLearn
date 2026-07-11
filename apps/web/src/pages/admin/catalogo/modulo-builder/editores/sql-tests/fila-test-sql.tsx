import { cn } from "@/shared/lib/cn"
import { extraerTextoPlano } from "@/shared/lib/sanitize-html"
import { ChevronDown, ChevronRight, Eye, EyeOff } from "lucide-react"
import { FilaTestSqlDetalle } from "./fila-test-sql-detalle"

/**
 * Un caso de test SQL. Espejo estructural de `TestUnit` (CODIGO) pero con la
 * semántica del contrato `testSqlSchema`: cada test trae su propia
 * `consultaReferencia` (la SQL correcta) y una `esquemaSemilla` opcional; no
 * hay entrada/salida de texto porque el runner compara conjuntos de filas.
 */
export interface TestSqlUnit {
  readonly id: string
  readonly descripcion: string
  readonly esquemaSemilla: string
  readonly consultaReferencia: string
  readonly visible: boolean
  readonly ordenImporta: boolean
}

interface FilaTestSqlProps {
  readonly test: TestSqlUnit
  readonly numero: number
  readonly expandido: boolean
  readonly onAlternar: () => void
  readonly onCambiar: (siguiente: TestSqlUnit) => void
  readonly onEliminar: () => void
}

export function FilaTestSql({
  test,
  numero,
  expandido,
  onAlternar,
  onCambiar,
  onEliminar,
}: FilaTestSqlProps) {
  const resumen = extraerTextoPlano(test.descripcion)
  return (
    <li className="rounded-lg border border-border bg-surface shadow-xs">
      <button
        type="button"
        onClick={onAlternar}
        className="flex w-full items-center gap-2 rounded-lg px-4 py-3 text-left transition-colors duration-fast ease-default hover:bg-subtle/40"
      >
        <span className="text-text-tertiary">
          {expandido ? (
            <ChevronDown className="h-4 w-4" strokeWidth={1.5} aria-hidden={true} />
          ) : (
            <ChevronRight className="h-4 w-4" strokeWidth={1.5} aria-hidden={true} />
          )}
        </span>
        <span className="tabular shrink-0 text-caption text-text-tertiary">{numero}.</span>
        <span className="flex-1 truncate font-medium text-body-sm text-text-primary">
          {resumen.length > 0 ? (
            resumen
          ) : (
            <span className="text-text-tertiary">Sin descripción</span>
          )}
        </span>
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-pill px-2 py-0.5 text-caption",
            test.visible ? "bg-info-soft text-info-on-soft" : "bg-subtle text-text-secondary",
          )}
        >
          {test.visible ? (
            <Eye className="h-3 w-3" strokeWidth={1.5} aria-hidden={true} />
          ) : (
            <EyeOff className="h-3 w-3" strokeWidth={1.5} aria-hidden={true} />
          )}
          {test.visible ? "Público" : "Oculto"}
        </span>
      </button>

      {expandido ? (
        <FilaTestSqlDetalle test={test} onCambiar={onCambiar} onEliminar={onEliminar} />
      ) : null}
    </li>
  )
}

export function testSqlVacio(): TestSqlUnit {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2, 12)
  return {
    id,
    descripcion: "",
    esquemaSemilla: "",
    consultaReferencia: "",
    visible: true,
    ordenImporta: false,
  }
}
