import { ApiError } from "@/shared/api/api-error"
import {
  type ExcelConfirmarResponse,
  type ExcelPreviewResponse,
  apiErrorBodySchema,
  excelConfirmarResponseSchema,
  excelPreviewResponseSchema,
} from "@nexott-learn/shared-types"

// =============================================================================
// EXCEL DIAGNOSTICO · plantilla / preview / confirmar
// PR 3b · usa fetch directo (no httpClient) por necesidades de blob+FormData.
// Endpoints autenticados: cookies se envian con credentials:"include".
// =============================================================================

const BASE = `${import.meta.env.VITE_API_URL ?? ""}/api`

const FILENAME_UTF8_REGEX = /filename\*=UTF-8''([^;]+)/i
const FILENAME_ASCII_REGEX = /filename="?([^";]+)"?/i

export interface DescargarPlantillaResult {
  readonly blob: Blob
  readonly filename: string
}

export async function descargarPlantillaApi(cursoId: string): Promise<DescargarPlantillaResult> {
  const r = await fetch(`${BASE}/admin/cursos/${cursoId}/diagnostico/excel/plantilla`, {
    credentials: "include",
  })
  if (!r.ok) {
    throw await mapearError(r)
  }
  const blob = await r.blob()
  const cd = r.headers.get("Content-Disposition") ?? ""
  const filename = parsearFilename(cd) ?? `plantilla-eval-inicial-${cursoId}.xlsx`
  return { blob, filename }
}

export async function previewExcelApi(
  cursoId: string,
  archivo: File,
): Promise<ExcelPreviewResponse> {
  const fd = new FormData()
  fd.append("archivo", archivo)
  const r = await fetch(`${BASE}/admin/cursos/${cursoId}/diagnostico/excel/preview`, {
    method: "POST",
    credentials: "include",
    body: fd,
  })
  if (!r.ok) {
    throw await mapearError(r)
  }
  return excelPreviewResponseSchema.parse(await r.json())
}

export async function confirmarExcelApi(
  cursoId: string,
  uploadId: string,
): Promise<ExcelConfirmarResponse> {
  const r = await fetch(`${BASE}/admin/cursos/${cursoId}/diagnostico/excel/confirmar`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ uploadId }),
  })
  if (!r.ok) {
    throw await mapearError(r)
  }
  return excelConfirmarResponseSchema.parse(await r.json())
}

async function mapearError(r: Response): Promise<ApiError> {
  try {
    const parsed = apiErrorBodySchema.safeParse(await r.json())
    if (parsed.success) {
      return new ApiError({
        status: r.status,
        code: parsed.data.code,
        message: parsed.data.message,
        fieldErrors: parsed.data.fieldErrors,
        retryAfter: parsed.data.retryAfter,
      })
    }
  } catch {
    // body no JSON
  }
  return new ApiError({ status: r.status, code: "INTERNAL", message: `Error ${r.status}` })
}

function parsearFilename(header: string): string | null {
  // Prioriza filename*=UTF-8''... (RFC 5987) y cae a filename="..." simple.
  const utf8 = FILENAME_UTF8_REGEX.exec(header)
  if (utf8?.[1]) {
    try {
      return decodeURIComponent(utf8[1])
    } catch {
      // fall-through
    }
  }
  const ascii = FILENAME_ASCII_REGEX.exec(header)
  return ascii?.[1] ?? null
}
