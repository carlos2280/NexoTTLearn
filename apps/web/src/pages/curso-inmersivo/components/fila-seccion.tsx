import { cn } from "@/shared/lib/cn"
import type { ModoCursoParticipante, SeccionPlanItemParticipante } from "@nexott-learn/shared-types"
import { BookOpen, Code2 } from "lucide-react"
import { calcularSeccionCompletada } from "./calcular-seccion-completada"

interface FilaSeccionProps {
  readonly titulo: string
  readonly seccionId: string
  readonly modo: ModoCursoParticipante
  readonly plan: SeccionPlanItemParticipante | null
  readonly abiertaPorAperturas: boolean
  readonly activa: boolean
  readonly onSeleccionar: (seccionId: string) => void
  readonly soloLectura: boolean
}

/**
 * Fila individual del sidebar. Un solo ícono comunica tipo + estado:
 *  - shape: BookOpen (lectura) | Code2 (sección con bloques evaluables)
 *  - color: activa → aurora-violet; completada → success desvanecido
 *    (manifiesto §07); pendiente → tertiary.
 *
 * El cálculo de `completada` vive en `calcularSeccionCompletada` para
 * mantener la decisión por modo testeada en aislado (BUG-QA-3).
 */
export function FilaSeccion({
  titulo,
  seccionId,
  modo,
  plan,
  abiertaPorAperturas,
  activa,
  onSeleccionar,
  soloLectura,
}: FilaSeccionProps) {
  const completada = calcularSeccionCompletada({
    modo,
    soloLectura,
    planCompletada: plan?.completada,
    abiertaPorAperturas,
  })
  const esOpcional = plan?.caracter === "OPCIONAL"
  const esReto = (plan?.avance?.bloquesTotales ?? 0) > 0
  const IconoTipo = esReto ? Code2 : BookOpen
  const colorIcono = activa
    ? "text-aurora-violet"
    : completada
      ? "text-success-on-soft opacity-60"
      : "text-text-tertiary"
  return (
    <li>
      <button
        type="button"
        onClick={() => onSeleccionar(seccionId)}
        aria-current={activa ? "true" : undefined}
        aria-label={ariaLabelSeccion(titulo, esReto, completada, esOpcional)}
        className={cn(
          "group flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors duration-fast ease-default",
          activa
            ? "bg-accent-soft text-accent-on-soft"
            : "text-text-secondary hover:bg-surface hover:text-text-primary",
        )}
      >
        <IconoTipo
          aria-hidden={true}
          strokeWidth={1.75}
          className={cn("mt-0.5 h-4 w-4 shrink-0", colorIcono)}
        />
        <span className="min-w-0 flex-1">
          <span
            title={titulo}
            className={cn(
              "line-clamp-2 block text-body-sm leading-tight",
              activa ? "font-semibold text-text-primary" : "",
              completada && !activa ? "text-text-tertiary" : "",
            )}
          >
            {titulo}
          </span>
          {esOpcional && !completada ? (
            <span className="block font-mono text-[10px] text-text-tertiary uppercase tracking-wider">
              opcional
            </span>
          ) : null}
        </span>
      </button>
    </li>
  )
}

function ariaLabelSeccion(
  titulo: string,
  esReto: boolean,
  completada: boolean,
  esOpcional: boolean,
): string {
  const tipo = esReto ? "Sección con reto" : "Sección de lectura"
  const estado = completada ? "completada" : "pendiente"
  const opcional = esOpcional ? ", opcional" : ""
  return `${tipo}${opcional}, ${estado}: ${titulo}`
}
