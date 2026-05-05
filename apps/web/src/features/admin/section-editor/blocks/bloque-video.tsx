import { NxtInputField, NxtSelect, NxtSelectOption } from "@carlos2280/nexott-ui/react"
import type { ProveedorVideo } from "@nexott-learn/shared-types"
import { useState } from "react"
import { type VideoPayload, jsonEquals, parseVideoPayload } from "./bloque-payloads"
import { BloqueSaveStatus } from "./bloque-save-status"
import { detectVideoProvider } from "./detect-video-provider"
import { useBloqueAutoSave } from "./use-bloque-autosave"

interface BloqueVideoProps {
  readonly cursoId: string
  readonly moduloId: string
  readonly seccionId: string
  readonly contenidoId: string
  readonly contenidoRaw: unknown
}

interface ProveedorPreview {
  readonly proveedor: ProveedorVideo
  readonly videoId: string | null
}

// Editor de bloque VIDEO. Maneja URL + proveedor (autodetectado, override
// manual respetado hasta el siguiente cambio de URL) + duracion opcional +
// transcripcion opcional. Preview 16:9 segun proveedor — solo se renderiza
// si la URL coincide con el proveedor seleccionado.
export function BloqueVideo({
  cursoId,
  moduloId,
  seccionId,
  contenidoId,
  contenidoRaw,
}: BloqueVideoProps) {
  const [initial] = useState<VideoPayload>(() => parseVideoPayload(contenidoRaw))
  const [draft, setDraft] = useState<VideoPayload>(initial)

  const { state, flush } = useBloqueAutoSave<VideoPayload>({
    cursoId,
    moduloId,
    seccionId,
    contenidoId,
    draft,
    initial,
    equals: jsonEquals,
  })

  // Cuando el admin cambia la URL, autodetectamos el proveedor (override
  // implicito). Si despues cambia el proveedor manualmente, ese cambio queda
  // hasta que el admin vuelva a tocar la URL (siguiente onChange autodetecta
  // y "borra" el override).
  const handleUrlChange = (nuevaUrl: string): void => {
    const detected = detectVideoProvider(nuevaUrl)
    setDraft((prev) => ({ ...prev, url: nuevaUrl, proveedor: detected.proveedor }))
  }

  const handleProveedorChange = (nuevo: ProveedorVideo): void => {
    setDraft((prev) => ({ ...prev, proveedor: nuevo }))
  }

  const detected = detectVideoProvider(draft.url)
  const previewState = computePreviewState(draft.url, draft.proveedor, detected)

  return (
    <div className="bloque-video">
      <div className="bloque-video__field">
        <NxtInputField
          variant="filled"
          label="URL del video"
          placeholder="https://www.youtube.com/watch?v=..."
          value={draft.url}
          onChange={(event) => handleUrlChange(event.target.value)}
          onBlur={() => flush()}
        />
      </div>

      <div className="bloque-video__field">
        <NxtSelect
          label="Proveedor"
          value={draft.proveedor}
          onNxtSelectChange={(event) => handleProveedorChange(event.detail.value as ProveedorVideo)}
          onNxtSelectClose={() => flush()}
        >
          <NxtSelectOption value="youtube">YouTube</NxtSelectOption>
          <NxtSelectOption value="vimeo">Vimeo</NxtSelectOption>
          <NxtSelectOption value="interno">Video interno</NxtSelectOption>
        </NxtSelect>
      </div>

      <BloqueVideoPreview state={previewState} />

      <div className="bloque-video__field">
        <NxtInputField
          variant="filled"
          label="Duracion (segundos)"
          placeholder="0"
          type="number"
          value={draft.duracion?.toString() ?? ""}
          onChange={(event) => {
            const raw = event.target.value
            const parsed = raw === "" ? undefined : Number.parseInt(raw, 10)
            setDraft((prev) => ({
              ...prev,
              duracion: Number.isFinite(parsed) && (parsed ?? -1) >= 0 ? parsed : undefined,
            }))
          }}
          onBlur={() => flush()}
        />
      </div>

      <div className="bloque-video__field">
        <NxtInputField
          variant="filled"
          label="Transcripcion"
          placeholder="Pega aqui la transcripcion del video (opcional)"
          multiline={true}
          rows={4}
          value={draft.transcripcion ?? ""}
          onChange={(event) =>
            setDraft((prev) => ({
              ...prev,
              transcripcion: event.target.value === "" ? undefined : event.target.value,
            }))
          }
          onBlur={() => flush()}
        />
      </div>

      <div className="bloque-video__status">
        <BloqueSaveStatus state={state} />
      </div>
    </div>
  )
}

export type PreviewState =
  | { readonly kind: "empty" }
  | { readonly kind: "mismatch" }
  | { readonly kind: "invalid" }
  | { readonly kind: "youtube"; readonly videoId: string }
  | { readonly kind: "vimeo"; readonly videoId: string }
  | { readonly kind: "interno"; readonly url: string }

export function computePreviewState(
  url: string,
  proveedor: ProveedorVideo,
  detected: ProveedorPreview,
): PreviewState {
  const trimmed = url.trim()
  if (trimmed.length === 0) {
    return { kind: "empty" }
  }
  if (proveedor === "interno") {
    return { kind: "interno", url: trimmed }
  }
  // youtube/vimeo: la URL debe coincidir con el proveedor seleccionado.
  if (detected.proveedor !== proveedor) {
    return { kind: "mismatch" }
  }
  if (!detected.videoId) {
    return { kind: "invalid" }
  }
  return proveedor === "youtube"
    ? { kind: "youtube", videoId: detected.videoId }
    : { kind: "vimeo", videoId: detected.videoId }
}

interface BloqueVideoPreviewProps {
  readonly state: PreviewState
}

function BloqueVideoPreview({ state }: BloqueVideoPreviewProps) {
  if (state.kind === "empty") {
    return null
  }
  if (state.kind === "mismatch") {
    return (
      <div className="bloque-video__preview bloque-video__preview--note">
        URL no coincide con el proveedor seleccionado.
      </div>
    )
  }
  if (state.kind === "invalid") {
    return (
      <div className="bloque-video__preview bloque-video__preview--note">
        URL no valida para el proveedor seleccionado.
      </div>
    )
  }
  if (state.kind === "youtube") {
    return (
      <div className="bloque-video__preview">
        <iframe
          className="bloque-video__frame"
          src={`https://www.youtube.com/embed/${state.videoId}`}
          title="Vista previa de YouTube"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen={true}
        />
      </div>
    )
  }
  if (state.kind === "vimeo") {
    return (
      <div className="bloque-video__preview">
        <iframe
          className="bloque-video__frame"
          src={`https://player.vimeo.com/video/${state.videoId}`}
          title="Vista previa de Vimeo"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen={true}
        />
      </div>
    )
  }
  // interno
  return (
    <div className="bloque-video__preview">
      {/* biome-ignore lint/a11y/useMediaCaption: el admin sube su propio video, no obligamos pista */}
      <video className="bloque-video__frame" controls={true} src={state.url} />
    </div>
  )
}
