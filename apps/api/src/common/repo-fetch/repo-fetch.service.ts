import nodeFs from "node:fs"
import { mkdtemp, readFile, readdir, rm, stat } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { Injectable, Logger, UnprocessableEntityException } from "@nestjs/common"
import { clone } from "isomorphic-git"
import http from "isomorphic-git/http/node"
import { apiErrorCodes } from "../errors/api-error.codes"
import {
  type ArchivoLeido,
  LIMITES_DEFECTO,
  type LimitesEmpaquetado,
  type RepoEmpaquetado,
  debeIncluirArchivo,
  empaquetarArchivos,
  esRutaIgnorada,
} from "./empaquetar-repo"
import { validarRepoUrl } from "./validar-repo-url"

const CLONE_TIMEOUT_MS = 30_000
const PREFIJO_TEMP = "nxtt-repo-"

/** Estado mutable del recorrido BFS del árbol clonado. */
interface RecorridoAcumulador {
  readonly archivos: ArchivoLeido[]
  bytes: number
  readonly subdirs: string[]
  tope: boolean
}

/**
 * `RepoFetchService` — descarga el repositorio entregado por el participante y
 * lo empaqueta en texto para la evaluación cualitativa de la IA (Slice 8, Paso
 * 2a del colapso a una capa).
 *
 * Flujo: valida la URL (anti-SSRF, `validarRepoUrl`) → `git clone --depth 1`
 * (isomorphic-git, sin binario del sistema) a un directorio temporal → recorre
 * el árbol leyendo solo archivos de texto dentro de los topes → empaqueta →
 * borra el temporal SIEMPRE (`finally`).
 *
 * Nunca ejecuta código del repo (solo lee texto). Nunca loggea contenido: solo
 * metadatos (archivos incluidos, bytes, truncado).
 */
@Injectable()
export class RepoFetchService {
  private readonly logger = new Logger(RepoFetchService.name)

  async descargarYEmpaquetar(
    repoUrl: string,
    limites: LimitesEmpaquetado = LIMITES_DEFECTO,
  ): Promise<RepoEmpaquetado> {
    const validacion = validarRepoUrl(repoUrl)
    if (!validacion.ok) {
      throw new UnprocessableEntityException({
        code: apiErrorCodes.repoUrlInvalida,
        message: validacion.motivo,
      })
    }

    const dir = await mkdtemp(join(tmpdir(), PREFIJO_TEMP))
    const clon = this.iniciarClone(validacion.url, dir)
    let lecturaCompleta = false
    try {
      await this.esperarClone(clon)
      const archivos = await this.leerArchivos(dir, limites)
      const empaquetado = empaquetarArchivos(archivos, limites)
      this.logger.log(
        `Repo empaquetado archivos=${empaquetado.archivosIncluidos} bytes=${empaquetado.bytesTotales} truncado=${empaquetado.truncado}`,
      )
      if (empaquetado.archivosIncluidos === 0) {
        throw new UnprocessableEntityException({
          code: apiErrorCodes.repoNoAccesible,
          message: "El repositorio no tiene archivos de código legibles.",
        })
      }
      lecturaCompleta = true
      return empaquetado
    } finally {
      await this.limpiar(dir, clon, lecturaCompleta)
    }
  }

  /**
   * Inicia el clone (sin await). isomorphic-git 1.x no soporta AbortSignal: si
   * el timeout gana, esta promesa sigue viva. Su eventual rechazo tardío queda
   * observado por el `Promise.race` de `esperarClone` y por el `.then(borrar,
   * borrar)` de `limpiar`, así que nunca es una unhandled rejection.
   */
  private iniciarClone(url: string, dir: string): Promise<void> {
    return clone({
      fs: nodeFs,
      http,
      dir,
      url,
      singleBranch: true,
      depth: 1,
      noTags: true,
    })
  }

