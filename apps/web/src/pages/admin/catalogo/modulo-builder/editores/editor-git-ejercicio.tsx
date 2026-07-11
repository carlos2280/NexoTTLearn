import { Field } from "@/shared/components/ui/field"
import { Textarea } from "@/shared/components/ui/textarea"
import type { BloqueDetalleResponse } from "@nexott-learn/shared-types"
import { useRef, useState } from "react"
import {
  type BorradorGit,
  construirContenidoGit,
  leerInicialGit,
} from "./git-ejercicio/borrador-git"
import { CamposObjetivoGit } from "./git-ejercicio/campos-objetivo-git"
import { EditorBloqueShell } from "./shared/editor-bloque-shell"
import { TiptapEditor } from "./shared/tiptap-editor"
import { extensionesMinimas } from "./shared/tiptap-extensiones"
import { useAutoGuardarBloque } from "./shared/use-auto-guardar-bloque"

interface EditorGitEjercicioProps {
  readonly bloque: BloqueDetalleResponse
}

export function EditorGitEjercicio({ bloque }: EditorGitEjercicioProps) {
  const inicial = leerInicialGit(bloque.contenido)
  const [datos, setDatos] = useState<BorradorGit>(inicial)
  const datosRef = useRef<BorradorGit>(inicial)

  const auto = useAutoGuardarBloque({
    bloqueId: bloque.id,
    construirContenido: () => construirContenidoGit(datosRef.current),
  })

  function actualizar(parcial: Partial<BorradorGit>) {
    setDatos((prev) => {
      const siguiente = { ...prev, ...parcial }
      datosRef.current = siguiente
      return siguiente
    })
    auto.marcarSucio()
  }

  return (
    <EditorBloqueShell
      bloque={bloque}
      titulo="Ejercicio git"
      descripcion="El participante practica git en un terminal sobre un repo simulado. Se marca «logrado» cuando el estado final del repo cumple el objetivo declarativo de abajo."
      estadoGuardado={auto.estado}
    >
      <Field
        label="Enunciado"
        hint="La consigna que ve el participante. Acepta negrita, cursiva, listas, código inline y enlaces."
      >
        {(_attrs) => (
          <TiptapEditor
            key={bloque.id}
            htmlInicial={datos.enunciado}
            extensiones={extensionesMinimas(
              "Crea una rama feature/login, haz un commit y mézclala…",
            )}
            variante="minima"
            altoMin="140px"
            onCambio={(html) => actualizar({ enunciado: html })}
          />
        )}
      </Field>

      <CamposObjetivoGit valor={datos.objetivo} onCambio={(objetivo) => actualizar({ objetivo })} />

      <Field
        label="Pista"
        hint="Opcional. Texto plano que el participante puede desplegar si se atasca."
      >
        {(attrs) => (
          <Textarea
            {...attrs}
            value={datos.pista}
            onChange={(e) => actualizar({ pista: e.target.value })}
            rows={2}
            maxLength={2000}
            placeholder="Recuerda: git checkout -b crea y cambia de rama a la vez."
          />
        )}
      </Field>
    </EditorBloqueShell>
  )
}
