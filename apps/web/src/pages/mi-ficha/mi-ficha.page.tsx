import { useUsuarioActual } from "@/features/auth/hooks/use-usuario-actual"
import { useMiFicha } from "@/features/me/hooks/use-mi-ficha"
import { Banner } from "@/shared/components/ui/banner"
import { useState } from "react"
import { DetalleArea } from "./components/detalle-area"
import { DrawerHistorico } from "./components/drawer-historico"
import { FichaSkeleton } from "./components/ficha-skeleton"
import { HeroViaje } from "./components/hero-viaje"
import { TuMapa } from "./components/tu-mapa"

interface HistoricoState {
  readonly skillId: string
  readonly skillNombre: string
}

export function MiFichaPage() {
  const { data, isLoading, error } = useMiFicha()
  const { data: usuario } = useUsuarioActual()
  const [areaExpandidaId, setAreaExpandidaId] = useState<string | null>(null)
  const [historico, setHistorico] = useState<HistoricoState | null>(null)

  const areaExpandida = data?.porArea.find((a) => a.areaId === areaExpandidaId) ?? null

  const handleAreaClick = (areaId: string) => {
    setAreaExpandidaId((prev) => (prev === areaId ? null : areaId))
  }

  const handleAbrirHistorico = (skillId: string, skillNombre: string) => {
    setHistorico({ skillId, skillNombre })
  }

  return (
    <div className="flex flex-col gap-12">
      {data && usuario ? (
        <HeroViaje nombre={usuario.nombre} porArea={data.porArea} skills={data.skills} />
      ) : null}

      {isLoading ? <FichaSkeleton /> : null}

      {error ? (
        <Banner tone="danger">
          No pudimos cargar tu ficha. Reintenta en un momento o vuelve mas tarde.
        </Banner>
      ) : null}

      {data ? <TuMapa porArea={data.porArea} onAreaClick={handleAreaClick} /> : null}

      {data && areaExpandida ? (
        <DetalleArea
          area={areaExpandida}
          skills={data.skills}
          onCerrar={() => setAreaExpandidaId(null)}
          onAbrirHistorico={handleAbrirHistorico}
        />
      ) : null}

      <DrawerHistorico
        abierto={historico !== null}
        onCerrar={() => setHistorico(null)}
        colaboradorId={usuario?.colaboradorId}
        skillId={historico?.skillId ?? null}
        skillNombre={historico?.skillNombre ?? null}
      />
    </div>
  )
}
