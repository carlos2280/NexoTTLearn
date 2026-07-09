import { type EstadoGit, alcanzablesDesde, tip } from "@/features/git-ejecucion/motor-git"
import { cn } from "@/shared/lib/cn"
import { GitBranch, GitCommitHorizontal } from "lucide-react"

interface EstadoRepoGitProps {
  readonly estado: EstadoGit
}

const MAX_COMMITS_VISIBLES = 6

/**
 * Vista compacta del repo simulado: rama activa + demás ramas, y los commits
 * alcanzables desde HEAD (más reciente primero). Ayuda al alumno a "ver" el
 * efecto de cada comando sin salir del bloque.
 */
export function EstadoRepoGit({ estado }: EstadoRepoGitProps) {
  const ramas = Object.keys(estado.ramas)
  const commits = alcanzablesDesde(estado, tip(estado)).slice(0, MAX_COMMITS_VISIBLES)

  return (
    <aside
      aria-label="Estado del repositorio"
      className="flex flex-col gap-3 rounded-lg border border-border bg-subtle p-4"
    >
      <div className="flex flex-wrap items-center gap-1.5">
        {ramas.map((rama) => {
          const activa = rama === estado.head
          return (
            <span
              key={rama}
              className={cn(
                "inline-flex items-center gap-1 rounded-pill border px-2 py-0.5 text-caption",
                activa
                  ? "border-aurora-cyan/40 bg-[rgb(var(--color-aurora-cyan-rgb)/0.1)] text-aurora-cyan"
                  : "border-border text-text-tertiary",
              )}
            >
              <GitBranch className="h-3 w-3" aria-hidden={true} />
              {rama}
            </span>
          )
        })}
      </div>
      <ol className="flex flex-col gap-1.5">
        {commits.map((commit) => (
          <li key={commit.id} className="flex items-start gap-2 text-body-sm">
            <GitCommitHorizontal
              className="mt-0.5 h-3.5 w-3.5 shrink-0 text-text-tertiary"
              aria-hidden={true}
            />
            <span className="font-code text-caption text-text-tertiary">{commit.id}</span>
            <span className="text-text-secondary">{commit.mensaje}</span>
          </li>
        ))}
      </ol>
    </aside>
  )
}
