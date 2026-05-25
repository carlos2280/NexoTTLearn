import { useDetalleBloqueEvaluable } from "@/features/cursos/hooks/use-bloques-evaluables"
import { Badge } from "@/shared/components/ui/badge"
import { type ColumnaTabla, DataTable } from "@/shared/components/ui/data-table"
import { SidePeek, SidePeekSeccion } from "@/shared/components/ui/side-peek"
import type { BloqueEvaluableColaboradorItem } from "@nexott-learn/shared-types"
import { useFormatearFecha } from "./shared-helpers"

interface Props {
  readonly cursoId: string
  readonly bloqueId: string | null
  readonly tituloBloque: string
  readonly onCerrar: () => void
}

/**
 * Drawer "Detalle de bloque". Lista los colaboradores que han intentado el
 * bloque (1 fila por persona, su mejor nota) y, para QUIZ, las preguntas
 * más falladas como apoyo al admin para detectar temas problemáticos.
 */
export function DrawerDetalleBloque({ cursoId, bloqueId, tituloBloque, onCerrar }: Props) {
  const abierto = bloqueId !== null
  const { data, isLoading } = useDetalleBloqueEvaluable(cursoId, bloqueId ?? undefined)
  const formatearFecha = useFormatearFecha()

  const columnas: readonly ColumnaTabla<BloqueEvaluableColaboradorItem>[] = [
    {
      id: "colaborador",
      cabecera: "Colaborador",
      accesor: (f) => (
        <div className="flex flex-col">
          <span className="text-text-primary">{f.colaborador.nombre}</span>
          <span className="text-body-sm text-text-tertiary">{f.colaborador.email}</span>
        </div>
      ),
    },
    {
      id: "mejor",
      cabecera: "Mejor nota",
      alineado: "derecha",
      accesor: (f) => (
        <span className="tabular">
          {f.mejorNota}
          <span className="text-text-tertiary">/100</span>
        </span>
      ),
    },
    {
      id: "intentos",
      cabecera: "Intentos",
      alineado: "derecha",
      accesor: (f) => <span className="tabular">{f.cantidadIntentos}</span>,
    },
    {
      id: "estado",
      cabecera: "Estado",
      accesor: (f) =>
        f.aprobado ? (
          <Badge tono="success" conPunto={false}>
            Aprobado
          </Badge>
        ) : (
          <Badge tono="neutro" conPunto={false}>
            No aprobado
          </Badge>
        ),
    },
    {
      id: "ultimo",
      cabecera: "Último intento",
      accesor: (f) => formatearFecha(f.ultimoIntentoFecha),
    },
  ]

  const colaboradores = data?.colaboradores ?? []
  const preguntasMasFalladas = data?.preguntasMasFalladas ?? []
  const hayVersionVieja = colaboradores.some((c) => c.tieneVersionVieja)

  return (
    <SidePeek
      abierto={abierto}
      onCambiarAbierto={(o) => (o ? null : onCerrar())}
      titulo={tituloBloque}
      descripcion={data ? `Umbral ${data.bloque.umbralAprobacion}/100` : undefined}
      ancho="xl"
    >
      <div className="flex flex-col">
        {hayVersionVieja ? (
          <p className="rounded-md border border-warning/30 bg-[rgb(var(--color-warning-rgb)/0.06)] px-3 py-2 text-body-sm text-warning-on-soft">
            Algunos intentos son de una versión anterior del bloque. Las notas comparan condiciones
            distintas.
          </p>
        ) : null}
        <SidePeekSeccion titulo="Colaboradores">
          <DataTable
            columnas={columnas}
            filas={colaboradores}
            obtenerKey={(f) => f.colaborador.id}
            cargando={isLoading}
            vacioTitulo="Sin intentos"
            vacioDescripcion="Aún no hay colaboradores que hayan intentado este bloque."
          />
        </SidePeekSeccion>
        {preguntasMasFalladas.length > 0 ? (
          <SidePeekSeccion titulo="Preguntas más falladas">
            <ol className="flex flex-col gap-2">
              {preguntasMasFalladas.map((p, i) => (
                <li
                  key={p.preguntaId}
                  className="flex items-center justify-between gap-3 rounded-md border border-border bg-subtle px-3 py-2"
                >
                  <span className="text-body-sm text-text-secondary">
                    <span className="text-text-tertiary">#{i + 1}</span>{" "}
                    <code className="font-mono text-text-primary">{p.preguntaId}</code>
                  </span>
                  <span className="tabular text-body-sm text-text-secondary">
                    {p.conteo} {p.conteo === 1 ? "fallo" : "fallos"}
                  </span>
                </li>
              ))}
            </ol>
          </SidePeekSeccion>
        ) : null}
      </div>
    </SidePeek>
  )
}
