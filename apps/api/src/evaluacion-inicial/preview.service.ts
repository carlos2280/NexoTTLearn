import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from "@nestjs/common"
import {
  PreviewCambioItem,
  PreviewErrorCelda,
  PreviewRechazoItem,
  PreviewResponse,
  PreviewResumen,
  previewCambiosArraySchema,
  previewRechazosArraySchema,
  previewResumenSchema,
} from "@nexott-learn/shared-types"
import { ArchivoTipo, EstadoAsignado, Prisma, RolAsignacion } from "@prisma/client"
import { apiErrorCodes } from "../common/errors/api-error.codes"
import { decimalAnumero } from "../common/prisma/decimal"
import { PrismaService } from "../common/prisma/prisma.service"
import { StorageService } from "../common/storage/storage.service"
import { SesionUsuario } from "../common/types/sesion.types"
import {
  AreaExigidaCursoTemplate,
  ColaboradorAsignadoValido,
  FilaParseadaValida,
  ParserEsperado,
  ParserResultado,
  SkillExigidaCursoTemplate,
} from "./evaluacion-inicial.types"
import { ExcelParserService } from "./excel-parser.service"

const TTL_PREVIEW_MIN = 30
const MS_POR_MIN = 60 * 1000
const MIME_XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
const MAGIC_XLSX = Buffer.from([0x50, 0x4b, 0x03, 0x04])

const SELECT_CURSO_PREVIEW = {
  id: true,
  titulo: true,
  estado: true,
  areasExigidas: {
    select: {
      areaId: true,
      area: { select: { id: true, nombre: true } },
    },
  },
  skillsExigidas: {
    select: {
      skillId: true,
      skill: { select: { id: true, etiquetaVisible: true, areaId: true } },
    },
  },
} as const satisfies Prisma.CursoSelect

const SELECT_ASIGNACION_PREVIEW = {
  colaboradorId: true,
  colaborador: { select: { id: true, email: true, nombre: true } },
} as const satisfies Prisma.AsignacionCursoSelect

const SELECT_NOTA_SKILL_PREVIEW = {
  colaboradorId: true,
  skillId: true,
  notaActual: true,
} as const satisfies Prisma.NotaSkillSelect

const SELECT_PREVIEW_DESCARTAR = {
  id: true,
  cursoId: true,
  aplicadoEn: true,
  archivoId: true,
} as const satisfies Prisma.PreviewEvaluacionInicialSelect

interface CrearPreviewInput {
  readonly cursoId: string
  readonly buffer: Buffer
  readonly mimeType: string
  readonly tamanioBytes: number
  readonly sesion: SesionUsuario
}

interface ResumenPersistido {
  readonly previewId: string
  readonly archivoId: string
  readonly expiraEn: Date
  readonly resumen: PreviewResumen
  readonly cambios: readonly PreviewCambioItem[]
  readonly rechazos: readonly PreviewRechazoItem[]
}

interface AsignacionComputada {
  readonly colaboradorId: string
  readonly email: string
  readonly nombreColaborador: string
  readonly skillId: string
  readonly valor: number
  readonly fuente: "SKILL_DIRECTA" | "AREA_HEREDADA"
}

/**
 * PreviewService — Slice 5 P5b.
 *
 * Orquesta el ciclo `POST /preview`:
 *   1. Re-lee el curso + asignados (defensa contra cambios concurrentes).
 *   2. Valida precondiciones D7 / D-EVI-1 (curso publicable).
 *   3. Pide al parser un resultado tipado celda a celda (D-EVI-8).
 *   4. Aplica algoritmo "lo especifico gana" (D-EVI-6) sobre las filas validas
 *      y compara con `notas_skill.notaActual` (una sola query, sin N+1).
 *   5. Persiste el `Archivo` via `StorageService` y luego crea
 *      `PreviewEvaluacionInicial` con TTL 30 min (D-EVI-2). **NO se envuelven
 *      en `$transaction`**: si `previewEvaluacionInicial.create` falla, el
 *      `Archivo` queda huérfano en BD y disco (aceptable por D-EVI-1 —
 *      retención 5 años; el huérfano no compromete seguridad ni integridad
 *      funcional).
 *   6. El audit log se escribe DESDE el controller (D-AUDIT-2), fuera del
 *      flujo del service.
 *   7. Devuelve la respuesta con cambios + rechazos. **NO se aplica
 *      todo-o-nada** en preview (D-EVI-7 solo aplica al endpoint `aplicar` en
 *      P5c). El preview siempre devuelve 201; solo se rechaza con 422 cuando
 *      los encabezados son invalidos (`validacionExcelEncabezados`).
 *
 * `descartarPreview` borra el preview con guard race-safe (deleteMany WHERE
 * aplicadoEn IS NULL); el `Archivo` queda en storage como evidencia (D-EVI-1
 * retencion 5 anios).
 */
