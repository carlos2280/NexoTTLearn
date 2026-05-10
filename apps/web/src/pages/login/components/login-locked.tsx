import { RUTAS } from "@/shared/constants/rutas"
import { useCountdown } from "@/shared/hooks/use-countdown"
import { Button } from "@/shared/ui/primitives/button"
import { ShieldAlert } from "lucide-react"
import type { ReactElement } from "react"
import { Link } from "react-router-dom"

interface LoginLockedProps {
  readonly retryAfterSeconds: number
  readonly onUnlocked: () => void
}

export function LoginLocked({ retryAfterSeconds, onUnlocked }: LoginLockedProps): ReactElement {
  const { mmss, ended } = useCountdown(retryAfterSeconds)

  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <div className="relative grid size-16 place-items-center rounded-[var(--radius-xl)] border border-danger/30 bg-[rgb(244_63_94/0.12)]">
        <span
          aria-hidden="true"
          className="absolute inset-0 animate-[pulse-glow_2.6s_ease-in-out_infinite] rounded-[var(--radius-xl)] bg-[rgb(244_63_94/0.2)]"
        />
        <ShieldAlert className="relative size-7 text-danger" aria-hidden="true" />
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="font-bold text-text-primary text-xl tracking-tight">
          Cuenta bloqueada temporalmente
        </h2>
        <p className="text-sm text-text-secondary leading-relaxed">
          {ended
            ? "Ya puedes intentarlo nuevamente."
            : "Has superado el limite de intentos permitidos."}
        </p>
      </div>

      {!ended && (
        <div className="flex flex-col items-center gap-1.5">
          <span className="font-medium text-text-muted text-xs uppercase tracking-widest">
            Reintenta en
          </span>
          <span className="font-bold font-mono text-4xl text-gradient-brand tabular-nums">
            {mmss}
          </span>
        </div>
      )}

      <div className="flex w-full flex-col gap-3 pt-2">
        {ended ? (
          <Button full={true} onClick={onUnlocked}>
            Volver a intentar
          </Button>
        ) : (
          <Button asChild={true} variant="outline" full={true}>
            <Link to={RUTAS.recuperarPassword}>Recuperar acceso</Link>
          </Button>
        )}
        {!ended && (
          <p className="text-text-muted text-xs">
            Si necesitas acceso urgente, contacta a tu administrador.
          </p>
        )}
      </div>
    </div>
  )
}
