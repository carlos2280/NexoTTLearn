import { Injectable } from "@nestjs/common"
import { OrigenNotaSkill, Prisma } from "@prisma/client"
import { PrismaService } from "../common/prisma/prisma.service"

export type PrismaTx = Prisma.TransactionClient | PrismaService

/**
 * Service del motor de `NotaSkill` extendido (Slice 8 P8b — D-S8-F2 / D33).
 *
 * Responsabilidades:
 *  - Localizar el `IntentoTransversal` vigente segun politica "ultimo aprobado"
 *    (D-S8-C5).
 *  - Recalcular `notas_skill.nota_actual` aplicando D33 (70 bloques / 20
 *    transversal / 10 entrevista IA) con redistribucion D35 cuando una fuente
 *    falta.
 *  - Registrar la actualizacion en `historico_notas_skill`.
 *
 * El motor original de bloques vive en `intentos-bloque.service.ts` y sigue
 * funcionando para el flujo BLOQUE-only del Slice 7; este service lo
 * complementa cuando entran transversal/entrevista en juego.
 *
 * Decision emergente (documentada en reporte): el motor de bloques actual
 * escribe `notaActual = promedio_bloques` directamente. Para evitar que el
 * proximo intento de bloque sobrescriba el aporte transversal, este service
 * lee la nota de bloques al vuelo en cada recalculo. La consistencia se
 * mantiene en el ciclo finalizar/anular del transversal; consolidar el motor
 * de bloques al D33 completo queda diferido (FIX-P8-cierre).
 */
@Injectable()
export class NotaSkillService {
  // Service stateless: todas las queries van por el `tx` recibido (cliente raiz
  // PrismaService o TransactionClient). Sin dependencias inyectadas; tests lo
  // instancian con `new NotaSkillService()`.

  /**
   * Politica "ultimo aprobado" (D-S8-C5). Los intentos llegan ordenados ASC.
   *  1. Filtra `anulado=false` y `estado='FINALIZADO'`.
   *  2. Toma el ultimo: si `aprobado=true`, devuelve ese intento.
   *  3. Si no, busca hacia atras el anterior aprobado; si no existe -> null.
   */
  obtenerIntentoTransversalVigente<T extends IntentoVigenteCandidato>(
    intentos: readonly T[],
  ): T | null {
    const noAnulados = intentos.filter((i) => !i.anulado && i.estado === "FINALIZADO")
    if (noAnulados.length === 0) {
      return null
    }
    const ultimo = noAnulados[noAnulados.length - 1]
    if (ultimo === undefined) {
      return null
    }
    if (ultimo.aprobado === true) {
      return ultimo
    }
    for (let i = noAnulados.length - 2; i >= 0; i -= 1) {
      const candidato = noAnulados[i]
      if (candidato !== undefined && candidato.aprobado === true) {
        return candidato
      }
    }
    return null
  }

  /**
   * Aplica D33 (70/20/10) con redistribucion D35 cuando alguna fuente es null.
   * Pesos vienen del curso (`Curso.pesoBloques`, `pesoTransversal`,
   * `pesoEntrevista`); las fuentes en null se omiten y los pesos vivos se
   * reescalan a 100.
   */
  calcularNotaActualSkill(
    notas: {
      readonly bloques: number | null
      readonly transversal: number | null
      readonly entrevista: number | null
    },
    pesos: {
      readonly bloques: number
      readonly transversal: number
      readonly entrevista: number
    },
  ): number | null {
    const fuentes: ReadonlyArray<{ readonly peso: number; readonly nota: number }> = (
      [
        { peso: pesos.bloques, nota: notas.bloques },
        { peso: pesos.transversal, nota: notas.transversal },
        { peso: pesos.entrevista, nota: notas.entrevista },
      ] as const
    ).flatMap((f) => (f.nota === null || f.peso <= 0 ? [] : [{ peso: f.peso, nota: f.nota }]))
    if (fuentes.length === 0) {
      return null
    }
    const pesoTotal = fuentes.reduce((sum, f) => sum + f.peso, 0)
    if (pesoTotal <= 0) {
      return null
    }
    const ponderada = fuentes.reduce((acc, f) => acc + (f.peso / pesoTotal) * f.nota, 0)
    return Math.round(ponderada * 100) / 100
  }

