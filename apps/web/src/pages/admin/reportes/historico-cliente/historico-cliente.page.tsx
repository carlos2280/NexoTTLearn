import { useListarClientes } from "@/features/catalogo/hooks/use-listar-clientes"
import { useHistoricoCliente } from "@/features/reportes/hooks/use-historico-cliente"
import { Banner } from "@/shared/components/ui/banner"
import { Card } from "@/shared/components/ui/card"
import type { HistoricoClienteQuery } from "@nexott-learn/shared-types"
import { useEffect, useMemo } from "react"
import { useSearchParams } from "react-router-dom"
import { HistoricoHeader } from "./components/historico-header"
import { HistoricoKpis } from "./components/historico-kpis"
import { HistoricoObservaciones } from "./components/historico-observaciones"
import { HistoricoTabla } from "./components/historico-tabla"
import { type ClienteOpcion, HistoricoToolbar } from "./components/historico-toolbar"

export function HistoricoClientePage() {
  const [searchParams, setSearchParams] = useSearchParams()

  const clientesQuery = useListarClientes({ page: 1, pageSize: 100, activo: true })
  const clientes = useMemo<readonly ClienteOpcion[]>(
    () =>
      (clientesQuery.data?.data ?? []).map((c) => ({
        id: c.id,
        nombre: c.nombre,
      })),
    [clientesQuery.data],
  )

  const clienteIdParam = searchParams.get("clienteId")
  const clienteId = clienteIdParam ?? clientes[0]?.id ?? ""

  useEffect(() => {
    const primero = clientes[0]
    if (!clienteIdParam && primero) {
      const next = new URLSearchParams(searchParams)
      next.set("clienteId", primero.id)
      setSearchParams(next, { replace: true })
    }
  }, [clienteIdParam, clientes, searchParams, setSearchParams])

  const query: HistoricoClienteQuery | null = useMemo(() => {
    if (!clienteId) {
      return null
    }
    return { clienteId, format: "json" }
  }, [clienteId])

  const { data, isLoading, error } = useHistoricoCliente(query)

  const actualizarParam = (clave: string, valor: string) => {
    const next = new URLSearchParams(searchParams)
    next.set(clave, valor)
    setSearchParams(next, { replace: true })
  }

  const cargandoClientes = clientesQuery.isLoading
  const sinClientes = !cargandoClientes && clientes.length === 0
  const nombreCliente = clientes.find((c) => c.id === clienteId)?.nombre

  return (
    <div className="mx-auto flex max-w-[1280px] flex-col gap-10">
      <HistoricoHeader
        frescura={data?.meta.frescura}
        scopeHash={data?.meta.scopeHash}
        nombreCliente={nombreCliente}
      />

      <HistoricoToolbar
        clientes={clientes}
        clienteId={clienteId}
        onCambiarCliente={(id) => actualizarParam("clienteId", id)}
      />

      {sinClientes && (
        <Banner tone="info" title="Aún no hay clientes">
          Registra un cliente desde el módulo de catálogo para empezar a ver su histórico.
        </Banner>
      )}

      {data?.meta.warning && (
        <Banner tone="warning" title="Resultado parcial">
          {data.meta.warning}
        </Banner>
      )}

      {error && (
        <Banner tone="danger" title="No pudimos cargar el reporte">
          {error.message}
        </Banner>
      )}

      {!(sinClientes || error) &&
        (isLoading || cargandoClientes ? (
          <Skeleton />
        ) : data ? (
          <>
            <HistoricoKpis cursos={data.cursos} />
            <HistoricoTabla cursos={data.cursos} />
            <HistoricoObservaciones observaciones={data.observacionesFrecuentes} />
          </>
        ) : null)}
    </div>
  )
}

function Skeleton() {
  return (
    <div className="flex flex-col gap-10">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr_1fr]">
        <Card tono="plano" className="h-[200px] animate-pulse" />
        <Card tono="plano" className="h-[200px] animate-pulse" />
        <Card tono="plano" className="h-[200px] animate-pulse" />
      </div>
      <div className="flex flex-col gap-3">
        {Array.from({ length: 4 }, (_, i) => (
          <Card key={`hsk-${i + 1}`} tono="plano" className="h-[120px] animate-pulse" />
        ))}
      </div>
    </div>
  )
}
