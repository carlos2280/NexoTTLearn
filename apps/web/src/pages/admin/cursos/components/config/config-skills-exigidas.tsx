import { useListarAreas } from "@/features/catalogo/hooks/use-listar-areas"
import { useListarSkills } from "@/features/catalogo/hooks/use-listar-skills"
import { useActualizarSkillsExigidasCurso } from "@/features/cursos/hooks/use-mutaciones-config-curso"
import { Banner } from "@/shared/components/ui/banner"
import { Button } from "@/shared/components/ui/button"
import { SearchField } from "@/shared/components/ui/search-field"
import { SkillChip } from "@/shared/components/ui/skill-chip"
import { type SlugArea, slugArea } from "@/shared/lib/slug-area"
import type {
  AreaResponse,
  CursoConfiguracionResponse,
  CursoDetalle,
  CursoSkillExigida,
  SkillResponse,
} from "@nexott-learn/shared-types"
import { X } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { AYUDAS_CONFIG_CURSO } from "./ayudas"
import { CampoNumero } from "./campo-numero"
import { ConfigCard } from "./config-card"
import { SelectorPopover } from "./selector-popover"

interface ConfigSkillsExigidasProps {
  readonly curso: CursoDetalle
  readonly bloqueado: boolean
}

function diferentes(a: readonly CursoSkillExigida[], b: readonly CursoSkillExigida[]): boolean {
  if (a.length !== b.length) {
    return true
  }
  return a.some((fa, i) => {
    const fb = b[i]
    return !fb || fa.skillId !== fb.skillId || fa.notaMinima !== fb.notaMinima
  })
}

export function ConfigSkillsExigidas({ curso, bloqueado }: ConfigSkillsExigidasProps) {
  const mutacion = useActualizarSkillsExigidasCurso()
  const skillsCatalogo = useListarSkills({ page: 1, pageSize: 100, estado: "ACTIVA" })
  const areasCatalogo = useListarAreas({ page: 1, pageSize: 100 })

  const catalogoSkills = useMemo(() => skillsCatalogo.data?.data ?? [], [skillsCatalogo.data])
  const catalogoAreas = useMemo(() => areasCatalogo.data?.data ?? [], [areasCatalogo.data])

  const indiceArea = useMemo(() => {
    const map = new Map<string, AreaResponse>()
    for (const a of catalogoAreas) {
      map.set(a.id, a)
    }
    return map
  }, [catalogoAreas])

  function areaDeSkill(skill: SkillResponse | undefined): SlugArea {
    if (!skill) {
      return "soft"
    }
    return slugArea(indiceArea.get(skill.areaId)?.nombre)
  }

  const [filas, setFilas] = useState<readonly CursoSkillExigida[]>(curso.skillsExigidas)
  const [avisoSinCobertura, setAvisoSinCobertura] = useState<readonly string[]>([])
  const [busqueda, setBusqueda] = useState("")

  useEffect(() => {
    setFilas(curso.skillsExigidas)
  }, [curso.skillsExigidas])

  const modificado = diferentes(filas, curso.skillsExigidas)
  const skillsDisponibles = catalogoSkills.filter((s) => !filas.some((f) => f.skillId === s.id))

  const indicesFiltrados = useMemo(() => {
    if (busqueda.trim().length === 0) {
      return filas.map((_, i) => i)
    }
    const q = busqueda.trim().toLowerCase()
    return filas.reduce<number[]>((acc, f, i) => {
      const etiqueta = catalogoSkills.find((s) => s.id === f.skillId)?.etiquetaVisible ?? f.skillId
      if (etiqueta.toLowerCase().includes(q)) {
        acc.push(i)
      }
      return acc
    }, [])
  }, [busqueda, filas, catalogoSkills])

  function agregar(skillId: string) {
    setFilas((prev) => [...prev, { skillId, notaMinima: 70 }])
  }
  function actualizar(i: number, fila: Partial<CursoSkillExigida>) {
    setFilas((prev) => prev.map((f, idx) => (idx === i ? { ...f, ...fila } : f)))
  }
  function eliminar(i: number) {
    setFilas((prev) => prev.filter((_, idx) => idx !== i))
  }

  async function guardar(motivo: string | undefined) {
    const res = (await mutacion.mutateAsync({
      cursoId: curso.id,
      input: { skills: filas as CursoSkillExigida[] },
      motivo,
    })) as CursoConfiguracionResponse
    setAvisoSinCobertura(res.skillsSinCobertura?.map((s) => s.etiquetaVisible) ?? [])
  }

  return (
    <ConfigCard
      id="config-skills"
      titulo="Skills exigidas"
      descripcion="Skills que el curso evalúa, con su nota mínima. Las skills sin cobertura por módulos generan aviso (no bloquea)."
      ayuda={AYUDAS_CONFIG_CURSO.skills}
      acciones={
        <div className="flex items-center gap-2">
          {filas.length > 0 ? (
            <>
              <SearchField
                valor={busqueda}
                onCambio={setBusqueda}
                placeholder="Filtrar skills…"
                className="w-[220px]"
              />
              <span aria-hidden={true} className="h-6 w-px bg-border" />
            </>
          ) : null}
          <SelectorPopover<SkillResponse>
            disponibles={skillsDisponibles}
            obtenerId={(s) => s.id}
            obtenerEtiqueta={(s) => s.etiquetaVisible}
            renderItem={(s) => (
              <ItemSkillPopover skill={s} area={slugArea(indiceArea.get(s.areaId)?.nombre)} />
            )}
            onSeleccionar={agregar}
            triggerLabel="Añadir skill"
            buscable={true}
            placeholderBusqueda="Buscar skill por nombre…"
            emptyMessage="No hay skills que coincidan"
          />
        </div>
      }
      exigeMotivo={curso.estado !== "BORRADOR"}
      modificado={modificado}
      enviando={mutacion.isPending}
      deshabilitado={bloqueado}
      onGuardar={guardar}
      onCancelar={() => setFilas(curso.skillsExigidas)}
    >
      {avisoSinCobertura.length > 0 ? (
        <Banner tone="warning" title="Skills sin cobertura">
          Estas skills no las cubre ningún módulo habilitado: {avisoSinCobertura.join(", ")}.
        </Banner>
      ) : null}

      {filas.length === 0 ? (
        <p className="text-body-sm text-text-tertiary">Aún no hay skills exigidas.</p>
      ) : indicesFiltrados.length === 0 ? (
        <p className="text-body-sm text-text-tertiary">
          Ninguna skill coincide con &ldquo;{busqueda}&rdquo;.
        </p>
      ) : (
        <div className="-m-1 max-h-[420px] overflow-y-auto p-1">
          <div className="flex flex-col gap-2">
            {indicesFiltrados.map((i) => {
              const f = filas[i]
              if (!f) {
                return null
              }
              const skill = catalogoSkills.find((s) => s.id === f.skillId)
              return (
                <FilaSkillItem
                  key={f.skillId}
                  skill={skill}
                  skillId={f.skillId}
                  area={areaDeSkill(skill)}
                  notaMinima={f.notaMinima}
                  onCambioNota={(v) => actualizar(i, { notaMinima: v })}
                  onEliminar={() => eliminar(i)}
                />
              )
            })}
          </div>
        </div>
      )}
    </ConfigCard>
  )
}

