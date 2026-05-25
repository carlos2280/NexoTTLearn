import { ConfirmMotivoDialog } from "@/shared/components/ui/confirm-motivo-dialog"
import type { usePersonasOrquestacion } from "../use-personas-orquestacion"
import { PersonaCrearDialog } from "./persona-crear-dialog"
import { PersonaCredencialDialog } from "./persona-credencial-dialog"
import { PersonaFichaPeek } from "./persona-ficha-peek"

interface PersonasDialogosProps {
  readonly orq: ReturnType<typeof usePersonasOrquestacion>
}

export function PersonasDialogos({ orq }: PersonasDialogosProps) {
  const cerrarSiCierra = (v: boolean) => (v ? null : orq.cerrar())
  const persona = orq.dialog.persona
  const cred = orq.dialog.credencial

  return (
    <>
      <PersonaCrearDialog
        abierto={orq.dialog.modo === "crear"}
        onCambiarAbierto={cerrarSiCierra}
        enviando={orq.estado.enviandoCrear}
        onCrear={orq.ejecutar.crear}
      />

      <PersonaFichaPeek
        abierto={orq.dialog.modo === "ver-ficha"}
        persona={persona}
        onCambiarAbierto={cerrarSiCierra}
      />

      <ConfirmMotivoDialog
        abierto={orq.dialog.modo === "regenerar-password"}
        onCambiarAbierto={cerrarSiCierra}
        titulo="Regenerar contraseña inicial"
        descripcion={
          persona
            ? `Se generará una nueva contraseña temporal para ${persona.nombre}. La anterior dejará de servir.`
            : undefined
        }
        textoConfirmar="Generar nueva contraseña"
        placeholderMotivo="Por qué se regenera (ej. olvido reportado)…"
        enviando={orq.estado.enviandoRegenerar}
        onConfirmar={orq.ejecutar.regenerarPassword}
      />

      <ConfirmMotivoDialog
        abierto={orq.dialog.modo === "desbloquear"}
        onCambiarAbierto={cerrarSiCierra}
        titulo="Desbloquear cuenta"
        descripcion={
          persona
            ? `${persona.nombre} podrá volver a iniciar sesión. Los intentos fallidos se reiniciarán.`
            : undefined
        }
        textoConfirmar="Desbloquear"
        placeholderMotivo="Motivo del desbloqueo…"
        enviando={orq.estado.enviandoDesbloquear}
        onConfirmar={orq.ejecutar.desbloquear}
      />

      {cred ? (
        <PersonaCredencialDialog
          abierto={
            orq.dialog.modo === "credencial-creada" || orq.dialog.modo === "credencial-regenerada"
          }
          onCambiarAbierto={cerrarSiCierra}
          titulo={
            orq.dialog.modo === "credencial-creada" ? "Colaborador creado" : "Contraseña regenerada"
          }
          descripcion="Guarda esta credencial: solo se muestra ahora."
          nombre={cred.nombre}
          email={cred.email}
          passwordTemporal={cred.passwordTemporal}
          caducaEn={cred.caducaEn}
        />
      ) : null}
    </>
  )
}
