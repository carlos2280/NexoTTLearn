import { cn } from "@/shared/lib/cn"
import { Check } from "lucide-react"

interface Criterio {
  readonly key: string
  readonly label: string
  readonly test: (value: string) => boolean
}

const REGEX_MAYUSCULA = /[A-Z]/
const REGEX_MINUSCULA = /[a-z]/
const REGEX_DIGITO = /\d/

export const CRITERIOS_PASSWORD: readonly Criterio[] = [
  { key: "len", label: "10 caracteres", test: (v) => v.length >= 10 },
  { key: "upper", label: "mayúscula", test: (v) => REGEX_MAYUSCULA.test(v) },
  { key: "lower", label: "minúscula", test: (v) => REGEX_MINUSCULA.test(v) },
  { key: "digit", label: "número", test: (v) => REGEX_DIGITO.test(v) },
] as const

export function cumpleTodosLosCriterios(valor: string): boolean {
  return CRITERIOS_PASSWORD.every((c) => c.test(valor))
}

interface CriteriosPasswordProps {
  readonly valor: string
}

/**
 * Lista discreta de criterios bajo la nueva contraseña.
 * Sin barras decorativas, sin chips. Una sola línea en mono fino.
 * Cumplido = se desvanece (lo difícil ya pasó). Pendiente = respira sutil.
 */
export function CriteriosPassword({ valor }: CriteriosPasswordProps) {
  const cumplidos = CRITERIOS_PASSWORD.filter((c) => c.test(valor)).length
  const total = CRITERIOS_PASSWORD.length

  return (
    <div
      className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-1 font-mono text-[11px]"
      aria-live="polite"
      aria-label={`${cumplidos} de ${total} criterios cumplidos`}
    >
      {CRITERIOS_PASSWORD.map((c) => {
        const ok = c.test(valor)
        return (
          <span
            key={c.key}
            className={cn(
              "inline-flex items-center gap-1.5 transition-[opacity,color] duration-base ease-default",
              ok ? "text-text-tertiary opacity-55" : "text-text-secondary",
            )}
          >
            {ok ? (
              <Check
                className="h-3 w-3 shrink-0"
                style={{ color: "var(--color-state-solido)" }}
                aria-hidden={true}
              />
            ) : (
              <span className="h-1 w-1 shrink-0 rounded-pill bg-text-tertiary" aria-hidden={true} />
            )}
            <span>{c.label}</span>
          </span>
        )
      })}
    </div>
  )
}
