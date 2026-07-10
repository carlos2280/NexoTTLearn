import { Switch } from "@/shared/components/ui/switch"
import { cn } from "@/shared/lib/cn"
import { BarraSumaSegmentos } from "./barra-suma-segmentos"
import { CampoNumero } from "./campo-numero"
import type { FormTransversal } from "./transversal-form"

interface CapasTransversalProps {
  readonly form: FormTransversal
  readonly onCambio: (parcial: Partial<FormTransversal>) => void
}

interface CapaConfig {
  readonly id: "tests" | "cualitativa" | "comprension"
  readonly label: string
  readonly etiquetaCorta: string
  readonly explicacion: string
  readonly pesoKey: "pesoCapaTests" | "pesoCapaCualitativa" | "pesoCapaComprension"
  readonly activaKey: "capaTestsActiva" | "capaCualitativaActiva" | "capaComprensionActiva"
}

const CAPAS: readonly CapaConfig[] = [
  {
    id: "tests",
    label: "Tests automáticos",
    etiquetaCorta: "Tests",
    explicacion:
      "Verifica si el proyecto entregado funciona a nivel técnico: que el código haga lo que debe.",
    pesoKey: "pesoCapaTests",
    activaKey: "capaTestsActiva",
  },
  {
    id: "cualitativa",
    label: "Análisis cualitativo",
    etiquetaCorta: "Cualitativa",
    explicacion:
      "La IA revisa la calidad del código entregado —orden, claridad, buenas prácticas—, no solo si funciona.",
    // biome-ignore lint/nursery/noSecrets: nombre de campo del form, no un secreto
    pesoKey: "pesoCapaCualitativa",
    // biome-ignore lint/nursery/noSecrets: nombre de campo del form, no un secreto
    activaKey: "capaCualitativaActiva",
  },
  {
    id: "comprension",
    label: "Comprensión",
    etiquetaCorta: "Comprensión",
    explicacion:
      "La IA analiza el proyecto entregado y estima qué tan bien se domina lo construido, más allá de que funcione. El participante no rinde ninguna entrevista.",
    // biome-ignore lint/nursery/noSecrets: nombre de campo del form, no un secreto
    pesoKey: "pesoCapaComprension",
    // biome-ignore lint/nursery/noSecrets: nombre de campo del form, no un secreto
    activaKey: "capaComprensionActiva",
  },
]

/**
 * Bloque "Capas de evaluación" del transversal: por cada capa, un switch de
 * activación + su peso. Las 3 capas SIEMPRE suman 100 (contrato del backend);
 * el switch solo decide si la capa se evalúa: cuando está apagada, al calcular
 * la nota su peso se reparte entre las activas (D35), por eso el peso sigue
 * editable aunque la capa esté apagada.
 */
export function CapasTransversal({ form, onCambio }: CapasTransversalProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <span className="nx-eyebrow text-text-tertiary">Capas de evaluación</span>
        <p className="text-body-sm text-text-secondary">
          Reparte 100% entre las 3 capas. Puedes apagar una capa: cuando está apagada no se evalúa y
          su peso se reparte entre las activas.
        </p>
      </div>

      <ul className="flex flex-col divide-y divide-border rounded-lg border border-border">
        {CAPAS.map((capa) => {
          const activa = form[capa.activaKey]
          return (
            <li
              key={capa.id}
              className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6"
            >
              <Switch
                id={`capa-transversal-${capa.id}`}
                checked={activa}
                onCambio={(v) => onCambio({ [capa.activaKey]: v })}
                label={capa.label}
                descripcion={
                  <>
                    {capa.explicacion}
                    {activa ? null : (
                      <span className="text-text-tertiary">
                        {" "}
                        Ahora está apagada: no se evalúa y su peso se reparte entre las activas.
                      </span>
                    )}
                  </>
                }
              />
              <div className={cn("w-full sm:w-28", activa ? undefined : "opacity-55")}>
                <CampoNumero
                  label="Peso (%)"
                  valor={form[capa.pesoKey]}
                  onCambio={(v) => onCambio({ [capa.pesoKey]: v })}
                />
              </div>
            </li>
          )
        })}
      </ul>

      <BarraSumaSegmentos
        tramos={CAPAS.map((capa) => ({
          id: capa.id,
          valor: form[capa.pesoKey],
          etiqueta: capa.etiquetaCorta,
        }))}
      />
    </div>
  )
}
