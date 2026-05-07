import { RUTAS } from "@/shared/constants/rutas"
import { Alert } from "@/shared/ui/primitives/alert"
import { Button } from "@/shared/ui/primitives/button"
import { ArrowRight, LifeBuoy, Mail } from "lucide-react"
import type { ReactElement } from "react"
import { Link } from "react-router-dom"

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_CONTACT_EMAIL ?? "admin@nexott.local"

export function RecuperarInfo(): ReactElement {
  const mailto = `mailto:${ADMIN_EMAIL}?subject=${encodeURIComponent(
    "Solicitud de reseteo de contrasena",
  )}`

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col items-center gap-4">
        <span className="relative grid size-14 place-items-center rounded-[var(--radius-xl)] border border-glass-border bg-[linear-gradient(135deg,rgb(124_58_237/0.18),rgb(34_211_238/0.14))]">
          <span
            aria-hidden="true"
            className="absolute inset-0 animate-[breathing_4s_ease-in-out_infinite] rounded-[var(--radius-xl)] bg-[linear-gradient(135deg,rgb(124_58_237/0.25),rgb(34_211_238/0.2))] opacity-60 blur-md"
          />
          <LifeBuoy className="relative size-7 text-brand-cyan" aria-hidden="true" />
        </span>
        <div className="flex flex-col items-center gap-1.5 text-center">
          <h2 className="font-bold text-2xl text-text-primary tracking-tight">Necesitas ayuda?</h2>
          <p className="max-w-[38ch] text-sm text-text-secondary leading-relaxed">
            Por seguridad, los reseteos de contrasena los gestiona tu administrador.
          </p>
        </div>
      </header>

      <Alert variant="info">
        <p className="font-semibold text-sm text-text-primary">Contacta a tu administrador</p>
        <p className="mt-1 text-sm text-text-secondary leading-relaxed">
          Solicitale el reseteo por un canal seguro (Teams, llamada o correo). Te entregara una
          contrasena temporal que deberas cambiar al ingresar.
        </p>
      </Alert>

      <div className="flex justify-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-glass-border bg-glass-1 px-3 py-1.5 text-text-secondary text-xs">
          <Mail className="size-3.5 text-brand-cyan" aria-hidden="true" />
          <span className="font-mono">{ADMIN_EMAIL}</span>
        </span>
      </div>

      <Button asChild={true} full={true}>
        <a href={mailto}>
          Escribir al administrador
          <ArrowRight aria-hidden="true" />
        </a>
      </Button>

      <div className="flex items-center justify-center pt-1">
        <Link
          to={RUTAS.login}
          className="font-medium text-text-muted text-xs transition-colors hover:text-brand-violet-soft focus-visible:text-brand-violet-soft focus-visible:outline-none"
        >
          Volver al login
        </Link>
      </div>
    </div>
  )
}
