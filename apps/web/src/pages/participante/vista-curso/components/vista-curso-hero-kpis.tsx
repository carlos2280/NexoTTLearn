import type { VistaCursoKpis } from "@nexott-learn/shared-types"

interface VistaCursoHeroKpisProps {
  readonly kpis: VistaCursoKpis
}

// §4.2.5 4 KPIs personales del curso: modulos · nota · horas · contenidos.
export function VistaCursoHeroKpis({ kpis }: VistaCursoHeroKpisProps) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      <KpiCell
        valor={`${kpis.modulosCompletados}`}
        sub={`/${kpis.modulosAsignados}`}
        label="Modulos"
        excelencia={false}
      />
      <KpiCell
        valor={kpis.notaPromedio === null ? "—" : String(kpis.notaPromedio)}
        sub=""
        label="Nota"
        excelencia={kpis.notaPromedio !== null && kpis.notaPromedio >= 90}
      />
      <KpiCell valor={String(kpis.horasDedicadas)} sub="h" label="Dedicacion" excelencia={false} />
      <KpiCell valor={String(kpis.contenidosVistos)} sub="" label="Contenidos" excelencia={false} />
    </div>
  )
}

interface KpiCellProps {
  readonly valor: string
  readonly sub: string
  readonly label: string
  readonly excelencia: boolean
}

function KpiCell({ valor, sub, label, excelencia }: KpiCellProps) {
  return (
    <div className="flex flex-col gap-0.5 rounded-xl border border-glass-border bg-surface-1 px-4 py-3">
      <div className="flex items-baseline gap-0.5">
        <span
          className={
            excelencia
              ? "font-extrabold text-2xl text-gradient-brand tabular-nums"
              : "font-extrabold text-2xl text-text-primary tabular-nums"
          }
        >
          {valor}
        </span>
        {sub.length > 0 ? (
          <span className="font-medium text-[13px] text-text-muted">{sub}</span>
        ) : null}
      </div>
      <span className="font-medium text-[10.5px] text-text-muted uppercase tracking-[0.06em]">
        {label}
      </span>
    </div>
  )
}
