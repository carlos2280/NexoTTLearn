# Flujo de Autenticacion — NexoTT Learn

> Documento de referencia del sistema completo de autenticacion: login,
> lockout, MFA TOTP (setup + verify), cambio de password, audit log,
> pantallas de exito intersticiales y manejo de errores tipados.
>
> Ultima actualizacion: 2026-05-02 (sesion: pantallas de exito + mobile brand)

---

## 1. Vision general

El flujo auth tiene cinco pantallas (cuatro de input + una intersticial de
exito) y un audit log:

```
                              ┌─────────────────┐
                              │  /login         │  (publica)
                              │  email + pass   │
                              └────────┬────────┘
                                       │
                ┌──────────────────────┼──────────────────────┐
                │                      │                      │
        ACCOUNT_LOCKED        status="ok"               mfaRequired
                │                      │                      │
                ▼                      ▼                      │
        Pantalla locked         Sesion creada                 │
        (countdown)             ↓                             │
        en /login               ¿debeCambiarPassword?         │
                                Si → /cambiar-password        │
                                No → bandeja segun rol        │
                                                              │
                ┌─────────────────────────────────────────────┤
                │                                             │
        status="mfa-setup"                          status="mfa-verify"
        (mfaConfirmadoEn=null)                      (mfaConfirmadoEn=fecha)
                │                                             │
                ▼                                             ▼
        ┌───────────────────────┐               ┌──────────────────────┐
        │  /login/mfa (setup)   │               │  /login/mfa (verify) │
        │  QR + secret manual   │               │  Solo TOTP 6 digitos │
        │  TOTP confirmacion    │               │                      │
        └───────────┬───────────┘               └─────────┬────────────┘
                    │                                     │
        POST confirm-mfa-setup                  POST verify-mfa
        - valida code                           - valida code
        - mfaConfirmadoEn=now                   - inicia sesion
        - inicia sesion
                    │                                     │
                    ▼                                     ▼
        ┌──────────────────────────┐         ┌──────────────────────────┐
        │ AuthSuccessScreen 1.8s   │         │ AuthSuccessScreen 1.8s   │
        │ "MFA activado"           │         │ "Acceso verificado"      │
        │ "Tu cuenta, tu fortaleza"│         │ "Bienvenido de vuelta"   │
        └──────────────┬───────────┘         └──────────────┬───────────┘
                       │                                    │
                       └──────────────┬─────────────────────┘
                                      ▼
                           ¿debeCambiarPassword?
                           Si → /cambiar-password
                                  ↓ (POST cambiar-password OK)
                                  AuthSuccessScreen 1.8s
                                  "Contrasena actualizada"
                                  "Todo listo para empezar"
                                  ↓
                           No → bandeja segun rol
```

> Las pantallas intersticiales `AuthSuccessScreen` no son un paso del backend:
> son del cliente, mantienen el `NxtLayoutAuth` y reemplazan el slot del
> formulario por `NxtSuccessMark` durante 1.8s antes del navigate.

---

## 2. Estados de un Usuario

Un usuario en `usuarios` tiene tres flags que controlan el flujo:

| Campo | Valores | Significado |
|-------|---------|-------------|
| `mfaEnabled` | bool | Admin lo controla. Si `true`, el usuario debe pasar MFA en login. |
| `mfaConfirmadoEn` | datetime nullable | Si `null` y `mfaEnabled=true`: primer login MFA → flujo SETUP. Si fecha: ya configuro → flujo VERIFY. |
| `debeCambiarPassword` | bool | Si `true`: tras autenticar (con o sin MFA), forzar `/cambiar-password`. |
| `bloqueadoHasta` | datetime nullable | Si fecha futura: cuenta bloqueada por 5 intentos fallidos. Lockout de 15 min. |

**Decision:** MFA es **opcional**, lo controla el admin. No hay UI publica para que un usuario se active MFA por su cuenta. En FASE 5 (futura) el admin tendra UI para flagear `mfaEnabled` por usuario.

---

## 3. Login (`POST /auth/login`)

### Request
```json
{ "email": "user@dominio.com", "password": "..." }
```

### Validaciones backend
1. Schema Zod: email valido, password no vacio
2. Usuario existe y `activo=true`
3. No esta bloqueado (`bloqueadoHasta` no es futuro)
4. Password coincide (bcrypt)

### Respuestas (discriminadas por `status`)

**Login OK sin MFA**
```json
{ "status": "ok", "usuario": { ... } }
```
La sesion ya esta creada. Cookie `nexott.sid` se setea.

