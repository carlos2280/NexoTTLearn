import { ConflictException, Injectable, NotFoundException } from "@nestjs/common"
import type {
  AreaPorTrabajarCierre,
  EtiquetaCualitativa,
  ResultadoCierreCurso,
  ResumenCierreCurso,
  SkillCosechadaCierre,
} from "@nexott-learn/shared-types"
import { apiErrorCodes } from "../common/errors/api-error.codes"
import { PrismaService } from "../common/prisma/prisma.service"

const UMBRAL_EXCELENCIA_FINAL = 85
const UMBRAL_SOLIDO_FINAL = 70
const UMBRAL_DESARROLLO_FINAL = 50

/**
 * `MeResumenCierreService` — B-26. Devuelve la "ceremonia" del veredicto para
 * la pantalla `/cursos/:cursoId/cerrado` que el participante ve cuando el
 * admin cierra el curso (decision 03-R3 del viaje colaborador).
 *
 * Fuente de verdad: `CursoFotografiaCierre.snapshot` (construido por
 * `cursos/cierre-curso.helpers.ts`). Es la unica vista inmutable de lo que
 * paso en el cierre — la BD viva puede cambiar despues, este endpoint no.
 *
 * `skillsDemostradasNuevas` aplica la spec literal del inventario: NO incluye
 * skills que ya estaban demostradas ANTES del inicio del curso. Para decidirlo
 * mira `historico_notas_skill` en una ventana previa a `Curso.fechaInicio`.
 */
@Injectable()
export class MeResumenCierreService {
  constructor(private readonly prisma: PrismaService) {}

  async obtenerResumenCierreDeUsuario(
    usuarioId: string,
    cursoId: string,
  ): Promise<ResumenCierreCurso> {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { colaboradorId: true },
    })
    if (!usuario?.colaboradorId) {
      throw new NotFoundException({
        code: apiErrorCodes.colaboradorNoEncontrado,
        message: "Colaborador no encontrado.",
      })
    }
    return this.obtenerResumenCierre(usuario.colaboradorId, cursoId)
  }

  async obtenerResumenCierre(colaboradorId: string, cursoId: string): Promise<ResumenCierreCurso> {
    const asignacion = await this.prisma.asignacionCurso.findUnique({
      where: {
        // biome-ignore lint/style/useNamingConvention: clave compuesta generada por Prisma.
        colaboradorId_cursoId: { colaboradorId, cursoId },
      },
      select: {
        id: true,
        observacionesAdmin: true,
        curso: { select: { id: true, estado: true, fechaInicio: true } },
      },
    })
    if (!asignacion) {
      throw new NotFoundException({
        code: apiErrorCodes.asignacionNoEncontrada,
        message: "Asignacion no encontrada para este curso y colaborador.",
      })
    }
    if (asignacion.curso.estado !== "CERRADO") {
      throw new ConflictException({
        code: apiErrorCodes.conflictCursoNoCerrado,
        message: "El curso aun no esta cerrado.",
      })
    }

    const fotografia = await this.prisma.cursoFotografiaCierre.findUnique({
      where: { cursoId },
      select: { snapshot: true, descartada: true, fechaCierre: true },
    })
    if (!fotografia || fotografia.descartada) {
      throw new ConflictException({
        code: apiErrorCodes.conflictCursoNoCerrado,
        message: "El curso aun no tiene fotografia de cierre disponible.",
      })
    }

    const snapshot = parseSnapshot(fotografia.snapshot)
    if (!snapshot) {
      throw new ConflictException({
        code: apiErrorCodes.conflictCursoNoCerrado,
        message: "La fotografia de cierre tiene un formato no soportado.",
      })
    }

    const fila = snapshot.asignaciones.find((a) => a.asignacionId === asignacion.id)
    const resultado = filtrarResultadoVisible(fila?.resultadoFinal)
    if (!fila || resultado === null) {
      throw new ConflictException({
        code: apiErrorCodes.conflictCursoNoCerrado,
        message: "La asignacion no tiene un veredicto final disponible.",
      })
    }

    const skillIds = snapshot.curso.configuracion.skillsExigidas.map((s) => s.skillId)
    const skillsMeta = await this.cargarSkillsConArea(skillIds)
    const previas = await this.cargarUltimaNotaPreviaPorSkill(
      colaboradorId,
      skillIds,
      asignacion.curso.fechaInicio,
    )

    const skillsDemostradasNuevas = construirSkillsDemostradasNuevas({
      notasPorSkill: fila.notasPorSkill,
      skillsMeta,
      ultimaPreviaPorSkill: previas,
    })

    const areasPorTrabajar =
      resultado === "NO_APTO"
        ? construirAreasPorTrabajar(snapshot, fila.notasPorSkill, skillsMeta)
        : []

    const notaGlobalFinal = resolverNotaGlobalFinal(fila)

    return {
      cursoId,
      cursoTitulo: snapshot.curso.titulo,
      fechaCierre: fotografia.fechaCierre.toISOString(),
      resultado,
      etiquetaCualitativaFinal: etiquetaCualitativaPorNota(notaGlobalFinal),
      notaGlobalFinal,
      skillsDemostradasNuevas,
      areasPorTrabajar,
      comentarioAdmin: asignacion.observacionesAdmin ?? null,
    }
  }

  private async cargarSkillsConArea(
    skillIds: readonly string[],
  ): Promise<ReadonlyMap<string, SkillConArea>> {
    if (skillIds.length === 0) {
      return new Map()
    }
    const rows = await this.prisma.skill.findMany({
      where: { id: { in: [...skillIds] } },
      select: {
        id: true,
        etiquetaVisible: true,
        area: { select: { id: true, codigo: true, nombre: true } },
      },
    })
    return new Map(rows.map((r) => [r.id, r]))
  }

  /**
   * Devuelve el valor (>= 0) de la nota mas reciente ANTERIOR a `fechaInicio`
   * por cada skill. `null` (mapeado a `undefined` aqui) si nunca tuvo nota
   * previa o si la entrada vigente tenia `valor=null`.
   */
  private async cargarUltimaNotaPreviaPorSkill(
    colaboradorId: string,
    skillIds: readonly string[],
    fechaInicioCurso: Date,
  ): Promise<ReadonlyMap<string, number | null>> {
    if (skillIds.length === 0) {
      return new Map()
    }
    const rows = await this.prisma.historicoNotaSkill.findMany({
      where: {
        fecha: { lt: fechaInicioCurso },
        notaSkill: { colaboradorId, skillId: { in: [...skillIds] } },
      },
      select: {
        valor: true,
        fecha: true,
        notaSkill: { select: { skillId: true } },
      },
      orderBy: { fecha: "desc" },
    })
    const ultima = new Map<string, number | null>()
    for (const row of rows) {
      const skillId = row.notaSkill.skillId
      if (ultima.has(skillId)) {
        continue
      }
      ultima.set(skillId, row.valor === null ? null : Number(row.valor))
    }
    return ultima
  }
}

