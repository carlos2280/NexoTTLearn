# Proximos pasos — Sistema de autenticacion

> Continuacion del trabajo en flujo auth. Cada FASE es independiente y dejable
> en una sesion. Orden recomendado pero no obligatorio.
>
> Estado actual al cierre de sesion 2026-05-02:
> - FASE 1: errores tipados + locked  ✅
> - FASE 2: MFA backend (TOTP, crypto, challenges)  ✅
> - FASE 3: MFA frontend verify  ✅
> - FASE 3.5: MFA setup-on-first-login + audit log  ✅
> - FASE 4: recuperar password informativa  ✅
> - Pantallas de exito (post-MFA, post-password) + loader de hidratacion  ✅
> - `nxt-success-mark` en libreria + integracion en auth  ✅
> - `NxtLayoutAuth` mobile-brand header  ✅
> - FASE 5: admin reset password + UI MFA + auth events  ⏳ (pendiente)
> - Hardening: throttler, perfil eventos, email notifications  ⏳ (pendiente)
> - Mejoras nexott-ui restantes: breathing loading, shake error  ⏳ (pendiente)

---

## FASE 4 — Pantalla "Recuperar contrasena" informativa  ✅ IMPLEMENTADA

> Implementada en sesion 2026-05-02. Archivos creados:
> - `apps/web/src/pages/recuperar-password/recuperar-password.page.tsx`
> - `apps/web/src/pages/recuperar-password/components/recuperar-info.tsx`
> - Ruta registrada en `apps/web/src/app/router/routes.tsx`

### Objetivo
Cuando un usuario hace click en "Olvidaste tu contrasena?" en `/login`,
mostrarle una pantalla informativa indicando que debe contactar al admin.
**No hay email todavia, no hay tokens de reset.**

### Por que asi
- Sin servicio SMTP/Resend configurado
- Mas seguro: sin tokens en URL ni vector de phishing por email
- El admin reset (FASE 5) cubre el caso real

### Trabajo

```
apps/web/src/pages/recuperar-password/
  ├── recuperar-password.page.tsx       NUEVO
  └── components/
      └── recuperar-info.tsx             NUEVO (opcional, page puede ir directo)
```

### Diseño UI

Reusar `NxtLayoutAuth` con:
- Hero title: "Recupera el acceso"
- Hero subtitle: "Tu administrador puede reestablecer tu contrasena."
- Manifesto: "Aqui estamos para ayudarte."

Form panel (sin form, solo informativo):
- `NxtIcon name="info"` o `name="shield"` con `spectrum`
- H2: "Necesitas ayuda?"
- P: "Por seguridad, los reseteos de contrasena los gestiona tu administrador. Contacta a tu admin para reestablecer tu acceso."
- Pill con email del admin (configurable en env `VITE_ADMIN_CONTACT_EMAIL`)
- Boton secundario `mailto:` (abre cliente de email)
- Link "Volver al login"

### Archivos a tocar

- Crear `apps/web/src/pages/recuperar-password/recuperar-password.page.tsx`
- `apps/web/src/app/router/routes.tsx` → registrar ruta publica `RUTAS.recuperarPassword`
- `apps/web/.env.local` (o vite config) → añadir `VITE_ADMIN_CONTACT_EMAIL`

### Aceptacion
- Click en "Olvidaste tu contrasena?" en `/login` lleva a `/recuperar-password`
- La pantalla sigue el ADN visual (NxtLayoutAuth, espectro, etc.)
- Link `mailto:` funciona
- "Volver al login" regresa a `/login`

---

## FASE 5 — Panel admin: reset password + MFA toggle + auth events

### Objetivo
El admin debe poder gestionar usuarios desde `/admin/personas`:
1. Resetear contrasena → genera password temporal aleatoria, marca `debeCambiarPassword=true`
2. Toggle MFA → activa/desactiva `mfaEnabled` (resetea `mfaSecret` y `mfaConfirmadoEn`)
3. Ver auth_eventos del usuario (lista paginada)