**Login OK con MFA — primer login (setup)**
```json
{
  "status": "mfa-setup",
  "challengeId": "...",
  "emailEnmascarado": "ja***z@nttdata.com",
  "secret": "JBSWY3DPEHPK3PXP",
  "otpauthUri": "otpauth://totp/NexoTT%20Learn:user@..."
}
```
El secret y el URI **solo** se devuelven en este caso. Header `Cache-Control: no-store`.
La sesion **no** esta creada todavia.

**Login OK con MFA — verify**
```json
{
  "status": "mfa-verify",
  "challengeId": "...",
  "emailEnmascarado": "ja***z@nttdata.com"
}
```
La sesion **no** esta creada todavia. El cliente debe llamar `/auth/verify-mfa`.

### Errores

| Codigo HTTP | `code` | Cuando |
|------------|--------|--------|
| 401 | `INVALID_CREDENTIALS` | Email no existe, inactivo, o password incorrecta |
| 423 | `ACCOUNT_LOCKED` | Cuenta bloqueada. Body incluye `retryAfter: number` (segundos) |

Tras 5 intentos fallidos consecutivos: la cuenta se bloquea 15 min y se devuelve `ACCOUNT_LOCKED`.

---

## 4. MFA Setup (primer login con MFA habilitado)

### `POST /auth/login` retorna `status: "mfa-setup"`

El backend hace lo siguiente, en orden:

1. Verifica que `mfaEnabled=true && mfaConfirmadoEn=null`
2. Genera **un nuevo secret** TOTP con `otplib.generateSecret()` — RFC 6238 estandar
3. **Cifra** el secret con AES-256-GCM (clave derivada de `MFA_ENCRYPTION_KEY`)
4. **Sobrescribe** `mfaSecret` en BD (regenera si el usuario abandona y vuelve)
5. Crea un challengeId con TTL 5min, single-use
6. Genera el URI `otpauth://...` con `otplib.generateURI()` — issuer `"NexoTT Learn"`
7. Registra `MFA_SETUP_INICIADO` en `auth_eventos`
8. Devuelve secret + URI + challengeId al frontend (UNA vez)

### Frontend en `/login/mfa` (modo setup)

1. Lee `pending-mfa-store` desde sessionStorage
2. Genera QR como SVG inline desde `otpauthUri` con `qrcode` lib
3. Muestra: shield icon + QR + secret copiable + TOTP input
4. Usuario escanea con Google Authenticator/Authy/1Password
5. Ingresa codigo de 6 digitos → auto-submit por evento `nxt-totp-complete`

### `POST /auth/confirm-mfa-setup`

```json
{ "challengeId": "...", "code": "123456" }
```

Backend:
1. Valida challenge (no expirado, existe)
2. Recupera `mfaSecret` cifrado, descifra
3. Verifica codigo TOTP con `otplib.verify()` — window ±1 step (90s)
4. Si OK: marca `mfaConfirmadoEn=now`, registra `MFA_ACTIVADO`, invalida challenge
5. Si falla: registra `MFA_FALLIDO`, devuelve `MFA_INVALID` (con intentos restantes) o `MFA_EXPIRED` (si supero 5 intentos)
6. Crea sesion via `req.login()` y devuelve `{ usuario }`

Tras esto, los logins futuros van por la rama VERIFY.

---

## 5. MFA Verify (logins posteriores con MFA ya configurado)

### Frontend en `/login/mfa` (modo verify)

Solo muestra: shield icon + email enmascarado pill + TOTP input.
**No** muestra secret ni QR (ya escaneado).

### `POST /auth/verify-mfa`

```json
{ "challengeId": "...", "code": "123456" }
```

Backend:
1. Valida challenge
2. Verifica codigo TOTP contra el secret descifrado
3. Si OK: registra `MFA_VERIFICADO`, crea sesion, registra `LOGIN_OK` (metadata: `via: "mfa"`)
4. Si falla: mismo manejo que setup (`MFA_FALLIDO` + intentos)

---

## 6. Cambio de password (`POST /auth/cambiar-password`)

Requiere sesion activa (cookie). Schema:
```json
{ "passwordActual": "...", "passwordNuevo": "...", "confirmacion": "..." }
```

Reglas password (Zod en `shared-types/src/auth.ts`):
- Min 8 chars
- Al menos 1 mayuscula, 1 minuscula, 1 numero
- Nuevo != actual
- Confirmacion == nuevo

