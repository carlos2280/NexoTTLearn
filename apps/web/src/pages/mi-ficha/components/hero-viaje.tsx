import { descargarMiFicha, dispararDescargaFicha } from "@/features/me/api/exportar-ficha.api"
import { Button } from "@/shared/components/ui/button"
import { FirmaNombre } from "@/shared/components/ui/firma-nombre"
import type { FichaPorAreaItem, FichaSkillItem } from "@nexott-learn/shared-types"
import { useState } from "react"
import { toast } from "sonner"
import {
  areasConActividad,
  cuentaAreasSolidasOExcelentes,
  fortalezaActual,
  hayAreaSolida,
  relativizarFecha,
  sufijoNarrativo,
  ultimaSkill,
} from "../mi-ficha.helpers"

interface HeroViajeProps {
  readonly nombre: string
  readonly porArea: readonly FichaPorAreaItem[]
  readonly skills: readonly FichaSkillItem[]
}

export function HeroViaje({ nombre, porArea, skills }: HeroViajeProps) {
  const [descargando, setDescargando] = useState(false)
  const areas = areasConActividad(porArea)
  const solidas = cuentaAreasSolidasOExcelentes(porArea)
  const solida = hayAreaSolida(porArea)
  const fortaleza = fortalezaActual(porArea)
  const ultima = ultimaSkill(skills)

  async function descargarCsv(): Promise<void> {
    setDescargando(true)
    try {
      const payload = await descargarMiFicha("csv")
      dispararDescargaFicha(payload)
    } catch (_err) {
      toast.error("No se pudo exportar la ficha. Reintenta en un momento.")
    } finally {
      setDescargando(false)
    }
  }

  const sufijo = sufijoNarrativo({
    areasConActividad: areas,
    areasSolidasOExcelentes: solidas,
    hayAreaSolida: solida,
  })

  return (
    <header className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <span className="nx-eyebrow text-aurora-violet">Tu ficha</span>
        <h1 className="max-w-[28ch] text-display-md text-text-primary">
          <FirmaNombre nombre={nombre} tono="aurora" />
          <span>{sufijo}</span>
        </h1>
        {areas > 0 ? (
          <p className="text-body-lg text-text-secondary">
            Has demostrado capacidades en{" "}
            <span className="font-medium text-text-primary">
              {areas} {areas === 1 ? "area" : "areas"}
            </span>
            .
            {fortaleza ? (
              <>
                {" "}
                Tu fortaleza actual:{" "}
                <span className="font-medium text-text-primary">{fortaleza}</span>.
              </>
            ) : null}
          </p>
        ) : null}
      </div>

      <span
        aria-hidden="true"
        className="block h-px w-full max-w-[480px] rounded-full bg-[image:var(--gradient-aurora)] opacity-80"
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        {ultima ? (
          <p className="text-body-sm text-text-tertiary">
            Ultima habilidad: <span className="text-text-secondary">{ultima.nombre}</span>{" "}
            <span className="text-text-disabled">·</span>{" "}
            <span>{relativizarFecha(ultima.fecha)}</span>
          </p>
        ) : (
          <span aria-hidden="true" />
        )}
        <Button
          variant="ghost"
          size="sm"
          isLoading={descargando}
          disabled={descargando}
          onClick={() => {
            descargarCsv().catch(() => undefined)
          }}
        >
          Exportar →
        </Button>
      </div>
    </header>
  )
}
