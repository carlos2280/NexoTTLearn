import {
  usePrevisualizarRepararSkills,
  useRepararSkills,
} from "@/features/cursos/hooks/use-reparar-skills"
import { Banner } from "@/shared/components/ui/banner"
import { Button } from "@/shared/components/ui/button"
import { ConfirmDialog } from "@/shared/components/ui/confirm-dialog"
import { useState } from "react"
import { lineasResumenReparacion, necesitaReparacion } from "./reparar-skills.helpers"

interface RepararSkillsAvisoProps {
  readonly cursoId: string
  readonly bloqueado: boolean
}

/**
 * Aviso para cursos cargados sin habilidades (plantilla vieja, sin `skill=`):
 * sus preguntas no se pueden responder y el avance de los asignados queda en
 * 0 %. Solo aparece si falta algo; el boton muestra el resumen y pide confirmar.
 */
export function RepararSkillsAviso({ cursoId, bloqueado }: RepararSkillsAvisoProps) {
  const preview = usePrevisualizarRepararSkills(cursoId, !bloqueado)
  const reparar = useRepararSkills(cursoId)
  const [abierto, setAbierto] = useState(false)

  if (bloqueado || !preview.data || !necesitaReparacion(preview.data)) {
    return null
  }
  const lineas = lineasResumenReparacion(preview.data)

  async function confirmar() {
    await reparar.mutateAsync()
    setAbierto(false)
  }

  return (
    <Banner tone="warning" title="A este curso le faltan habilidades">
      <div className="flex flex-col items-start gap-3">
        <p>
          Sin ellas, sus preguntas no se pueden responder y el avance de las personas asignadas no
          se mueve.
        </p>
        <Button size="sm" type="button" onClick={() => setAbierto(true)}>
          Revisar y reparar
        </Button>
      </div>
      <ConfirmDialog
        abierto={abierto}
        onCambiarAbierto={setAbierto}
        titulo="Reparar habilidades del curso"
        descripcion={
          <ul className="list-disc space-y-1 pl-5">
            {lineas.map((linea) => (
              <li key={linea}>{linea}</li>
            ))}
          </ul>
        }
        textoConfirmar="Reparar"
        enviando={reparar.isPending}
        onConfirmar={confirmar}
      />
    </Banner>
  )
}
