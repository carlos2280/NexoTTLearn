import { Drawer, DrawerBody, DrawerContent, DrawerHeader } from "@/shared/ui/patterns/drawer"
import { StatCard } from "@/shared/ui/patterns/stat-card"
import type { MatrizAreaHeader, MatrizCursoResponse } from "@nexott-learn/shared-types"
import { CheckCircle2, Target, TrendingUp, XCircle } from "lucide-react"
import { calcularStatsArea } from "../lib/stats-area"

interface DrawerAreaCrossProps {
  readonly area: MatrizAreaHeader | null
  readonly matriz: MatrizCursoResponse | undefined
  readonly onClose: () => void
}

export function DrawerAreaCross({ area, matriz, onClose }: DrawerAreaCrossProps) {
  const open = Boolean(area)
  const stats = matriz && area ? calcularStatsArea(matriz, area.id) : null

  return (
    <Drawer
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          onClose()
        }
      }}
    >
      <DrawerContent
        title={`Área ${area?.nombre ?? ""}`}
        header={
          <DrawerHeader>
            <div className="flex flex-col gap-1">
              <span className="text-text-muted text-xs uppercase tracking-wider">
                Vista cross-candidato
              </span>
              <h3 className="font-semibold text-base text-text-primary tracking-tight">
                {area?.nombre ?? "—"}
              </h3>
              <span className="text-text-muted text-xs">
                Umbral {area?.umbral ?? "—"} · peso {area?.peso ?? "—"}
              </span>
            </div>
          </DrawerHeader>
        }
      >
        <DrawerBody>
          {!stats && area ? (
            <div className="rounded-[var(--radius-lg)] border border-glass-border bg-glass-1 p-6 text-center text-sm text-text-muted">
              Cargando datos del área…
            </div>
          ) : null}
          {stats && area ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <StatCard
                  label="Promedio"
                  value={stats.promedio === null ? "—" : stats.promedio}
                  icon={TrendingUp}
                  tone={
                    stats.promedio !== null && stats.promedio >= area.umbral ? "success" : "warning"
                  }
                />
                <StatCard
                  label="Con nota"
                  value={`${stats.conNota} / ${stats.total}`}
                  icon={Target}
                  tone="info"
                />
                <StatCard
                  label="Cumplen"
                  value={stats.cumplen}
                  icon={CheckCircle2}
                  tone="success"
                />
                <StatCard label="No cumplen" value={stats.noCumplen} icon={XCircle} tone="danger" />
              </div>
              <DistribucionLine total={stats.total} stats={stats} />
            </>
          ) : null}
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  )
}

interface DistribucionLineProps {
  readonly total: number
  readonly stats: ReturnType<typeof calcularStatsArea>
}

function DistribucionLine({ total, stats }: DistribucionLineProps) {
  if (total === 0) {
    return null
  }
  const verde = (stats.cumplen / total) * 100
  const amarillo = (stats.cerca / total) * 100
  const rojo = (stats.noCumplen / total) * 100
  const vacio = 100 - verde - amarillo - rojo

  return (
    <section className="flex flex-col gap-2">
      <h4 className="font-medium text-text-secondary text-xs uppercase tracking-wider">
        Distribución
      </h4>
      <div className="flex h-2 overflow-hidden rounded-full">
        <span style={{ width: `${verde}%` }} className="bg-success" />
        <span style={{ width: `${amarillo}%` }} className="bg-warning" />
        <span style={{ width: `${rojo}%` }} className="bg-danger" />
        <span style={{ width: `${vacio}%` }} className="bg-glass-2" />
      </div>
      <div className="flex flex-wrap gap-3 text-text-muted text-xs">
        <span>Cumple: {stats.cumplen}</span>
        <span>Cerca: {stats.cerca}</span>
        <span>No cumple: {stats.noCumplen}</span>
        <span>Sin dato: {total - stats.conNota}</span>
      </div>
    </section>
  )
}
