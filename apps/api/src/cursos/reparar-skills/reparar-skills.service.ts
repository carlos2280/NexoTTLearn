import { ConflictException, Injectable, Logger, NotFoundException } from "@nestjs/common"
import type {
  RepararSkillsCursoPreview,
  RepararSkillsCursoResponse,
} from "@nexott-learn/shared-types"
import {
  AccionAuditoria,
  EstadoAsignado,
  EstadoBloque,
  EstadoCurso,
  type Prisma,
  RolAsignacion,
} from "@prisma/client"

import { AuditLogService } from "../../common/audit/audit-log.service"
import { apiErrorCodes } from "../../common/errors/api-error.codes"
import { PrismaService } from "../../common/prisma/prisma.service"
import { PlanPersonalRecalculoService } from "../../plan-personal/plan-personal-recalculo.service"
import {
  type CursoAReparar,
  type FilaSeccionSkill,
  bloquesSinSkill,
  planificarSeccionSkills,
} from "./reparar-skills.helpers"

// Mismos defaults que el importador (importar-curso.service.ts).
const AREA_PESO = 100
const PUNTAJE_OBJETIVO = 60
const NOTA_MINIMA_SKILL = 60

const SELECT_CURSO_A_REPARAR = {
  id: true,
  titulo: true,
  estado: true,
  areasExigidas: { select: { areaId: true } },
  skillsExigidas: { select: { skillId: true } },
  modulosHabilitados: {
    orderBy: { orden: "asc" },
    select: {
      modulo: {
        select: {
          id: true,
          titulo: true,
          secciones: {
            orderBy: { orden: "asc" },
            select: {
              id: true,
              skills: { select: { skillId: true } },
              bloques: {
                where: { estado: EstadoBloque.ACTIVO },
                orderBy: { orden: "asc" },
                select: { id: true, tipo: true, esEvaluable: true, skillQueMideId: true },
              },
            },
          },
        },
      },
    },
  },
} satisfies Prisma.CursoSelect

type CursoRow = Prisma.CursoGetPayload<{ select: typeof SELECT_CURSO_A_REPARAR }>

interface ResultadoTx {
  readonly bloquesCompletados: number
  readonly filas: readonly FilaSeccionSkill[]
  readonly skillsExigidasAgregadas: number
  readonly areaExigidaAgregada: boolean
}

/**
 * Repara un curso ya cargado al que le faltan skills (p. ej. importado con la
 * plantilla vieja, sin `skill=`): sin ellas sus bloques evaluables rechazan
 * intentos y sus secciones quedan fuera del plan, con el avance en 0 %.
 *
 * Solo AGREGA: asigna skill a bloques evaluables que no tienen (sin subir su
 * version: nadie pudo responderlos, no hay intentos que invalidar), crea
 * SeccionSkill en secciones sin ninguna, agrega las skills exigidas que falten
 * y el area exigida si el curso no tiene. Luego recalcula los planes de los
 * asignados (cada uno recibe la notificacion PLAN_RECALCULADO).
 * Las secciones son del catalogo: si otro curso usa el mismo modulo, tambien
 * ve las skills agregadas.
 */
@Injectable()
export class RepararSkillsCursoService {
  private readonly logger = new Logger(RepararSkillsCursoService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
    private readonly recalculo: PlanPersonalRecalculoService,
  ) {}

  /** Lo que haria `reparar`, sin escribir. Para el resumen previo del boton. */
  async previsualizar(cursoId: string): Promise<RepararSkillsCursoPreview> {
    const row = await this.cargarOExplotar(cursoId)
    const d = diagnosticar(row)
    const planes = await this.prisma.asignacionCurso.count({
      where: {
        cursoId,
        rol: RolAsignacion.ASIGNADO,
        // Mismo filtro que PlanPersonalRecalculoService.recalcularMasivo.
        estadoAsignado: {
          in: [EstadoAsignado.ASIGNADO, EstadoAsignado.EN_PROGRESO, EstadoAsignado.LISTO],
        },
      },
    })
    return {
      cursoId,
      bloques: d.bloques,
      secciones: d.secciones,
      skillsExigidas: d.skillsExigidas,
      areaExigida: d.areaExigida,
      planes: hayCambios(d) ? planes : 0,
    }
  }

