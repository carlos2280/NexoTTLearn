import type { ExcelPreviewEstado, ExcelPreviewResponse } from "@nexott-learn/shared-types"
import { AlertTriangle, CheckCircle2, FileSpreadsheet, XCircle } from "lucide-react"

interface PreviewTablaProps {
  readonly preview: ExcelPreviewResponse
  readonly archivo: File | null
}

const ICONO = new Map<
  ExcelPreviewEstado,
  { readonly icon: typeof CheckCircle2; readonly color: string; readonly bg: string }
>([
  ["ok", { icon: CheckCircle2, color: "text-success", bg: "bg-[var(--success-bg)]" }],
  ["warning", { icon: AlertTriangle, color: "text-warning", bg: "bg-[var(--warning-bg)]" }],
  ["error", { icon: XCircle, color: "text-danger", bg: "bg-[var(--danger-bg)]" }],
])

export function PreviewTabla({ preview, archivo }: PreviewTablaProps) {
  return (
    <div className="flex flex-col gap-4">
      {archivo && (
        <div className="flex items-center gap-3 rounded-[var(--radius-md)] border border-glass-border bg-glass-1 px-3 py-2">
          <FileSpreadsheet className="size-4 text-text-muted" strokeWidth={1.75} />
          <span className="flex-1 truncate font-medium text-sm text-text-primary">
            {archivo.name}
          </span>
          <span className="text-text-muted text-xs">{(archivo.size / 1024).toFixed(1)} KB</span>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        <ResumenCard label="Válidas" value={preview.resumen.ok} tone="success" />
        <ResumenCard label="Advertencias" value={preview.resumen.warnings} tone="warning" />
        <ResumenCard label="Errores" value={preview.resumen.errores} tone="danger" />
      </div>

      <div className="overflow-hidden rounded-[var(--radius-md)] border border-glass-border">
        <div className="max-h-[440px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-surface-2">
              <tr className="border-glass-border border-b">
                <th className="w-10 px-3 py-2 text-left font-medium text-text-muted text-xs uppercase tracking-wider">
                  {" "}
                </th>
                <th className="px-3 py-2 text-left font-medium text-text-muted text-xs uppercase tracking-wider">
                  Email
                </th>
                <th className="px-3 py-2 text-left font-medium text-text-muted text-xs uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-3 py-2 text-center font-medium text-text-muted text-xs uppercase tracking-wider">
                  Notas
                </th>
                <th className="px-3 py-2 text-left font-medium text-text-muted text-xs uppercase tracking-wider">
                  Mensajes
                </th>
              </tr>
            </thead>
            <tbody>
              {preview.filas.map((f, i) => {
                const cfg = ICONO.get(f.estado)
                if (!cfg) {
                  return null
                }
                const Icon = cfg.icon
                const conNota = f.notas.filter((n) => n.valor !== null).length
                return (
                  <tr
                    key={`${f.email}-${i}`}
                    className="border-glass-border border-b last:border-0 hover:bg-glass-1"
                  >
                    <td className="px-3 py-2">
                      <span
                        className={`flex size-6 items-center justify-center rounded-full ${cfg.bg}`}
                      >
                        <Icon className={`size-3.5 ${cfg.color}`} strokeWidth={2.5} />
                      </span>
                    </td>
                    <td className="px-3 py-2 font-mono text-text-primary text-xs">
                      {f.email || "—"}
                    </td>
                    <td className="px-3 py-2 text-text-secondary">{f.nombre || "—"}</td>
                    <td className="px-3 py-2 text-center text-text-muted text-xs tabular-nums">
                      {conNota}/{f.notas.length}
                    </td>
                    <td className="px-3 py-2 text-text-muted text-xs">
                      {f.mensajes.length === 0 ? "Sin observaciones" : f.mensajes.join(" · ")}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

interface ResumenCardProps {
  readonly label: string
  readonly value: number
  readonly tone: "success" | "warning" | "danger"
}

const TONE_STYLES = new Map<
  ResumenCardProps["tone"],
  { readonly color: string; readonly bg: string; readonly border: string }
>([
  [
    "success",
    {
      color: "text-success",
      bg: "bg-[var(--success-bg)]",
      border: "border-[rgb(16_185_129/0.3)]",
    },
  ],
  [
    "warning",
    {
      color: "text-warning",
      bg: "bg-[var(--warning-bg)]",
      border: "border-[rgb(245_158_11/0.3)]",
    },
  ],
  [
    "danger",
    {
      color: "text-danger",
      bg: "bg-[var(--danger-bg)]",
      border: "border-[rgb(244_63_94/0.3)]",
    },
  ],
])

function ResumenCard({ label, value, tone }: ResumenCardProps) {
  const cfg = TONE_STYLES.get(tone)
  if (!cfg) {
    return null
  }
  return (
    <div
      className={`flex flex-col gap-1 rounded-[var(--radius-md)] border ${cfg.border} ${cfg.bg} px-3 py-2.5`}
    >
      <span className="text-text-muted text-xs">{label}</span>
      <span className={`font-bold text-2xl tabular-nums ${cfg.color}`}>{value}</span>
    </div>
  )
}
