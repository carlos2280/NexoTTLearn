import { promises as fs } from "node:fs"
import { isAbsolute, resolve, sep } from "node:path"
import { Injectable, InternalServerErrorException, Logger, NotFoundException } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { ArchivoTipo, Prisma } from "@prisma/client"
import { apiErrorCodes } from "../errors/api-error.codes"
import { PrismaService } from "../prisma/prisma.service"
import { GuardarArchivoInput, GuardarArchivoResult, LeerArchivoResult } from "./storage.types"

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

  async guardar(input: GuardarArchivoInput): Promise<GuardarArchivoResult> {
    const archivo = await this.prisma.archivo.create({
      data: {
        tipo: input.tipo,
        path: "",
        mimeType: input.mimeType,
        tamanioBytes: input.contenido.length,
        subidoPorUsuarioId: input.subidoPorUsuarioId,
        metadata: input.metadata ?? Prisma.JsonNull,
      },
      select: { id: true },
    })

    const relativePath = this.buildRelativePath(input.tipo, archivo.id, input.mimeType)
    const absolutePath = this.resolveSeguro(relativePath)

    await fs.mkdir(resolve(absolutePath, ".."), { recursive: true })
    await fs.writeFile(absolutePath, input.contenido)

    await this.prisma.archivo.update({
      where: { id: archivo.id },
      data: { path: relativePath },
      select: { id: true },
    })

    return { archivoId: archivo.id, path: relativePath }
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
      const detalle = error instanceof Error ? error.message : String(error)
      this.logger.warn(`No se pudo borrar archivo fisico ${archivoId}: ${detalle}`)
    }
    await this.prisma.archivo.delete({ where: { id: archivoId } })
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
