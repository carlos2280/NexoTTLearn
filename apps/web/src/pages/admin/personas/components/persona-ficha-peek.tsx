import { useFichaPersona } from "@/features/personas/hooks/use-ficha-persona"
import { Badge } from "@/shared/components/ui/badge"
import { Banner } from "@/shared/components/ui/banner"
import { SidePeek, SidePeekSeccion } from "@/shared/components/ui/side-peek"
import { Skeleton } from "@/shared/components/ui/skeleton"
import type { ColaboradorAdminResumen, FichaResponse } from "@nexott-learn/shared-types"
import type { ReactNode } from "react"
import { BadgeEstadoEmpleado } from "./badge-estado-empleado"
import { BadgeRol } from "./badge-rol"

interface PersonaFichaPeekProps {
  readonly abierto: boolean
  readonly persona: ColaboradorAdminResumen | null
  readonly onCambiarAbierto: (abierto: boolean) => void
}

function formatearFecha(iso: string | null): string {
  if (!iso) {
    return "Sin acceso registrado"
  }
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) {
    return "—"
  }
  return d.toLocaleString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

interface CampoProps {
  readonly etiqueta: string
  readonly valor: ReactNode
}

function Campo({ etiqueta, valor }: CampoProps) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-caption text-text-tertiary">{etiqueta}</span>
      <span className="text-body-sm text-text-primary">{valor}</span>
    </div>
  )
}

export function PersonaFichaPeek({ abierto, persona, onCambiarAbierto }: PersonaFichaPeekProps) {
  const { data, isLoading, error } = useFichaPersona(persona?.id ?? null)

  return (
    <SidePeek
      abierto={abierto}
      onCambiarAbierto={onCambiarAbierto}
      titulo={persona?.nombre ?? "Ficha"}
      descripcion={persona?.email}
      ancho="lg"
    >
      {persona ? (
        <>
          <SidePeekSeccion titulo="Identidad">
            <div className="grid grid-cols-2 gap-4">
              <Campo etiqueta="Rol" valor={<BadgeRol rol={persona.usuario?.rol} />} />
              <Campo
                etiqueta="Estado de empleo"
                valor={<BadgeEstadoEmpleado estado={persona.estadoEmpleado} />}
              />
              <Campo
                etiqueta="MFA"
                valor={
                  persona.usuario?.mfaHabilitado ? (
                    <Badge tono="info" conPunto={false}>
                      Activo
                    </Badge>
                  ) : (
                    <Badge tono="contorno" conPunto={false}>
                      Sin MFA
                    </Badge>
                  )
                }
              />
              <Campo
                etiqueta="Último acceso"
                valor={
                  <span className="tabular">
                    {formatearFecha(persona.usuario?.ultimoLogin ?? null)}
                  </span>
                }
              />
            </div>
          </SidePeekSeccion>

          <SidePeekSeccion titulo="Ficha de skills">
            <SkillsBloque isLoading={isLoading} error={error} data={data ?? null} />
          </SidePeekSeccion>
        </>
      ) : null}
    </SidePeek>
  )
}

interface SkillsBloqueProps {
  readonly isLoading: boolean
  readonly error: unknown
  readonly data: FichaResponse | null
}

function SkillsBloque({ isLoading, error, data }: SkillsBloqueProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        <Skeleton className="h-12" />
        <Skeleton className="h-12" />
        <Skeleton className="h-12" />
      </div>
    )
  }
  if (error) {
    return <Banner tone="danger">No se pudo cargar la ficha.</Banner>
  }
  if (!data || data.porArea.length === 0) {
    return (
      <p className="text-body-sm text-text-tertiary">Aún no hay áreas con notas registradas.</p>
    )
  }
  return (
    <ul className="flex flex-col gap-2">
      {data.porArea.map((area) => (
        <li
          key={area.areaId}
          className="flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-3"
        >
          <div className="flex flex-col gap-0.5">
            <span className="font-medium text-body-sm text-text-primary">{area.nombre}</span>
            <span className="text-caption text-text-tertiary">
              {area.skillsConNota} de {area.skillsTotales} skills con nota
            </span>
          </div>
          <span className="tabular font-medium text-aurora-violet text-h3">
            {area.promedio === null ? "—" : area.promedio.toFixed(1)}
          </span>
        </li>
      ))}
    </ul>
  )
}
