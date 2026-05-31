import { Badge } from "@/shared/components/ui/badge"
import { Button } from "@/shared/components/ui/button"
import { SidePeek, SidePeekSeccion } from "@/shared/components/ui/side-peek"
import type { ColaboradorAdminResumen } from "@nexott-learn/shared-types"
import { KeyRound, ShieldCheck } from "lucide-react"
import type { ReactNode } from "react"
import type { usePersonasOrquestacion } from "../use-personas-orquestacion"
import { BadgeEstadoEmpleado } from "./badge-estado-empleado"
import { BadgeRol } from "./badge-rol"

interface PersonaFichaPeekProps {
  readonly abierto: boolean
  readonly persona: ColaboradorAdminResumen | null
  readonly onCambiarAbierto: (abierto: boolean) => void
  readonly orq: ReturnType<typeof usePersonasOrquestacion>
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

export function PersonaFichaPeek({
  abierto,
  persona,
  onCambiarAbierto,
  orq,
}: PersonaFichaPeekProps) {
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

          <SidePeekSeccion titulo="Acciones de cuenta">
            {persona.usuario ? (
              <div className="flex flex-col gap-2">
                <Button
                  variant="secondary"
                  size="md"
                  fullWidth={true}
                  onClick={() => orq.abrir("regenerar-password", persona)}
                >
                  <KeyRound className="h-4 w-4" aria-hidden={true} />
                  Regenerar contraseña…
                </Button>
                {persona.usuario.bloqueado ? (
                  <Button
                    variant="secondary"
                    size="md"
                    fullWidth={true}
                    onClick={() => orq.abrir("desbloquear", persona)}
                  >
                    <ShieldCheck className="h-4 w-4" aria-hidden={true} />
                    Desbloquear cuenta…
                  </Button>
                ) : null}
              </div>
            ) : (
              <p className="text-body-sm text-text-tertiary">
                Esta persona no tiene cuenta de acceso. Créala desde la lista para habilitar
                acciones.
              </p>
            )}
          </SidePeekSeccion>
        </>
      ) : null}
    </SidePeek>
  )
}
