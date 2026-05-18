import { cn } from "@/shared/lib/cn"
import type { ModoCursoParticipante, SeccionPlanItemParticipante } from "@nexott-learn/shared-types"
import { calcularSeccionCompletada } from "./calcular-seccion-completada"
import { IconoEstadoSeccion } from "./icono-estado-seccion"

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
 * Fila individual del sidebar (una seccion). El calculo de `completada` vive
 * en `calcularSeccionCompletada` para mantener la decision por modo testeada
 * en aislado (BUG-QA-3).
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
  return (
    <li>
      <button
        type="button"
        onClick={() => onSeleccionar(seccionId)}
        aria-current={activa ? "true" : undefined}
        className={cn(
          "group flex w-full items-start gap-3 rounded-lg px-2.5 py-2 text-left transition-colors duration-fast ease-default",
          activa
            ? "bg-accent-soft text-accent-on-soft"
            : "text-text-secondary hover:bg-surface hover:text-text-primary",
        )}
      >
        <IconoEstadoSeccion
          completada={completada}
          esOpcional={esOpcional}
          activa={activa}
          modo={modo}
        />
        <span className="min-w-0 flex-1">
          <span
            className={cn(
              "block truncate text-body-sm",
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
