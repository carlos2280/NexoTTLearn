import { DrawerBody } from "@/shared/ui/patterns/drawer"
import type {
  EntregaBloqueDetalleAdmin,
  EntregaBloqueIntentoPrevioAdmin,
} from "@nexott-learn/shared-types"
import { edadRelativa } from "../lib/prioridad"

interface TabContenidoEntregaProps {
  readonly data: EntregaBloqueDetalleAdmin
}

export function TabContenidoEntrega({ data }: TabContenidoEntregaProps) {
  return (
    <DrawerBody>
      <p className="font-medium text-text-secondary text-xs uppercase tracking-wider">
        Contenido entregado
      </p>
      <pre className="overflow-x-auto rounded-[var(--radius-md)] border border-glass-border bg-glass-1 p-4 text-text-primary text-xs leading-relaxed">
        {JSON.stringify(data.contenido, null, 2)}
      </pre>
      {data.feedback ? (
        <div className="space-y-1">
          <p className="font-medium text-text-secondary text-xs uppercase tracking-wider">
            Feedback previo
          </p>
          <p className="text-sm text-text-primary">{data.feedback}</p>
        </div>
      ) : null}
    </DrawerBody>
  )
}

interface TabHistoricoProps {
  readonly intentos: EntregaBloqueIntentoPrevioAdmin[]
  readonly intentoActual: number
}

export function TabHistorico({ intentos, intentoActual }: TabHistoricoProps) {
  return (
    <DrawerBody>
      <p className="font-medium text-text-secondary text-xs uppercase tracking-wider">
        Intentos del candidato
      </p>
      <div className="flex flex-col gap-2">
        {intentos.map((intento) => (
          <div
            key={intento.id}
            className="flex items-center justify-between rounded-[var(--radius-md)] border border-glass-border bg-glass-1 px-4 py-3"
          >
            <div>
              <p className="font-medium text-sm text-text-primary">
                Intento {intento.intento}
                {intento.intento === intentoActual ? (
                  <span className="ml-2 text-brand-violet-soft text-xs">(actual)</span>
                ) : null}
              </p>
              <p className="text-text-muted text-xs">{edadRelativa(intento.enviadaAt)}</p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-sm text-text-primary">
                {intento.nota !== null ? `${intento.nota} / 100` : "—"}
              </p>
              <p className="text-text-muted text-xs">{intento.estado}</p>
            </div>
          </div>
        ))}
      </div>
    </DrawerBody>
  )
}
