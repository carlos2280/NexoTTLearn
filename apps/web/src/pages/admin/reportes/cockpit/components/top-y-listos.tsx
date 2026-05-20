import { Card } from "@/shared/components/ui/card"
import type {
  CoberturaListosParaPresentar,
  CoberturaTopColaborador,
} from "@nexott-learn/shared-types"
import { Award, Briefcase, LifeBuoy } from "lucide-react"
import type { ReactNode } from "react"

interface TopYListosProps {
  readonly top: readonly CoberturaTopColaborador[]
  readonly necesitanApoyo: readonly CoberturaTopColaborador[]
  readonly listosParaPresentar: CoberturaListosParaPresentar
}

export function TopYListos({ top, necesitanApoyo, listosParaPresentar }: TopYListosProps) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <ColumnaPersonas
        icono={<Award className="h-4 w-4 text-success" aria-hidden={true} />}
        titulo="Top del talento"
        descripcion="Promedio global más alto"
        items={top}
        tono="success"
      />
      <ColumnaPersonas
        icono={<LifeBuoy className="h-4 w-4 text-warning" aria-hidden={true} />}
        titulo="Necesitan apoyo"
        descripcion="Promedio global más bajo"
        items={necesitanApoyo}
        tono="warning"
      />
      <ColumnaListos listos={listosParaPresentar} />
    </div>
  )
}

interface ColumnaPersonasProps {
  readonly icono: ReactNode
  readonly titulo: string
  readonly descripcion: string
  readonly items: readonly CoberturaTopColaborador[]
  readonly tono: "success" | "warning"
}

function ColumnaPersonas({ icono, titulo, descripcion, items, tono }: ColumnaPersonasProps) {
  return (
    <Card tono="plano" densidad="base" className="flex flex-col gap-3">
      <header className="flex items-center gap-2">
        {icono}
        <div className="flex flex-col">
          <span className="font-medium text-body-sm text-text-primary">{titulo}</span>
          <span className="text-caption text-text-tertiary">{descripcion}</span>
        </div>
      </header>
      {items.length === 0 ? (
        <p className="text-caption text-text-tertiary">Aún no hay datos suficientes.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((c) => (
            <li
              key={c.id}
              className="flex items-baseline justify-between gap-2 border-border border-b pb-2 last:border-b-0 last:pb-0"
            >
              <div className="flex flex-col">
                <span className="font-medium text-body-sm text-text-primary">{c.nombre}</span>
                <span className="text-caption text-text-tertiary">
                  {c.areasExcelencia} {c.areasExcelencia === 1 ? "área" : "áreas"} en excelencia
                </span>
              </div>
              <span
                className={`tabular font-mono font-semibold text-body-sm ${
                  tono === "success" ? "text-success" : "text-warning"
                }`}
              >
                {Math.round(c.promedioGlobal)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

interface ColumnaListosProps {
  readonly listos: CoberturaListosParaPresentar
}

function ColumnaListos({ listos }: ColumnaListosProps) {
  return (
    <Card tono="plano" densidad="base" className="flex flex-col gap-3">
      <header className="flex items-center gap-2">
        <Briefcase className="h-4 w-4 text-aurora-violet" aria-hidden={true} />
        <div className="flex flex-col">
          <span className="font-medium text-body-sm text-text-primary">Listos para presentar</span>
          <span className="text-caption text-text-tertiary">Estado del pipeline a cliente</span>
        </div>
      </header>
      <dl className="flex flex-col gap-2">
        <FilaListo
          etiqueta="Colaboradores aptos"
          valor={listos.colaboradoresAptos}
          hint="Listos para ir al cliente"
        />
        <FilaListo
          etiqueta="Cursos activos"
          valor={listos.cursosActivos}
          hint="En curso ahora mismo"
        />
        <FilaListo
          etiqueta="Clientes con pipeline"
          valor={listos.clientesConPipeline}
          hint="Con al menos un apto"
        />
      </dl>
    </Card>
  )
}

interface FilaListoProps {
  readonly etiqueta: string
  readonly valor: number
  readonly hint: string
}

function FilaListo({ etiqueta, valor, hint }: FilaListoProps) {
  return (
    <div className="flex items-baseline justify-between gap-2 border-border border-b pb-2 last:border-b-0 last:pb-0">
      <div className="flex flex-col">
        <dt className="font-medium text-body-sm text-text-primary">{etiqueta}</dt>
        <dd className="text-caption text-text-tertiary">{hint}</dd>
      </div>
      <span className="tabular font-medium font-mono text-body-lg text-text-primary">{valor}</span>
    </div>
  )
}
