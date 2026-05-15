import type { CursoConfiguracionResponse, CursoDetalle } from "@nexott-learn/shared-types"
import { ConfigAreasExigidas } from "./config-areas-exigidas"
import { ConfigEntrevistaIa } from "./config-entrevista-ia"
import { ConfigHeader } from "./config-header"
import { ConfigModulosHabilitados } from "./config-modulos-habilitados"
import { ConfigParametros } from "./config-parametros"
import { ConfigPesos } from "./config-pesos"
import { ConfigSkillsExigidas } from "./config-skills-exigidas"
import { ConfigTransversal } from "./config-transversal"
import { ConfigUmbralesLogro } from "./config-umbrales-logro"

interface ConfigCursoTabProps {
  readonly curso: CursoDetalle & Partial<Pick<CursoConfiguracionResponse, "umbralesLogro">>
}

export function ConfigCursoTab({ curso }: ConfigCursoTabProps) {
  const bloqueado = curso.estado === "CERRADO" || curso.estado === "ARCHIVADO"

  return (
    <div className="flex flex-col gap-6">
      <ConfigHeader />
      <ConfigParametros curso={curso} />
      <ConfigAreasExigidas curso={curso} bloqueado={bloqueado} />
      <ConfigSkillsExigidas curso={curso} bloqueado={bloqueado} />
      <ConfigModulosHabilitados curso={curso} bloqueado={bloqueado} />
      <ConfigPesos curso={curso} bloqueado={bloqueado} />
      <ConfigUmbralesLogro curso={curso} bloqueado={bloqueado} />
      <ConfigTransversal curso={curso} bloqueado={bloqueado} />
      <ConfigEntrevistaIa curso={curso} bloqueado={bloqueado} />
    </div>
  )
}
