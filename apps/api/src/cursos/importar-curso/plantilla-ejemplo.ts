/**
 * Plantilla MD que se devuelve en `GET /api/v1/admin/cursos/importar/plantilla`.
 * El admin la descarga, la rellena en su editor favorito (VS Code, Obsidian,
 * Notion exportando como .md) y la vuelve a subir.
 *
 * Contiene un ejemplo completo de los 8 tipos de fence (parrafo, tip, quiz,
 * codigo, codigo_ilustrativo, recurso, video, diagrama). Cada bloque
 * documenta sus campos disponibles via comentarios YAML.
 */
export const PLANTILLA_CURSO_MD = `---
curso:
  titulo: "Mi Curso de Ejemplo"
  cliente: "NTT Data Iberia"        # debe existir ya en la plataforma
  fechaInicio: "2026-06-15"          # YYYY-MM-DD
  fechaDeadline: "2026-09-15"
  desbloqueo: "ENCADENADO"           # ENCADENADO | LIBRE | DESDE_FECHA (opcional)
---

# Módulo 1: Bienvenida
> Presentación del curso y primeras nociones.

## Sección 1.1: ¿Por qué este curso?

::: parrafo
Hola y **bienvenido**. Aquí puedes escribir Markdown normal:
listas, negritas, *cursivas*, [enlaces](https://ejemplo.com).
Se convierte a HTML al importar.
:::

::: tip variante=info
Este es un callout informativo. La variante puede ser \`info\`, \`warning\` o \`exito\`.
:::

## Sección 1.2: Tu primer quiz

::: quiz notaMinima=70 intentosMax=3
- enunciado: ¿Qué es un componente React?
  tipo: OPCION_UNICA
  opciones:
    - { texto: "Una función que devuelve UI", correcta: true }
    - { texto: "Un archivo CSS especial", correcta: false }
    - { texto: "Un endpoint del backend", correcta: false }
  explicacion: "Un componente React es una función que retorna JSX."

- enunciado: ¿React usa Virtual DOM?
  tipo: VERDADERO_FALSO
  correcta: true
  explicacion: "Sí, para optimizar re-renders."
:::

## Sección 1.3: Tu primer reto de código

::: codigo
lenguaje: javascript                 # javascript | typescript | python
enunciado: |
  Implementa una función \`sumar(a, b)\` que devuelva la suma de los dos.
esqueleto: |
  function sumar(a, b) {
    // tu código aquí
  }
solucion: |
  function sumar(a, b) {
    return a + b
  }
tests:
  - { descripcion: "suma básica", entrada: "2 3", esperada: "5", visible: true }
  - { descripcion: "negativos", entrada: "-1 1", esperada: "0", visible: true }
  - { descripcion: "caso oculto", entrada: "999 1", esperada: "1000", visible: false }
:::

# Módulo 2: Recursos y multimedia

## Sección 2.1: Materiales de apoyo

::: codigo_ilustrativo
lenguaje: typescript
descripcion: "Así se define un tipo en TypeScript."
codigo: |
  type Usuario = {
    id: string
    email: string
  }
:::

::: recurso
subtipo: enlace                       # enlace | adjunto
titulo: "Documentación oficial de React"
url: "https://react.dev"
descripcion: "Empieza por 'Learn React' si vienes de cero."
:::

::: video
proveedor: youtube                    # youtube | vimeo | loom | otro
url: "https://youtube.com/watch?v=abc123"
marcarAlPorcentaje: 90                # se marca completado al X% de reproducción
notas: "15 min. Mira hasta el minuto 12, lo demás es bonus."
:::
`