### 5.1 — Reset password admin

**Backend**

```
apps/api/src/admin/personas/personas.module.ts          NUEVO
apps/api/src/admin/personas/personas.controller.ts      NUEVO
apps/api/src/admin/personas/personas.service.ts         NUEVO
apps/api/src/app.module.ts                              registrar PersonasModule
```

Endpoint:
```
POST /admin/personas/:id/reset-password
  Guard: SesionGuard + GuardRol("ADMIN")
  Response: { passwordTemporal: "..." }  (UNA vez, no se almacena)
```

Logica:
1. Generar password temporal: `crypto.randomBytes(12).toString("base64").slice(0, 16)`
2. Hashear con bcrypt 12 rounds
3. Update usuario: `passwordHash`, `debeCambiarPassword=true`, `intentosFallidos=0`, `bloqueadoHasta=null`
4. Registrar `PASSWORD_CAMBIADO` en `auth_eventos` con `metadata: { por: "admin", adminId }`
5. Devolver password temporal al admin (mostrar UNA vez con boton copiar)

**Frontend**

```
apps/web/src/pages/admin/personas/                              NUEVO
  ├── personas.page.tsx                                          (lista)
  ├── components/
  │   └── reset-password-modal.tsx                               (NxtConfirmDialog + result)
  └── hooks/
      └── use-resetear-password.ts

apps/web/src/features/admin-personas/api/
  └── resetear-password.api.ts                                   NUEVO
```

UI:
- Boton "Resetear contrasena" en row de cada usuario
- Click → `NxtConfirmDialog` con texto "Esto generara una password temporal. El usuario debera cambiarla en su proximo login. Continuar?"
- Confirmar → POST → mostrar la password en modal con boton copiar al clipboard
- Modal con warning: "Solo se mostrara una vez. Transmite la password al usuario por canal seguro (Teams, llamada). No quedara registrada."

### 5.2 — Toggle MFA admin

**Backend**

```
POST /admin/personas/:id/mfa
  Body: { enabled: boolean }
  Response: { usuario }
```

Logica:
- Si `enabled=true`: `mfaEnabled=true`, `mfaSecret=null`, `mfaConfirmadoEn=null` (forzar setup en proximo login)
- Si `enabled=false`: `mfaEnabled=false`, `mfaSecret=null`, `mfaConfirmadoEn=null`
- Registrar evento `MFA_ACTIVADO` o nuevo `MFA_DESACTIVADO` (añadir al enum)

**Frontend**

- `NxtSwitch` en perfil del usuario en panel admin
- Confirmacion antes de cambiar
- Toast de exito

### 5.3 — Vista de auth_eventos

**Backend**

```
GET /admin/personas/:id/auth-eventos?page=1&limit=20
  Response: { eventos: AuthEvento[], total, page, totalPages }
```

**Frontend**

- Tab "Actividad" en perfil del usuario
- `NxtTable` con columnas: tipo (con badge de color por severity), fecha, IP, user-agent
- Filtros: por tipo, por rango de fecha
- Paginacion con `NxtPagination`

### Aceptacion FASE 5
- Admin puede resetear password desde panel y la password se transmite OOB
- Admin puede activar/desactivar MFA por usuario
- Admin puede ver historial de eventos auth de un usuario
- Todos los eventos quedan en `auth_eventos` con `metadata.por="admin"`
- Cero break del flujo existente

---

## Hardening (cuando haya tiempo)

### H1 — Rate limit global por IP

**Problema:** sin rate limit pre-autenticacion, un atacante puede probar miles de
emails/passwords sin pasar por el lockout (que es por usuario).

**Solucion:** `@nestjs/throttler`

```bash
pnpm --filter @nexott-learn/api add @nestjs/throttler
```