@Injectable()
export class PreviewService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly parser: ExcelParserService,
    private readonly storage: StorageService,
  ) {}

  async crearPreview(input: CrearPreviewInput): Promise<PreviewResponse> {
    if (input.mimeType !== MIME_XLSX) {
      throw new BadRequestException({
        code: apiErrorCodes.invalidBody,
        message: "El archivo debe ser .xlsx (Office Open XML Spreadsheet).",
      })
    }
    if (input.buffer.length < 4 || !input.buffer.subarray(0, 4).equals(MAGIC_XLSX)) {
      throw new BadRequestException({
        code: apiErrorCodes.invalidBody,
        message: "El archivo no es un .xlsx válido (magic bytes incorrectos).",
      })
    }

    const curso = await this.prisma.curso.findUnique({
      where: { id: input.cursoId },
      select: SELECT_CURSO_PREVIEW,
    })
    if (!curso) {
      throw new NotFoundException({
        code: apiErrorCodes.cursoNoEncontrado,
        message: `Curso ${input.cursoId} no encontrado.`,
      })
    }
    if (curso.areasExigidas.length === 0 && curso.skillsExigidas.length === 0) {
      throw new ConflictException({
        code: apiErrorCodes.conflictCursoNoPublicable,
        message: "El curso no tiene areas exigidas ni skills exigidas declaradas.",
        details: { motivo: "SIN_DECLARACION" },
      })
    }

    const asignaciones = await this.prisma.asignacionCurso.findMany({
      where: {
        cursoId: input.cursoId,
        rol: RolAsignacion.ASIGNADO,
        estadoAsignado: { not: EstadoAsignado.RETIRADO },
      },
      select: SELECT_ASIGNACION_PREVIEW,
    })
    if (asignaciones.length === 0) {
      throw new ConflictException({
        code: apiErrorCodes.conflictCursoNoPublicable,
        message: "El curso no tiene colaboradores asignados activos.",
        details: { motivo: "SIN_ASIGNADOS_ACTIVOS" },
      })
    }

    const skillsExigidas: SkillExigidaCursoTemplate[] = curso.skillsExigidas.map((se) => ({
      skillId: se.skill.id,
      etiquetaVisible: se.skill.etiquetaVisible,
      areaId: se.skill.areaId,
    }))
    const areasExigidas: AreaExigidaCursoTemplate[] = curso.areasExigidas.map((ae) => ({
      areaId: ae.area.id,
      nombre: ae.area.nombre,
    }))
    const skillsPorArea = this.construirSkillsPorArea(skillsExigidas)
    const emailsValidos = new Map<string, ColaboradorAsignadoValido>()
    for (const a of asignaciones) {
      emailsValidos.set(a.colaborador.email.toLowerCase(), {
        colaboradorId: a.colaborador.id,
        nombre: a.colaborador.nombre,
      })
    }

    const esperado: ParserEsperado = {
      skillsExigidas,
      areasExigidas,
      skillsPorArea,
      emailsValidos,
    }

    let parserResult: ParserResultado
    try {
      parserResult = await this.parser.parsear({ buffer: input.buffer, esperado })
    } catch (err) {
      throw new BadRequestException({
        code: apiErrorCodes.invalidBody,
        message: "El archivo .xlsx está corrupto o no puede leerse.",
        details: { causa: err instanceof Error ? err.message : "desconocido" },
      })
    }
    this.asegurarEncabezadosValidos(parserResult)

    const { cambios, rechazos, filasValidas, filasRechazadas } = await this.computarPreview(
      parserResult,
      esperado,
    )
    const filasTotales = filasValidas + filasRechazadas
    const skillsAfectadas = new Set(cambios.map((c) => c.skillId)).size
    const colaboradoresAfectados = new Set(cambios.map((c) => c.colaboradorId)).size

    const resumen: PreviewResumen = {
      filasTotales,
      filasValidas,
      filasRechazadas,
      skillsAfectadas,
      colaboradoresAfectados,
    }

    const persistido = await this.persistir({
      cursoId: input.cursoId,
      buffer: input.buffer,
      mimeType: input.mimeType,
      sesion: input.sesion,
      resumen,
      cambios,
      rechazos,
    })

    return {
      previewId: persistido.previewId,
      archivoId: persistido.archivoId,
      expiraEn: persistido.expiraEn.toISOString(),
      resumen: persistido.resumen,
      cambios: persistido.cambios,
      rechazos: persistido.rechazos,
    }
  }

  async descartarPreview(
    cursoId: string,
    previewId: string,
  ): Promise<{ readonly archivoId: string }> {
    const preview = await this.prisma.previewEvaluacionInicial.findUnique({
      where: { id: previewId },
      select: SELECT_PREVIEW_DESCARTAR,
    })
    if (!preview || preview.cursoId !== cursoId) {
      throw new NotFoundException({
        code: apiErrorCodes.previewNoEncontrado,
        message: `Preview ${previewId} no encontrado.`,
      })
    }
    if (preview.aplicadoEn !== null) {
      throw new ConflictException({
        code: apiErrorCodes.conflictPreviewYaAplicado,
        message: "El preview ya fue aplicado y no puede descartarse.",
      })
    }

    const archivoId = preview.archivoId
    const borrado = await this.prisma.previewEvaluacionInicial.deleteMany({
      where: { id: previewId, cursoId, aplicadoEn: null },
    })
    if (borrado.count === 0) {
      throw new ConflictException({
        code: apiErrorCodes.conflictPreviewYaAplicado,
        message: "El preview fue aplicado entre la lectura y el borrado.",
      })
    }
    return { archivoId }
  }

  private asegurarEncabezadosValidos(parser: ParserResultado): void {
    if (parser.encabezadosFaltantes.length === 0 && parser.encabezadosInesperados.length === 0) {
      return
    }
    throw new UnprocessableEntityException({
      code: apiErrorCodes.validacionExcelEncabezados,
      message: "El Excel no coincide con el template del curso.",
      details: {
        encabezadosFaltantes: parser.encabezadosFaltantes,
        encabezadosInesperados: parser.encabezadosInesperados,
      },
    })
  }

  private construirSkillsPorArea(
    skillsExigidas: readonly SkillExigidaCursoTemplate[],
  ): ReadonlyMap<string, readonly string[]> {
    const map = new Map<string, string[]>()
    for (const s of skillsExigidas) {
      const lista = map.get(s.areaId) ?? []
      lista.push(s.skillId)
      map.set(s.areaId, lista)
    }
    return map
  }

  private async computarPreview(
    parser: ParserResultado,
    esperado: ParserEsperado,
  ): Promise<{
    readonly cambios: readonly PreviewCambioItem[]
    readonly rechazos: readonly PreviewRechazoItem[]
    readonly filasValidas: number
    readonly filasRechazadas: number
  }> {
    const validas: FilaParseadaValida[] = []
    const rechazos: PreviewRechazoItem[] = []
    for (const fila of parser.filas) {
      if (fila.tipo === "VALIDA") {
        validas.push(fila)
      } else {
        const erroresCelda: PreviewErrorCelda[] = fila.errores.map((e) => ({
          celda: e.celda,
          codigo: e.codigo,
          mensaje: e.mensaje,
        }))
        rechazos.push({ fila: fila.numero, email: fila.email, errores: erroresCelda })
      }
    }

    if (validas.length === 0) {
      return {
        cambios: [],
        rechazos,
        filasValidas: 0,
        filasRechazadas: rechazos.length,
      }
    }

    const aplicado = this.aplicarAlgoritmoLoEspecificoGana(validas, esperado)
    const notasActuales = await this.cargarNotasActuales(aplicado)

    const cambios: PreviewCambioItem[] = []
    const etiquetasSkill = new Map(
      esperado.skillsExigidas.map((s) => [s.skillId, s.etiquetaVisible]),
    )
    for (const item of aplicado) {
      const claveActual = this.claveNota(item.colaboradorId, item.skillId)
      const valorAnterior = notasActuales.get(claveActual) ?? null
      if (valorAnterior === item.valor) {
        continue
      }
      cambios.push({
        colaboradorId: item.colaboradorId,
        email: item.email,
        nombreColaborador: item.nombreColaborador,
        skillId: item.skillId,
        etiquetaSkill: etiquetasSkill.get(item.skillId) ?? item.skillId,
        valorAnterior,
        valorNuevo: item.valor,
        fuente: item.fuente,
      })
    }

    return {
      cambios,
      rechazos,
      filasValidas: validas.length,
      filasRechazadas: rechazos.length,
    }
  }

  private aplicarAlgoritmoLoEspecificoGana(
    validas: readonly FilaParseadaValida[],
    esperado: ParserEsperado,
  ): readonly AsignacionComputada[] {
    const skillsExigidasIds = new Set(esperado.skillsExigidas.map((s) => s.skillId))
    const salida: AsignacionComputada[] = []
    for (const fila of validas) {
      const notas = this.calcularNotasPorFila(fila, esperado, skillsExigidasIds)
      for (const [skillId, info] of notas) {
        salida.push({
          colaboradorId: fila.colaboradorId,
          email: fila.email,
          nombreColaborador: fila.nombre,
          skillId,
          valor: info.valor,
          fuente: info.fuente,
        })
      }
    }
    return salida
  }

  private calcularNotasPorFila(
    fila: FilaParseadaValida,
    esperado: ParserEsperado,
    skillsExigidasIds: ReadonlySet<string>,
  ): Map<string, { valor: number; fuente: "SKILL_DIRECTA" | "AREA_HEREDADA" }> {
    const notas = new Map<string, { valor: number; fuente: "SKILL_DIRECTA" | "AREA_HEREDADA" }>()
    for (const [skillId, valor] of fila.valoresSkill) {
      if (valor !== null && skillsExigidasIds.has(skillId)) {
        notas.set(skillId, { valor, fuente: "SKILL_DIRECTA" })
      }
    }
    for (const [areaId, valor] of fila.valoresArea) {
      if (valor === null) {
        continue
      }
      this.heredarSkillsDelArea(areaId, valor, esperado, skillsExigidasIds, notas)
    }
    return notas
  }

  private heredarSkillsDelArea(
    areaId: string,
    valor: number,
    esperado: ParserEsperado,
    skillsExigidasIds: ReadonlySet<string>,
    notas: Map<string, { valor: number; fuente: "SKILL_DIRECTA" | "AREA_HEREDADA" }>,
  ): void {
    const skillsDelArea = esperado.skillsPorArea.get(areaId) ?? []
    for (const skillId of skillsDelArea) {
      if (skillsExigidasIds.has(skillId) && !notas.has(skillId)) {
        notas.set(skillId, { valor, fuente: "AREA_HEREDADA" })
      }
    }
  }

  private async cargarNotasActuales(
    aplicado: readonly { readonly colaboradorId: string; readonly skillId: string }[],
  ): Promise<ReadonlyMap<string, number | null>> {
    if (aplicado.length === 0) {
      return new Map()
    }
    const colaboradorIds = Array.from(new Set(aplicado.map((a) => a.colaboradorId)))
    const skillIds = Array.from(new Set(aplicado.map((a) => a.skillId)))
    const notas = await this.prisma.notaSkill.findMany({
      where: {
        colaboradorId: { in: colaboradorIds },
        skillId: { in: skillIds },
      },
      select: SELECT_NOTA_SKILL_PREVIEW,
    })
    const map = new Map<string, number | null>()
    for (const n of notas) {
      map.set(this.claveNota(n.colaboradorId, n.skillId), decimalAnumero(n.notaActual))
    }
    return map
  }

  private claveNota(colaboradorId: string, skillId: string): string {
    return `${colaboradorId}::${skillId}`
  }

  private async persistir(input: {
    readonly cursoId: string
    readonly buffer: Buffer
    readonly mimeType: string
    readonly sesion: SesionUsuario
    readonly resumen: PreviewResumen
    readonly cambios: readonly PreviewCambioItem[]
    readonly rechazos: readonly PreviewRechazoItem[]
  }): Promise<ResumenPersistido> {
    const archivo = await this.storage.guardar({
      contenido: input.buffer,
      mimeType: input.mimeType,
      tipo: ArchivoTipo.EVALUACION_INICIAL_EXCEL,
      subidoPorUsuarioId: input.sesion.usuarioId,
      metadata: this.buildMetadataArchivo(input.cursoId, input.resumen),
    })
    const resumenValidado = previewResumenSchema.parse(input.resumen)
    const cambiosValidados = previewCambiosArraySchema.parse(input.cambios)
    const rechazosValidados = previewRechazosArraySchema.parse(input.rechazos)
    const expiraEn = new Date(Date.now() + TTL_PREVIEW_MIN * MS_POR_MIN)
    const preview = await this.prisma.previewEvaluacionInicial.create({
      data: {
        cursoId: input.cursoId,
        archivoId: archivo.archivoId,
        creadoPorUsuarioId: input.sesion.usuarioId,
        expiraEn,
        resumen: resumenValidado satisfies Prisma.InputJsonValue,
        cambios: cambiosValidados satisfies Prisma.InputJsonValue,
        rechazos: rechazosValidados satisfies Prisma.InputJsonValue,
      },
      select: { id: true },
    })
    return {
      previewId: preview.id,
      archivoId: archivo.archivoId,
      expiraEn,
      resumen: input.resumen,
      cambios: input.cambios,
      rechazos: input.rechazos,
    }
  }

  private buildMetadataArchivo(cursoId: string, resumen: PreviewResumen): Prisma.InputJsonObject {
    return {
      cursoId,
      filasTotales: resumen.filasTotales,
      filasValidas: resumen.filasValidas,
      filasRechazadas: resumen.filasRechazadas,
    }
  }
}
