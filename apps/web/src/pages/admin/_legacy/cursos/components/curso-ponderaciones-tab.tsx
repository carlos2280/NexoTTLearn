import { useActualizarPesosCurso } from "@/features/admin-cursos/hooks/use-actualizar-pesos-curso"
import { useCursoAdmin } from "@/features/admin-cursos/hooks/use-curso-admin"
import { ApiError } from "@/shared/api/api-error"
import {
  NxtButton,
  NxtCard,
  NxtEyebrow,
  NxtIconTile,
  type NxtIconTileGradient,
  NxtNumberInput,
  NxtSkeleton,
  NxtTag,
  NxtText,
  toast,
} from "@carlos2280/nexott-ui/react"
import { Stack } from "@carlos2280/nexott-ui/react-primitives"
import {
  type CursoTipoPeso,
  PESO_CODIGO_DEFAULT,
  PESO_EJERCICIO_DEFAULT,
  PESO_MINI_PROYECTO_DEFAULT,
  PESO_QUIZ_DEFAULT,
  TIPOS_PESO_INTRA_MODULO,
  type TipoPesoIntraModulo,
} from "@nexott-learn/shared-types"
import { useEffect, useMemo, useState } from "react"

interface CursoPonderacionesTabProps {
  readonly cursoId: string
}

// Estado: ReadonlyMap por tipo intra-modulo. Usamos Map en vez de Record para
// que la key snake_case del enum del back ("mini_proyecto") no choque con la
// regla useNamingConvention de biome.
type EstadoPesos = ReadonlyMap<TipoPesoIntraModulo, number>

type IconoTarjeta = "check-circle" | "edit" | "code" | "layers"

interface ConfigTarjeta {
  readonly tipo: TipoPesoIntraModulo
  readonly etiqueta: string
  readonly descripcion: string
  readonly icono: IconoTarjeta
  readonly gradient: NxtIconTileGradient
}

// Tolerancia espejo de la del back. Sin ella, 33.33+33.33+33.34 = 99.999...
// pintaria "Error" en cliente y "ok" en servidor (o viceversa).
const TOLERANCIA_SUMA = 0.01
const SUMA_INTRA_MODULO_OBJETIVO = 100

const TARJETAS: readonly ConfigTarjeta[] = [
  {
    tipo: "quiz",
    etiqueta: "Test / Quiz",
    descripcion: "Cuestionario con correccion automatica",
    icono: "check-circle",
    gradient: "sky",
  },
  {
    tipo: "ejercicio",
    etiqueta: "Ejercicio",
    descripcion: "Practica con tests automaticos en IDE",
    icono: "edit",
    gradient: "violet",
  },
  {
    tipo: "codigo",
    etiqueta: "Ejemplo de codigo",
    descripcion: "Codigo de referencia con preguntas de comprension",
    icono: "code",
    gradient: "amber",
  },
  {
    tipo: "mini_proyecto",
    etiqueta: "Mini proyecto",
    descripcion: "Entrega de repo Git por modulo, 3 capas",
    icono: "layers",
    gradient: "emerald",
  },
]

const DEFAULTS: ReadonlyMap<TipoPesoIntraModulo, number> = new Map<TipoPesoIntraModulo, number>([
  ["quiz", PESO_QUIZ_DEFAULT],
  ["ejercicio", PESO_EJERCICIO_DEFAULT],
  ["codigo", PESO_CODIGO_DEFAULT],
  ["mini_proyecto", PESO_MINI_PROYECTO_DEFAULT],
])

// Tab "Ponderaciones intra-modulo": configura los 4 pesos de nivel='modulo'.
// Persiste con PATCH /admin/cursos/:id/pesos enviando SOLO los items intra-modulo
// (el back upserta el nivel y borra el resto del MISMO nivel).
export function CursoPonderacionesTab({ cursoId }: CursoPonderacionesTabProps) {
  const detalleQuery = useCursoAdmin(cursoId)
  const mutation = useActualizarPesosCurso()

  const inicial = useMemo(
    () => derivarEstadoInicial(detalleQuery.data?.tipoPesos ?? []),
    [detalleQuery.data?.tipoPesos],
  )
  const [estado, setEstado] = useState<EstadoPesos>(inicial)

  // Resincroniza al refrescar el detalle (post-PATCH del bloque Evaluacion
  // final, por ejemplo, que invalida la cache de la query).
  useEffect(() => {
    setEstado(inicial)
  }, [inicial])

  if (detalleQuery.isLoading) {
    return <NxtSkeleton variant="card" />
  }

  if (detalleQuery.isError || !detalleQuery.data) {
    return (
      <NxtCard variant="surface" padding="lg" accent="rose">
        <NxtText size="sm" tone="dim">
          No pudimos cargar las ponderaciones. Reintenta en unos segundos.
        </NxtText>
      </NxtCard>
    )
  }

  const suma = sumar(estado)
  const dirty = haCambiado(estado, inicial)
  const sumaCorrecta = Math.abs(suma - SUMA_INTRA_MODULO_OBJETIVO) <= TOLERANCIA_SUMA
  const fueraDeRango = TARJETAS.some((tarjeta) => !estaEnRango(obtener(estado, tarjeta.tipo)))
  const puedeGuardar = dirty && sumaCorrecta && !fueraDeRango && !mutation.isPending

  const onCambioPeso = (tipo: TipoPesoIntraModulo, valor: number): void => {
    setEstado((prev) => {
      const next = new Map(prev)
      next.set(tipo, valor)
      return next
    })
  }

  const onGuardar = (): void => {
    if (!puedeGuardar) {
      return
    }
    mutation.mutate(
      {
        id: cursoId,
        input: {
          pesos: TARJETAS.map((tarjeta) => ({
            tipo: tarjeta.tipo,
            peso: obtener(estado, tarjeta.tipo),
            nivel: "modulo" as const,
          })),
        },
      },
      {
        onSuccess: () => toast.success("Ponderaciones actualizadas"),
        onError: (error) => toast.error(mensajeDeError(error, "guardar las ponderaciones")),
      },
    )
  }

  return (
    <Stack gap="xl">
      <Stack gap="lg">
        <Stack gap="xs">
          <NxtEyebrow accent="bar">Ponderaciones intra-modulo</NxtEyebrow>
          <NxtText size="sm" tone="dim">
            Pesos que deciden cuanto aporta cada tipo dentro de un modulo. Si un modulo no tiene
            alguno de estos tipos, su peso se redistribuye automaticamente entre los que si existen.
          </NxtText>
        </Stack>

        <Stack gap="md">
          {TARJETAS.map((tarjeta) => (
            <TarjetaPonderacion
              key={tarjeta.tipo}
              icono={tarjeta.icono}
              gradient={tarjeta.gradient}
              titulo={tarjeta.etiqueta}
              descripcion={tarjeta.descripcion}
              valor={obtener(estado, tarjeta.tipo)}
              onCambio={(valor) => onCambioPeso(tarjeta.tipo, valor)}
            />
          ))}
        </Stack>

        <ResumenTotal suma={suma} sumaCorrecta={sumaCorrecta} />

        <Stack direction="row" align="center" justify="end" gap="sm">
          <NxtButton
            variant="primary"
            icon="check"
            disabled={!puedeGuardar}
            loading={mutation.isPending}
            onNxtButtonClick={onGuardar}
          >
            Guardar cambios
          </NxtButton>
        </Stack>
      </Stack>
    </Stack>
  )
}

