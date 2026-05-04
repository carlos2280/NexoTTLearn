import { useCursosAdmin } from "@/features/admin-cursos/hooks/use-cursos-admin"
import { useClonarModulo } from "@/features/admin-modulos/hooks/use-clonar-modulo"
import { useModulosAdmin } from "@/features/admin-modulos/hooks/use-modulos-admin"
import { ApiError } from "@/shared/api/api-error"
import { NxtButton, NxtModal, NxtSelect, NxtSelectOption, toast } from "@carlos2280/nexott-ui/react"
import { Stack } from "@carlos2280/nexott-ui/react-primitives"
import type { UseQueryResult } from "@tanstack/react-query"
import { useState } from "react"

interface CursoModuloClonarModalProps {
  readonly abierto: boolean
  readonly cursoIdDestino: string
  readonly onCerrar: () => void
  readonly onExito: () => void
}

export function CursoModuloClonarModal({
  abierto,
  cursoIdDestino,
  onCerrar,
  onExito,
}: CursoModuloClonarModalProps) {
  const cursosQuery = useCursosAdmin()
  // Excluir el curso destino para evitar clonar de si mismo (el back lo
  // permite pero no aporta valor — siempre seria mejor "duplicar").
  const cursosOrigen = cursosQuery.data?.items.filter((curso) => curso.id !== cursoIdDestino) ?? []

  const [cursoOrigenId, setCursoOrigenId] = useState<string>("")
  const [moduloOrigenId, setModuloOrigenId] = useState<string>("")

  const modulosOrigenQuery = useModulosAdmin(cursoOrigenId || undefined)
  const modulosOrigen = modulosOrigenQuery.data?.items ?? []

  const clonarMutation = useClonarModulo()

  const cerrarYResetear = (): void => {
    setCursoOrigenId("")
    setModuloOrigenId("")
    onCerrar()
  }

  const ejecutar = async (): Promise<void> => {
    if (!moduloOrigenId) {
      return
    }
    try {
      await clonarMutation.mutateAsync({
        cursoIdDestino,
        input: { moduloOrigenId },
      })
      toast.success("Modulo clonado")
      setCursoOrigenId("")
      setModuloOrigenId("")
      onExito()
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "No pudimos clonar el modulo. Reintenta en unos segundos.",
      )
    }
  }

  return (
    <NxtModal
      open={abierto}
      size="md"
      title="Clonar modulo de otro curso"
      description="Selecciona el curso y modulo origen. Solo se copia la cabecera (titulo, descripcion, configuracion). Las secciones no se clonan."
      onNxtModalClose={cerrarYResetear}
    >
      <Stack gap="lg">
        <NxtSelect
          label="Curso origen"
          value={cursoOrigenId}
          disabled={cursosQuery.isLoading || cursosOrigen.length === 0}
          helper={helperCursoOrigen(cursosQuery, cursosOrigen.length)}
          state={cursosQuery.isError ? "error" : ""}
          onNxtSelectChange={(event) => {
            setCursoOrigenId(event.detail.value)
            setModuloOrigenId("")
          }}
        >
          <NxtSelectOption value="">Selecciona un curso</NxtSelectOption>
          {cursosOrigen.map((curso) => (
            <NxtSelectOption key={curso.id} value={curso.id}>
              {curso.title}
            </NxtSelectOption>
          ))}
        </NxtSelect>

        <NxtSelect
          label="Modulo origen"
          value={moduloOrigenId}
          disabled={!cursoOrigenId || modulosOrigenQuery.isLoading}
          helper={helperModuloOrigen(modulosOrigenQuery, cursoOrigenId, modulosOrigen.length)}
          state={modulosOrigenQuery.isError ? "error" : ""}
          onNxtSelectChange={(event) => setModuloOrigenId(event.detail.value)}
        >
          <NxtSelectOption value="">Selecciona un modulo</NxtSelectOption>
          {modulosOrigen.map((modulo) => (
            <NxtSelectOption key={modulo.id} value={modulo.id}>
              {modulo.titulo}
            </NxtSelectOption>
          ))}
        </NxtSelect>
      </Stack>

      <div slot="footer">
        <NxtButton variant="ghost" onNxtButtonClick={cerrarYResetear}>
          Cancelar
        </NxtButton>
        <NxtButton
          variant="primary"
          disabled={!moduloOrigenId || clonarMutation.isPending}
          loading={clonarMutation.isPending}
          onNxtButtonClick={ejecutar}
        >
          Clonar modulo
        </NxtButton>
      </div>
    </NxtModal>
  )
}

function helperCursoOrigen(query: UseQueryResult<unknown>, cantidad: number): string {
  if (query.isError) {
    return "No pudimos cargar los cursos."
  }
  if (!query.isLoading && cantidad === 0) {
    return "No hay otros cursos disponibles."
  }
  return ""
}

function helperModuloOrigen(
  query: UseQueryResult<unknown>,
  cursoOrigenId: string,
  cantidad: number,
): string {
  if (query.isError) {
    return "No pudimos cargar los modulos del curso."
  }
  if (cursoOrigenId && !query.isLoading && cantidad === 0) {
    return "Ese curso no tiene modulos."
  }
  return ""
}
