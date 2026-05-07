import { cn } from "@/shared/lib/cn"
import { Input } from "@/shared/ui/primitives/input"
import type { SemaforoCeldaDiagnostico } from "@nexott-learn/shared-types"

export function CampoPuntaje({
  valor,
  onChange,
  objetivo,
  valido,
  semaforo,
}: {
  readonly valor: string
  readonly onChange: (v: string) => void
  readonly objetivo: number
  readonly valido: boolean
  readonly semaforo: SemaforoCeldaDiagnostico
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Input
        label="Puntaje (0–100)"
        type="number"
        min={0}
        max={100}
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        error={valor !== "" && !valido ? "Puntaje fuera de rango (0–100)" : undefined}
        autoFocus={true}
      />
      <span
        className={cn(
          "text-xs",
          semaforo === "verde" && "text-success",
          semaforo === "amarillo" && "text-warning",
          semaforo === "rojo" && "text-danger",
          semaforo === "vacio" && "text-text-muted",
        )}
      >
        Umbral del área: {objetivo}
        {valido ? ` · ${textoSemaforo(semaforo)}` : null}
      </span>
    </div>
  )
}

export function CampoObservaciones({
  valor,
  onChange,
}: {
  readonly valor: string
  readonly onChange: (v: string) => void
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-medium text-sm text-text-primary">Observaciones (opcional)</span>
      <textarea
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        maxLength={2000}
        rows={3}
        className={cn(
          "w-full resize-none rounded-[var(--radius-md)] border border-glass-border",
          "bg-glass-1 px-3.5 py-2.5 text-sm text-text-primary",
          "placeholder:text-text-faint",
          "focus-visible:border-brand-violet focus-visible:bg-glass-2 focus-visible:outline-none",
          "focus-visible:shadow-[0_0_0_4px_rgb(124_58_237/0.18)]",
        )}
      />
    </label>
  )
}

export function semaforoEnVivo(nota: number, objetivo: number): SemaforoCeldaDiagnostico {
  if (nota >= objetivo) {
    return "verde"
  }
  if (nota >= objetivo - 10) {
    return "amarillo"
  }
  return "rojo"
}

function textoSemaforo(s: SemaforoCeldaDiagnostico): string {
  if (s === "verde") {
    return "Cumple el umbral, no requiere módulo OBLIG"
  }
  if (s === "amarillo") {
    return "Cerca del umbral, sugerirá RECOMENDADO"
  }
  if (s === "rojo") {
    return "Brecha alta, sugerirá OBLIGATORIO"
  }
  return ""
}