  /** Espera el clone con un tope de tiempo; mapea fallo/timeout a repoNoAccesible. */
  private async esperarClone(clon: Promise<void>): Promise<void> {
    let temporizador: NodeJS.Timeout | undefined
    const timeout = new Promise<never>((_, reject) => {
      temporizador = setTimeout(() => reject(new Error("clone timeout")), CLONE_TIMEOUT_MS)
    })
    try {
      await Promise.race([clon, timeout])
    } catch (error) {
      const detalle = error instanceof Error ? error.message : String(error)
      this.logger.warn(`Fallo clone del repo: ${detalle}`)
      throw new UnprocessableEntityException({
        code: apiErrorCodes.repoNoAccesible,
        message: "No se pudo clonar el repositorio (inaccesible, privado o demasiado grande).",
      })
    } finally {
      if (temporizador) {
        clearTimeout(temporizador)
      }
    }
  }

  /**
   * Borra el temporal sin borrar "bajo escritura":
   *  - camino feliz (lectura completa): el clone ya terminó → borra ya.
   *  - error/timeout: el clone puede seguir vivo → borra cuando realmente
   *    resuelva/rechace (limpieza diferida). Nota: si el clone quedara colgado
   *    para siempre el temporal persiste; acotar eso requiere cuota de disco a
   *    nivel de contenedor (fuera del alcance de este servicio).
   */
  private async limpiar(dir: string, clon: Promise<void>, lecturaCompleta: boolean): Promise<void> {
    if (lecturaCompleta) {
      await this.borrarTemp(dir)
      return
    }
    // Error/timeout: el clone puede seguir vivo. Borra cuando realmente termine
    // (ambas ramas), lo que además observa su posible rechazo tardío.
    clon.then(
      () => this.borrarTemp(dir),
      () => this.borrarTemp(dir),
    )
  }

  private async borrarTemp(dir: string): Promise<void> {
    await rm(dir, { recursive: true, force: true }).catch((e: unknown) => {
      this.logger.warn(
        `No se pudo borrar el temporal ${dir}: ${e instanceof Error ? e.message : "?"}`,
      )
    })
  }

  /**
   * Recorre el árbol clonado (BFS) leyendo solo los archivos que pasan la
   * política de inclusión. Corta temprano al superar los topes para acotar la
   * memoria: `empaquetarArchivos` hace el corte final determinista.
   */
  private async leerArchivos(raiz: string, limites: LimitesEmpaquetado): Promise<ArchivoLeido[]> {
    const acc: RecorridoAcumulador = { archivos: [], bytes: 0, subdirs: [""], tope: false }
    while (acc.subdirs.length > 0 && !acc.tope) {
      const relDir = acc.subdirs.shift()
      if (relDir === undefined) {
        break
      }
      const entradas = await readdir(join(raiz, relDir), { withFileTypes: true })
      await this.procesarEntradas(raiz, relDir, entradas, limites, acc)
    }
    return acc.archivos
  }

  private async procesarEntradas(
    raiz: string,
    relDir: string,
    entradas: readonly nodeFs.Dirent[],
    limites: LimitesEmpaquetado,
    acc: RecorridoAcumulador,
  ): Promise<void> {
    for (const entrada of entradas) {
      const rel = relDir.length > 0 ? `${relDir}/${entrada.name}` : entrada.name
      if (esRutaIgnorada(rel)) {
        continue
      }
      if (entrada.isDirectory()) {
        acc.subdirs.push(rel)
        continue
      }
      if (acc.archivos.length >= limites.maxArchivos || acc.bytes >= limites.maxBytesTotal) {
        acc.tope = true
        return
      }
      const leido = entrada.isFile() ? await this.leerArchivoTexto(raiz, rel, limites) : null
      if (leido !== null) {
        acc.archivos.push(leido)
        acc.bytes += leido.bytes
      }
    }
  }

  /** Lee un archivo si pasa la política de inclusión; si no, devuelve null. */
  private async leerArchivoTexto(
    raiz: string,
    rel: string,
    limites: LimitesEmpaquetado,
  ): Promise<ArchivoLeido | null> {
    const info = await stat(join(raiz, rel))
    if (!debeIncluirArchivo(rel, info.size, limites)) {
      return null
    }
    const contenido = await readFile(join(raiz, rel), "utf8")
    return { ruta: rel, contenido, bytes: info.size }
  }
}
