import { Button } from "@/shared/components/ui/button"
import { Field } from "@/shared/components/ui/field"
import { Input } from "@/shared/components/ui/input"
import { Switch } from "@/shared/components/ui/switch"
import { GitBranch, Plus, X } from "lucide-react"
import { type KeyboardEvent, useId, useState } from "react"
import type { BorradorObjetivo } from "./borrador-git"

/** Tope de ramas que admite el contrato `objetivoGitSchema` (`.max(20)`). */
const RAMAS_MAX = 20

interface CamposObjetivoGitProps {
  readonly valor: BorradorObjetivo
  readonly onCambio: (valor: BorradorObjetivo) => void
}

/**
 * Editor del objetivo declarativo de un GIT_EJERCICIO: rama activa esperada,
 * ramas que deben existir (chips), si debe haber merge en main, y commits
 * mínimos. Todos opcionales — el objetivo se evalúa con AND de lo presente.
 */
export function CamposObjetivoGit({ valor, onCambio }: CamposObjetivoGitProps) {
  const mergeId = useId()
  const [nuevaRama, setNuevaRama] = useState("")

  const topeAlcanzado = valor.ramasExisten.length >= RAMAS_MAX

  function anadirRama() {
    const rama = nuevaRama.trim()
    if (rama && !valor.ramasExisten.includes(rama) && !topeAlcanzado) {
      onCambio({ ...valor, ramasExisten: [...valor.ramasExisten, rama] })
    }
    setNuevaRama("")
  }

  function quitarRama(rama: string) {
    onCambio({ ...valor, ramasExisten: valor.ramasExisten.filter((r) => r !== rama) })
  }

  function onKeyDownRama(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault()
      anadirRama()
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-subtle/40 p-4">
      <span className="nx-eyebrow text-text-tertiary">Objetivo · cómo se corrige</span>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Rama activa esperada" hint="Dónde debe quedar HEAD. Vacío = no se exige.">
          {(attrs) => (
            <Input
              {...attrs}
              value={valor.ramaActiva}
              onChange={(e) => onCambio({ ...valor, ramaActiva: e.target.value })}
              placeholder="feature/login"
              maxLength={60}
            />
          )}
        </Field>
        <Field label="Commits mínimos" hint="Sin contar el commit raíz. 0 o vacío = sin mínimo.">
          {(attrs) => (
            <Input
              {...attrs}
              type="number"
              min={0}
              max={100}
              value={valor.commitsMinimos}
              onChange={(e) => onCambio({ ...valor, commitsMinimos: e.target.value })}
              placeholder="0"
            />
          )}
        </Field>
      </div>

      <Field
        label="Ramas que deben existir"
        hint={
          topeAlcanzado ? `Máximo ${RAMAS_MAX} ramas.` : "Enter o «Añadir» para sumar cada rama."
        }
      >
        {(attrs) => (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Input
                {...attrs}
                value={nuevaRama}
                onChange={(e) => setNuevaRama(e.target.value)}
                onKeyDown={onKeyDownRama}
                placeholder="develop"
                maxLength={60}
                disabled={topeAlcanzado}
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={anadirRama}
                disabled={topeAlcanzado}
              >
                <Plus className="h-4 w-4" strokeWidth={1.5} aria-hidden={true} />
                Añadir
              </Button>
            </div>
            {valor.ramasExisten.length > 0 ? (
              <ul className="flex flex-wrap gap-1.5">
                {valor.ramasExisten.map((rama) => (
                  <li key={rama}>
                    <span className="inline-flex items-center gap-1.5 rounded-pill border border-border bg-surface py-1 pr-1 pl-2.5 font-mono text-body-sm text-text-secondary">
                      <GitBranch
                        className="h-3.5 w-3.5 text-text-tertiary"
                        strokeWidth={1.5}
                        aria-hidden={true}
                      />
                      {rama}
                      <button
                        type="button"
                        onClick={() => quitarRama(rama)}
                        aria-label={`Quitar rama ${rama}`}
                        className="flex h-5 w-5 items-center justify-center rounded-pill text-text-tertiary transition-colors hover:bg-muted hover:text-text-primary"
                      >
                        <X className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden={true} />
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        )}
      </Field>

      <Switch
        id={mergeId}
        checked={valor.hayMergeEnMain}
        onCambio={(v) => onCambio({ ...valor, hayMergeEnMain: v })}
        label="Debe haber un merge en main"
        descripcion="Se cumple si existe un commit de merge alcanzable desde main."
      />
    </div>
  )
}