Backend:
1. Verifica password actual con bcrypt
2. Hashea nuevo con bcrypt 12 rounds
3. Limpia `intentosFallidos` y `bloqueadoHasta`
4. Marca `debeCambiarPassword=false`, `passwordCambiadoEn=now`
5. Registra `PASSWORD_CAMBIADO` en `auth_eventos`

---

## 7. Errores tipados (shared-types)

Todos los errores HTTP de la API tienen el mismo body:
```json
{
  "code": "INVALID_CREDENTIALS",
  "message": "Credenciales invalidas",
  "retryAfter": 600,            // opcional
  "fieldErrors": { ... }         // opcional
}
```

Codigos definidos en `packages/shared-types/src/api-errors.ts`:

| Codigo | Status | Cuando |
|--------|--------|--------|
| `VALIDATION_ERROR` | 400 | Schema Zod falla, fieldErrors describe que falto |
| `INVALID_CREDENTIALS` | 401 | Login con email/pass incorrectos |
| `ACCOUNT_LOCKED` | 423 | 5+ intentos fallidos. retryAfter en body |
| `ACCOUNT_INACTIVE` | 401 | Cuenta desactivada |
| `MFA_REQUIRED` | (no se usa como error, es flow control) | — |
| `MFA_INVALID` | 401 | Codigo TOTP incorrecto, quedan intentos |
| `MFA_EXPIRED` | 410 | Challenge expirado o supero 5 intentos |
| `PASSWORD_CHANGE_REQUIRED` | (flow control, no error) | — |
| `UNAUTHORIZED` | 401 | Sin sesion |
| `FORBIDDEN` | 403 | Rol incorrecto |
| `NOT_FOUND` | 404 | — |
| `CONFLICT` | 409 | — |
| `INTERNAL` | 500 | Error inesperado |

Todos pasan por `ApiExceptionFilter` global que normaliza la respuesta.

---

## 8. Cifrado del secret MFA at-rest

Implementado en `MfaCryptoService`:

- **Algoritmo:** AES-256-GCM
- **Clave:** SHA-256(`MFA_ENCRYPTION_KEY` env var) — debe ser min 32 chars
- **IV:** 12 bytes random por cifrado
- **Auth tag:** 16 bytes (GCM)
- **Almacenamiento BD:** base64(iv | authTag | ciphertext) en `usuarios.mfa_secret`
- **Comparaciones:** `crypto.timingSafeEqual` (resistente a timing attacks)

Si `MFA_ENCRYPTION_KEY` no esta configurada, el modulo falla al iniciar (fail-fast).

---

## 9. Challenge en memoria (MfaChallengeService)

Store en memoria (no Redis todavia) con TTL 5min.

| Operacion | Detalle |
|-----------|---------|
| `crear(usuarioId)` | Genera ID con `randomBytes(32).toString("base64url")` |
| `obtener(id)` | Devuelve null si no existe o expiro (auto-purge al leer) |
| `registrarIntentoFallido(id)` | +1 al contador. A los 5: invalida e devuelve false |
| `invalidar(id)` | Borra del store |

**Limitacion conocida:** no soporta multi-instancia. Para produccion con > 1 replica:
migrar a Redis con la misma API. La interfaz ya es async-friendly.

---

## 10. Audit log (auth_eventos)

Tabla `auth_eventos` registra todos los eventos auth. Siempre se intenta escribir;
si falla, se loguea pero **no bloquea** el flujo de auth.

### Eventos registrados

| Tipo | Cuando | Datos extra |
|------|--------|-------------|
| `LOGIN_OK` | Login exitoso (con o sin MFA) | metadata: `{via: "mfa"}` si fue por MFA |
| `LOGIN_FALLIDO` | Email no existe, inactivo, o password incorrecta | metadata: `{motivo}` |
| `LOGIN_BLOQUEADO` | Cuenta bloqueada (5 intentos o ya bloqueada) | metadata: `{motivo}` |
| `MFA_SETUP_INICIADO` | Se genera secret nuevo para setup | — |
| `MFA_ACTIVADO` | confirm-mfa-setup OK | — |
| `MFA_VERIFICADO` | verify-mfa OK | — |
| `MFA_FALLIDO` | Codigo TOTP incorrecto | metadata: `{contexto: "setup"\|"verify", quedanIntentos}` |
| `PASSWORD_CAMBIADO` | cambiar-password OK | — |
| `LOGOUT` | logout OK con sesion activa | — |

### Datos comunes
- `usuarioId` (nullable: login fallido sin usuario valido)
- `email` (para casos sin usuario)
- `ip` (extraida de `req.ip` con `trust proxy 1`)
- `userAgent` (max 500 chars)
- `creadoEn`

