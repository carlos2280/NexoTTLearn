# ═══════════════════════════════════════════════════════════
# NexoTT Learn — Makefile
# ─────────────────────────────────────────────────────────
# Uso: make <target>
# Lista targets: make help
# ═══════════════════════════════════════════════════════════

SHELL := /bin/bash
.DEFAULT_GOAL := help

# Colores para los echos
C_RESET := \033[0m
C_BOLD  := \033[1m
C_BLUE  := \033[34m
C_GREEN := \033[32m
C_YELLOW:= \033[33m
C_RED   := \033[31m

# Rutas
ROOT := $(shell pwd)

# ─────────────────────────────────────────────────────────
# Help
# ─────────────────────────────────────────────────────────

.PHONY: help
help: ## Muestra esta ayuda
	@printf "\n$(C_BOLD)NexoTT Learn — Comandos disponibles$(C_RESET)\n\n"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | grep -v "^#" | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(C_GREEN)%-18s$(C_RESET) %s\n", $$1, $$2}'
	@printf "\n"

# ─────────────────────────────────────────────────────────
# Setup
# ─────────────────────────────────────────────────────────

.PHONY: install
install: ## Instala dependencias del workspace
	@printf "$(C_BLUE)→ Instalando dependencias…$(C_RESET)\n"
	pnpm install

.PHONY: clean
clean: kill ## Limpia node_modules, dist y .turbo
	@printf "$(C_YELLOW)→ Limpiando node_modules, dist, .turbo…$(C_RESET)\n"
	rm -rf node_modules apps/*/node_modules packages/*/node_modules
	rm -rf apps/*/dist packages/*/dist
	rm -rf .turbo apps/*/.turbo packages/*/.turbo
	@printf "$(C_GREEN)✓ Limpio$(C_RESET)\n"

# ─────────────────────────────────────────────────────────
# Base de datos
# ─────────────────────────────────────────────────────────

.PHONY: db-up
db-up: ## Levanta Postgres en Docker
	@printf "$(C_BLUE)→ Levantando Postgres…$(C_RESET)\n"
	docker compose up -d postgres
	@printf "$(C_GREEN)✓ Postgres listo en localhost:5435$(C_RESET)\n"

.PHONY: db-down
db-down: ## Detiene Postgres
	@printf "$(C_YELLOW)→ Deteniendo Postgres…$(C_RESET)\n"
	docker compose down

.PHONY: sandbox-up
sandbox-up: ## Levanta Piston (sandbox de codigo) e instala JS/TS/Python
	@printf "$(C_BLUE)→ Levantando Piston…$(C_RESET)\n"
	docker compose up -d piston
	@printf "$(C_BLUE)→ Esperando healthy…$(C_RESET)\n"
	@for i in $$(seq 1 30); do \
	  if curl -sf http://localhost:2000/api/v2/runtimes > /dev/null 2>&1; then break; fi; \
	  sleep 1; \
	done
	@printf "$(C_BLUE)→ Instalando runtimes (idempotente)…$(C_RESET)\n"
	@for pkg in '{"language":"node","version":"20.11.1"}' '{"language":"typescript","version":"5.0.3"}' '{"language":"python","version":"3.12.0"}'; do \
	  curl -s -X POST http://localhost:2000/api/v2/packages -H "Content-Type: application/json" -d "$$pkg" > /dev/null; \
	done
	@printf "$(C_GREEN)✓ Piston listo en localhost:2000$(C_RESET)\n"
	@curl -s http://localhost:2000/api/v2/runtimes | head -c 200; echo

.PHONY: sandbox-down
sandbox-down: ## Detiene Piston
	@printf "$(C_YELLOW)→ Deteniendo Piston…$(C_RESET)\n"
	docker compose stop piston

.PHONY: db-migrate
db-migrate: ## Aplica migraciones Prisma
	pnpm db:migrate

.PHONY: db-seed
db-seed: ## Ejecuta seed (curso 'Frontend para devs backend' + 3 admins + 10 participantes)
	pnpm db:seed

.PHONY: db-seed-fresh
db-seed-fresh: ## ⚠ Reset destructivo + migrate + seed (entorno limpio en un comando)
	@printf "$(C_RED)⚠  Esto borrará TODOS los datos y volverá a sembrar desde cero.$(C_RESET)\n"
	cd apps/api && pnpm exec prisma migrate reset --force --skip-seed
	cd apps/api && pnpm db:seed
	@printf "$(C_GREEN)✓ BD sembrada. Levanta la app con 'make dev'.$(C_RESET)\n"

.PHONY: db-studio
db-studio: ## Abre Prisma Studio
	pnpm db:studio

.PHONY: db-reset
db-reset: ## Reset completo de la BD (⚠ destructivo)
	@printf "$(C_RED)⚠  Esto borrará TODOS los datos.$(C_RESET)\n"
	@read -p "¿Continuar? [y/N] " confirm && [ "$$confirm" = "y" ]
	cd apps/api && pnpm exec prisma migrate reset --force

# ─────────────────────────────────────────────────────────
# Dev servers
# ─────────────────────────────────────────────────────────

.PHONY: dev
dev: kill ## Levanta web + api en paralelo (foreground)
	@printf "$(C_BLUE)→ Levantando web + api…$(C_RESET)\n"
	pnpm dev

.PHONY: dev-fresh
dev-fresh: kill vite-cache-clear ## Levanta dev con cache de Vite limpio
	@printf "$(C_BLUE)→ Levantando web + api con cache limpio…$(C_RESET)\n"
	pnpm dev

.PHONY: dev-web
dev-web: ## Levanta solo el frontend (Vite, localhost:5173)
	pnpm dev:web

.PHONY: dev-api
dev-api: ## Levanta solo el backend (Nest, localhost:4000)
	pnpm dev:api

.PHONY: vite-cache-clear
vite-cache-clear: ## Limpia el cache de pre-bundling de Vite
	@printf "$(C_YELLOW)→ Limpiando cache de Vite…$(C_RESET)\n"
	@rm -rf apps/web/node_modules/.vite
	@printf "$(C_GREEN)✓ Cache de Vite limpio$(C_RESET)\n"

# ─────────────────────────────────────────────────────────
# Procesos
# ─────────────────────────────────────────────────────────

.PHONY: kill
kill: ## Mata todos los procesos dev del proyecto (web + api)
	@printf "$(C_YELLOW)→ Matando procesos NexoTTLearn…$(C_RESET)\n"
	@pgrep -f "nest start --watch" | grep -v $$$$ | xargs -r kill -9 2>/dev/null || true
	@pgrep -f "node.*vite/bin/vite.js" | grep -v $$$$ | xargs -r kill -9 2>/dev/null || true
	@pgrep -f "turbo-linux.*dev" | grep -v $$$$ | xargs -r kill -9 2>/dev/null || true
	@pgrep -f "node.*NexoTTLearn/apps/api/dist" | grep -v $$$$ | xargs -r kill -9 2>/dev/null || true
	@sleep 1
	@printf "$(C_GREEN)✓ Procesos terminados$(C_RESET)\n"

.PHONY: ps
ps: ## Lista procesos dev del proyecto
	@printf "$(C_BLUE)Procesos NexoTTLearn activos:$(C_RESET)\n"
	@ps aux | grep -E "nest start|vite |turbo dev|NexoTTLearn/apps" | grep -v grep | grep -v claude || echo "  (ninguno)"

.PHONY: ports
ports: ## Muestra qué procesos ocupan los puertos del proyecto
	@printf "$(C_BLUE)Puertos del proyecto:$(C_RESET)\n"
	@echo "  5173 (web), 5174 (web fallback), 4000 (api), 5435 (postgres)"
	@ss -tlnp 2>/dev/null | grep -E ":5173|:5174|:4000|:5435" || echo "  (todos libres)"

# ─────────────────────────────────────────────────────────
# Calidad
# ─────────────────────────────────────────────────────────

.PHONY: lint
lint: ## Corre Biome check
	pnpm lint

.PHONY: lint-fix
lint-fix: ## Corre Biome con auto-fix
	pnpm dlx @biomejs/biome@1.9.4 check --write .

.PHONY: typecheck
typecheck: ## Typecheck de todo el workspace
	pnpm exec tsc --noEmit -p apps/web
	pnpm exec tsc --noEmit -p apps/api
	pnpm exec tsc --noEmit -p packages/shared-types

.PHONY: test
test: ## Corre tests del workspace
	pnpm test

.PHONY: build
build: ## Build de producción
	pnpm build

.PHONY: validate
validate: typecheck lint test ## typecheck + lint + test (CI gate)
	@printf "$(C_GREEN)✓ Validación completa$(C_RESET)\n"

# ─────────────────────────────────────────────────────────
# Atajos compuestos
# ─────────────────────────────────────────────────────────

.PHONY: setup
setup: install db-up db-migrate db-seed ## Setup completo de cero (install + db + seed)
	@printf "$(C_GREEN)✓ Setup completo. Ahora 'make dev'$(C_RESET)\n"

.PHONY: fresh
fresh: kill clean install ## Limpieza profunda + reinstalar (sin tocar BD)
	@printf "$(C_GREEN)✓ Reinstalado en limpio$(C_RESET)\n"

.PHONY: status
status: ps ports ## Muestra estado completo (procesos + puertos)