  /**
   * Recalcula `notas_skill.nota_actual` para `(colaboradorId, skillId)` a
   * partir de las tres fuentes (bloques / transversal / entrevista), persiste
   * el resultado e inserta una entrada en `historico_notas_skill` con el
   * `origen` que motivo el recalculo.
   */
  async recalcularConFuentes(
    tx: PrismaTx,
    input: {
      readonly colaboradorId: string
      readonly skillId: string
      readonly cursoId: string
      readonly origen: OrigenNotaSkill
      readonly referencia: Prisma.InputJsonObject
    },
  ): Promise<{ readonly notaActual: number | null }> {
    const [curso, mejoresBloques] = await Promise.all([
      tx.curso.findUniqueOrThrow({
        where: { id: input.cursoId },
        select: {
          pesoBloques: true,
          pesoTransversal: true,
          pesoEntrevista: true,
          transversalId: true,
          entrevistaIaId: true,
        },
      }),
      tx.intentoBloque.findMany({
        where: {
          colaboradorId: input.colaboradorId,
          bloque: { skillQueMideId: input.skillId },
          esMejorIntento: true,
          estaInvalidado: false,
        },
        select: { nota: true },
      }),
    ])

    const notaBloques = promedio(mejoresBloques.map((m) => Number(m.nota.toString())))

    let notaTransversal: number | null = null
    if (curso.transversalId !== null) {
      const intentos = await this.cargarIntentosTransversalPorSkill(tx, {
        colaboradorId: input.colaboradorId,
        skillId: input.skillId,
        cursoTransversalId: curso.transversalId,
      })
      const vigente = this.obtenerIntentoTransversalVigente(intentos)
      if (vigente && vigente.notaGlobal !== null) {
        notaTransversal = Number(vigente.notaGlobal.toString())
      }
    }

    // Entrevista IA queda en P8c — siempre null en P8b.
    const notaEntrevista: number | null = null

    const notaActual = this.calcularNotaActualSkill(
      { bloques: notaBloques, transversal: notaTransversal, entrevista: notaEntrevista },
      {
        bloques: Number(curso.pesoBloques.toString()),
        transversal: Number(curso.pesoTransversal.toString()),
        entrevista: Number(curso.pesoEntrevista.toString()),
      },
    )

    const origenActual = {
      tipo: input.origen,
      skillId: input.skillId,
      cursoId: input.cursoId,
      fuentes: {
        bloques: notaBloques,
        transversal: notaTransversal,
        entrevista: notaEntrevista,
      },
    } satisfies Prisma.InputJsonObject

    const notaSkill = await tx.notaSkill.upsert({
      where: {
        // biome-ignore lint/style/useNamingConvention: clave compuesta generada por Prisma para @@unique.
        colaboradorId_skillId: { colaboradorId: input.colaboradorId, skillId: input.skillId },
      },
      create: {
        colaboradorId: input.colaboradorId,
        skillId: input.skillId,
        notaActual: notaActual === null ? null : new Prisma.Decimal(notaActual),
        origenActual: origenActual as unknown as Prisma.InputJsonValue,
      },
      update: {
        notaActual: notaActual === null ? null : new Prisma.Decimal(notaActual),
        origenActual: origenActual as unknown as Prisma.InputJsonValue,
      },
      select: { id: true },
    })

    await tx.historicoNotaSkill.create({
      data: {
        notaSkillId: notaSkill.id,
        valor: notaActual === null ? null : new Prisma.Decimal(notaActual),
        origen: input.origen,
        referencia: input.referencia as unknown as Prisma.InputJsonValue,
      },
    })

    return { notaActual }
  }

  /**
   * Carga los intentos transversales del colaborador relacionados con la skill
   * (via `transversales_skills`) y los devuelve ordenados ASC por fecha — el
   * orden requerido por D-S8-C5. Si la skill no esta etiquetada al
   * transversal, devuelve lista vacia.
   */
  private async cargarIntentosTransversalPorSkill(
    tx: PrismaTx,
    input: {
      readonly colaboradorId: string
      readonly skillId: string
      readonly cursoTransversalId: string
    },
  ): Promise<readonly IntentoVigenteCandidato[]> {
    const transversalEtiquetado = await tx.transversalSkill.findFirst({
      where: { transversalId: input.cursoTransversalId, skillId: input.skillId },
      select: { transversalId: true },
    })
    if (!transversalEtiquetado) {
      return []
    }
    return await tx.intentoTransversal.findMany({
      where: {
        transversalId: input.cursoTransversalId,
        colaboradorId: input.colaboradorId,
        anulado: false,
      },
      select: {
        id: true,
        estado: true,
        anulado: true,
        aprobado: true,
        notaGlobal: true,
        fecha: true,
      },
      orderBy: { fecha: "asc" },
    })
  }
}

export interface IntentoVigenteCandidato {
  readonly id: string
  readonly estado: string
  readonly anulado: boolean
  readonly aprobado: boolean | null
  readonly notaGlobal: Prisma.Decimal | null
  readonly fecha: Date
}

function promedio(valores: readonly number[]): number | null {
  if (valores.length === 0) {
    return null
  }
  const suma = valores.reduce((acc, v) => acc + v, 0)
  return Math.round((suma / valores.length) * 100) / 100
}
