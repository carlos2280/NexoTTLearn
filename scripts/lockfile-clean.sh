#!/usr/bin/env bash
# Regenera pnpm-lock.yaml limpio (sin overrides de .pnpmfile.cjs local).
# Uso: pnpm lockfile:clean
set -euo pipefail

cd "$(dirname "$0")/.."

PNPMFILE=".pnpmfile.cjs"
BACKUP=".pnpmfile.cjs.local-tmp"

# Si NODE_AUTH_TOKEN no esta exportado, intentar leerlo de ~/.npmrc
if [[ -z "${NODE_AUTH_TOKEN:-}" ]]; then
  if [[ -f "$HOME/.npmrc" ]]; then
    TOKEN=$(grep -E "^//npm\.pkg\.github\.com/:_authToken=" "$HOME/.npmrc" | head -1 | cut -d'=' -f2-)
    if [[ -n "$TOKEN" ]]; then
      export NODE_AUTH_TOKEN="$TOKEN"
    fi
  fi
fi

if [[ -z "${NODE_AUTH_TOKEN:-}" ]]; then
  echo "❌ NODE_AUTH_TOKEN no esta disponible (ni en env ni en ~/.npmrc)."
  echo "   Configuralo con: npm config set //npm.pkg.github.com/:_authToken=<TU_PAT>"
  exit 1
fi

# Desactivar override local si existe
RESTORE=false
if [[ -f "$PNPMFILE" ]]; then
  mv "$PNPMFILE" "$BACKUP"
  RESTORE=true
fi

# Restaurar siempre, incluso si pnpm falla
trap '[[ "$RESTORE" == "true" ]] && mv "$BACKUP" "$PNPMFILE"' EXIT

echo "→ Regenerando pnpm-lock.yaml limpio..."
pnpm install --lockfile-only

# Verificar que el lockfile quedo limpio
if grep -qE "file:/(home|Users|root)|^pnpmfileChecksum:" pnpm-lock.yaml; then
  echo "❌ El lockfile sigue conteniendo rutas locales tras la regeneracion."
  exit 1
fi

echo "✓ Lockfile limpio."
