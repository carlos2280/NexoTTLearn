import { useListarBloques } from "@/features/catalogo/hooks/use-listar-bloques"
import { useCrearBloque } from "@/features/catalogo/hooks/use-mutaciones-bloques"
import { useObtenerBloque } from "@/features/catalogo/hooks/use-obtener-bloque"
import { Banner } from "@/shared/components/ui/banner"
import { Button } from "@/shared/components/ui/button"
import { Skeleton } from "@/shared/components/ui/skeleton"
import type { BloqueDetalleResponse } from "@nexott-learn/shared-types"
import { FlaskConical } from "lucide-react"
import type { ReactNode } from "react"
import { toast } from "sonner"
import { contenidoPorDefecto } from "../shared/contenido-por-defecto"
import { EditorTestsSqlEmbebido } from "./editor-tests-sql-embebido"

interface SeccionTestsSqlProps {
  readonly reto: BloqueDetalleResponse
}

/**
 * Sección "Tests automáticos" embebida en el editor del Reto SQL. Encuentra el
 * bloque SQL_TESTS pareado (por `contenido.sqlEjercicioId`, filtro backend de la
 * Fase 2a), lo carga y lo edita ahí mismo. Si el reto aún no tiene tests (import
 * antiguo), ofrece crearlos. Espejo de `SeccionTestsDelReto` (CODIGO) sin el
 * concepto de lenguaje (SQL es siempre SQL).
 */
export function SeccionTestsSql({ reto }: SeccionTestsSqlProps) {
  const lista = useListarBloques({
    page: 1,
    pageSize: 1,
    seccionId: reto.seccionId,
    tipo: "SQL_TESTS",
    sqlEjercicioId: reto.id,
  })
  const testsId = lista.data?.data[0]?.id
  const detalle = useObtenerBloque(testsId)
  const crear = useCrearBloque()

  async function crearTests() {
    await crear.mutateAsync({
      seccionId: reto.seccionId,
      input: {
        tipo: "SQL_TESTS",
        esEvaluable: false,
        skillQueMideId: null,
        contenido: contenidoPorDefecto("SQL_TESTS", { sqlEjercicioHermanoId: reto.id }),
      },
    })
    toast.success("Tests creados")
  }

  let cuerpo: ReactNode
  if (lista.isLoading) {
    cuerpo = <Skeleton className="h-40 w-full" />
  } else if (lista.isError) {
    // Ojo: NO mostrar "Crear tests" si la lista falló — el reto podría ya
    // tener tests y crearíamos un segundo bloque pareado (doble creación).
    cuerpo = <AvisoError onReintentar={() => lista.refetch()} />
  } else if (!testsId) {
    cuerpo = <CrearTestsCta onCrear={crearTests} enviando={crear.isPending} />
  } else if (detalle.isLoading) {
    cuerpo = <Skeleton className="h-40 w-full" />
  } else if (detalle.isError || !detalle.data) {
    cuerpo = <AvisoError onReintentar={() => detalle.refetch()} />
  } else {
    cuerpo = <EditorTestsSqlEmbebido key={detalle.data.id} bloque={detalle.data} />
  }

  return (
    <div className="flex flex-col gap-4 border-border border-t pt-6">
      <div className="flex items-center gap-2">
        <FlaskConical className="h-4 w-4 text-text-tertiary" strokeWidth={1.5} aria-hidden={true} />
        <span className="nx-eyebrow text-text-tertiary">
          Tests automáticos · no visible al alumno
        </span>
      </div>
      {cuerpo}
    </div>
  )
}

function CrearTestsCta({
  onCrear,
  enviando,
}: {
  readonly onCrear: () => void
  readonly enviando: boolean
}) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-lg border border-border border-dashed bg-subtle/50 p-5">
      <p className="text-body-sm text-text-secondary">
        Este reto todavía no tiene tests. Sin ellos, los participantes no pueden ejecutar nada.
      </p>
      <Button variant="secondary" size="sm" onClick={onCrear} isLoading={enviando}>
        <FlaskConical className="h-4 w-4" strokeWidth={1.5} aria-hidden={true} />
        Crear tests
      </Button>
    </div>
  )
}

function AvisoError({ onReintentar }: { readonly onReintentar: () => void }) {
  return (
    <Banner tone="danger" title="No pudimos cargar los tests de este reto">
      Reintenta en un momento. No crees tests nuevos hasta poder verlos, para no duplicarlos.{" "}
      <button type="button" onClick={onReintentar} className="font-medium underline">
        Reintentar
      </button>
    </Banner>
  )
}