### Indices
- `(usuarioId, creadoEn)` — para query "ultimos eventos de este usuario"
- `(tipo, creadoEn)` — para query "todos los LOGIN_BLOQUEADO recientes"

### NO registrar nunca
- Passwords (ni en plain ni hashed)
- mfaSecret (ni cifrado ni en plain)
- challengeIds (son tokens single-use)
- Sesiones

---

## 11. Medidas de seguridad activas

| Medida | Donde |
|--------|-------|
| Lockout 5 intentos / 15 min | `auth.service.ts` |
| Email enmascarado en respuestas MFA | `enmascararEmail()` |
| AES-256-GCM cifrado at-rest del secret | `MfaCryptoService` |
| Challenge single-use con TTL 5min | `MfaChallengeService` |
| Rate limit 5 intentos por challenge | `MfaChallengeService` |
| Setup window 5min (mismo TTL) | Heredado del challenge |
| Regenerar secret en cada entrada al setup | `MfaService.iniciarSetup` |
| Headers `Cache-Control: no-store` en respuestas con secret | controller |
| Cero logging del secret | nunca pasa por Logger |
| Audit log resiliente (no bloquea auth) | `AuthEventosService` |
| Window TOTP ±1 step (90s) | `verify({...})` default de otplib |
| `crypto.timingSafeEqual` para comparaciones | `MfaCryptoService` |
| Validacion Zod en boundaries | shared-types schemas |
| ApiExceptionFilter normaliza errores (no leak stacktraces) | `apps/api/src/common/errors/` |

---

## 12. Frontend — store y guards

### `pendingMfaStore` (sessionStorage)

Discriminated union persistido durante el flow de MFA:

```ts
type PendingMfa =
  | { mode: "verify", challengeId, emailEnmascarado, iniciadoEn }
  | { mode: "setup", challengeId, emailEnmascarado, secret, otpauthUri, iniciadoEn }
```

- Se valida con Zod al leer (defensivo: si esta corrupto, se borra)
- TTL 5min: si pasa, `get()` devuelve null
- Se limpia al confirmar/verificar/cancelar

### Guards de ruta

| Guard | Que hace |
|-------|----------|
| `GuardSesion` | Si no hay usuario en `useUsuarioActual`, redirect a `/login` |
| `GuardCambioPassword` | Si `usuario.debeCambiarPassword=true`, redirect a `/cambiar-password` |
| `GuardRol rol="ADMIN"` | Si rol no es ADMIN, redirect a bandeja participante |

### `/login/mfa` — guard inline

- Si hay sesion → ya autenticado, redirect a ruta post-login
- Si no hay `pendingMfa` → redirect a `/login`
- Bifurca por `pending.mode`: `MfaSetupForm` vs `MfaForm`

---

## 13. Componentes frontend

### Paginas y formularios

| Archivo | Que hace |
|---------|----------|
| `LoginPage` | Si hay sesion, redirige. Si no, layout auth + LoginForm |
| `LoginForm` | Email + pass. Bifurca a setup/verify segun response. Estado locked inline |
| `LoginLocked` | Pantalla locked con countdown (`useCountdown`) y link a recuperar |
| `MfaPage` | Bifurca por `success`/`pending.mode`: SuccessScreen, SetupForm o Form |
| `MfaSetupForm` | QR + secret pill copiable + TOTP confirmacion. Notifica `onSuccess` al padre |
| `MfaForm` | Email pill + TOTP verify. Notifica `onSuccess` al padre |
| `RecuperarPasswordPage` | Layout auth + RecuperarInfo (informativa, sin form) |
| `CambiarPasswordPage` | Bifurca: si hay `destinoExito`, SuccessScreen; si no, form |
| `CambiarPasswordForm` | 3 inputs password con toggle. Notifica `onSuccess` al padre |

### Componentes compartidos (`apps/web/src/features/auth/components/`)

| Archivo | Que hace |
|---------|----------|
| `AuthSuccessScreen` | Pantalla intersticial que envuelve `NxtLayoutAuth` + `NxtSuccessMark`. Ejecuta `onComplete` tras `durationMs` (default 1800 desde `AUTH_TIMINGS.successScreenDuration`). Reusable en MFA y password-change |
| `AuthHydrationLoader` | Loader minimalista (logo Nx con breathing) para `isLoading`. Solo aparece tras `AUTH_TIMINGS.hydrationLoaderDelay` (150ms) para evitar flash en cache hits |

### Constantes (`apps/web/src/features/auth/constants/`)

