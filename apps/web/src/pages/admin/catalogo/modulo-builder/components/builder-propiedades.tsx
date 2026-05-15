import { Badge } from "@/shared/components/ui/badge"
import { tiempoRelativo } from "@/shared/lib/tiempo-relativo"
import type {
  BloqueDetalleResponse,
  ModuloResponse,
  SeccionResponse,
} from "@nexott-learn/shared-types"
import type { ReactNode } from "react"
import { tipoBloqueMeta } from "../bloque-tipo-meta"
import type { Seleccion } from "../types"
import { EditarEvaluacionBloque } from "./editar-evaluacion-bloque"

interface BuilderPropiedadesProps {
  readonly seleccion: Seleccion
  readonly modulo: ModuloResponse
  readonly totalSecciones: number
  readonly totalBloques: number
  readonly seccion: SeccionResponse | undefined
  readonly bloque: BloqueDetalleResponse | undefined
}

/**
 * Panel derecho de propiedades. Cambia según lo seleccionado:
 * - módulo (default) → propiedades globales
 * - sección → orden + actualización
 * - bloque → tipo, versión, estado + edición evaluativa
 *
 * Las etiquetas son eyebrow tipográfico (uppercase + tracking). Los valores
 * numéricos van en mono tabular (consistencia con PageHeaderStat). Las
 * fechas en tiempo relativo (hace X min) — nunca absolutas.
 */
export function BuilderPropiedades(props: BuilderPropiedadesProps) {
  const { seleccion, modulo, totalSecciones, totalBloques, seccion, bloque } = props

  const subtitulo = obtenerSubtitulo(seleccion, bloque)

  return (
    <aside className="flex h-full w-[300px] shrink-0 flex-col border-border border-l bg-surface">
      <div className="flex flex-col gap-0.5 border-border border-b px-4 py-3">
        <span className="nx-eyebrow text-text-tertiary">Propiedades</span>
        <span className="text-body-sm text-text-secondary">{subtitulo}</span>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {seleccion.tipo === "modulo" ? (
          <PropsModulo
            modulo={modulo}
            totalSecciones={totalSecciones}
            totalBloques={totalBloques}
          />
        ) : null}
        {seleccion.tipo === "seccion" && seccion ? <PropsSeccion seccion={seccion} /> : null}
        {seleccion.tipo === "bloque" && bloque ? <PropsBloque bloque={bloque} /> : null}
      </div>
    </aside>
  )
}

function obtenerSubtitulo(seleccion: Seleccion, bloque: BloqueDetalleResponse | undefined): string {
  if (seleccion.tipo === "modulo") {
    return "Módulo"
  }
  if (seleccion.tipo === "seccion") {
    return "Sección"
  }
  if (bloque) {
    return `Bloque · ${tipoBloqueMeta(bloque.tipo).etiqueta}`
  }
  return "Bloque"
}

function Fila({
  etiqueta,
  children,
}: {
  readonly etiqueta: string
  readonly children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="nx-eyebrow text-text-tertiary">{etiqueta}</span>
      <div className="text-body-sm text-text-primary">{children}</div>
    </div>
  )
}

function Numero({ children }: { readonly children: ReactNode }) {
  return <span className="tabular font-mono text-text-primary">{children}</span>
}

function FechaRelativa({ iso }: { readonly iso: string }) {
  return <span className="tabular font-mono text-text-tertiary">{tiempoRelativo(iso)}</span>
}

function PropsModulo({
  modulo,
  totalSecciones,
  totalBloques,
}: {
  readonly modulo: ModuloResponse
  readonly totalSecciones: number
  readonly totalBloques: number
}) {
  return (
    <div className="flex flex-col gap-4">
      <Fila etiqueta="Estado">
        {modulo.estado === "ACTIVO" ? (
          <Badge tono="success" conPunto={true}>
            Activo
          </Badge>
        ) : (
          <Badge tono="neutro" conPunto={true}>
            Archivado
          </Badge>
        )}
      </Fila>
      <Fila etiqueta="Secciones">
        <Numero>{totalSecciones}</Numero>
      </Fila>
      <Fila etiqueta="Bloques">
        <Numero>{totalBloques}</Numero>
      </Fila>
      {modulo.descripcion ? (
        <Fila etiqueta="Descripción">
          <span className="text-text-secondary">{modulo.descripcion}</span>
        </Fila>
      ) : null}
    </div>
  )
}

function PropsSeccion({ seccion }: { readonly seccion: SeccionResponse }) {
  return (
    <div className="flex flex-col gap-4">
      <Fila etiqueta="Título">{seccion.titulo}</Fila>
      <Fila etiqueta="Orden en módulo">
        <Numero>{seccion.orden}</Numero>
      </Fila>
      <Fila etiqueta="Actualizada">
        <FechaRelativa iso={seccion.updatedAt} />
      </Fila>
    </div>
  )
}

function PropsBloque({ bloque }: { readonly bloque: BloqueDetalleResponse }) {
  const meta = tipoBloqueMeta(bloque.tipo)
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <Fila etiqueta="Tipo">{meta.etiqueta}</Fila>
        <Fila etiqueta="Orden en sección">
          <Numero>{bloque.orden}</Numero>
        </Fila>
        <Fila etiqueta="Versión">
          <Numero>v{bloque.version}</Numero>
        </Fila>
        <Fila etiqueta="Estado">
          {bloque.estado === "ACTIVO" ? (
            <Badge tono="success" conPunto={true}>
              Activo
            </Badge>
          ) : (
            <Badge tono="neutro" conPunto={true}>
              Eliminado
            </Badge>
          )}
        </Fila>
        <Fila etiqueta="Actualizado">
          <FechaRelativa iso={bloque.updatedAt} />
        </Fila>
      </div>
      <EditarEvaluacionBloque bloque={bloque} />
    </div>
  )
}
