import { useMiFicha } from "@/features/me/hooks/use-mi-ficha"
import { Banner } from "@/shared/components/ui/banner"
import { PageHeader } from "@/shared/components/ui/page-header"
import { useMemo } from "react"
import { FichaGrupoArea } from "./components/ficha-grupo-area"
import { FichaResumenAreas } from "./components/ficha-resumen-areas"
import { FichaSkeleton } from "./components/ficha-skeleton"
import { agruparPorArea } from "./mi-ficha.types"

export function MiFichaPage() {
  const { data, isLoading, error } = useMiFicha()

  const grupos = useMemo(() => {
    if (!data) {
      return []
    }
    return agruparPorArea(data.skills, data.porArea)
  }, [data])

  const totalConNota = useMemo(() => grupos.reduce((acc, g) => acc + g.skillsConNota, 0), [grupos])
  const totalSkills = useMemo(() => grupos.reduce((acc, g) => acc + g.skillsTotales, 0), [grupos])

  return (
    <div className="flex flex-col gap-10">
      <PageHeader
        eyebrow="Mi competencia"
        titulo="Mi ficha"
        descripcion="Tus skills medidas y su evidencia. Se actualiza a medida que avanzas en cursos, bloques y entrevistas."
      />

      {isLoading ? <FichaSkeleton /> : null}

      {error ? (
        <Banner tone="danger">
          No pudimos cargar tu ficha. Reintenta en un momento o vuelve más tarde.
        </Banner>
      ) : null}

      {data && grupos.length === 0 ? (
        <Banner tone="neutral">
          Aún no hay skills registradas en tu ficha. Se irán completando a medida que avances.
        </Banner>
      ) : null}

      {data && grupos.length > 0 ? (
        <>
          <p className="tabular font-mono text-caption text-text-tertiary">
            <span className="text-text-primary">{totalConNota}</span> con nota{" "}
            <span className="text-text-disabled">·</span> {totalSkills} skills en total
          </p>

          <FichaResumenAreas grupos={grupos} />

          <div className="flex flex-col gap-10">
            {grupos.map((grupo) => (
              <FichaGrupoArea key={grupo.areaId} grupo={grupo} />
            ))}
          </div>
        </>
      ) : null}
    </div>
  )
}
