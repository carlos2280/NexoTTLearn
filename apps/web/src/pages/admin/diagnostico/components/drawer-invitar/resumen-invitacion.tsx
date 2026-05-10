import type {
  InvitarCandidatosErrorCodigo,
  InvitarCandidatosResponse,
} from "@nexott-learn/shared-types"
import { AlertTriangle, CheckCircle2, Info } from "lucide-react"

interface ResumenInvitacionProps {
  readonly resumen: InvitarCandidatosResponse
}

export function ResumenInvitacion({ resumen }: ResumenInvitacionProps) {
  const totalCreadas = resumen.creadas.length
  const totalYa = resumen.yaInvitados.length
  const totalErr = resumen.errores.length

  return (
    <div className="flex flex-col gap-3 rounded-[var(--radius-md)] border border-glass-border bg-glass-1 p-4">
      <header className="flex items-center gap-2">
        <CheckCircle2 className="size-4 text-success" aria-hidden="true" strokeWidth={2} />
        <h3 className="font-semibold text-sm text-text-primary">Resumen de la invitación</h3>
      </header>
      <ul className="flex flex-col gap-1.5 text-sm">
        <li className="flex items-center gap-2 text-text-primary">
          <span className="font-semibold">{totalCreadas}</span>
          <span className="text-text-muted">{totalCreadas === 1 ? "invitado" : "invitados"}</span>
        </li>
        {totalYa > 0 ? (
          <li className="flex items-center gap-2 text-text-muted">
            <Info className="size-3.5" aria-hidden="true" />
            <span>
              {totalYa} {totalYa === 1 ? "ya estaba" : "ya estaban"} invitado
              {totalYa === 1 ? "" : "s"}
            </span>
          </li>
        ) : null}
        {totalErr > 0 ? (
          <li className="flex items-center gap-2 text-warning">
            <AlertTriangle className="size-3.5" aria-hidden="true" />
            <span>
              {totalErr} con error: {resumen.errores.map((e) => mensajeError(e.codigo)).join(", ")}
            </span>
          </li>
        ) : null}
      </ul>
    </div>
  )
}

function mensajeError(codigo: InvitarCandidatosErrorCodigo): string {
  switch (codigo) {
    case "USUARIO_NO_ENCONTRADO":
      return "usuario no encontrado"
    case "USUARIO_NO_PARTICIPANTE":
      return "no es participante"
    case "USUARIO_BLOQUEADO":
      return "usuario bloqueado"
    default: {
      const _exhaustive: never = codigo
      return _exhaustive
    }
  }
}