interface SkillConArea {
  readonly id: string
  readonly etiquetaVisible: string
  readonly area: { readonly id: string; readonly codigo: string; readonly nombre: string }
}

interface SnapshotCierre {
  readonly curso: {
    readonly titulo: string
    readonly configuracion: {
      readonly skillsExigidas: readonly { readonly skillId: string }[]
    }
  }
  readonly asignaciones: readonly AsignacionSnapshot[]
}

interface AsignacionSnapshot {
  readonly asignacionId: string
  readonly resultadoFinal: string | null
  readonly notaGlobalFinal?: number
  readonly notasPorSkill: readonly NotaSkillSnapshot[]
}

interface NotaSkillSnapshot {
  readonly skillId: string
  readonly notaActual: number | null
  readonly umbralCumple: number
  /**
   * Persistido en snapshots construidos despues del fix DEUDA-B26-1.
   * Opcional para compat con snapshots anteriores.
   */
  readonly caracter?: "OBLIGATORIA" | "OPCIONAL"
}

function parseSnapshot(value: unknown): SnapshotCierre | null {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return null
  }
  const root = value as Record<string, unknown>
  const curso = root.curso as Record<string, unknown> | undefined
  const config = curso?.configuracion as Record<string, unknown> | undefined
  const skillsExigidas = config?.skillsExigidas
  const asignaciones = root.asignaciones
  if (
    typeof curso?.titulo !== "string" ||
    !Array.isArray(skillsExigidas) ||
    !Array.isArray(asignaciones)
  ) {
    return null
  }
  const asignacionesParsed = asignaciones.filter(esAsignacionSnapshot)
  return {
    curso: {
      titulo: curso.titulo,
      configuracion: {
        skillsExigidas: skillsExigidas.filter(esSkillExigidaSnapshot),
      },
    },
    asignaciones: asignacionesParsed,
  }
}

function esAsignacionSnapshot(value: unknown): value is AsignacionSnapshot {
  if (value === null || typeof value !== "object") {
    return false
  }
  const v = value as Record<string, unknown>
  if (typeof v.asignacionId !== "string") {
    return false
  }
  if (v.resultadoFinal !== null && typeof v.resultadoFinal !== "string") {
    return false
  }
  if (!Array.isArray(v.notasPorSkill)) {
    return false
  }
  return true
}

function esSkillExigidaSnapshot(value: unknown): value is { readonly skillId: string } {
  if (value === null || typeof value !== "object") {
    return false
  }
  return typeof (value as Record<string, unknown>).skillId === "string"
}

function filtrarResultadoVisible(value: string | null | undefined): ResultadoCierreCurso | null {
  if (value === "APTO" || value === "NO_APTO" || value === "COMPLETADO") {
    return value
  }
  return null
}

