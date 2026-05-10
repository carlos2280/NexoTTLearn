import { Tabs } from "@/shared/ui/patterns/tabs"
import type { BandejaStream } from "@nexott-learn/shared-types"
import { AnimatePresence, motion } from "framer-motion"
import { useState } from "react"
import { NovedadRow } from "./novedad-row"
import { PendienteRow } from "./pendiente-row"

interface BandejaStreamProps {
  readonly stream: BandejaStream
}

type TabValue = "pendientes" | "novedades"

const EASE_OUT: [number, number, number, number] = [0.2, 0.8, 0.2, 1]

// §4.3 doc canonico. Tabs Pendientes (max 10) / Novedades (max 5).
// Cambio de tab con AnimatePresence (fade 200ms, mode wait — sin overlap).
export function BandejaStreamBlock({ stream }: BandejaStreamProps) {
  const [tab, setTab] = useState<TabValue>("pendientes")

  return (
    <section className="mt-10 flex flex-col gap-4">
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32, ease: EASE_OUT, delay: 0.28 }}
        className="font-medium text-[11px] text-text-muted uppercase tracking-[0.12em]"
      >
        Actividades
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32, ease: EASE_OUT, delay: 0.3 }}
      >
        <Tabs<TabValue>
          items={[
            { value: "pendientes", label: "Pendientes" },
            {
              value: "novedades",
              label: "Novedades",
              badge: stream.novedadesNoLeidas > 0 ? stream.novedadesNoLeidas : null,
            },
          ]}
          value={tab}
          onChange={setTab}
          ariaLabel="Stream de actividades"
        />
      </motion.div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.2, ease: EASE_OUT }}
          className="flex flex-col gap-2.5"
        >
          {contenidoTab(tab, stream)}
        </motion.div>
      </AnimatePresence>
    </section>
  )
}

function contenidoTab(tab: TabValue, stream: BandejaStream) {
  switch (tab) {
    case "pendientes": {
      if (stream.pendientes.length === 0) {
        return <Vacio mensaje="Sin pendientes por ahora" />
      }
      return stream.pendientes.map((item, i) => (
        <PendienteRow key={item.id} item={item} index={i} />
      ))
    }
    case "novedades": {
      if (stream.novedades.length === 0) {
        return <Vacio mensaje="Sin novedades nuevas" />
      }
      return stream.novedades.map((item, i) => <NovedadRow key={item.id} item={item} index={i} />)
    }
    default: {
      const _exhaustive: never = tab
      return _exhaustive
    }
  }
}

function Vacio({ mensaje }: { readonly mensaje: string }) {
  return (
    <div className="rounded-2xl border border-glass-border border-dashed bg-surface-1 px-4 py-10 text-center text-sm text-text-muted">
      {mensaje}
    </div>
  )
}