  async reparar(cursoId: string, autorUsuarioId: string): Promise<RepararSkillsCursoResponse> {
    const row = await this.cargarOExplotar(cursoId)
    if (!hayCambios(diagnosticar(row))) {
      return vacio(cursoId)
    }
    const curso = aCursoAReparar(row)
    const exigidasActuales = new Set(row.skillsExigidas.map((e) => e.skillId))

    const r = await this.prisma.$transaction(async (tx) =>
      this.aplicar(tx, row, curso, exigidasActuales),
    )
    await this.auditar(row, curso, r, autorUsuarioId)
    const planes = await this.recalculo.recalcularMasivo(cursoId, autorUsuarioId)

    this.logger.log(
      `reparar-skills | curso=${cursoId} | bloques=${r.bloquesCompletados} | filas=${r.filas.length} | planes=${planes.recalculadas}/${planes.total}`,
    )
    return {
      cursoId,
      bloquesCompletados: r.bloquesCompletados,
      seccionesCompletadas: new Set(r.filas.map((f) => f.seccionId)).size,
      skillsExigidasAgregadas: r.skillsExigidasAgregadas,
      areaExigidaAgregada: r.areaExigidaAgregada,
      planes: {
        total: planes.total,
        recalculados: planes.recalculadas,
        fallidos: planes.fallidas,
      },
    }
  }

  private async cargarOExplotar(cursoId: string): Promise<CursoRow> {
    const row = await this.prisma.curso.findUnique({
      where: { id: cursoId },
      select: SELECT_CURSO_A_REPARAR,
    })
    if (!row) {
      throw new NotFoundException({
        code: apiErrorCodes.cursoNoEncontrado,
        message: "Curso no encontrado.",
      })
    }
    if (row.estado !== EstadoCurso.BORRADOR && row.estado !== EstadoCurso.ACTIVO) {
      throw new ConflictException({
        code: apiErrorCodes.conflictCursoEstado,
        message: "Solo se reparan cursos en borrador o activos.",
        details: { estado: row.estado },
      })
    }
    return row
  }

  private async aplicar(
    tx: Prisma.TransactionClient,
    row: CursoRow,
    curso: CursoAReparar,
    exigidasActuales: ReadonlySet<string>,
  ): Promise<ResultadoTx> {
    const areaExistente = row.areasExigidas[0]?.areaId
    const areaId = areaExistente ?? (await this.asegurarArea(tx, row.titulo))

    const skillNuevaDeBloque = new Map<string, string>()
    const skillPorEtiqueta = new Map<string, string>()
    for (const { bloqueId, etiqueta } of bloquesSinSkill(curso)) {
      let skillId = skillPorEtiqueta.get(etiqueta)
      if (!skillId) {
        const skill = await tx.skill.upsert({
          where: { etiquetaVisible: etiqueta },
          create: { etiquetaVisible: etiqueta, areaId },
          update: {},
          select: { id: true },
        })
        skillId = skill.id
        skillPorEtiqueta.set(etiqueta, skillId)
      }
      await tx.bloque.update({
        where: { id: bloqueId },
        data: { skillQueMideId: skillId },
        select: { id: true },
      })
      skillNuevaDeBloque.set(bloqueId, skillId)
    }

    const filas = planificarSeccionSkills(curso, skillNuevaDeBloque)
    if (filas.length > 0) {
      await tx.seccionSkill.createMany({ data: [...filas], skipDuplicates: true })
    }

    const nuevasExigidas = [...new Set(filas.map((f) => f.skillId))].filter(
      (skillId) => !exigidasActuales.has(skillId),
    )
    if (nuevasExigidas.length > 0) {
      await tx.cursoSkillExigida.createMany({
        data: nuevasExigidas.map((skillId) => ({
          cursoId: row.id,
          skillId,
          notaMinima: NOTA_MINIMA_SKILL,
        })),
        skipDuplicates: true,
      })
    }

    if (!areaExistente) {
      await tx.cursoAreaExigida.create({
        data: { cursoId: row.id, areaId, peso: AREA_PESO, puntajeObjetivo: PUNTAJE_OBJETIVO },
      })
    }

    return {
      bloquesCompletados: skillNuevaDeBloque.size,
      filas,
      skillsExigidasAgregadas: nuevasExigidas.length,
      areaExigidaAgregada: !areaExistente,
    }
  }

