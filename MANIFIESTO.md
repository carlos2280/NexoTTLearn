# Manifiesto Visual · NexoTT Learn

> El "norte" del producto. Lo que hacemos, lo que no hacemos, y por qué.
> Antes de añadir un color, una sombra, un gradiente o una animación,
> esta es la lectura obligatoria.

---

## El principio

**Menos es más. Cada elemento cumple su función o es basura.**

No diseñamos pantallas bonitas — diseñamos pantallas que comunican, que respetan al usuario, y que se hacen invisibles cuando dejan que el contenido brille. Si quitamos un elemento y la pantalla sigue cumpliendo su trabajo, ese elemento sobraba.

---

## Para quién

Nuestros usuarios son **colaboradores técnicos de 20 a 45 años con conocimientos avanzados**. Usan a diario Linear, Vercel, Stripe Dashboard, GitHub, Figma, Notion. Detectan lo barato en dos segundos. Reconocen lo bien hecho y se enganchan.

La consecuencia: **no podemos esconder lo mediocre detrás de gradientes**. La calidad se nota en la suma de mil detalles invisibles, no en un hero llamativo.

---

## La estética madre

Una mezcla deliberada, no un calco de ninguno:

- **Stripe** en el rigor sistémico y la limpieza luminosa.
- **Apple** en el espacio generoso y los momentos emocionales.
- **Linear** en el motion técnico que responde al usuario.
- **Vercel** en el rigor del minimalismo cuando toca.

El resultado no es ninguno de los cuatro: es NexoTT.

---

## Las tres capas de color

Tres familias que **nunca se mezclan**. Cada una tiene un trabajo distinto:

| Capa | Cuándo aparece | Color |
|---|---|---|
| **Marca** | Login, bienvenida, certificado, logro cumbre | Aurora (cyan → violet → magenta) — recurso escaso |
| **Acción** | CTAs primarios, focus de inputs, links | Índigo profundo — el caballo de batalla |
| **Feedback** | Errores, éxitos, advertencias, info | Semánticos (rojo, verde, ámbar, cyan) — sin marca |

**Antipatrón mortal**: usar la aurora en un banner de error. Pierde la semántica, pierde la urgencia, pierde la marca. Cada capa hace su trabajo.

---

## Los momentos del producto

Cada pantalla pertenece a uno de estos cuatro momentos. La identidad **modula** según el momento:

| Momento | Atmósfera |
|---|---|
| **Marca** (login, bienvenida) | Teatral. Aurora al máximo. Tipografía display. Motion cinematográfico. |
| **Trabajo** (bandeja, admin, cursos) | Calma editorial. Neutros + acento sobrio. Aire generoso. Jerarquía única. |
| **Técnico** (code playground, evaluación) | IDE moderno. Surface oscuro. Syntax con tinta de marca. Feedback con glow. |
| **Recompensa** (curso completado, certificado, apto para cliente) | Aurora como premio. Sensación de hito alcanzado. |

---

## Las 10 leyes inviolables

### 01 — Lo difícil no se nota
La sutileza tecnológica vive detrás. Cada animación, cada gradiente, cada token de espaciado. Si el usuario lo nota como "decoración", sobra. Si lo siente sin nombrarlo, está bien hecho.

### 02 — Una jerarquía por pantalla
Una sola cosa manda. Apple, Linear, Stripe siempre tienen UN punto focal por pantalla y el resto respira a su alrededor. Si todo pesa lo mismo, nada pesa.

### 03 — Aurora es recurso escaso
Solo aparece en 3-5 momentos cumbre de toda la app. Login. Bienvenida. CTA cumbre. Certificado. Listo para cliente. Nunca de fondo en cards de dashboard. Nunca en banners. Si la repetimos en cada pantalla, deja de ser premio.

### 04 — Tres capas que no se cruzan
Marca, acción y feedback tienen colores distintos y vidas distintas. Un veredicto "Apto" se ve en verde semántico, no en aurora. Un CTA cumbre va en aurora, no en índigo. Cada capa es lo que es.

