import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto"
import { Injectable } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { AppEnv } from "../../config/env.validation"

const ALGORITMO = "aes-256-gcm" as const
const LONGITUD_KEY_BYTES = 32
const LONGITUD_IV_BYTES = 12
const LONGITUD_TAG_BYTES = 16
const LONGITUD_MINIMA_PAYLOAD = LONGITUD_IV_BYTES + LONGITUD_TAG_BYTES

/**
 * CifradoService — AES-256-GCM (D-MFA-1).
 *
 * Cifra payloads sensibles para almacenarlos en BD. Hoy lo usa solo `MfaService`
 * para `Usuario.mfaSecret`, manana cualquier campo equivalente (token de Resend
 * en `ConfiguracionSistema`, etc.).
 *
 * Formato persistido: base64( iv || ciphertext || tag ).
 *  - IV (12 bytes) generado al azar por cada cifrado. NUNCA se reusa.
 *  - Tag de autenticacion (16 bytes) vincula iv+ciphertext: si se modifica un
 *    byte del payload, `desencriptar()` lanza.
 *
 * La clave maestra (32 bytes) viene de `SECRETS_ENCRYPTION_KEY`, validada al
 * arranque por `env.validation.ts` (64 hex chars + refine prod != placeholder).
 *
 * Logs: este service NO logea ni el plaintext ni el payload cifrado. El caller
 * tampoco debe hacerlo.
 */
@Injectable()
export class CifradoService {
  private readonly key: Buffer

  constructor(configService: ConfigService<AppEnv, true>) {
    const hexKey = configService.get("SECRETS_ENCRYPTION_KEY", { infer: true })
    const buffer = Buffer.from(hexKey, "hex")
    if (buffer.length !== LONGITUD_KEY_BYTES) {
      throw new Error(
        `SECRETS_ENCRYPTION_KEY debe ser ${LONGITUD_KEY_BYTES} bytes (${LONGITUD_KEY_BYTES * 2} hex chars).`,
      )
    }
    this.key = buffer
  }

  encriptar(plaintext: string): string {
    const iv = randomBytes(LONGITUD_IV_BYTES)
    const cipher = createCipheriv(ALGORITMO, this.key, iv)
    const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()])
    const tag = cipher.getAuthTag()
    return Buffer.concat([iv, ciphertext, tag]).toString("base64")
  }

  desencriptar(payload: string): string {
    const buf = Buffer.from(payload, "base64")
    if (buf.length < LONGITUD_MINIMA_PAYLOAD) {
      throw new Error("Payload cifrado invalido: longitud insuficiente.")
    }
    const iv = buf.subarray(0, LONGITUD_IV_BYTES)
    const tag = buf.subarray(buf.length - LONGITUD_TAG_BYTES)
    const ciphertext = buf.subarray(LONGITUD_IV_BYTES, buf.length - LONGITUD_TAG_BYTES)
    const decipher = createDecipheriv(ALGORITMO, this.key, iv)
    decipher.setAuthTag(tag)
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8")
  }
}
