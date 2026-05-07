import { useCursoDetalle } from "@/features/admin-cursos/hooks/use-curso-detalle"
import { RUTAS } from "@/shared/constants/rutas"
import { Skeleton } from "@/shared/ui/patterns/skeleton"
import { type TabItem, Tabs } from "@/shared/ui/patterns/tabs"
import { Alert } from "@/shared/ui/primitives/alert"
import { BarChart, Info, Layers, Users } from "lucide-react"
import { type ReactNode, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { EliminarCursoDialog } from "../components/eliminar-curso-dialog"
import { TransicionCursoModal } from "../components/transicion-curso-modal"
import { CursoDetalleError } from "./components/curso-detalle-error"
import { CursoDetalleHeader } from "./components/curso-detalle-header"
import { CursoResumenTab } from "./components/curso-resumen-tab"
import { useCursoTransiciones } from "./lib/use-curso-transiciones"

type TabActiva = "resumen" | "estructura" | "candidatos" | "reportes"

export function CursoDetallePage() {
  const { id: cursoId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [tabActiva, setTabActiva] = useState<TabActiva>("resumen")
  const [cursoTransicion, setCursoTransicion] = useState<
    { readonly variante: "despublicar" | "cerrar" } | undefined
  >()
  const [eliminarAbierto, setEliminarAbierto] = useState(false)

  const cursoQuery = useCursoDetalle(cursoId)
  const transiciones = useCursoTransiciones({ cursoId })

  if (!cursoId) {
    return (
      <PageWrap>
        <Alert variant="error">
          <p className="font-semibold text-sm">Ruta inválida</p>
          <p className="mt-1 text-sm text-text-secondary">Falta el id del curso.</p>
        </Alert>
      </PageWrap>
    )
  }

  if (cursoQuery.isPending) {
    return (
      <PageWrap>
        <CursoDetalleSkeleton />
      </PageWrap>
    )
  }

  if (cursoQuery.isError) {
    return (
      <PageWrap>
        <CursoDetalleError error={cursoQuery.error} onReintentar={() => cursoQuery.refetch()} />
      </PageWrap>
    )
  }

  const curso = cursoQuery.data
  const tabs: readonly TabItem<TabActiva>[] = [
    { value: "resumen", label: "Resumen", icon: Info },
    {
      value: "estructura",
      label: "Estructura",
      icon: Layers,
      badge: curso.contadores.modulos,
      disabled: true,
    },
    {
      value: "candidatos",
      label: "Candidatos",
      icon: Users,
      badge: curso.contadores.inscripcionesActivas,
      disabled: true,
    },
    { value: "reportes", label: "Reportes", icon: BarChart, disabled: true },
  ]

  return (
    <>
      <PageWrap>
        <div className="flex flex-col gap-8">
          <CursoDetalleHeader
            curso={curso}
            onEditar={() => navigate(`${RUTAS.admin.cursoDetalle(cursoId)}/editor`)}
            onDuplicar={() => navigate(`${RUTAS.admin.cursos}?duplicar=${cursoId}`)}
            onDespublicar={() => setCursoTransicion({ variante: "despublicar" })}
            onCerrar={() => setCursoTransicion({ variante: "cerrar" })}
            onEliminar={() => setEliminarAbierto(true)}
          />
          <Tabs items={tabs} value={tabActiva} onChange={setTabActiva} />
          {tabActiva === "resumen" ? <CursoResumenTab curso={curso} /> : null}
        </div>
      </PageWrap>

      {cursoTransicion ? (
        <TransicionCursoModal
          abierto={true}
          variante={cursoTransicion.variante}
          cursoTitulo={curso.titulo}
          enviando={
            cursoTransicion.variante === "despublicar"
              ? transiciones.despublicarPending
              : transiciones.cerrarPending
          }
          onCerrar={() => setCursoTransicion(undefined)}
          onConfirmar={async (motivo) => {
            await transiciones.confirmarTransicion(cursoTransicion.variante, motivo)
            setCursoTransicion(undefined)
          }}
        />
      ) : null}

      <EliminarCursoDialog
        abierto={eliminarAbierto}
        cursoTitulo={curso.titulo}
        enviando={transiciones.eliminarPending}
        onCancelar={() => setEliminarAbierto(false)}
        onConfirmar={transiciones.confirmarEliminar}
      />
    </>
  )
}

function PageWrap({ children }: { readonly children: ReactNode }) {
  return <div className="px-6 py-8 md:px-10 md:py-12">{children}</div>
}

function CursoDetalleSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-9 w-1/3" />
      <Skeleton className="h-5 w-1/2" />
      <Skeleton className="h-48 w-full" />
    </div>
  )
}
