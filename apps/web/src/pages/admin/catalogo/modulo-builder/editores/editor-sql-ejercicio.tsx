import { Banner } from "@/shared/components/ui/banner"
import { Field } from "@/shared/components/ui/field"
import { Input } from "@/shared/components/ui/input"
import type { BloqueDetalleResponse } from "@nexott-learn/shared-types"
import { useRef, useState } from "react"
import { CodeEditor } from "./shared/code-editor"
import { EditorBloqueShell } from "./shared/editor-bloque-shell"
import { TiptapEditor } from "./shared/tiptap-editor"
import { extensionesMinimas } from "./shared/tiptap-extensiones"
import { useAutoGuardarBloque } from "./shared/use-auto-guardar-bloque"
import { SeccionTestsSql } from "./sql-ejercicio/seccion-tests-sql"

interface EditorSqlEjercicioProps {
  readonly bloque: BloqueDetalleResponse
}

interface Borrador {
  readonly enunciado: string
  readonly esquemaSemilla: string
  readonly consultaInicial: string
  readonly tiempoLimiteSeg: number
}

function leerInicial(contenido: Record<string, unknown> | null): Borrador {
  return {
    enunciado: typeof contenido?.enunciado === "string" ? contenido.enunciado : "",
    esquemaSemilla: typeof contenido?.esquemaSemilla === "string" ? contenido.esquemaSemilla : "",
    consultaInicial:
      typeof contenido?.consultaInicial === "string" ? contenido.consultaInicial : "",
    tiempoLimiteSeg:
      typeof contenido?.tiempoLimiteSeg === "number" ? contenido.tiempoLimiteSeg : 30,
  }
}

export function EditorSqlEjercicio({ bloque }: EditorSqlEjercicioProps) {
  const inicial = leerInicial(bloque.contenido)
  const [datos, setDatos] = useState<Borrador>(inicial)
  const datosRef = useRef<Borrador>(inicial)

  const auto = useAutoGuardarBloque({
    bloqueId: bloque.id,
    construirContenido: () => ({ ...datosRef.current }),
  })

  function actualizar(parcial: Partial<Borrador>) {
    setDatos((prev) => {
      const siguiente = { ...prev, ...parcial }
      datosRef.current = siguiente
      return siguiente
    })
    auto.marcarSucio()
  }

  return (
    <EditorBloqueShell
      bloque={bloque}
      titulo="Reto SQL"
      descripcion="Define la consulta a resolver, la base de datos de ejemplo y sus tests. El participante escribe SQL y el navegador (PGlite) lo auto-corrige comparando las filas contra una consulta de referencia."
      estadoGuardado={auto.estado}
    >
      <Banner tone="info">
        Todo reto SQL se evalúa automáticamente con sus tests (abajo). Cada test corre la consulta
        del participante y una <strong>consulta de referencia</strong> sobre la misma base, y
        compara los conjuntos de filas.
      </Banner>

      <Field label="Tiempo límite por test" hint="Entre 1 y 120 segundos.">
        {(attrs) => (
          <div className="flex items-center gap-2">
            <Input
              {...attrs}
              type="number"
              min={1}
              max={120}
              value={datos.tiempoLimiteSeg}
              onChange={(e) =>
                actualizar({
                  tiempoLimiteSeg: Math.max(1, Math.min(120, Number(e.target.value) || 30)),
                })
              }
            />
            <span className="tabular font-mono text-body-sm text-text-tertiary">segundos</span>
          </div>
        )}
      </Field>

      <Field
        label="Enunciado"
        hint="Acepta formato: negrita, cursiva, listas, código inline y enlaces."
      >
        {(_attrs) => (
          <TiptapEditor
            key={bloque.id}
            htmlInicial={datos.enunciado}
            extensiones={extensionesMinimas("Escribe una consulta que devuelva…")}
            variante="minima"
            altoMin="160px"
            onCambio={(html) => actualizar({ enunciado: html })}
          />
        )}
      </Field>

      <Field
        label="Esquema semilla"
        hint="DDL + INSERTs de la base que el participante explora mientras itera. Se aplica antes de cada test."
      >
        {(attrs) => (
          <CodeEditor
            id={attrs.id}
            value={datos.esquemaSemilla}
            onValueChange={(v) => actualizar({ esquemaSemilla: v })}
            lenguaje="sql"
            rows={8}
            placeholder={"CREATE TABLE empleados (…);\nINSERT INTO empleados VALUES (…);"}
          />
        )}
      </Field>

      <Field
        label="Consulta inicial"
        hint="El esqueleto que el participante ve al abrir. Puede quedar vacío."
      >
        {(attrs) => (
          <CodeEditor
            id={attrs.id}
            value={datos.consultaInicial}
            onValueChange={(v) => actualizar({ consultaInicial: v })}
            lenguaje="sql"
            rows={6}
            placeholder={"-- Escribe tu consulta aquí\nSELECT"}
          />
        )}
      </Field>

      <SeccionTestsSql key={bloque.id} reto={bloque} />
    </EditorBloqueShell>
  )
}
