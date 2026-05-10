---
description: Reglas React específicas de NexoTTLearn (apps/web).
paths:
  - "apps/web/src/**/*.ts"
  - "apps/web/src/**/*.tsx"
---

# NexoTTLearn — Reglas React

## Convenciones canónicas

Heredadas del paraguas: ver `../../.claude/rules/react-web.md` y documentos en `../../OLD/CONVENCIONES-ALTA-CALIDAD/REACT-TYPESCRIPT/`.

## Específicas del proyecto

- **Paquete**: `@nexott-learn/web`.
- **Puerto dev**: 5173.
- **Bundler**: Vite 5.
- **Datos**: Tanstack Query con cliente HTTP en `shared/api/http-client.ts`.
- **Forms**: validación con Zod, schemas co-ubicados con la página/feature.
- **Rutas**: react-router-dom; constantes en `shared/constants/rutas.ts`.
- **Comandos**:
  - Dev: `make dev-web` o `pnpm dev:web`.
  - Typecheck: `pnpm --filter @nexott-learn/web typecheck`.
  - Tests: `pnpm --filter @nexott-learn/web test`.
  - Cache de Vite: `make vite-cache-clear`.

## Estructura `apps/web/src/`

```
src/
├── app/             ← bootstrap (providers globales, router raíz)
├── pages/           ← una carpeta por ruta
│   └── <pagina>/
│       ├── components/
│       ├── hooks/
│       ├── <pagina>.page.tsx
│       └── <pagina>.types.ts
├── features/        ← lógica de dominio reusable entre páginas
│   └── <dominio>/
│       ├── api/
│       ├── hooks/
│       ├── components/
│       └── types.ts
├── shared/          ← infraestructura genérica
│   ├── api/
│   ├── components/
│   ├── hooks/
│   ├── lib/
│   └── constants/
└── styles/
```

Para crear una página: skill `/nueva-pagina-react <nombre>`.

## Antes de PR que toque web/

1. `make validate`.
2. Invocar agente `react-reviewer`.
3. Si toca formularios o auth, validar Zod schema y guardas de ruta.
