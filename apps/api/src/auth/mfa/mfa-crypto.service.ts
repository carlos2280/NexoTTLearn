import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto"
import { Injectable, OnModuleInit } from "@nestjs/common"

const ALGO = "aes-256-gcm"
const IV_LENGTH = 12
const AUTH_TAG_LENGTH = 16

/**
 * MfaCryptoService — Cifrado at-rest del secreto TOTP.
 *
 * Estrategia: AES-256-GCM con clave derivada de MFA_ENCRYPTION_KEY (env).
 * El payload almacenado en BD es: base64(iv | authTag | ciphertext).
 */
@Injectable()
export class MfaCryptoService implements OnModuleInit {
  private key!: Buffer

  onModuleInit(): void {
    const raw = process.env.MFA_ENCRYPTION_KEY
    if (!raw || raw.length < 32) {
      throw new Error("MFA_ENCRYPTION_KEY debe tener al menos 32 caracteres")
    }
    this.key = createHash("sha256").update(raw).digest()
  }

  encrypt(plaintext: string): string {
    const iv = randomBytes(IV_LENGTH)
    const cipher = createCipheriv(ALGO, this.key, iv)
    const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()])
    const authTag = cipher.getAuthTag()
    return Buffer.concat([iv, authTag, ciphertext]).toString("base64")
  }

  decrypt(payload: string): string {
    const buffer = Buffer.from(payload, "base64")
    const iv = buffer.subarray(0, IV_LENGTH)
    const authTag = buffer.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH)
    const ciphertext = buffer.subarray(IV_LENGTH + AUTH_TAG_LENGTH)

    const decipher = createDecipheriv(ALGO, this.key, iv)
    decipher.setAuthTag(authTag)
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8")
  }
}
