<!--
  Titulo del PR: usa formato Conventional Commits
  Ejemplo: feat(auth): pantalla de login completa
-->

## Resumen

<!-- 1-3 frases sobre QUE cambia y POR QUE. No el como (eso esta en el diff). -->

## Tipo de cambio

- [ ] `feat` — Nueva funcionalidad
- [ ] `fix` — Correccion de bug
- [ ] `refactor` — Sin cambio funcional
- [ ] `docs` — Solo documentacion
- [ ] `chore` / `build` / `ci` — Mantenimiento, deps, infra
- [ ] `test` — Tests
- [ ] **Breaking change** (marca `!` en el commit o `BREAKING CHANGE:` en footer)

## Alcance

<!-- Marca lo que aplica -->

- [ ] `apps/web`
- [ ] `apps/api`
- [ ] `packages/shared-types`
- [ ] BD / migraciones Prisma
- [ ] Documentacion
- [ ] Config / CI / hooks

## Como probar

<!--
  Pasos concretos para que el reviewer pueda validar.
  Ejemplo:
  1. make dev
  2. Ir a http://localhost:5173/login
  3. Login con admin@nexott.local / Admin1234!
  4. Verificar que redirige a /bandeja
-->

1.
2.
3.

## Checklist

- [ ] El titulo del PR sigue Conventional Commits.
- [ ] `make validate` pasa local (typecheck + lint + test).
- [ ] No hay `any`, `!`, `as`, `enum`, `@ts-ignore`.
- [ ] Codigo y commits en espanol.
- [ ] Si es UI: probado en navegador, sin regresiones visibles.
- [ ] Si toca BD: migracion creada y probada con `make db-migrate`.
- [ ] Si toca `nexott-ui`: la libreria local esta rebuildeada (`make lib-rebuild`).
- [ ] Documentacion actualizada si cambia comportamiento publico.

## Screenshots / video

<!-- Solo si aplica (cambios visuales). -->

## Notas para el reviewer

<!-- Decisiones de diseno controvertidas, alternativas descartadas, riesgos conocidos. -->

## Refs

<!-- Issues, tickets, conversaciones relacionadas. -->

Closes #
