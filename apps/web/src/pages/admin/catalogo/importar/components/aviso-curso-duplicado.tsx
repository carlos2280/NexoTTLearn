import { Banner } from "@/shared/components/ui/banner"
import { Button } from "@/shared/components/ui/button"
import { RUTAS } from "@/shared/constants/rutas"
import type { CursoTituloDuplicado } from "@nexott-learn/shared-types"
import { Link } from "react-router-dom"

interface AvisoCursoDuplicadoProps {
  readonly cursos: readonly CursoTituloDuplicado[]
  readonly importando: boolean
  readonly onConfirmar: () => void
  readonly onCancelar: () => void
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
}: AvisoCursoDuplicadoProps) {
  const titulo = cursos[0]?.titulo ?? ""
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
    </Banner>
  )
}
