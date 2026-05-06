import { useActualizarPesosCurso } from "@/features/admin-cursos/hooks/use-actualizar-pesos-curso"
import { ApiError } from "@/shared/api/api-error"
import {
  NxtBadge,
  NxtButton,
  NxtCard,
  NxtDivider,
  NxtEyebrow,
  NxtIconTile,
  type NxtIconTileGradient,
  NxtNumberInput,
  NxtSwitch,
  type NxtSwitchChangeDetail,
  NxtTag,
  NxtText,
  toast,
} from "@carlos2280/nexott-ui/react"
import { Stack } from "@carlos2280/nexott-ui/react-primitives"
import {
  type CursoTipoPeso,
  PESO_ENTREVISTA_DEFAULT,
  PESO_PROYECTO_DEFAULT,
  TIPOS_PESO_NIVEL_CURSO,
} from "@nexott-learn/shared-types"
import { useEffect, useMemo, useState } from "react"

interface CursoEvaluacionFinalProps {
  readonly cursoId: string
  readonly tipoPesos: readonly CursoTipoPeso[]
}

interface EstadoTarjeta {
  readonly activo: boolean
  readonly peso: number
}

interface EstadoEvaluacion {
  readonly proyecto: EstadoTarjeta
  readonly entrevista: EstadoTarjeta
}

// Tolerancia espejo de la del back (admin-cursos.ts en shared-types).
// Sin esto un 99.999 cliente vs 100 server pintaria mensajes contradictorios.
const TOLERANCIA_SUMA = 0.01
const SUMA_NIVEL_CURSO_MAXIMA = 100
const PESO_PROYECTO_INACTIVO = 0
const PESO_ENTREVISTA_INACTIVO = 0

// El bloque "Evaluacion final del curso" vive bajo la lista de modulos en el
// Tab Modulos. Configura los 2 pesos de nivel='curso' (proyecto, entrevista)
// con toggle on/off + input de peso. Persiste con PATCH /admin/cursos/:id/pesos
// enviando SOLO los items de nivel='curso' (el back upserta el nivel y borra
// el resto del MISMO nivel).
export function CursoEvaluacionFinal({ cursoId, tipoPesos }: CursoEvaluacionFinalProps) {
  const inicial = useMemo(() => derivarEstadoInicial(tipoPesos), [tipoPesos])
  const [estado, setEstado] = useState<EstadoEvaluacion>(inicial)
  const mutation = useActualizarPesosCurso()

  // Si el detalle se refresca (ej: post-PATCH del tab Ponderaciones que
  // recarga el detalle entero), resincronizamos el estado local.
  useEffect(() => {
    setEstado(inicial)
  }, [inicial])

  const proyectoPct = estado.proyecto.activo ? estado.proyecto.peso : 0
  const entrevistaPct = estado.entrevista.activo ? estado.entrevista.peso : 0
  const sumaCurso = proyectoPct + entrevistaPct
  const moduloPct = Math.max(0, SUMA_NIVEL_CURSO_MAXIMA - sumaCurso)
  const excedeMaximo = sumaCurso - SUMA_NIVEL_CURSO_MAXIMA > TOLERANCIA_SUMA
  const fueraDeRango = !(estaEnRango(estado.proyecto) && estaEnRango(estado.entrevista))
  const dirty = haCambiado(estado, inicial)
  const puedeGuardar = dirty && !excedeMaximo && !fueraDeRango && !mutation.isPending

  const onCambioActivoProyecto = (event: CustomEvent<NxtSwitchChangeDetail>): void => {
    const activo = event.detail.checked
    setEstado((prev) => ({
      ...prev,
      proyecto: {
        activo,
        peso: activo ? Math.max(prev.proyecto.peso, PESO_PROYECTO_DEFAULT) : prev.proyecto.peso,
      },
    }))
  }

  const onCambioPesoProyecto = (valor: number): void => {
    setEstado((prev) => ({ ...prev, proyecto: { ...prev.proyecto, peso: valor } }))
  }

  const onCambioActivoEntrevista = (event: CustomEvent<NxtSwitchChangeDetail>): void => {
    const activo = event.detail.checked
    setEstado((prev) => ({
      ...prev,
      entrevista: {
        activo,
        peso: activo
          ? Math.max(prev.entrevista.peso, PESO_ENTREVISTA_DEFAULT)
          : prev.entrevista.peso,
      },
    }))
  }

  const onCambioPesoEntrevista = (valor: number): void => {
    setEstado((prev) => ({ ...prev, entrevista: { ...prev.entrevista, peso: valor } }))
  }

  const onConfigurar = (): void => {
    toast.info("Proximamente")
  }

  const onGuardar = (): void => {
    if (!puedeGuardar) {
      return
    }
    mutation.mutate(
      {
        id: cursoId,
        input: {
          pesos: [
            {
              tipo: "proyecto",
              peso: estado.proyecto.activo ? estado.proyecto.peso : PESO_PROYECTO_INACTIVO,
              nivel: "curso",
            },
            {
              tipo: "entrevista",
              peso: estado.entrevista.activo ? estado.entrevista.peso : PESO_ENTREVISTA_INACTIVO,
              nivel: "curso",
            },
          ],
        },
      },
      {
        onSuccess: () => toast.success("Evaluacion final actualizada"),
        onError: (error) => toast.error(mensajeDeError(error, "guardar la evaluacion final")),
      },
    )
  }

  return (
    <Stack gap="lg">
      <NxtDivider />

      <Stack gap="xs">
        <NxtEyebrow accent="bar">Evaluacion final del curso</NxtEyebrow>
        <NxtText size="sm" tone="dim">
          Se desbloquea al completar todos los modulos.
        </NxtText>
      </Stack>

      <Stack gap="md">
        <TarjetaEvaluable
          icono="shield"
          gradient="rose"
          titulo="Proyecto Integrador"
          descripcion="Entrega de repo Git a nivel curso, 3 capas"
          activo={estado.proyecto.activo}
          peso={estado.proyecto.peso}
          onCambioActivo={onCambioActivoProyecto}
          onCambioPeso={onCambioPesoProyecto}
          onConfigurar={onConfigurar}
        />
        <TarjetaEvaluable
          icono="users"
          gradient="violet"
          titulo="Entrevista Final IA"
          descripcion="Entrevista IA con Claude como cliente"
          activo={estado.entrevista.activo}
          peso={estado.entrevista.peso}
          onCambioActivo={onCambioActivoEntrevista}
          onCambioPeso={onCambioPesoEntrevista}
          onConfigurar={onConfigurar}
        />
      </Stack>

      <NxtCard variant="surface" padding="md">
        <Stack direction="row" align="center" justify="between" gap="sm" wrap={true}>
          <NxtText size="sm" tone="default">
            Modulos {formatearPct(moduloPct)} + Proyecto {formatearPct(proyectoPct)} + Entrevista{" "}
            {formatearPct(entrevistaPct)} = 100%
          </NxtText>
          {excedeMaximo ? (
            <NxtTag variant="danger">Error</NxtTag>
          ) : (
            <NxtTag variant="success">Correcto</NxtTag>
          )}
        </Stack>
      </NxtCard>

      <Stack direction="row" align="center" justify="end" gap="sm">
        <NxtButton
          variant="primary"
          icon="check"
          disabled={!puedeGuardar}
          loading={mutation.isPending}
          onNxtButtonClick={onGuardar}
        >
          Guardar evaluacion final
        </NxtButton>
      </Stack>
    </Stack>
  )
}

