import { ApiError } from "@/shared/api/api-error"
import { Banner } from "@/shared/components/ui/banner"
import { Button } from "@/shared/components/ui/button"
import { RUTAS } from "@/shared/constants/rutas"
import { Link, useNavigate } from "react-router-dom"
import { AvisoCursoDuplicado } from "./components/aviso-curso-duplicado"
import { PreviewArchivo } from "./components/preview-archivo"
import { ZonaUpload } from "./components/zona-upload"
import { useArchivoMd } from "./hooks/use-archivo-md"
import { useDescargarPlantilla } from "./hooks/use-descargar-plantilla"
import { type OpcionesImportar, useImportarCurso } from "./hooks/use-importar-curso"
import { cursosDuplicadosDelError } from "./lib/curso-duplicado"

/**
 * Página `/admin/catalogo/importar` — flujo "Importar curso desde Markdown".
 *
 * Flujo del admin:
 *  1. (Opcional) Descarga la plantilla `.md` para empezar desde un ejemplo.
 *  2. Edita el archivo en su editor (VS Code, Obsidian, Notion).
 *  3. Vuelve a esta página, sube el `.md`.
 *  4. Pulsa "Importar". El backend parsea, valida y persiste en transacción.
 *  5. Si OK → redirige al detalle del curso creado. Si KO → ve el error
 *     con módulo/sección/bloque exactos para corregir.
 */
export function ImportarCursoPage() {
  const navigate = useNavigate()
  const { archivo, error: errorArchivo, cargarDesdeFile, limpiar } = useArchivoMd()
  const { importar, isPending, resultado, error: errorImport, reset } = useImportarCurso()
  const { descargar: handleDescargarPlantilla, descargando: descargandoPlantilla } =
    useDescargarPlantilla()

  const handleImportar = async (opciones: OpcionesImportar = {}) => {
    if (!archivo) {
      return
    }
    const res = await importar(archivo.contenido, opciones).catch(() => null)
    if (res) {
      navigate(RUTAS.admin.cursoDetalle(res.cursoId))
    }
  }

  const handleReiniciar = () => {
    limpiar()
    reset()
  }

  const duplicados = cursosDuplicadosDelError(errorImport)
  const tituloExito = resultado?.reemplazado
    ? "Curso reemplazado correctamente"
    : "Curso importado correctamente"
  const mensajeError = duplicados
    ? null
    : errorImport instanceof ApiError
      ? errorImport.message
      : (errorImport?.message ?? errorArchivo ?? null)

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-10">
      <header className="flex flex-col gap-1.5">
        <span className="nx-eyebrow text-text-tertiary">Catálogo</span>
        <h1 className="text-h1 text-text-primary">
          Importar curso<span className="text-accent">.</span>
        </h1>
        <p className="text-body-sm text-text-secondary">
          Sube un archivo Markdown con la estructura del curso y se cargará completo: módulos,
          secciones y bloques.{" "}
          <Link
            to={RUTAS.admin.catalogo}
            className="text-accent underline-offset-4 hover:underline"
          >
            Volver al catálogo
          </Link>
        </p>
      </header>

      {resultado ? (
        <Banner tone="success" title={tituloExito}>
          El curso quedó con {resultado.modulosCreados} módulos, {resultado.seccionesCreadas}{" "}
          secciones y {resultado.bloquesCreados} bloques. Redirigiendo al detalle…
        </Banner>
      ) : null}

      {duplicados ? (
        <AvisoCursoDuplicado
          cursos={duplicados}
          importando={isPending}
          onConfirmar={() => handleImportar({ confirmarDuplicado: true })}
          onReemplazar={(cursoId) => handleImportar({ reemplazarCursoId: cursoId })}
          onCancelar={reset}
        />
      ) : null}

      {mensajeError ? (
        <Banner tone="danger" title="No se pudo importar">
          <pre className="whitespace-pre-wrap font-mono text-caption">{mensajeError}</pre>
        </Banner>
      ) : null}

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-h3 text-text-primary">1. (Opcional) Descargar plantilla</h2>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleDescargarPlantilla}
            disabled={descargandoPlantilla}
          >
            {descargandoPlantilla ? "Descargando…" : "Descargar .md"}
          </Button>
        </div>
        <p className="text-body-sm text-text-secondary">
          Si es tu primera vez, descarga la plantilla — viene con un ejemplo de cada tipo de bloque.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-h3 text-text-primary">2. Subir tu archivo</h2>
        {archivo ? (
          <PreviewArchivo
            nombre={archivo.nombre}
            tamanoBytes={archivo.tamanoBytes}
            contenido={archivo.contenido}
            onQuitar={handleReiniciar}
          />
        ) : (
          <ZonaUpload onArchivo={cargarDesdeFile} disabled={isPending} />
        )}
      </section>

      {archivo ? (
        <section className="flex items-center justify-end gap-3">
          <Button type="button" variant="ghost" onClick={handleReiniciar} disabled={isPending}>
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={() => handleImportar()}
            disabled={isPending || duplicados !== null}
          >
            {isPending ? "Importando…" : "Importar curso"}
          </Button>
        </section>
      ) : null}
    </main>
  )
}
