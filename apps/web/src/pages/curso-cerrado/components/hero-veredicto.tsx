import { FirmaNombre } from "@/shared/components/ui/firma-nombre"
import type { EtiquetaCualitativa, ResultadoCierreCurso } from "@nexott-learn/shared-types"
import { motion, useReducedMotion } from "framer-motion"
import { colorDeEtiquetaCualitativa, etiquetaCualitativaVisible } from "../curso-cerrado.types"

interface HeroVeredictoProps {
  readonly nombreUsuario: string
  readonly cursoTitulo: string
  readonly resultado: ResultadoCierreCurso
  readonly etiquetaCualitativa: EtiquetaCualitativa
}

export function HeroVeredicto({
  nombreUsuario,
  cursoTitulo,
  resultado,
  etiquetaCualitativa,
}: HeroVeredictoProps) {
  const reducedMotion = useReducedMotion()
  const ease: [number, number, number, number] = [0.16, 1, 0.3, 1]
  const esApto = resultado === "APTO"
  const colorEstado = colorDeEtiquetaCualitativa(etiquetaCualitativa)

  return (
    <header className="relative flex flex-col items-center gap-8 text-center">
      {esApto ? (
        <span
          aria-hidden="true"
          className="-z-10 -translate-x-1/2 absolute top-4 left-1/2 h-56 w-[28rem] max-w-[80vw] rounded-full opacity-70 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, rgb(var(--color-aurora-violet-rgb) / 0.35), rgb(var(--color-aurora-cyan-rgb) / 0.25) 50%, transparent 75%)",
          }}
        />
      ) : null}

      <motion.h1
        initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 20, filter: "blur(12px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.9, ease }}
        className="text-display-xl text-text-primary leading-none"
        style={esApto ? { color: "var(--color-state-apto)" } : undefined}
      >
        {esApto ? "¡APTO!" : "Aun no apto"}
      </motion.h1>

      <motion.p
        initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.7, ease }}
        className="max-w-[34ch] text-body-lg text-text-secondary"
      >
        <FirmaNombre nombre={nombreUsuario} tono="aurora" />, completaste el curso{" "}
        <span className="text-text-primary">{cursoTitulo}</span>.
      </motion.p>

      {esApto ? (
        <motion.span
          initial={reducedMotion ? { opacity: 1 } : { width: 0, opacity: 0 }}
          animate={{ width: "100%", opacity: 0.85 }}
          transition={{ delay: 0.6, duration: 1.2, ease }}
          aria-hidden="true"
          className="block h-px max-w-[260px] rounded-full bg-[image:var(--gradient-aurora)]"
        />
      ) : null}

      <motion.div
        initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.75, duration: 0.6, ease }}
        className="flex flex-col items-center gap-1"
      >
        <span className="nx-eyebrow text-text-tertiary">Tu desempeno</span>
        <span
          className="font-medium text-h2 uppercase"
          style={{ color: colorEstado, letterSpacing: "0.08em" }}
        >
          {etiquetaCualitativaVisible(etiquetaCualitativa)}
        </span>
      </motion.div>
    </header>
  )
}
