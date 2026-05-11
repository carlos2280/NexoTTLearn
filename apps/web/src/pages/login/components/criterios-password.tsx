import { cn } from "@/shared/lib/cn"
import { Check, X } from "lucide-react"

interface Criterio {
  readonly key: string
  readonly label: string
  readonly test: (value: string) => boolean
}

const REGEX_MAYUSCULA = /[A-Z]/
const REGEX_MINUSCULA = /[a-z]/
const REGEX_DIGITO = /\d/

export const CRITERIOS_PASSWORD: readonly Criterio[] = [
  { key: "len", label: "Al menos 10 caracteres", test: (v) => v.length >= 10 },
  { key: "upper", label: "Una mayúscula", test: (v) => REGEX_MAYUSCULA.test(v) },
  { key: "lower", label: "Una minúscula", test: (v) => REGEX_MINUSCULA.test(v) },
  { key: "digit", label: "Un número", test: (v) => REGEX_DIGITO.test(v) },
] as const

export function cumpleTodosLosCriterios(valor: string): boolean {
  return CRITERIOS_PASSWORD.every((c) => c.test(valor))
}

interface CriteriosPasswordProps {
  readonly valor: string
}

export function CriteriosPassword({ valor }: CriteriosPasswordProps) {
  return (
    <ul className="flex flex-col gap-1">
      {CRITERIOS_PASSWORD.map((c) => {
        const ok = c.test(valor)
        return (
          <li
            key={c.key}
            className={cn(
              "flex items-center gap-2 text-caption transition-colors duration-fast",
              ok ? "text-success" : "text-text-tertiary",
            )}
          >
            {ok ? (
              <Check className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            <span>{c.label}</span>
          </li>
        )
      })}
    </ul>
  )
}
