import { Banner } from "@/shared/components/ui/banner"
import { Button } from "@/shared/components/ui/button"
import { ConfirmDialog } from "@/shared/components/ui/confirm-dialog"
import { RUTAS } from "@/shared/constants/rutas"
import type { CursoTituloDuplicado } from "@nexott-learn/shared-types"
import { useState } from "react"
import { Link } from "react-router-dom"

interface AvisoCursoDuplicadoProps {
  readonly cursos: readonly CursoTituloDuplicado[]
  readonly importando: boolean
  readonly onConfirmar: () => void
  readonly onCancelar: () => void
  /** 2B: reemplazar el contenido de ese curso (solo si es `reemplazable`). */
  readonly onReemplazar: (cursoId: string) => Promise<void>
}

function etiquetaEstado(estado: string): string {
  if (estado === "BORRADOR") {
    return "Borrador"
  }
  if (estado === "ACTIVO") {
    return "Activo"
  }
  if (estado === "CERRADO") {
    return "Cerrado"
  }
  return "Archivado"
}

/**
 * Aviso antes de duplicar (2A): ya existe un curso con el mismo titulo. La
 * importacion no creo nada; el admin decide si crea otro de todas formas.
 */
export function AvisoCursoDuplicado({
  cursos,
  importando,
  onConfirmar,
  onCancelar,
  onReemplazar,
}: AvisoCursoDuplicadoProps) {
  const titulo = cursos[0]?.titulo ?? ""
  const [aReemplazar, setAReemplazar] = useState<string | null>(null)
  return (
    <Banner tone="warning" title={`Ya existe un curso llamado «${titulo}»`}>
      <div className="flex flex-col gap-3">
        <p>Si importas este archivo, se creará otro curso con el mismo título. No se tocó nada.</p>
        <ul className="flex flex-col gap-1">
          {cursos.map((c) => (
            <li key={c.id}>
              <Link
                to={RUTAS.admin.cursoDetalle(c.id)}
                className="underline-offset-4 hover:underline"
              >
                {c.titulo}
              </Link>{" "}
              · {etiquetaEstado(c.estado)}
              {c.reemplazable ? (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="ml-2"
                  onClick={() => setAReemplazar(c.id)}
                  disabled={importando}
                >
                  Reemplazar este curso
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-3">
          <Button type="button" size="sm" onClick={onConfirmar} disabled={importando}>
            {importando ? "Importando…" : "Importar de todas formas"}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={onCancelar}
            disabled={importando}
          >
            Cancelar
          </Button>
        </div>
      </div>
      <ConfirmDialog
        abierto={aReemplazar !== null}
        onCambiarAbierto={(abierto) => (abierto ? null : setAReemplazar(null))}
        titulo="Reemplazar el curso"
        descripcion="El curso queda con el contenido de este archivo, con el mismo enlace y la misma configuración. Sus módulos anteriores se archivan en el catálogo (se pueden recuperar)."
        textoConfirmar="Reemplazar"
        enviando={importando}
        onConfirmar={async () => {
          if (aReemplazar) {
            await onReemplazar(aReemplazar)
          }
          setAReemplazar(null)
        }}
      />
    </Banner>
  )
}
