import { cn } from "@/shared/lib/cn"
import { AnimatePresence, motion } from "framer-motion"
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
  const cumplidos = CRITERIOS_PASSWORD.filter((c) => c.test(valor)).length
  const progreso = cumplidos / CRITERIOS_PASSWORD.length

  return (
    <div className="flex flex-col gap-2">
      {/* Barra de fuerza — refuerzo visual; los chips son la fuente para a11y. */}
      <div aria-hidden="true" className="relative h-1 overflow-hidden rounded-pill bg-subtle">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-pill bg-[image:var(--gradient-aurora)]"
          initial={{ width: 0 }}
          animate={{ width: `${progreso * 100}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 20, mass: 0.6 }}
        />
      </div>

      {/* Chips de criterios */}
      <ul className="flex flex-wrap gap-1.5">
        {CRITERIOS_PASSWORD.map((c) => {
          const ok = c.test(valor)
          return (
            <li
              key={c.key}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-pill border px-2.5 py-1 text-caption",
                "transition-colors duration-base ease-default",
                ok
                  ? "border-aurora-cyan/40 bg-[rgb(var(--color-aurora-cyan-rgb)/0.1)] text-aurora-cyan"
                  : "border-border bg-subtle text-text-tertiary",
              )}
            >
              <span className="relative flex h-3.5 w-3.5 items-center justify-center">
                <AnimatePresence mode="wait" initial={false}>
                  {ok ? (
                    <motion.span
                      key="ok"
                      initial={{ scale: 0, rotate: -45 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0, rotate: 45 }}
                      transition={{ type: "spring", stiffness: 240, damping: 16 }}
                      className="absolute"
                      aria-hidden="true"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </motion.span>
                  ) : (
                    <motion.span
                      key="pending"
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.5, opacity: 0 }}
                      transition={{ duration: 0.18 }}
                      className="absolute h-1.5 w-1.5 rounded-pill bg-current"
                      aria-hidden="true"
                    />
                  )}
                </AnimatePresence>
              </span>
              <span>{c.label}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
