import { useCrearIntentoTransversal } from "@/features/transversal/hooks/use-crear-intento-transversal"
import { Button } from "@/shared/components/ui/button"
import { TextField } from "@/shared/components/ui/text-field"
import { Textarea } from "@/shared/components/ui/textarea"
import { crearIntentoTransversalSchema } from "@nexott-learn/shared-types"
import { GitBranch, Send } from "lucide-react"
import { useState } from "react"

interface FormEnvioTransversalProps {
  readonly asignacionId: string
  readonly urlInicial?: string
  readonly onIntentoCreado: (intentoId: string) => void
}

interface ErroresForm {
  readonly url?: string
  readonly comentario?: string
  readonly general?: string
}

const MAX_COMENTARIO = 2000

/**
 * Form de envio del proyecto transversal (vista 1 del spec 05). URL_GIT
 * restringida a github.com / gitlab.com (regex del schema compartido) +
 * comentario opcional <= 2000 chars. Validacion con Zod, errores inline
 * sobrios, sin alarma roja gigante.
 */
export function FormEnvioTransversal({
  asignacionId,
  urlInicial = "",
  onIntentoCreado,
}: FormEnvioTransversalProps) {
  const [url, setUrl] = useState(urlInicial)
  const [comentario, setComentario] = useState("")
  const [errores, setErrores] = useState<ErroresForm>({})
  const crear = useCrearIntentoTransversal()

  const onEnviar = async (): Promise<void> => {
    setErrores({})
    const parsed = crearIntentoTransversalSchema.safeParse({
      repoOArtefacto: { tipo: "URL_GIT", url: url.trim() },
      comentarioColaborador: comentario.trim() || undefined,
    })
    if (!parsed.success) {
      const flat = parsed.error.flatten()
      setErrores({
        url: flat.fieldErrors.repoOArtefacto?.[0],
        comentario: flat.fieldErrors.comentarioColaborador?.[0],
      })
      return
    }
    try {
      const resp = await crear.mutateAsync({ asignacionId, body: parsed.data })
      onIntentoCreado(resp.intentoId)
    } catch (err) {
      setErrores({ general: err instanceof Error ? err.message : "No pudimos enviar tu proyecto." })
    }
  }

  return (
    <section className="flex flex-col gap-5 rounded-2xl border border-border bg-surface p-6">
      <header className="flex flex-col gap-1">
        <h3 className="nx-eyebrow text-text-tertiary">Envia tu proyecto</h3>
        <p className="text-body-sm text-text-secondary">
          Solo aceptamos URLs de github.com o gitlab.com vía HTTPS.
        </p>
      </header>

      <TextField
        label="URL del repositorio"
        icon={<GitBranch className="h-4 w-4" aria-hidden={true} />}
        type="url"
        autoComplete="off"
        spellCheck={false}
        placeholder="https://github.com/usuario/proyecto"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        error={errores.url}
      />

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="comentario-transversal"
          className="font-medium text-body-sm text-text-secondary"
        >
          Comentario (opcional)
        </label>
        <Textarea
          id="comentario-transversal"
          rows={4}
          maxLength={MAX_COMENTARIO}
          placeholder="Si quieres añadir contexto (decisiones de diseño, README destacado, lo que sea), va aqui."
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
          hasError={!!errores.comentario}
        />
        {errores.comentario ? (
          <p className="text-caption text-danger-on-soft">{errores.comentario}</p>
        ) : (
          <p className="text-caption text-text-tertiary">
            {comentario.length}/{MAX_COMENTARIO}
          </p>
        )}
      </div>

      {errores.general ? (
        <p className="text-body-sm text-danger-on-soft">{errores.general}</p>
      ) : null}

      <footer className="flex flex-col items-end gap-2">
        <Button onClick={onEnviar} disabled={crear.isPending || url.trim().length === 0}>
          <Send className="mr-2 h-3.5 w-3.5" aria-hidden={true} />
          {crear.isPending ? "Enviando…" : "Enviar mi proyecto"}
        </Button>
        <p className="text-caption text-text-tertiary">Recibiras el resultado en pocos minutos.</p>
      </footer>
    </section>
  )
}