### 05 — Tokens, nunca hex
Ningún `#abc123` en un componente. Si necesitas un color, gradiente o sombra que no existe, primero el token en `globals.css`, luego el uso. La identidad no se mantiene sola: se mantiene desde la fuente única.

### 06 — Variantes, no forks
Si necesitas un Button distinto, añade una variante al Button base. Nunca un `<button className="...">` ad-hoc imitando uno. Un solo lugar donde evolucionar.

### 07 — Cumplido se desvanece, pendiente respira
Lo que el usuario YA hizo no debe aplaudir. Se difumina (opacity baja, color secundario). Lo que falta es lo que llama la atención discretamente. La app no celebra cada paso — confía en el usuario.

### 08 — Motion responde, no decora
Cada animación es respuesta a una acción del usuario: hover, focus, click, mount, success. Animaciones decorativas en loop están prohibidas, salvo tres firmas específicas: aurora drift del login, pulse de "sistema activo", breathe del CTA cumbre.

### 09 — La marca vive en la suma
Ningún componente individual grita "NexoTT". Es la **combinación** de tipografía, espacio, motion, color y silencio lo que da identidad. Si un solo componente parece "demasiado de marca", probablemente está mal calibrado.

### 10 — Calidez profesional, sin emojis
Hablamos en serio, con calidez sobria. "Curso completado" — no "¡Genial! 🎉". "No pudimos guardar los cambios" — no "Oops 😅". Es producto interno corporativo de gente que se juega su carrera, no consumer app gamificada.

---

## Antipatrones cazados (lista viva)

Errores ya identificados y eliminados. Vivos como recordatorio:

- ❌ Barras de progreso decorativas con gradient aurora bajo un input. Aporta cero información.
- ❌ Chips coloridos con borde y bg para validación progresiva. Ruido visual que compite con el input.
- ❌ KPIs con chip de icono de color tipo Bootstrap 2014. Stripe pone número grande limpio + delta + sparkline. Nada más.
- ❌ Sidebar del mismo color que el canvas. Sin profundidad, sin firma de marca.
- ❌ Aurora plana en superficies grandes del dashboard. Pierde su valor de "premio".
- ❌ Cards repetidas con `border bg-surface p-4` copiada en cada pantalla. Tres dialectos visuales para la misma idea.
- ❌ Microcopy con emojis y "¡Oops!". Rompe la calidez profesional.
- ❌ Animaciones decorativas en loop fuera de los tres casos permitidos.
- ❌ Hex hardcoded fuera de `globals.css`.
- ❌ `React.FC` con children implícito.

---

## El sistema en una página

```
TOKENS           → apps/web/src/styles/globals.css (única fuente de verdad)
PLAYGROUND       → /playground (ruta dev, ver el sistema vivo)
COMPONENTES      → apps/web/src/shared/components/ui/
DOC IDENTIDAD    → OLD/CONVENCIONES-ALTA-CALIDAD/IDENTIDAD-VISUAL/
AGENTE GUARDIÁN  → .claude/agents/ui-design-advisor.md
```

---

## Cómo se aprueba un cambio visual

Antes de añadir cualquier color, gradiente, sombra, animación o componente, pasa por estas 5 preguntas:

1. **¿Soluciona un problema?** Si no, no entra.
2. **¿Existe ya un token / variante / patrón?** Si sí, úsalo. Si no, ¿de verdad falta o es un caso único?
3. **¿Encaja en una de las 3 capas de color?** Si no encaja, no es coherente.
4. **¿Compite con algo más en la pantalla?** Si sí, simplifica.
5. **¿Aporta o decora?** Si decora, fuera.

Si pasa las 5, adelante. Si falla en una, revisa.

---

## La firma final

> NexoTT Learn no es bonito por bonito. Su belleza comunica que el resultado importa: una entrevista con un cliente, una carrera que avanza, un colaborador que se prepara. Si una pantalla de "completado" se siente como un toast más, fallamos. Si se siente como recibir un sello, ganamos.

**Esta es la ley. Si dudas, vuelve aquí.**
