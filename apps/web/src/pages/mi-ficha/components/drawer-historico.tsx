import { useHistoricoSkill } from "@/features/me/hooks/use-historico-skill"
import { SidePeek } from "@/shared/components/ui/side-peek"
import type { EntradaHistoricoNotaSkill } from "@nexott-learn/shared-types"
import { etiquetaNivelSkill, nivelDeNotaSkill, relativizarFecha } from "../mi-ficha.helpers"

interface DrawerHistoricoProps {
  readonly abierto: boolean
  readonly onCerrar: () => void
  readonly colaboradorId: string | undefined
  readonly skillId: string | null
  readonly skillNombre: string | null
}

export function DrawerHistorico({
  abierto,
  onCerrar,
  colaboradorId,
  skillId,
  skillNombre,
}: DrawerHistoricoProps) {
  const { data, isLoading, error } = useHistoricoSkill({ colaboradorId, skillId })

  return (
    <SidePeek
      abierto={abierto}
      onCambiarAbierto={(v) => {
        if (!v) {
          onCerrar()
        }
      }}
      titulo={skillNombre ?? "Historico"}
      descripcion="Linea temporal de la skill"
      ancho="md"
    >
      {isLoading ? <p className="text-body-sm text-text-tertiary">Cargando historico…</p> : null}

      {error ? (
        <p className="text-body-sm text-danger">
          No pudimos cargar el historico. Reintenta en un momento.
        </p>
      ) : null}

      {data && data.length === 0 ? (
        <p className="text-body-sm text-text-tertiary">Aun no hay entradas para esta habilidad.</p>
      ) : null}

      {data && data.length > 0 ? (
        <>
          <ol className="flex flex-col gap-5">
            {data.map((entrada, idx) => (
              <EntradaItem key={entrada.id} entrada={entrada} esActual={idx === 0} />
            ))}
          </ol>
          {data.some((e) => e.valor !== null) ? (
            <p className="mt-6 border-border border-t pt-4 text-caption text-text-tertiary">
              Niveles: <span className="text-text-secondary">Inicial</span> (&lt;50){" "}
              <span className="text-text-disabled">·</span>{" "}
              <span className="text-text-secondary">En desarrollo</span> (50–69){" "}
              <span className="text-text-disabled">·</span>{" "}
              <span className="text-text-secondary">Solido</span> (70–84){" "}
              <span className="text-text-disabled">·</span>{" "}
              <span className="text-text-secondary">Excelencia</span> (85+).
            </p>
          ) : null}
        </>
      ) : null}
    </SidePeek>
  )
}

interface EntradaItemProps {
  readonly entrada: EntradaHistoricoNotaSkill
  /**
   * `true` para el ultimo hito (cronologicamente, mas reciente) — recibe el
   * dot aurora-cyan con pulse para comunicar "donde estas hoy". El resto se
   * muestra en gris segun la regla "lo cumplido se desvanece".
   */
  readonly esActual: boolean
}

function EntradaItem({ entrada, esActual }: EntradaItemProps) {
  const nivel = nivelDeNotaSkill(entrada.valor)
  const fechaRel = relativizarFecha(entrada.fecha)
  const referencia = describirReferencia(entrada)

  return (
    <li className="relative flex gap-4 pl-5">
      <span
        aria-hidden="true"
        className={
          esActual
            ? "nx-pulse-dot absolute top-1.5 left-0 h-2 w-2 rounded-full bg-aurora-cyan"
            : "absolute top-1.5 left-0 h-2 w-2 rounded-full bg-text-tertiary"
        }
      />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center justify-between gap-3">
          <span className="font-medium text-body-sm text-text-primary">
            {etiquetaNivelSkill(nivel)}
          </span>
          {entrada.valor !== null ? (
            <span className="tabular font-mono text-caption text-text-tertiary">
              {entrada.valor}
              <span className="text-text-disabled">/100</span>
            </span>
          ) : null}
        </div>
        <span className="text-caption text-text-tertiary">
          {fechaRel}
          {referencia ? (
            <>
              {" "}
              <span className="text-text-disabled">·</span> {referencia}
            </>
          ) : null}
        </span>
      </div>
    </li>
  )
}

function describirReferencia(entrada: EntradaHistoricoNotaSkill): string | null {
  switch (entrada.origen) {
    case "ENTREVISTA_INICIAL":
      return "Entrevista inicial"
    case "BLOQUE": {
      const ref = entrada.referencia
      const cursoTitulo = ref && typeof ref.cursoTitulo === "string" ? ref.cursoTitulo : null
      return cursoTitulo ? `Curso "${cursoTitulo}"` : "Bloque didactico"
    }
    case "TRANSVERSAL": {
      const ref = entrada.referencia
      const proyectoTitulo =
        ref && typeof ref.proyectoTitulo === "string" ? ref.proyectoTitulo : null
      return proyectoTitulo ? `Proyecto "${proyectoTitulo}"` : "Proyecto transversal"
    }
    case "ENTREVISTA_IA":
      return "Entrevista IA"
    case "MANUAL":
      return "Ajuste manual"
    default:
      return null
  }
}
