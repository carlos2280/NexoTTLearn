import { Kbd } from "@/shared/components/ui/kbd"
import {
  Content as DialogContent,
  Overlay as DialogOverlay,
  Portal as DialogPortal,
  Root as DialogRoot,
  Title as DialogTitle,
} from "@radix-ui/react-dialog"
import { Command } from "cmdk"
import { Search } from "lucide-react"
import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { COMANDOS, type Comando, ETIQUETA_GRUPO, type GrupoComando } from "./comandos"

interface PaletaComandosProps {
  readonly abierta: boolean
  readonly onCerrar: () => void
}

const GRUPOS: readonly GrupoComando[] = ["navegar", "acciones"]

export function PaletaComandos({ abierta, onCerrar }: PaletaComandosProps) {
  const navigate = useNavigate()

  useEffect(() => {
    if (!abierta) {
      return
    }
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = ""
    }
  }, [abierta])

  function ejecutar(comando: Comando) {
    if (comando.ruta) {
      navigate(comando.ruta)
    }
    onCerrar()
  }

  return (
    <DialogRoot open={abierta} onOpenChange={(v) => (v ? null : onCerrar())}>
      <DialogPortal>
        <DialogOverlay
          className="nx-motion-overlay fixed inset-0 bg-text-primary/30 backdrop-blur-sm"
          style={{ zIndex: 200 }}
        />
        <div
          className="pointer-events-none fixed inset-0 flex items-start justify-center px-4 pt-[14vh]"
          style={{ zIndex: 200 }}
        >
          <DialogContent
            aria-describedby={undefined}
            className="nx-motion-dialog pointer-events-auto w-full max-w-xl overflow-hidden rounded-xl border border-border bg-surface shadow-overlay outline-none"
          >
            <DialogTitle className="sr-only">Panel rápido</DialogTitle>
            <Command label="Panel rápido" loop={true} className="flex flex-col">
              <div className="group/input relative flex items-center gap-3 px-4 py-3.5">
                <Search
                  className="h-4 w-4 shrink-0 text-text-tertiary transition-colors duration-base ease-default group-focus-within/input:text-aurora-violet"
                  strokeWidth={1.5}
                  aria-hidden={true}
                />
                <Command.Input
                  placeholder="Busca, navega o ejecuta…"
                  className="flex-1 bg-transparent text-input text-text-primary outline-none placeholder:text-text-tertiary"
                />
                <Kbd>esc</Kbd>
                <div
                  aria-hidden={true}
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-[image:var(--gradient-aurora)] opacity-25"
                />
              </div>

              <Command.List className="max-h-[60vh] overflow-y-auto p-2">
                <Command.Empty className="px-3 py-8 text-center text-body-sm text-text-tertiary">
                  Sin resultados.
                </Command.Empty>
                {GRUPOS.map((grupo) => {
                  const items = COMANDOS.filter((c) => c.grupo === grupo)
                  if (items.length === 0) {
                    return null
                  }
                  return (
                    <Command.Group
                      key={grupo}
                      heading={ETIQUETA_GRUPO[grupo]}
                      className="[&_[cmdk-group-heading]]:nx-eyebrow px-1 pt-2 pb-1 text-caption text-text-tertiary [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-text-tertiary"
                    >
                      {items.map((comando) => {
                        const Icono = comando.icono
                        return (
                          <Command.Item
                            key={comando.id}
                            value={comando.etiqueta}
                            onSelect={() => ejecutar(comando)}
                            className="group/cmditem flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-body-sm text-text-secondary transition-[background-color,color,transform] duration-fast ease-default data-[selected=true]:translate-x-px data-[selected=true]:bg-accent-soft data-[selected=true]:text-accent-on-soft data-[selected=true]:shadow-ring-aurora-soft"
                          >
                            <Icono
                              className="h-4 w-4 shrink-0 text-text-tertiary transition-colors duration-fast ease-default group-data-[selected=true]/cmditem:text-aurora-violet"
                              strokeWidth={1.5}
                              aria-hidden={true}
                            />
                            <span className="flex-1 truncate">{comando.etiqueta}</span>
                            {comando.atajo ? (
                              <span className="hidden items-center gap-1 sm:flex">
                                {comando.atajo.map((tecla, i) => (
                                  <Kbd key={`${comando.id}-${i}`}>{tecla}</Kbd>
                                ))}
                              </span>
                            ) : null}
                          </Command.Item>
                        )
                      })}
                    </Command.Group>
                  )
                })}
              </Command.List>

              <footer className="flex items-center justify-between gap-3 border-border border-t bg-subtle/40 px-4 py-2.5 font-mono text-caption text-text-tertiary">
                <span className="inline-flex items-center gap-1.5">
                  <Kbd>↑</Kbd>
                  <Kbd>↓</Kbd>
                  <span>navegar</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Kbd>↵</Kbd>
                  <span>seleccionar</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Kbd>esc</Kbd>
                  <span>cerrar</span>
                </span>
              </footer>
            </Command>
          </DialogContent>
        </div>
      </DialogPortal>
    </DialogRoot>
  )
}
