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
        <ol className="flex flex-col gap-5">
          {data.map((entrada) => (
            <EntradaItem key={entrada.id} entrada={entrada} />
          ))}
        </ol>
      ) : null}
    </SidePeek>
  )
}

interface EntradaItemProps {
  readonly entrada: EntradaHistoricoNotaSkill
}

function EntradaItem({ entrada }: EntradaItemProps) {
  const nivel = nivelDeNotaSkill(entrada.valor)
  const fechaRel = relativizarFecha(entrada.fecha)
  const referencia = describirReferencia(entrada)

  return (
    <li className="relative flex gap-4 pl-5">
      <span
        aria-hidden="true"
        className="absolute top-1.5 left-0 h-2 w-2 rounded-full bg-text-tertiary"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center justify-between gap-3">
          <span className="font-medium text-body-sm text-text-primary">
            {etiquetaNivelSkill(nivel)}
          </span>
          {entrada.valor !== null ? (
            <span className="tabular font-mono text-caption text-text-tertiary">
              {entrada.valor}
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