interface TarjetaEvaluableProps {
  readonly icono: "shield" | "users"
  readonly gradient: NxtIconTileGradient
  readonly titulo: string
  readonly descripcion: string
  readonly activo: boolean
  readonly peso: number
  readonly onCambioActivo: (event: CustomEvent<NxtSwitchChangeDetail>) => void
  readonly onCambioPeso: (valor: number) => void
  readonly onConfigurar: () => void
}

function TarjetaEvaluable({
  icono,
  gradient,
  titulo,
  descripcion,
  activo,
  peso,
  onCambioActivo,
  onCambioPeso,
  onConfigurar,
}: TarjetaEvaluableProps) {
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
        <Stack direction="row" align="center" gap="md" wrap={true}>
          {activo ? (
            <NxtBadge variant="success" size="sm">
              Activo
            </NxtBadge>
          ) : (
            <NxtBadge variant="neutral" size="sm">
              Inactivo
            </NxtBadge>
          )}
          <NxtSwitch checked={activo} onNxtSwitchChange={onCambioActivo} />
          <NxtNumberInput
            value={peso}
            min={0}
            max={100}
            suffix="%"
            size="sm"
            disabled={!activo}
            onNxtNumberChange={(event) => onCambioPeso(event.detail.value)}
          />
          <NxtButton variant="ghost" icon="settings" onNxtButtonClick={onConfigurar}>
            Configurar
          </NxtButton>
        </Stack>
      </Stack>
    </NxtCard>
  )
}

function derivarEstadoInicial(tipoPesos: readonly CursoTipoPeso[]): EstadoEvaluacion {
  // Filtramos por tipos validos del enum: el seed antiguo dejo registros con
  // tipo="modulos" y otros legacy que no estan en el enum. Si llega un tipo
  // desconocido lo ignoramos sin romper la UI.
  const tiposValidos = new Set<string>(TIPOS_PESO_NIVEL_CURSO)
  const proyecto = tipoPesos.find((p) => p.tipo === "proyecto" && tiposValidos.has(p.tipo))
  const entrevista = tipoPesos.find((p) => p.tipo === "entrevista" && tiposValidos.has(p.tipo))
  return {
    proyecto: proyecto
      ? { activo: proyecto.activo, peso: proyecto.peso }
      : { activo: false, peso: PESO_PROYECTO_DEFAULT },
    entrevista: entrevista
      ? { activo: entrevista.activo, peso: entrevista.peso }
      : { activo: false, peso: PESO_ENTREVISTA_DEFAULT },
  }
}

function estaEnRango(tarjeta: EstadoTarjeta): boolean {
  return tarjeta.peso >= 0 && tarjeta.peso <= 100
}

function haCambiado(actual: EstadoEvaluacion, inicial: EstadoEvaluacion): boolean {
  return (
    actual.proyecto.activo !== inicial.proyecto.activo ||
    actual.proyecto.peso !== inicial.proyecto.peso ||
    actual.entrevista.activo !== inicial.entrevista.activo ||
    actual.entrevista.peso !== inicial.entrevista.peso
  )
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