  private async asegurarArea(tx: Prisma.TransactionClient, nombre: string): Promise<string> {
    const area = await tx.area.upsert({
      where: { nombre },
      create: { nombre },
      update: {},
      select: { id: true },
    })
    return area.id
  }

  /** Un registro por modulo tocado (sus secciones o bloques cambiaron). */
  private async auditar(
    row: CursoRow,
    curso: CursoAReparar,
    r: ResultadoTx,
    autorUsuarioId: string,
  ): Promise<void> {
    const seccionesTocadas = new Set(r.filas.map((f) => f.seccionId))
    const bloquesTocados = new Set(bloquesSinSkill(curso).map((b) => b.bloqueId))
    for (const modulo of curso.modulos) {
      const secciones = modulo.secciones.filter((s) => seccionesTocadas.has(s.id)).length
      const bloques = modulo.secciones
        .flatMap((s) => s.bloques)
        .filter((b) => bloquesTocados.has(b.id)).length
      if (secciones === 0 && bloques === 0) {
        continue
      }
      await this.auditLog.record({
        usuarioId: autorUsuarioId,
        accion: AccionAuditoria.MODULO_ACTUALIZADO,
        exito: true,
        recursoTipo: "modulo",
        recursoId: modulo.id,
        metadata: { origen: "REPARAR_SKILLS", cursoId: row.id, secciones, bloques },
      })
    }
  }
}

function aCursoAReparar(row: CursoRow): CursoAReparar {
  return {
    titulo: row.titulo,
    modulos: row.modulosHabilitados.map(({ modulo }) => ({
      id: modulo.id,
      titulo: modulo.titulo,
      secciones: modulo.secciones.map((s) => ({
        id: s.id,
        skillIds: s.skills.map((k) => k.skillId),
        bloques: s.bloques,
      })),
    })),
  }
}

interface Diagnostico {
  readonly bloques: number
  readonly secciones: number
  readonly skillsExigidas: number
  readonly areaExigida: boolean
}

/**
 * Cuenta lo que falta usando ids provisionales para las skills que aun no
 * existen («nueva:‹etiqueta›»): las mismas funciones que aplica `reparar`.
 */
function diagnosticar(row: CursoRow): Diagnostico {
  const curso = aCursoAReparar(row)
  const sinSkill = bloquesSinSkill(curso)
  const provisional = new Map(sinSkill.map((b) => [b.bloqueId, `nueva:${b.etiqueta}`]))
  const filas = planificarSeccionSkills(curso, provisional)
  const exigidas = new Set(row.skillsExigidas.map((e) => e.skillId))
  return {
    bloques: sinSkill.length,
    secciones: new Set(filas.map((f) => f.seccionId)).size,
    skillsExigidas: new Set(filas.map((f) => f.skillId).filter((id) => !exigidas.has(id))).size,
    areaExigida: row.areasExigidas.length === 0 && filas.length > 0,
  }
}

function hayCambios(d: Diagnostico): boolean {
  return d.bloques > 0 || d.secciones > 0 || d.skillsExigidas > 0
}

function vacio(cursoId: string): RepararSkillsCursoResponse {
  return {
    cursoId,
    bloquesCompletados: 0,
    seccionesCompletadas: 0,
    skillsExigidasAgregadas: 0,
    areaExigidaAgregada: false,
    planes: { total: 0, recalculados: 0, fallidos: 0 },
  }
}
