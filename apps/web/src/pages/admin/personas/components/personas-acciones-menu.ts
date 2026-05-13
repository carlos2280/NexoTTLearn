import type { AccionMenu } from "@/shared/components/ui/menu-acciones"
import type { ColaboradorAdminResumen } from "@nexott-learn/shared-types"
import { Eye, KeyRound, ShieldCheck } from "lucide-react"
import type { usePersonasOrquestacion } from "../use-personas-orquestacion"

export function accionesPorPersona(
  p: ColaboradorAdminResumen,
  orq: ReturnType<typeof usePersonasOrquestacion>,
): readonly (readonly AccionMenu[])[] {
  const acceso: AccionMenu[] = [
    {
      id: "ver-ficha",
      etiqueta: "Ver ficha…",
      icono: Eye,
      onClick: () => orq.abrir("ver-ficha", p),
    },
  ]

  const auth: AccionMenu[] = []
  if (p.usuario) {
    auth.push({
      id: "regenerar-password",
      etiqueta: "Regenerar contraseña…",
      icono: KeyRound,
      onClick: () => orq.abrir("regenerar-password", p),
    })
    if (p.usuario.bloqueado) {
      auth.push({
        id: "desbloquear",
        etiqueta: "Desbloquear cuenta…",
        icono: ShieldCheck,
        onClick: () => orq.abrir("desbloquear", p),
      })
    }
  }

  if (auth.length === 0) {
    return [acceso]
  }
  return [acceso, auth]
}