interface FilaSkillItemProps {
  readonly skill: SkillResponse | undefined
  readonly skillId: string
  readonly area: SlugArea
  readonly notaMinima: number
  readonly onCambioNota: (v: number) => void
  readonly onEliminar: () => void
}

function FilaSkillItem({
  skill,
  skillId,
  area,
  notaMinima,
  onCambioNota,
  onEliminar,
}: FilaSkillItemProps) {
  const etiqueta = skill?.etiquetaVisible ?? skillId
  return (
    <div className="group hover:-translate-y-px grid grid-cols-1 items-center gap-3 rounded-xl border border-border bg-surface p-3 shadow-xs transition-[transform,box-shadow] duration-base ease-default hover:shadow-sm sm:grid-cols-[1fr_140px_32px]">
      <div className="flex min-w-0 items-center">
        <SkillChip etiqueta={etiqueta} area={area} />
      </div>
      <CampoNumero label="Nota mínima (%)" valor={notaMinima} onCambio={onCambioNota} />
      <Button
        variant="ghost"
        size="sm"
        type="button"
        onClick={onEliminar}
        aria-label={`Eliminar ${etiqueta}`}
      >
        <X className="h-4 w-4" strokeWidth={1.5} aria-hidden={true} />
      </Button>
    </div>
  )
}

function ItemSkillPopover({
  skill,
  area,
}: { readonly skill: SkillResponse; readonly area: SlugArea }) {
  return (
    <>
      <SkillChip etiqueta={skill.etiquetaVisible} area={area} size="sm" />
      <span className="ml-auto font-mono text-[10px] text-text-tertiary">{area}</span>
    </>
  )
}
