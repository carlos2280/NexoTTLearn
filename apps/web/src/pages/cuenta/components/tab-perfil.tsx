import { AvatarIniciales } from "@/shared/components/ui/avatar-iniciales"
import { type ThemeMode, useTheme } from "@/shared/hooks/use-theme"
import { cn } from "@/shared/lib/cn"
import type { PerfilSesion } from "@nexott-learn/shared-types"
import { Monitor, MoonStar, Palette, Sun, UserRound } from "lucide-react"

interface TabPerfilProps {
  readonly usuario: PerfilSesion
}

const ROL_ETIQUETA: ReadonlyMap<PerfilSesion["rol"], string> = new Map([
  ["PARTICIPANTE", "Participante"],
  ["ADMIN", "Administrador"],
])

function etiquetaRol(rol: PerfilSesion["rol"]): string {
  return ROL_ETIQUETA.get(rol) ?? rol
}

interface OpcionTema {
  readonly id: ThemeMode
  readonly etiqueta: string
  readonly hint: string
  readonly icono: typeof Sun
}

const OPCIONES_TEMA: readonly OpcionTema[] = [
  { id: "light", etiqueta: "Claro", hint: "Fondo luminoso", icono: Sun },
  { id: "dark", etiqueta: "Oscuro", hint: "Fondo profundo", icono: MoonStar },
  { id: "system", etiqueta: "Automático", hint: "Sigue al sistema", icono: Monitor },
]

export function TabPerfil({ usuario }: TabPerfilProps) {
  const { modo, setModo } = useTheme()

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-5 rounded-lg border border-border bg-surface p-5">
        <header className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent-soft text-accent-on-soft">
            <UserRound className="h-4 w-4" strokeWidth={1.5} aria-hidden={true} />
          </div>
          <div className="flex flex-col">
            <h2 className="text-h3 text-text-primary">Perfil</h2>
            <p className="text-body-sm text-text-secondary">
              Datos de tu cuenta. Si algo no coincide, escribe al administrador.
            </p>
          </div>
        </header>

        <div className="flex items-center gap-4">
          <AvatarIniciales nombre={usuario.nombre} tamano="lg" />
          <dl className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-[auto_1fr] sm:gap-x-6 sm:gap-y-2">
            <dt className="nx-eyebrow text-text-tertiary">Nombre</dt>
            <dd className="text-body text-text-primary">{usuario.nombre}</dd>
            <dt className="nx-eyebrow text-text-tertiary">Email</dt>
            <dd className="text-body text-text-primary">{usuario.email}</dd>
            <dt className="nx-eyebrow text-text-tertiary">Rol</dt>
            <dd className="text-body text-text-primary">{etiquetaRol(usuario.rol)}</dd>
          </dl>
        </div>
      </section>

      <section className="flex flex-col gap-5 rounded-lg border border-border bg-surface p-5">
        <header className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent-soft text-accent-on-soft">
            <Palette className="h-4 w-4" strokeWidth={1.5} aria-hidden={true} />
          </div>
          <div className="flex flex-col">
            <h2 className="text-h3 text-text-primary">Apariencia</h2>
            <p className="text-body-sm text-text-secondary">
              Elige el tema con el que quieres trabajar. Tu preferencia se recuerda en este
              navegador.
            </p>
          </div>
        </header>

        <fieldset className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <legend className="sr-only">Selección de tema</legend>
          {OPCIONES_TEMA.map((opcion) => (
            <OpcionTemaRadio
              key={opcion.id}
              opcion={opcion}
              seleccionada={modo === opcion.id}
              onSeleccionar={() => setModo(opcion.id)}
            />
          ))}
        </fieldset>
      </section>
    </div>
  )
}

interface OpcionTemaRadioProps {
  readonly opcion: OpcionTema
  readonly seleccionada: boolean
  readonly onSeleccionar: () => void
}

function OpcionTemaRadio({ opcion, seleccionada, onSeleccionar }: OpcionTemaRadioProps) {
  const Icono = opcion.icono
  return (
    <label
      className={cn(
        "flex cursor-pointer items-center gap-3 rounded-md border px-3 py-3 transition-colors duration-base ease-default",
        "focus-within:outline-2 focus-within:outline-accent focus-within:outline-offset-2",
        seleccionada
          ? "border-accent bg-accent-soft text-accent-on-soft"
          : "border-border bg-surface text-text-secondary hover:border-border-strong hover:text-text-primary",
      )}
    >
      <input
        type="radio"
        name="tema"
        value={opcion.id}
        checked={seleccionada}
        onChange={onSeleccionar}
        className="sr-only"
      />
      <Icono className="h-4 w-4 shrink-0" strokeWidth={1.5} aria-hidden={true} />
      <span className="flex flex-col">
        <span className="font-medium text-body-sm">{opcion.etiqueta}</span>
        <span className="text-caption text-text-tertiary">{opcion.hint}</span>
      </span>
    </label>
  )
}