Config:
- 10 requests por minuto por IP en `/auth/login`
- 30 requests por minuto por IP en `/auth/*`
- Excluir endpoints autenticados (`/auth/me`, `/auth/cambiar-password`)

### H2 — Notificaciones email

Cuando se integre servicio de email (Resend, SES, etc.):

Eventos a notificar al email del usuario:
- `MFA_ACTIVADO` → "MFA activado en tu cuenta. Si no fuiste tu, contacta soporte."
- `PASSWORD_CAMBIADO` → "Tu contrasena fue cambiada el {fecha}."
- `LOGIN_BLOQUEADO` → "Tu cuenta fue bloqueada por intentos fallidos."
- `LOGIN_OK` desde IP/UA nueva → "Nuevo inicio de sesion desde {ip}, {ua}"

Implementacion:
- Servicio `EmailNotificationService` en `apps/api/src/notifications/`
- Hook en `AuthEventosService.registrar()` que dispara emails segun tipo
- Templates en `apps/api/src/notifications/templates/`

### H3 — Perfil del usuario: ver eventos propios

`GET /usuarios/me/auth-eventos` (sin parametro de id, usa la sesion)

UI en `/perfil`:
- Tab "Seguridad" con lista de eventos propios
- "Ultima vez desde {ip} el {fecha}"
- Boton "Cerrar todas las otras sesiones" (requiere migrar challenge store + sessions a Redis)

### H4 — Migrar challenge store a Redis

**Problema:** `MfaChallengeService` usa `Map` en memoria. No funciona con > 1 instancia.

**Solucion:**
- Mantener la misma API (ya es async-friendly)
- Implementar adapter Redis con TTL nativo
- Switch via env: `CHALLENGE_STORE=memory|redis`

### H5 — Backup codes para MFA

Cuando un usuario pierde acceso a su Authenticator:

- Generar 10 codes de 8 chars al confirmar setup MFA
- Mostrar UNA vez (descarga PDF o copy/paste)
- Hashear cada code con bcrypt en BD
- Cada code single-use, marcar `usadoEn`
- Endpoint `POST /auth/verify-mfa-backup-code` con misma respuesta que verify

### H6 — Forzar MFA por rol o por flag de organizacion

Cuando el negocio lo requiera:
- Flag `forzar_mfa_admins` a nivel organizacion
- Si admin entra sin MFA: redirect forzado a `/perfil/seguridad/setup-mfa`

---

## Mejoras nexott-ui (componentes y efectos)

### M1 — `nxt-success-mark` (NUEVO componente)  ✅ IMPLEMENTADO

> Implementado en sesion 2026-05-02 con scope ampliado respecto a la spec
> original.

**Donde:** `nexott-ui/src/core/components/feedback/nxt-success-mark.ts`

**Que hace:** Checkmark animado con stroke-dasharray + halo decorativo.
Auto-trigger al montarse via `connectedCallback`.

**Props finales (mas amplias que la spec original):**
- `size`: `sm` (40px) | `md` (72px) | `lg` (112px)
- `tone`: `brand` (espectro violet→indigo→cyan) | `emerald` (success canonico)
- `label`: texto principal
- `sublabel`: texto secundario
- `glow`: glow inferior espectral (default `true`)
- `autoplay`: anima al montar (default `true`)

**ADN checklist 7/7:** espectro (gradiente brand), profundidad (ghost border),
spring (dramatic), materialize, feedback emocional (firma del logro),
breathing (halo pulsa una vez), a11y (`role="status"`, reduced-motion).

**Story:** 8 casos en `Core/Feedback/SuccessMark` (Default, MfaSuccess,
PasswordChanged, FormSaved, Sizes, Tones, NoGlow, ManualPlay).

**Integracion en NexoTT Learn:**
- `apps/web/src/features/auth/components/auth-success-screen.tsx` — pantalla
  intersticial reutilizable que envuelve `NxtLayoutAuth` + `NxtSuccessMark`.
