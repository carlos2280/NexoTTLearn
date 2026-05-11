import { Badge } from "@/shared/components/ui/badge"
import type { ColumnaTabla } from "@/shared/components/ui/data-table"
import type { AreaResponse, EstadoSkill, SkillResponse } from "@nexott-learn/shared-types"

function BadgeEstado({ estado }: { readonly estado: EstadoSkill }) {
  return estado === "ACTIVA" ? (
    <Badge tono="success" conPunto={true}>
      Activa
    </Badge>
  ) : (
    <Badge tono="neutro" conPunto={true}>
      Archivada
    </Badge>
  )
}

function ChipArea({
  areas,
  areaId,
}: { readonly areas: readonly AreaResponse[]; readonly areaId: string }) {
  const nombre = areas.find((a) => a.id === areaId)?.nombre ?? "—"
  return <Badge tono="contorno">{nombre}</Badge>
}

export function columnasSkills(areas: readonly AreaResponse[]): ColumnaTabla<SkillResponse>[] {
  return [
    {
      id: "etiqueta",
      cabecera: "Skill",
      accesor: (s) => <span className="font-medium text-text-primary">{s.etiquetaVisible}</span>,
    },
    {
      id: "area",
      cabecera: "Área",
      anchoFijo: "200px",
      accesor: (s) => <ChipArea areas={areas} areaId={s.areaId} />,
    },
    {
      id: "estado",
      cabecera: "Estado",
      anchoFijo: "140px",
      accesor: (s) => <BadgeEstado estado={s.estado} />,
    },
    {
      id: "actualizado",
      cabecera: "Actualizado",
      anchoFijo: "150px",
      accesor: (s) => (
        <span className="tabular text-caption text-text-tertiary">
          {new Date(s.updatedAt).toLocaleDateString("es-ES")}
        </span>
      ),
    },
  ]
}
