import { Badge } from "@/shared/components/ui/badge"
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
 * Panel derecho de propiedades. Cambia segun lo seleccionado:
 *  - modulo seleccionado (default) -> propiedades globales del modulo
 *  - seccion -> orden, modulo padre, fecha
 *  - bloque -> tipo, evaluable, skill, version
 *
 * En B0 todos los campos son de SOLO LECTURA. La edicion llega en lotes
 * posteriores.
 */
export function BuilderPropiedades(props: BuilderPropiedadesProps) {
  const { seleccion, modulo, totalSecciones, totalBloques, seccion, bloque } = props
  return (
    <aside className="flex h-full w-[300px] shrink-0 flex-col border-border border-l bg-surface">
      <div className="border-border border-b px-4 py-2.5">
        <span className="nx-eyebrow text-text-tertiary">Propiedades</span>
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

function Fila({
  etiqueta,
  children,
}: {
  readonly etiqueta: string
  readonly children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-1 py-2">
      <span className="text-caption text-text-tertiary">{etiqueta}</span>
      <div className="text-body-sm text-text-primary">{children}</div>
    </div>
  )
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
    <div className="flex flex-col divide-y divide-border">
      <Fila etiqueta="Tipo">Módulo</Fila>
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
        <span className="tabular">{totalSecciones}</span>
      </Fila>
      <Fila etiqueta="Bloques">
        <span className="tabular">{totalBloques}</span>
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
    <div className="flex flex-col divide-y divide-border">
      <Fila etiqueta="Tipo">Sección</Fila>
      <Fila etiqueta="Título">{seccion.titulo}</Fila>
      <Fila etiqueta="Orden en módulo">
        <span className="tabular">{seccion.orden}</span>
      </Fila>
      <Fila etiqueta="Actualizada">
        <span className="text-text-secondary">{new Date(seccion.updatedAt).toLocaleString()}</span>
      </Fila>
    </div>
  )
}

function PropsBloque({ bloque }: { readonly bloque: BloqueDetalleResponse }) {
  const meta = tipoBloqueMeta(bloque.tipo)
  return (
    <div className="flex flex-col">
      <div className="flex flex-col divide-y divide-border">
        <Fila etiqueta="Tipo">{meta.etiqueta}</Fila>
        <Fila etiqueta="Orden en sección">
          <span className="tabular">{bloque.orden}</span>
        </Fila>
        <Fila etiqueta="Versión">
          <span className="tabular">v{bloque.version}</span>
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
          <span className="text-text-secondary">{new Date(bloque.updatedAt).toLocaleString()}</span>
        </Fila>
      </div>
      <EditarEvaluacionBloque bloque={bloque} />
    </div>
  )
}