interface TarjetaPonderacionProps {
  readonly icono: IconoTarjeta
  readonly gradient: NxtIconTileGradient
  readonly titulo: string
  readonly descripcion: string
  readonly valor: number
  readonly onCambio: (valor: number) => void
}

function TarjetaPonderacion({
  icono,
  gradient,
  titulo,
  descripcion,
  valor,
  onCambio,
}: TarjetaPonderacionProps) {
  return (
    <NxtCard variant="surface" padding="md">
      <Stack direction="row" align="center" gap="md" wrap={true}>
        <NxtIconTile name={icono} gradient={gradient} size="md" />
        <Stack gap="none" style={{ flex: 1, minWidth: 0 }}>
          <NxtText size="md" weight="semibold">
            {titulo}
          </NxtText>
          <NxtText size="sm" tone="dim">
            {descripcion}
          </NxtText>
        </Stack>
        <NxtNumberInput
          value={valor}
          min={0}
          max={100}
          suffix="%"
          size="sm"
          onNxtNumberChange={(event) => onCambio(event.detail.value)}
        />
      </Stack>
    </NxtCard>
  )
}

interface ResumenTotalProps {
  readonly suma: number
  readonly sumaCorrecta: boolean
}

function ResumenTotal({ suma, sumaCorrecta }: ResumenTotalProps) {
  return (
    <NxtCard variant="surface" padding="md">
      <Stack direction="row" align="center" justify="between" gap="sm" wrap={true}>
        <NxtText size="sm" tone="default">
          Total intra-modulo {formatearPct(suma)}
        </NxtText>
        {sumaCorrecta ? (
          <NxtTag variant="success">Correcto</NxtTag>
        ) : (
          <NxtTag variant="danger">Error</NxtTag>
        )}
      </Stack>
    </NxtCard>
  )
}

function derivarEstadoInicial(tipoPesos: readonly CursoTipoPeso[]): EstadoPesos {
  // Filtramos por tipos validos: el seed antiguo dejo registros con
  // tipo="modulos" y otros legacy. Si llega un tipo desconocido lo ignoramos
  // sin romper la UI.
  const tiposIntraModulo = new Set<string>(TIPOS_PESO_INTRA_MODULO)
  const recibidos = new Map<TipoPesoIntraModulo, number>()
  for (const item of tipoPesos) {
    if (tiposIntraModulo.has(item.tipo) && item.nivel === "modulo") {
      recibidos.set(item.tipo as TipoPesoIntraModulo, item.peso)
    }
  }
  const resultado = new Map<TipoPesoIntraModulo, number>()
  for (const tipo of TIPOS_PESO_INTRA_MODULO) {
    resultado.set(tipo, recibidos.get(tipo) ?? DEFAULTS.get(tipo) ?? 0)
  }
  return resultado
}

function obtener(estado: EstadoPesos, tipo: TipoPesoIntraModulo): number {
  return estado.get(tipo) ?? 0
}

function sumar(estado: EstadoPesos): number {
  let total = 0
  for (const tipo of TIPOS_PESO_INTRA_MODULO) {
    total += obtener(estado, tipo)
  }
  return total
}

function estaEnRango(valor: number): boolean {
  return valor >= 0 && valor <= 100
}

function haCambiado(actual: EstadoPesos, inicial: EstadoPesos): boolean {
  for (const tipo of TIPOS_PESO_INTRA_MODULO) {
    if (obtener(actual, tipo) !== obtener(inicial, tipo)) {
      return true
    }
  }
  return false
}

function formatearPct(valor: number): string {
  return `${Number.isInteger(valor) ? String(valor) : valor.toFixed(1)}%`
}

function mensajeDeError(error: unknown, accion: string): string {
  if (error instanceof ApiError) {
    return error.message
  }
  return `No pudimos ${accion}. Reintenta en unos segundos.`
}
