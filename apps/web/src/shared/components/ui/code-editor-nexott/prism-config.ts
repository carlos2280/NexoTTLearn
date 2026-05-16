import Prism from "prismjs"
import "prismjs/components/prism-bash"
import "prismjs/components/prism-c"
import "prismjs/components/prism-cpp"
import "prismjs/components/prism-csharp"
import "prismjs/components/prism-go"
import "prismjs/components/prism-java"
import "prismjs/components/prism-json"
import "prismjs/components/prism-markdown"
import "prismjs/components/prism-python"
import "prismjs/components/prism-rust"
import "prismjs/components/prism-sql"
import "prismjs/components/prism-typescript"
import "prismjs/components/prism-yaml"

/**
 * Mapeo de los IDs de lenguaje internos al nombre que Prism usa para sus
 * grammars. Los lenguajes que NO se importan arriba (default Prism: markup,
 * css, clike, javascript) usan los del core.
 */
const LENGUAJE_A_PRISM: Record<string, string> = {
  typescript: "typescript",
  javascript: "javascript",
  python: "python",
  java: "java",
  csharp: "csharp",
  cpp: "cpp",
  go: "go",
  rust: "rust",
  sql: "sql",
  bash: "bash",
  json: "json",
  yaml: "yaml",
  markdown: "markdown",
  html: "markup",
  css: "css",
  otro: "markup",
}

/**
 * Devuelve HTML con tokens de syntax envueltos en `<span class="token X">`
 * que después globals.css colorea via `--color-syntax-*`.
 */
export function highlightCodigo(code: string, lenguaje: string): string {
  const prismLang = LENGUAJE_A_PRISM[lenguaje] ?? "markup"
  const grammar = Prism.languages[prismLang]
  if (!grammar) {
    return code
  }
  return Prism.highlight(code, grammar, prismLang)
}

export const LENGUAJE_LABEL: Record<string, string> = {
  typescript: "TypeScript",
  javascript: "JavaScript",
  python: "Python",
  java: "Java",
  csharp: "C#",
  cpp: "C++",
  go: "Go",
  rust: "Rust",
  sql: "SQL",
  bash: "Bash",
  json: "JSON",
  yaml: "YAML",
  html: "HTML",
  css: "CSS",
  markdown: "Markdown",
  otro: "Texto",
}
