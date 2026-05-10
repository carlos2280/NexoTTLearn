import { DrawerBody } from "@/shared/ui/patterns/drawer"
import type { EntregaProyectoDetalleAdmin } from "@nexott-learn/shared-types"
import { edadRelativa } from "../lib/prioridad"

interface TabCapaProps {
  readonly data: EntregaProyectoDetalleAdmin
}

export function TabCapa1({ data }: TabCapaProps) {
  return (
    <DrawerBody>
      <p className="font-medium text-text-secondary text-xs uppercase tracking-wider">
        Capa 1 · Análisis Objetivo (auto)
      </p>
      <div className="space-y-2 rounded-[var(--radius-md)] border border-glass-border bg-glass-1 p-4">
        <Row
          label="Nota"
          value={data.notaCapa1 !== null ? `${data.notaCapa1} / 100` : "Pendiente"}
        />
        <Row
          label="Peso aplicado"
          value={data.pesoCapa1Aplicado !== null ? `${data.pesoCapa1Aplicado}%` : "—"}
        />
      </div>
    </DrawerBody>
  )
}

export function TabCapa2({ data }: TabCapaProps) {
  return (
    <DrawerBody>
      <p className="font-medium text-text-secondary text-xs uppercase tracking-wider">
        Capa 2 · Análisis Cualitativo IA
      </p>
      <div className="space-y-2 rounded-[var(--radius-md)] border border-glass-border bg-glass-1 p-4">
        <Row
          label="Nota"
          value={data.notaCapa2 !== null ? `${data.notaCapa2} / 100` : "Pendiente"}
        />
        <Row
          label="Peso aplicado"
          value={data.pesoCapa2Aplicado !== null ? `${data.pesoCapa2Aplicado}%` : "—"}
        />
      </div>
      {data.areasMejora ? (
        <div className="space-y-1">
          <p className="font-medium text-text-secondary text-xs uppercase tracking-wider">
            Áreas de mejora
          </p>
          <p className="text-sm text-text-primary">{data.areasMejora}</p>
        </div>
      ) : null}
      {data.fortalezas ? (
        <div className="space-y-1">
          <p className="font-medium text-text-secondary text-xs uppercase tracking-wider">
            Fortalezas
          </p>
          <p className="text-sm text-text-primary">{data.fortalezas}</p>
        </div>
      ) : null}
    </DrawerBody>
  )
}

export function TabCapa3({ data }: TabCapaProps) {
  return (
    <DrawerBody>
      <p className="font-medium text-text-secondary text-xs uppercase tracking-wider">
        Capa 3 · Entrevista de Comprensión
      </p>
      <div className="space-y-2 rounded-[var(--radius-md)] border border-glass-border bg-glass-1 p-4">
        <Row
          label="Nota"
          value={data.notaCapa3 !== null ? `${data.notaCapa3} / 100` : "Pendiente"}
        />
        <Row
          label="Peso aplicado"
          value={data.pesoCapa3Aplicado !== null ? `${data.pesoCapa3Aplicado}%` : "—"}
        />
      </div>
      {data.transcripcionCapa3 ? (
        <div className="space-y-1">
          <p className="font-medium text-text-secondary text-xs uppercase tracking-wider">
            Transcripción
          </p>
          <pre className="overflow-x-auto whitespace-pre-wrap rounded-[var(--radius-md)] border border-glass-border bg-glass-1 p-4 text-text-primary text-xs leading-relaxed">
            {data.transcripcionCapa3}
          </pre>
        </div>
      ) : null}
    </DrawerBody>
  )
}

export function TabFinalProyecto({ data }: TabCapaProps) {
  return (
    <DrawerBody>
      <p className="font-medium text-text-secondary text-xs uppercase tracking-wider">
        Resumen · Nota agregada
      </p>
      <div className="space-y-2 rounded-[var(--radius-md)] border border-glass-border bg-glass-1 p-4">
        <Row
          label="Capa 1"
          value={
            data.notaCapa1 !== null ? `${data.notaCapa1} (${data.pesoCapa1Aplicado ?? "?"}%)` : "—"
          }
        />
        <Row
          label="Capa 2"
          value={
            data.notaCapa2 !== null ? `${data.notaCapa2} (${data.pesoCapa2Aplicado ?? "?"}%)` : "—"
          }
        />
        <Row
          label="Capa 3"
          value={
            data.notaCapa3 !== null ? `${data.notaCapa3} (${data.pesoCapa3Aplicado ?? "?"}%)` : "—"
          }
        />
        <div className="border-glass-border border-t pt-2">
          <Row
            label="Nota agregada"
            value={
              data.notaCalculadaOriginal !== null ? `${data.notaCalculadaOriginal} / 100` : "—"
            }
            bold={true}
          />
          {data.ajustadaManual && data.notaFinal !== null ? (
            <Row label="Nota ajustada" value={`${data.notaFinal} / 100 ✦`} bold={true} />
          ) : null}
        </div>
      </div>
      <p className="font-medium text-text-secondary text-xs uppercase tracking-wider">Intentos</p>
      <div className="flex flex-col gap-2">
        {data.intentos.map((intento) => (
          <div
            key={intento.id}
            className="flex items-center justify-between rounded-[var(--radius-md)] border border-glass-border bg-glass-1 px-4 py-3"
          >
            <div>
              <p className="font-medium text-sm text-text-primary">
                Intento {intento.intento}
                {intento.intento === data.intento ? (
                  <span className="ml-2 text-brand-violet-soft text-xs">(actual)</span>
                ) : null}
              </p>
              <p className="text-text-muted text-xs">{edadRelativa(intento.enviadaAt)}</p>
            </div>
            <p className="font-semibold text-sm text-text-primary">
              {intento.notaFinal !== null ? `${intento.notaFinal} / 100` : "—"}
            </p>
          </div>
        ))}
      </div>
    </DrawerBody>
  )
}

interface RowProps {
  readonly label: string
  readonly value: string
  readonly bold?: boolean
}

function Row({ label, value, bold = false }: RowProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-text-secondary text-xs">{label}</span>
      <span
        className={bold ? "font-semibold text-sm text-text-primary" : "text-sm text-text-primary"}
      >
        {value}
      </span>
    </div>
  )
}
