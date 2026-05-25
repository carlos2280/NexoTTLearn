import type { ColaboradorAdminResumen } from "@nexott-learn/shared-types"
import { toast } from "sonner"
import type { CredencialMostrar, EstadoDialog } from "./personas-estado.types"
import {
  type CrearPersonaInput,
  type PersonasMutaciones,
  crear as crearAccion,
  desbloquear as desbloquearAccion,
  regenerar as regenerarAccion,
} from "./use-personas-acciones"

interface BuildArgs {
  readonly mut: PersonasMutaciones
  readonly dialog: EstadoDialog
  readonly setDialog: (e: EstadoDialog) => void
}

export function buildHandlers({ mut, dialog, setDialog }: BuildArgs) {
  return {
    crear: async (input: CrearPersonaInput) => {
      const r = await crearAccion(mut, input)
      toast.success(`${r.colaborador.nombre} fue creado`)
      const credencial: CredencialMostrar = {
        nombre: r.colaborador.nombre,
        email: r.colaborador.email,
        passwordTemporal: r.passwordTemporal,
        caducaEn: r.usuario.passwordInicialCaducaEn,
      }
      setDialog({ modo: "credencial-creada", persona: null, credencial })
    },
    regenerarPassword: async (motivo: string) => {
      if (!dialog.persona) {
        return
      }
      const r = await regenerarAccion(mut, dialog.persona, motivo)
      if (!r) {
        return
      }
      toast.success(`Contraseña regenerada para ${dialog.persona.nombre}`)
      const credencial: CredencialMostrar = {
        nombre: dialog.persona.nombre,
        email: dialog.persona.email,
        passwordTemporal: r.passwordTemporal,
        caducaEn: r.caducaEn,
      }
      setDialog({ modo: "credencial-regenerada", persona: null, credencial })
    },
    desbloquear: async (motivo: string) => {
      const persona: ColaboradorAdminResumen | null = dialog.persona
      if (!persona) {
        return
      }
      await desbloquearAccion(mut, persona, motivo)
      toast.success(`${persona.nombre} fue desbloqueado`)
      setDialog({ modo: "cerrado", persona: null, credencial: null })
    },
  }
}
