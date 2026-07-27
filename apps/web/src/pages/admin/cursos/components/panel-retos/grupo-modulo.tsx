import { Badge } from "@/shared/components/ui/badge"
import { Button } from "@/shared/components/ui/button"
import { cn } from "@/shared/lib/cn"
import { ChevronDown, ChevronRight, Play } from "lucide-react"
import { useId, useState } from "react"
import { resumirGrupo } from "./agrupar-retos"
import { FilaReto } from "./fila-reto"
import {
  ESTADO_PENDIENTE,
  type EstadoReto,
  type GrupoModulo as Grupo,
  type ResumenGrupo,
} from "./retos.types"

interface GrupoModuloProps {
  readonly grupo: Grupo
  readonly estados: ReadonlyMap<string, EstadoReto>
  readonly ocupado: boolean
  readonly cursoTitulo: string
  readonly onValidar: () => void
}

/**
 * Un módulo del curso, colapsable. Arranca plegado a propósito: el curso
 * minero tiene 21 módulos y 92 retos, y desplegarlos todos convierte la
 * pantalla en una lista ilegible. El chip de la cabecera resume el módulo sin
 * tener que abrirlo, así que el admin baja la vista buscando ámbar/rojo.
 */
export function GrupoModulo({ grupo, estados, ocupado, cursoTitulo, onValidar }: GrupoModuloProps) {
  const [abierto, setAbierto] = useState(false)
  const idLista = useId()
  const resumen = resumirGrupo(grupo.retos, estados)

  return (
    <li className="rounded-lg border border-border bg-surface shadow-xs">
      <div className="flex items-center gap-2 px-2 py-2">
        <button
          type="button"
          onClick={() => setAbierto((v) => !v)}
          aria-expanded={abierto}
          aria-controls={idLista}
          className="flex min-h-9 flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors duration-fast ease-default hover:bg-subtle/40"
        >
          <span className="shrink-0 text-text-tertiary">
            {abierto ? (
              <ChevronDown className="h-4 w-4" strokeWidth={1.5} aria-hidden={true} />
            ) : (
              <ChevronRight className="h-4 w-4" strokeWidth={1.5} aria-hidden={true} />
            )}
          </span>
          <span className="flex-1 truncate font-medium text-body-sm text-text-primary">
            {grupo.titulo}
          </span>
          <span className="tabular shrink-0 text-caption text-text-tertiary">
            {resumen.total} {resumen.total === 1 ? "reto" : "retos"}
          </span>
        </button>
        <ChipResumen resumen={resumen} />
        {/* `aria-disabled` y no `disabled`: deshabilitar el botón que acaba de
            recibir el clic manda el foco del teclado al `<body>`. Así el botón
            conserva el foco, se anuncia como no disponible y el clic no hace
            nada mientras hay una corrida en marcha. */}
        <Button
          variant="ghost"
          size="sm"
          onClick={ocupado ? undefined : onValidar}
          aria-disabled={ocupado}
          className={cn("h-9 shrink-0", ocupado && "pointer-events-none opacity-50")}
        >
          <Play className="h-3.5 w-3.5 fill-current" aria-hidden={true} />
          Validar
          <span className="sr-only"> los retos de {grupo.titulo}</span>
        </Button>
      </div>
      {abierto ? (
        <ul id={idLista} className="pb-1">
          {grupo.retos.map((reto) => (
            <FilaReto
              key={reto.bloqueId}
              reto={reto}
              estado={estados.get(reto.bloqueId) ?? ESTADO_PENDIENTE}
              cursoTitulo={cursoTitulo}
              modulo={{ id: grupo.moduloId, titulo: grupo.titulo }}
            />
          ))}
        </ul>
      ) : null}
    </li>
  )
}

interface ChipResumenProps {
  readonly resumen: ResumenGrupo
}

/**
 * El verde exige que TODOS los retos del módulo estén en verde
 * (`ok === total`). Con la condición anterior (`sinValidar === 0 && ok > 0`),
 * un módulo con 1 reto JS que pasa y 9 en un lenguaje no autocorregible se
 * anunciaba "Todos pasan" habiendo mirado uno de diez.
 */
function ChipResumen({ resumen }: ChipResumenProps) {
  if (resumen.rotos > 0) {
    return (
      <Badge variant="soft" tono="warning" className="h-7 shrink-0 items-center">
        {resumen.rotos} a revisar
      </Badge>
    )
  }
  if (resumen.ok === resumen.total && resumen.total > 0) {
    return (
      <Badge variant="soft" tono="success" className="h-7 shrink-0 items-center">
        Todos pasan
      </Badge>
    )
  }
  if (resumen.ok > 0) {
    return (
      <Badge variant="soft" tono="neutro" className="h-7 shrink-0 items-center">
        {resumen.ok} de {resumen.total} verificados
      </Badge>
    )
  }
  return (
    <Badge variant="soft" tono="neutro" className="h-7 shrink-0 items-center">
      Sin validar
    </Badge>
  )
}
