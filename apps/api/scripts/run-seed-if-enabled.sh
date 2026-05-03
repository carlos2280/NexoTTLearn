#!/bin/sh
echo "[seed] RUN_SEED=$RUN_SEED"
if [ "$RUN_SEED" = "true" ]; then
  echo "[seed] Ejecutando prisma db seed..."
  pnpm exec prisma db seed
  echo "[seed] Ejecutando seed-curso-demo..."
  pnpm exec tsx scripts/seed-curso-demo.ts
  echo "[seed] Seeds completados."
else
  echo "[seed] Seed omitido (RUN_SEED != true)"
fi
