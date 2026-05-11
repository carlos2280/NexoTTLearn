import { promises as fs } from "node:fs"
import { isAbsolute, resolve, sep } from "node:path"
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { ArchivoTipo, Prisma } from "@prisma/client"
import { apiErrorCodes } from "../errors/api-error.codes"
import { PrismaService } from "../prisma/prisma.service"
import {
  GuardarArchivoInput,
  GuardarArchivoResult,
  LeerArchivoResult,
  archivoMetadataSchema,
} from "./storage.types"

const SELECT_ARCHIVO_FIELDS = {
  id: true,
  tipo: true,
  path: true,
  mimeType: true,
  tamanioBytes: true,
} as const satisfies Prisma.ArchivoSelect

const MIME_EXTENSION_MAP: Record<string, string> = {
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "application/pdf": "pdf",
  "text/csv": "csv",
  "application/octet-stream": "bin",
}

/**
 * StorageService — backend de archivos del proyecto (D-EVI-1).
 *
 * Dev/test: filesystem local relativo a `STORAGE_ROOT` (default
 * `apps/api/storage`). Prod: misma interfaz contra un volumen montado
 * (Railway Volumes en `/data/storage`).
 *
 * Reglas duras:
 *   - El path persistido en `archivos.path` es SIEMPRE relativo a
 *     `STORAGE_ROOT`. Nunca se persiste el path absoluto: si cambia el
 *     volumen, el registro sigue siendo valido.
 *   - En lectura/borrado validamos que el path resuelto vive bajo
 *     `STORAGE_ROOT` (anti path-traversal); si no, lanzamos 500 con codigo
 *     `archivoPathInvalido` para alertar de configuracion / datos corruptos.
 */
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name)
  private readonly storageRoot: string

  constructor(
    private readonly prisma: PrismaService,
    configService: ConfigService,
  ) {
    const raw = configService.get<string>("STORAGE_ROOT") ?? "apps/api/storage"
    this.storageRoot = isAbsolute(raw) ? resolve(raw) : resolve(process.cwd(), raw)
  }

  /**
   * Persiste el archivo en BD + filesystem de forma atomica: si la escritura
   * fisica falla, la fila `archivos` se revierte por rollback del tx propio,
   * eliminando registros huerfanos. Cuando el caller necesita componer la
   * escritura con otras mutaciones, puede inyectar su propio `tx`.
   */
  async guardar(
    input: GuardarArchivoInput,
    tx?: Prisma.TransactionClient,
  ): Promise<GuardarArchivoResult> {
    const metadataValidada = this.validarMetadata(input.metadata)

    const ejecutor = async (client: Prisma.TransactionClient): Promise<GuardarArchivoResult> => {
      const archivo = await client.archivo.create({
        data: {
          tipo: input.tipo,
          path: "",
          mimeType: input.mimeType,
          tamanioBytes: input.contenido.length,
          subidoPorUsuarioId: input.subidoPorUsuarioId,
          metadata: metadataValidada ?? Prisma.JsonNull,
        },
        select: { id: true },
      })

      const relativePath = this.buildRelativePath(input.tipo, archivo.id, input.mimeType)
      const absolutePath = this.resolveSeguro(relativePath)

      await fs.mkdir(resolve(absolutePath, ".."), { recursive: true })
      await fs.writeFile(absolutePath, input.contenido)

      await client.archivo.update({
        where: { id: archivo.id },
        data: { path: relativePath },
        select: { id: true },
      })

      return { archivoId: archivo.id, path: relativePath }
    }

    if (tx) {
      return ejecutor(tx)
    }
    return this.prisma.$transaction(ejecutor)
  }

  async leer(archivoId: string): Promise<LeerArchivoResult> {
    const archivo = await this.prisma.archivo.findUnique({
      where: { id: archivoId },
      select: SELECT_ARCHIVO_FIELDS,
    })
    if (!archivo) {
      throw new NotFoundException({
        code: apiErrorCodes.archivoNoEncontrado,
        message: "Archivo no encontrado.",
      })
    }
    const absolutePath = this.resolveSeguro(archivo.path)
    const contenido = await fs.readFile(absolutePath)
    return { contenido, mimeType: archivo.mimeType }
  }

  async borrar(archivoId: string): Promise<void> {
    const archivo = await this.prisma.archivo.findUnique({
      where: { id: archivoId },
      select: { id: true, path: true },
    })
    if (!archivo) {
      return
    }
    try {
      const absolutePath = this.resolveSeguro(archivo.path)
      await fs.unlink(absolutePath)
    } catch (error) {
      const errCode =
        error instanceof Error && "code" in error
          ? (error as NodeJS.ErrnoException).code
          : "UNKNOWN"
      this.logger.warn({ archivoId, errCode }, "Fallo al borrar archivo fisico")
    }
    await this.prisma.archivo.delete({ where: { id: archivoId } })
  }

  private validarMetadata(
    metadata: Prisma.InputJsonValue | undefined,
  ): Prisma.InputJsonValue | null {
    if (metadata === undefined) {
      return null
    }
    const result = archivoMetadataSchema.safeParse(metadata)
    if (!result.success) {
      throw new BadRequestException({
        code: apiErrorCodes.invalidBody,
        message: "metadata de archivo invalida.",
        details: result.error.flatten(),
      })
    }
    return result.data as Prisma.InputJsonValue
  }

  private buildRelativePath(tipo: ArchivoTipo, archivoId: string, mimeType: string): string {
    const ahora = new Date()
    const yyyy = String(ahora.getUTCFullYear())
    const mm = String(ahora.getUTCMonth() + 1).padStart(2, "0")
    const ext = MIME_EXTENSION_MAP[mimeType] ?? "bin"
    return [tipo, yyyy, mm, `${archivoId}.${ext}`].join("/")
  }

  private resolveSeguro(relativePath: string): string {
    const absolute = resolve(this.storageRoot, relativePath)
    const rootConSep = this.storageRoot.endsWith(sep)
      ? this.storageRoot
      : `${this.storageRoot}${sep}`
    if (absolute !== this.storageRoot && !absolute.startsWith(rootConSep)) {
      throw new InternalServerErrorException({
        code: apiErrorCodes.archivoPathInvalido,
        message: "El path resuelto escapa de STORAGE_ROOT.",
      })
    }
    return absolute
  }
}
