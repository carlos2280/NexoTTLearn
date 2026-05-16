import { Banner } from "@/shared/components/ui/banner"
import { Button } from "@/shared/components/ui/button"
import { RUTAS } from "@/shared/constants/rutas"
import { useNavigate } from "react-router-dom"

interface PasoErrorLogoutProps {
  readonly mensaje: string
  readonly onReintentar: () => void
}

export function PasoErrorLogout({ mensaje, onReintentar }: PasoErrorLogoutProps) {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <p className="nx-eyebrow text-text-tertiary">Algo no salió bien</p>
        <h2 className="text-h1 text-text-primary">
          No pudimos cerrar tu sesión<span className="text-danger">.</span>
        </h2>
      </header>

      <Banner tone="danger">{mensaje}</Banner>

      <div className="flex flex-col gap-2">
        <Button type="button" fullWidth={true} onClick={onReintentar}>
          Reintentar
        </Button>
        <Button
          type="button"
          variant="ghost"
          fullWidth={true}
          onClick={() => navigate(RUTAS.bandeja, { replace: true })}
        >
          Volver a la bandeja
        </Button>
      </div>
    </div>
  )
}
