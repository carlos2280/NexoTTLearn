import type { VistaModulo } from "@nexott-learn/shared-types"
import { motion } from "framer-motion"
import { ChevronRight } from "lucide-react"
import { Link } from "react-router-dom"
import { MiniProyectoRow } from "./mini-proyecto-row"
import { ModuloNumIndicator } from "./modulo-num-indicator"
import { moduloProgressFill, tagAsignacionClassName, tagAsignacionLabel } from "./modulo-presets"

interface ModuloRowProps {
  readonly modulo: VistaModulo
  readonly index: number
}

const EASE_OUT: [number, number, number, number] = [0.2, 0.8, 0.2, 1]

// §4.3.3 module-item-extended. num + body + progress + chevron.
// Si tiene mini-proyecto activo, sub-fila debajo.
export function ModuloRow({ modulo, index }: ModuloRowProps) {
  const widthStyle = { width: `${modulo.porcentajeAvance}%` }
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: EASE_OUT, delay: 0.16 + index * 0.04 }}
      className="group/wrap relative overflow-hidden rounded-2xl border border-glass-border bg-surface-1 transition-all duration-300 hover:border-glass-border-strong"
    >
      <Link
        to={modulo.href}
        className="group/row relative flex items-stretch gap-4 px-5 py-4 transition-all duration-300 hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-violet/40"
      >
        <ModuloNumIndicator modulo={modulo} />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <p className="font-semibold text-[15px] text-text-primary">{modulo.titulo}</p>
          <div className="flex flex-wrap items-center gap-2 text-[13px] text-text-secondary">
            <span
              className={`inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 font-medium text-[10.5px] uppercase tracking-[0.06em] ${tagAsignacionClassName(modulo.tagAsignacion)}`}
            >
              {tagAsignacionLabel(modulo.tagAsignacion)}
            </span>
            <span className="truncate">
              {modulo.cantidadSecciones} sec · {modulo.cantidadContenidos} cont
              {textoEstadoModulo(modulo)}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-1.5 max-w-[180px] flex-1 overflow-hidden rounded-full bg-surface-2">
              <div
                className={moduloProgressFill(modulo.estado, modulo.excelencia)}
                style={widthStyle}
              />
            </div>
            <span className="font-semibold text-[12px] text-text-muted tabular-nums">
              {modulo.porcentajeAvance}%
            </span>
          </div>
        </div>
        <ChevronRight
          className="size-4 shrink-0 self-center text-brand-violet transition-transform duration-300 group-hover/row:translate-x-[2px]"
          strokeWidth={2}
        />
      </Link>
      {modulo.miniProyecto !== null ? <MiniProyectoRow mini={modulo.miniProyecto} /> : null}
    </motion.div>
  )
}

function textoEstadoModulo(modulo: VistaModulo): string {
  if (modulo.estado === "NO_INICIADO") {
    return " · Sin iniciar"
  }
  if (modulo.estado === "EN_PROGRESO") {
    return " · En progreso"
  }
  if (modulo.nota === null) {
    return ""
  }
  return modulo.excelencia ? ` · Nota: ${modulo.nota} ✦` : ` · Nota: ${modulo.nota}`
}
