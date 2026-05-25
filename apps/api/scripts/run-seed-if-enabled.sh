#!/bin/sh
# Ejecuta el seed solo cuando RUN_SEED_ON_DEPLOY=true.
# Idempotente: el seed esta disenado para correr varias veces sin duplicar datos.
# Uso desde Railway (apps/api/railway.toml):
#   ... && sh scripts/run-seed-if-enabled.sh && ...
set -e

if [ "$RUN_SEED_ON_DEPLOY" = "true" ]; then
  echo "[seed] RUN_SEED_ON_DEPLOY=true -> ejecutando pnpm db:seed"
  pnpm db:seed
else
  echo "[seed] RUN_SEED_ON_DEPLOY!=true -> skip"
fi
