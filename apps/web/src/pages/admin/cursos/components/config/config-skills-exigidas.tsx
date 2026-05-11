import { useListarSkills } from "@/features/catalogo/hooks/use-listar-skills"
import { useActualizarSkillsExigidasCurso } from "@/features/cursos/hooks/use-mutaciones-config-curso"
import { Banner } from "@/shared/components/ui/banner"
import { Button } from "@/shared/components/ui/button"
import { Select } from "@/shared/components/ui/select"
import type {
  CursoConfiguracionResponse,
  CursoDetalle,
  CursoSkillExigida,
} from "@nexott-learn/shared-types"
import { Sparkles, Trash2 } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { CampoNumero } from "./campo-numero"
import { ConfigCard } from "./config-card"

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
  const skillsCatalogo = useListarSkills({
    page: 1,
    pageSize: 200,
    estado: "ACTIVA",
  })
  const catalogo = useMemo(() => skillsCatalogo.data?.data ?? [], [skillsCatalogo.data])

  const [filas, setFilas] = useState<readonly CursoSkillExigida[]>(curso.skillsExigidas)
  const [avisoSinCobertura, setAvisoSinCobertura] = useState<readonly string[]>([])

  useEffect(() => {
    setFilas(curso.skillsExigidas)
  }, [curso.skillsExigidas])

  const modificado = diferentes(filas, curso.skillsExigidas)
  const skillsDisponibles = catalogo.filter((s) => !filas.some((f) => f.skillId === s.id))

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
      titulo="Skills exigidas"
      descripcion="Skills que el curso evalúa, con su nota mínima. Las skills sin cobertura por módulos generan aviso (no bloquea)."
      icono={Sparkles}
      exigeMotivo={curso.estado !== "BORRADOR"}
      modificado={modificado}
      enviando={mutacion.isPending}
      deshabilitado={bloqueado}
      onGuardar={guardar}
    >
      {avisoSinCobertura.length > 0 ? (
        <Banner tone="warning" title="Skills sin cobertura">
          Estas skills no las cubre ningún módulo habilitado: {avisoSinCobertura.join(", ")}.
        </Banner>
      ) : null}
      <div className="flex flex-col gap-2">
        {filas.length === 0 ? (
          <p className="text-body-sm text-text-tertiary">Aún no hay skills exigidas.</p>
        ) : null}
        {filas.map((f, i) => (
          <div
            key={f.skillId}
            className="grid grid-cols-1 items-end gap-2 rounded-md border border-border p-3 sm:grid-cols-[1fr,160px,40px]"
          >
            <div className="flex flex-col">
              <span className="text-caption text-text-tertiary uppercase">Skill</span>
              <span className="text-body-sm text-text-primary">
                {catalogo.find((s) => s.id === f.skillId)?.etiquetaVisible ?? f.skillId}
              </span>
            </div>
            <CampoNumero
              label="Nota mínima (%)"
              valor={f.notaMinima}
              onCambio={(v) => actualizar(i, { notaMinima: v })}
            />
            <Button
              variant="secondary"
              size="sm"
              type="button"
              onClick={() => eliminar(i)}
              aria-label="Eliminar skill"
            >
              <Trash2 className="h-4 w-4" strokeWidth={1.5} aria-hidden={true} />
            </Button>
          </div>
        ))}
      </div>
      <Select
        compact={true}
        value=""
        onChange={(e) => {
          if (e.target.value) {
            agregar(e.target.value)
            e.target.value = ""
          }
        }}
        disabled={skillsDisponibles.length === 0}
        className="min-w-[260px]"
        aria-label="Añadir skill exigida"
      >
        <option value="">+ Añadir skill…</option>
        {skillsDisponibles.map((s) => (
          <option key={s.id} value={s.id}>
            {s.etiquetaVisible}
          </option>
        ))}
      </Select>
    </ConfigCard>
  )
}
