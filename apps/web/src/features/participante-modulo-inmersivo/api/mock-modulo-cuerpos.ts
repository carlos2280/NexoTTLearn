// Tiptap JSON for the LECTURA blocks of the mock. Split from the main mock
// file to keep both under ~150 lines and to keep editorial content easy to
// review. F2 enriches these docs with the full rich-content set: blockquote,
// link, task list, table, image, code-block (lowlight), horizontal-rule,
// colored text, highlight, textAlign, super/subscript.

import type { TiptapJSONDoc } from "@nexott-learn/shared-types"

export const CUERPO_INTRO: TiptapJSONDoc = {
  type: "doc",
  content: [
    {
      type: "heading",
      attrs: { level: 2, textAlign: "center" },
      content: [{ type: "text", text: "Estrategias de Branching modernas" }],
    },
    {
      type: "paragraph",
      attrs: { textAlign: "center" },
      content: [
        {
          type: "text",
          marks: [{ type: "italic" }, { type: "textStyle", attrs: { color: "#a8a4b8" } }],
          text: "Una guia practica para equipos que ya sienten el dolor de integrar tarde.",
        },
      ],
    },
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "El modelo de ",
        },
        {
          type: "text",
          marks: [{ type: "bold" }, { type: "textStyle", attrs: { color: "#7c3aed" } }],
          text: "feature branches",
        },
        {
          type: "text",
          text: " es la estrategia mas usada en equipos modernos. Cada funcionalidad se desarrolla en una rama independiente que se integra al tronco mediante ",
        },
        {
          type: "text",
          marks: [
            {
              type: "link",
              attrs: { href: "https://docs.github.com/en/pull-requests", target: "_blank" },
            },
          ],
          text: "pull requests",
        },
        { type: "text", text: "." },
      ],
    },
    {
      type: "blockquote",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "El objetivo no es la rama: es el merge. Toda rama que vive demasiado se vuelve deuda.",
            },
          ],
        },
      ],
    },
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "Las ramas siguen un patron predecible. Los nombres mas comunes son:",
        },
      ],
    },
    {
      type: "bulletList",
      content: [
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  marks: [{ type: "code" }],
                  text: "feature/NXL-123-add-login-form",
                },
              ],
            },
          ],
        },
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  marks: [{ type: "code" }],
                  text: "bugfix/NXL-456-fix-null-pointer",
                },
              ],
            },
          ],
        },
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  marks: [{ type: "code" }],
                  text: "hotfix/NXL-789-security-patch",
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}