/**
 * Resuelve `notaGlobalFinal` de una asignacion en el snapshot.
 *
 * Camino principal (snapshots construidos a partir de DEUDA-B26-1):
 * `fila.notaGlobalFinal` viene persistida directamente — fuente de verdad
 * inmutable del veredicto final.
 *
 * Fallback (snapshots anteriores que NO persistian la nota): promedio simple
 * de notas OBLIGATORIAS con `notaActual !== null`. Si el snapshot tampoco
 * tiene `caracter` por nota, cae a todas las notas no nulas. Cuando NO hay
 * notas validas devuelve `0` (la `etiquetaCualitativaFinal` cae a `noCumple`,
 * semantica correcta para snapshots historicos sin nota disponible).
 */
function resolverNotaGlobalFinal(fila: AsignacionSnapshot): number {
  if (typeof fila.notaGlobalFinal === "number") {
    return fila.notaGlobalFinal
  }
  const conCaracter = fila.notasPorSkill.some((n) => n.caracter !== undefined)
  const elegibles = conCaracter
    ? fila.notasPorSkill.filter((n) => n.caracter === "OBLIGATORIA")
    : fila.notasPorSkill
  const valores = elegibles.map((n) => n.notaActual).filter((n): n is number => n !== null)
  if (valores.length === 0) {
    return 0
  }
  const suma = valores.reduce((acc, n) => acc + n, 0)
  return Math.round(suma / valores.length)
}

function etiquetaCualitativaPorNota(nota: number): EtiquetaCualitativa {
  if (nota >= UMBRAL_EXCELENCIA_FINAL) {
    return "excelencia"
  }
  if (nota >= UMBRAL_SOLIDO_FINAL) {
    return "solido"
  }
  if (nota >= UMBRAL_DESARROLLO_FINAL) {
    return "enDesarrollo"
  }
  return "noCumple"
}

function construirSkillsDemostradasNuevas(input: {
  readonly notasPorSkill: readonly NotaSkillSnapshot[]
  readonly skillsMeta: ReadonlyMap<string, SkillConArea>
  readonly ultimaPreviaPorSkill: ReadonlyMap<string, number | null>
}): readonly SkillCosechadaCierre[] {
  const demostradas = input.notasPorSkill.filter(
    (n) => n.notaActual !== null && n.notaActual >= n.umbralCumple,
  )
  const cosecha: SkillCosechadaCierre[] = []
  for (const skill of demostradas) {
    const meta = input.skillsMeta.get(skill.skillId)
    if (!meta) {
      continue
    }
    const previa = input.ultimaPreviaPorSkill.get(skill.skillId)
    const yaEstabaDemostrada =
      previa !== undefined && previa !== null && previa >= skill.umbralCumple
    if (yaEstabaDemostrada) {
      continue
    }
    cosecha.push({
      skillId: skill.skillId,
      skillNombre: meta.etiquetaVisible,
      areaCodigo: meta.area.codigo,
      areaNombre: meta.area.nombre,
    })
  }
  return cosecha.sort((a, b) => a.skillNombre.localeCompare(b.skillNombre))
}

function construirAreasPorTrabajar(
  snapshot: SnapshotCierre,
  notas: readonly NotaSkillSnapshot[],
  skillsMeta: ReadonlyMap<string, SkillConArea>,
): readonly AreaPorTrabajarCierre[] {
  const notasPorSkill = new Map(notas.map((n) => [n.skillId, n]))
  interface Acumulador {
    areaId: string
    areaCodigo: string
    areaNombre: string
    exigidas: number
    demostradas: number
  }
  const porArea = new Map<string, Acumulador>()
  for (const skillCfg of snapshot.curso.configuracion.skillsExigidas) {
    const meta = skillsMeta.get(skillCfg.skillId)
    if (!meta) {
      continue
    }
    const entry = porArea.get(meta.area.id) ?? {
      areaId: meta.area.id,
      areaCodigo: meta.area.codigo,
      areaNombre: meta.area.nombre,
      exigidas: 0,
      demostradas: 0,
    }
    entry.exigidas += 1
    const nota = notasPorSkill.get(skillCfg.skillId)
    if (nota && nota.notaActual !== null && nota.notaActual >= nota.umbralCumple) {
      entry.demostradas += 1
    }
    porArea.set(meta.area.id, entry)
  }
  const items: AreaPorTrabajarCierre[] = []
  for (const acc of porArea.values()) {
    if (acc.demostradas >= acc.exigidas) {
      continue
    }
    items.push({
      areaId: acc.areaId,
      areaCodigo: acc.areaCodigo,
      areaNombre: acc.areaNombre,
      nivelCualitativo: acc.demostradas === 0 ? "inicial" : "enDesarrollo",
    })
  }
  return items.sort((a, b) => a.areaNombre.localeCompare(b.areaNombre))
}