| Archivo | Contenido |
|---------|-----------|
| `timings.ts` | `successScreenDuration: 1800`, `hydrationLoaderDelay: 150`. Parametrizable |

### Patron de mutations con SuccessScreen

Para que el SuccessScreen sea visible, los hooks de mutation
(`useVerifyMfa`, `useConfirmMfaSetup`, `useCambiarPassword`) aceptan un
callback `onSuccess` que se invoca **antes** de actualizar/invalidar la
cache del usuario. Si se hiciera despues del `await mutateAsync`, las
guardas (`if (usuario)` o `if (!usuario.debeCambiarPassword)`) redirigirian
antes de que el `setState` del exito aplicara.

Todos usan `NxtLayoutAuth` de `@carlos2280/nexott-ui`. Cero CSS custom.

---

## 14. Endpoints

```
POST /auth/login                    LoginInput → LoginResult (discriminado)
POST /auth/verify-mfa               { challengeId, code } → { usuario }
POST /auth/confirm-mfa-setup        { challengeId, code } → { usuario }
POST /auth/cambiar-password         CambiarPasswordInput → 204 No Content
POST /auth/logout                   → 204 No Content
GET  /auth/me                       → UsuarioPublico (requiere sesion)
```

Todos los POST que tocan secretos llevan `Cache-Control: no-store`.

---

## 15. Configuracion necesaria

`apps/api/.env` debe tener:

```env
DATABASE_URL=postgresql://...
SESSION_SECRET=<min 32 chars>
MFA_ENCRYPTION_KEY=<min 32 chars, recomendado: openssl rand -base64 48>
WEB_ORIGIN=http://localhost:5173
NODE_ENV=development
```

Sin `MFA_ENCRYPTION_KEY`, el modulo MFA no inicializa y la API falla al arrancar.

---

## 16. Scripts de desarrollo

```bash
# Resetear todo a estado inicial (admin y participante con primer-login)
pnpm db:seed

# Habilitar MFA en el participante de seed (sin secret, dispara flujo SETUP)
pnpm --filter @nexott-learn/api db:setup-mfa-test

# Logs de auth en BD
pnpm --filter @nexott-learn/api db:studio
# Tabla: auth_eventos
```

---

## 17. Testeo manual del flujo completo

1. `pnpm db:seed` → ambos usuarios `debeCambiarPassword=true`
2. `pnpm db:setup-mfa-test` → participante `mfaEnabled=true`, sin secret
3. Reiniciar API (toma `MFA_ENCRYPTION_KEY` y endpoints nuevos)
4. Browser incognito → `/login`
5. Email: `participante@nexott.local`, Password: `Participante1234!`
6. → `/login/mfa` muestra QR + secret
7. Escanear con Google Authenticator (issuer "NexoTT Learn")
8. Ingresar codigo de 6 digitos → auto-submit
9. → **AuthSuccessScreen 1.8s**: "MFA activado" / "Tu cuenta, tu fortaleza."
10. → `/cambiar-password` (porque `debeCambiarPassword=true`)
11. Cambiar password
12. → **AuthSuccessScreen 1.8s**: "Contrasena actualizada" / "Todo listo para empezar."
13. → `/bandeja` (rol participante)
14. Logout, volver a entrar
15. Esta vez `mfaConfirmadoEn != null` → flujo VERIFY (solo TOTP, sin QR)
16. Ingresar codigo → **AuthSuccessScreen 1.8s**: "Acceso verificado" / "Bienvenido de vuelta."
17. → `/bandeja`

Verificar en `auth_eventos`:
- `LOGIN_OK` (con `via: mfa`)
- `MFA_SETUP_INICIADO`
- `MFA_ACTIVADO`
- `PASSWORD_CAMBIADO`
- `LOGOUT`
- `MFA_VERIFICADO`

---

## 18. Lo que falta (FASEs siguientes)

Ver [PROXIMOS-PASOS-AUTH.md](./PROXIMOS-PASOS-AUTH.md) para detalle de:

- FASE 5: panel admin para reset password + activar/desactivar MFA + ver auth_eventos
- Hardening posterior: throttler global, perfil con eventos propios, notificaciones email
- Mejoras pendientes en `nexott-ui`: breathing en loading (button), shake en error (totp), `nx-shield-check` en sprite

**Ya hechas en sesiones anteriores:**
- FASE 4: pantalla `/recuperar-password` informativa  ✅
- `nxt-success-mark` componente + integracion en flujos auth (post-MFA, post-password)  ✅
- `AuthHydrationLoader` para `isLoading`  ✅
- `NxtLayoutAuth` mobile-brand header  ✅
