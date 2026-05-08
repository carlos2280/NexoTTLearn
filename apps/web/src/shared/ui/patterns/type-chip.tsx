import { cn } from "@/shared/lib/cn"

export type TypeChipTone =
  | "indigo"
  | "emerald"
  | "slate"
  | "rose"
  | "sky"
  | "violet"
  | "amber"
  | "fuchsia"

interface TypeChipProps {
  readonly tone: TypeChipTone
  readonly children: string
  readonly className?: string
}

// Pill ghost por tipo de actividad. Reusable en bandeja, /cursos, expediente.
// Tonos coinciden con los gradientes de stream-item por tipo (IDENTIDAD §03.2).
export function TypeChip({ tone, children, className }: TypeChipProps) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 font-medium text-[10.5px] uppercase tracking-[0.06em]",
        TONE_CLASSES[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

const TONE_CLASSES: Record<TypeChipTone, string> = {
  indigo: "border-indigo-400/25 bg-indigo-500/10 text-indigo-300",
  emerald: "border-emerald-400/25 bg-emerald-500/10 text-emerald-300",
  slate: "border-slate-400/25 bg-slate-500/10 text-slate-300",
  rose: "border-rose-400/25 bg-rose-500/10 text-rose-300",
  sky: "border-sky-400/25 bg-sky-500/10 text-sky-300",
  violet: "border-violet-400/25 bg-violet-500/10 text-violet-300",
  amber: "border-amber-400/25 bg-amber-500/10 text-amber-300",
  fuchsia: "border-fuchsia-400/25 bg-fuchsia-500/10 text-fuchsia-300",
}
