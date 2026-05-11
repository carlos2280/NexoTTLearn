import { Badge } from "@/shared/components/ui/badge"
import { Button } from "@/shared/components/ui/button"
import type { PerfilSesion } from "@nexott-learn/shared-types"
import { KeyRound, ShieldCheck, ShieldOff } from "lucide-react"
import { useState } from "react"
import { CambiarPasswordForm } from "./cambiar-password-form"
import { MfaActivarDialog } from "./mfa-activar-dialog"
import { MfaDesactivarDialog } from "./mfa-desactivar-dialog"

interface TabSeguridadProps {
  readonly usuario: PerfilSesion
}

export function TabSeguridad({ usuario }: TabSeguridadProps) {
  const [activandoMfa, setActivandoMfa] = useState(false)
  const [desactivandoMfa, setDesactivandoMfa] = useState(false)

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-5">
        <header className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent-soft text-accent-on-soft">
            <KeyRound className="h-4 w-4" strokeWidth={1.5} aria-hidden={true} />
          </div>
          <div className="flex flex-col">
            <h2 className="text-h3 text-text-primary">Contraseña</h2>
            <p className="text-body-sm text-text-secondary">
              Cámbiala periódicamente. Mínimo 10 caracteres con mayúscula, minúscula y dígito.
            </p>
          </div>
        </header>
        <CambiarPasswordForm />
      </section>

      <section className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-5">
        <header className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent-soft text-accent-on-soft">
            {usuario.mfaHabilitado ? (
              <ShieldCheck className="h-4 w-4" strokeWidth={1.5} aria-hidden={true} />
            ) : (
              <ShieldOff className="h-4 w-4" strokeWidth={1.5} aria-hidden={true} />
            )}
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h2 className="text-h3 text-text-primary">Verificación en dos pasos</h2>
              {usuario.mfaHabilitado ? (
                <Badge tono="success" conPunto={true}>
                  Activado
                </Badge>
              ) : (
                <Badge tono="neutro" conPunto={true}>
                  Inactivo
                </Badge>
              )}
            </div>
            <p className="text-body-sm text-text-secondary">
              {usuario.mfaHabilitado
                ? "Tu cuenta pide un código de 6 dígitos tras el login."
                : "Suma una capa extra de seguridad con una app autenticadora."}
            </p>
          </div>
        </header>
        <div className="flex flex-wrap items-center gap-2">
          {usuario.mfaHabilitado ? (
            <Button variant="secondary" size="sm" onClick={() => setDesactivandoMfa(true)}>
              Desactivar
            </Button>
          ) : (
            <Button variant="primary" size="sm" onClick={() => setActivandoMfa(true)}>
              Activar doble factor
            </Button>
          )}
        </div>
      </section>

      <MfaActivarDialog abierto={activandoMfa} onCambiarAbierto={setActivandoMfa} />
      <MfaDesactivarDialog abierto={desactivandoMfa} onCambiarAbierto={setDesactivandoMfa} />
    </div>
  )
}