- `apps/web/src/features/auth/components/auth-hydration-loader.tsx` — loader
  minimalista mientras `useUsuarioActual` hidrata.
- `apps/web/src/features/auth/constants/timings.ts` — `successScreenDuration:
  1800` y `hydrationLoaderDelay: 150`, parametrizables.
- Aplicado en `mfa.page.tsx` (post-MFA verify y setup) y
  `cambiar-password.page.tsx` (post-password-change).
- Bug de timing resuelto: callbacks de mutations ahora se invocan en el
  `onSuccess` interno (antes de actualizar la cache del usuario), si no las
  guardas redirigian antes de que el setState aplicara.

### M2 — `nxt-button` con breathing en loading

**Problema actual:** Cuando `loading=true`, el boton pierde el glow espectro.
Se siente "muerto" durante la verificacion (visible en login y MFA).

**Solucion:** En `nxt-button.ts`, cuando `loading=true`, mantener el glow y
añadir clase `.animate-breathe` (3s loop suave).

### M3 — `nxt-totp` shake + reset visual en error

**Problema actual:** En `state="error"` solo cambia el color del helper. No se
siente que algo paso. El usuario podria no notar el error.

**Solucion:**
1. En `state="error"`: aplicar `.animate-shake` (8 LOC nuevo en animations.css)
2. Auto-reset del valor visual con animacion (cells vuelven a vacio en 200ms)
3. Re-focus en el primer cell

### M4 — `nx-shield-check` icon en sprite

**Donde:** `nexott-ui/src/core/shared/iconos.ts`

Variante de `shield` con check interno. Util para "MFA verificada" status indicator.

### M5 — Verificar `nxt-empty` mood="error"

Confirmar que el ring del icono tenga el rojo correcto en dark/light. Si no,
ajustar tokens en `nxt-empty.ts`.

### M6 — Micro: `nxt-icon name="copy"` ya existe ✅

Verificado en sprite. No falta nada para el QR pill copiable.

---

## Documentacion pendiente

- Actualizar `docs/ARQUITECTURA.md` con seccion "Sistema de autenticacion"
- En CLAUDE.md (si existe), añadir referencia a `AUTH-FLOW.md`
- Diagrama de secuencia del flujo MFA (mermaid o similar) para onboarding

---

## Estado de la libreria nexott-ui — items abiertos

Lista consolidada de cambios sugeridos en sesiones de auth:

| # | Item | Estado | Prioridad | Esfuerzo |
|---|------|--------|-----------|----------|
| 1 | `nxt-success-mark` (nuevo componente) | ✅ hecho | — | ~250 LOC + story |
| 2 | `NxtLayoutAuth` mobile-brand header | ✅ hecho | — | ~30 LOC |
| 3 | `nxt-button` mantener glow en loading + breathing | ⏳ abierto | Media | ~10 LOC |
| 4 | `nxt-totp` shake + reset visual en error | ⏳ abierto | Media | ~20 LOC |
| 5 | `nx-shield-check` en sprite | ⏳ abierto | Baja | 5 min |
| 6 | Verificar `nxt-empty mood="error"` ring color | ⏳ abierto | Baja | 10 min |

Estos items no bloquean el flujo de auth pero lo elevan de "funcional" a
"profesional pulido".

---

## Para retomar en otra sesion

1. Lee este archivo y `AUTH-FLOW.md`
2. Verifica estado actual: `pnpm typecheck && pnpm lint`
3. Si vas por FASE 4: arranca por la pantalla informativa, no requiere backend
4. Si vas por FASE 5: empieza por el reset password (mas pequeño, autocontenido)
5. Si vas por hardening: empieza por throttler (cambio puntual, alto valor)

Comandos utiles:
```bash
# Reset todo a estado inicial
pnpm db:seed

# Activar MFA en participante para testing
pnpm --filter @nexott-learn/api db:setup-mfa-test

# Ver eventos auth en BD
pnpm --filter @nexott-learn/api db:studio
```
