#!/bin/sh
if [ "$RUN_SEED" = "true" ]; then
  echo "[seed] RUN_SEED=true — ejecutando prisma db seed..."
  pnpm exec prisma db seed
  echo "[seed] Ejecutando seed-curso-demo..."
  pnpm exec tsx scripts/seed-curso-demo.ts
  echo "[seed] Seeds completados."
fi
