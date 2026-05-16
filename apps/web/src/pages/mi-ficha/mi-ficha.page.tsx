import { useUsuarioActual } from "@/features/auth/hooks/use-usuario-actual"
import { useMiFicha } from "@/features/me/hooks/use-mi-ficha"
import { Banner } from "@/shared/components/ui/banner"
import { useMemo } from "react"
import { FichaGrupoArea } from "./components/ficha-grupo-area"
import { FichaResumenAreas } from "./components/ficha-resumen-areas"
import { FichaSkeleton } from "./components/ficha-skeleton"
import { HeroViaje } from "./components/hero-viaje"
import { agruparPorArea } from "./mi-ficha.types"

export function MiFichaPage() {
  const { data, isLoading, error } = useMiFicha()
  const { data: usuario } = useUsuarioActual()

  const grupos = useMemo(() => {
    if (!data) {
      return []
    }
    return agruparPorArea(data.skills, data.porArea)
  }, [data])

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

      {data && grupos.length === 0 ? (
        <Banner tone="neutral">
          Aun no hay skills registradas en tu ficha. Se iran completando a medida que avances.
        </Banner>
      ) : null}

      {/* TODO F2: reemplazar FichaResumenAreas por "Tu mapa" (las 8 areas del catalogo). */}
      {/* TODO F3: reemplazar FichaGrupoArea por acordeon inline + drawer historico. */}
      {/* TODO F4: anadir "Tu historial" cronologico al final. */}
      {data && grupos.length > 0 ? (
        <section
          className="flex flex-col gap-10 border-border border-t pt-10 opacity-90"
          aria-label="Vista anterior — se reemplaza en F2/F3"
        >
          <p className="nx-eyebrow text-text-tertiary">Vista anterior (legacy)</p>
          <FichaResumenAreas grupos={grupos} />
          <div className="flex flex-col gap-10">
            {grupos.map((grupo) => (
              <FichaGrupoArea key={grupo.areaId} grupo={grupo} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}