export const CUERPO_DETALLE: TiptapJSONDoc = {
  type: "doc",
  content: [
    {
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text", text: "Git Flow vs Trunk-Based" }],
    },
    {
      type: "paragraph",
      content: [
        { type: "text", text: "Existen dos filosofias dominantes. " },
        {
          type: "text",
          marks: [{ type: "highlight", attrs: { color: "#fde68a" } }],
          text: "Git Flow",
        },
        {
          type: "text",
          text: " trabaja con ramas main, develop, release y hotfix; util cuando hay multiples versiones en produccion. ",
        },
        {
          type: "text",
          marks: [{ type: "highlight", attrs: { color: "#a7f3d0" } }],
          text: "Trunk-Based Development",
        },
        {
          type: "text",
          text: " integra todo rapido a una sola rama main, con ramas que viven menos de 24 horas.",
        },
      ],
    },
    {
      type: "image",
      attrs: {
        src: "https://picsum.photos/seed/branching/1200/600",
        alt: "Pizarra con flujos de ramas",
      },
    },
    {
      type: "heading",
      attrs: { level: 3 },
      content: [{ type: "text", text: "Comparativa rapida" }],
    },
    {
      type: "table",
      content: [
        {
          type: "tableRow",
          content: [
            {
              type: "tableHeader",
              content: [{ type: "paragraph", content: [{ type: "text", text: "Dimension" }] }],
            },
            {
              type: "tableHeader",
              content: [{ type: "paragraph", content: [{ type: "text", text: "Git Flow" }] }],
            },
            {
              type: "tableHeader",
              content: [{ type: "paragraph", content: [{ type: "text", text: "Trunk-Based" }] }],
            },
          ],
        },
        {
          type: "tableRow",
          content: [
            {
              type: "tableCell",
              content: [
                { type: "paragraph", content: [{ type: "text", text: "Versiones vivas" }] },
              ],
            },
            {
              type: "tableCell",
              content: [{ type: "paragraph", content: [{ type: "text", text: "Multiples" }] }],
            },
            {
              type: "tableCell",
              content: [{ type: "paragraph", content: [{ type: "text", text: "Una" }] }],
            },
          ],
        },
        {
          type: "tableRow",
          content: [
            {
              type: "tableCell",
              content: [{ type: "paragraph", content: [{ type: "text", text: "Ciclo deploy" }] }],
            },
            {
              type: "tableCell",
              content: [
                { type: "paragraph", content: [{ type: "text", text: "Semanal/mensual" }] },
              ],
            },
            {
              type: "tableCell",
              content: [
                { type: "paragraph", content: [{ type: "text", text: "Diario o continuo" }] },
              ],
            },
          ],
        },
      ],
    },
    {
      type: "heading",
      attrs: { level: 3 },
      content: [{ type: "text", text: "Ejemplo de hook pre-push" }],
    },
    {
      type: "codeBlock",
      attrs: { language: "typescript" },
      content: [
        {
          type: "text",
          // biome-ignore lint/nursery/noSecrets: editorial code sample, not a credential.
          text: 'import { execSync } from "node:child_process"\n\nfunction blockPushIfRedTests(): void {\n  const result = execSync("pnpm test --silent").toString()\n  if (result.includes("FAIL")) {\n    console.error("Push bloqueado: tests en rojo")\n    process.exit(1)\n  }\n}\n\nblockPushIfRedTests()',
        },
      ],
    },
  ],
}

export const CUERPO_CIERRE: TiptapJSONDoc = {
  type: "doc",
  content: [
    {
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text", text: "Cuando elegir cada estrategia" }],
    },
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "No hay respuesta universal. Si las tres dimensiones apuntan al continuo (una version, deploy diario, tests solidos) trunk-based gana. Si empujan a discreto, Git Flow tiene mas sentido aunque introduzca mas ceremonia.",
        },
      ],
    },
    {
      type: "horizontalRule",
    },
    {
      type: "heading",
      attrs: { level: 3 },
      content: [{ type: "text", text: "Checklist antes de migrar" }],
    },
    {
      type: "taskList",
      content: [
        {
          type: "taskItem",
          attrs: { checked: true },
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "CI verde sostenido durante 2 semanas." }],
            },
          ],
        },
        {
          type: "taskItem",
          attrs: { checked: true },
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "Cobertura de tests por encima del 70%." }],
            },
          ],
        },
        {
          type: "taskItem",
          attrs: { checked: false },
          content: [
            {
              type: "paragraph",
              content: [
                { type: "text", text: "Plataforma de feature flags (ej. " },
                {
                  type: "text",
                  marks: [{ type: "code" }],
                  text: "growthbook",
                },
                { type: "text", text: ") integrada." },
              ],
            },
          ],
        },
        {
          type: "taskItem",
          attrs: { checked: false },
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "Rollback automatico verificado en staging." }],
            },
          ],
        },
      ],
    },
    {
      type: "paragraph",
      content: [
        { type: "text", text: "Nota: la complejidad crece con O(n" },
        { type: "text", marks: [{ type: "superscript" }], text: "2" },
        { type: "text", text: ") cuando hay multiples release branches activas. Para CO" },
        { type: "text", marks: [{ type: "subscript" }], text: "2" },
        { type: "text", text: " del equipo (reuniones, sync) conviene minimizarlas." },
      ],
    },
  ],
}
