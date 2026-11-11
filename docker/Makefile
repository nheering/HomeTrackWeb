# HomeTrack Docker Makefile
# ==========================
# 
# Einfache Befehle fuer Docker-Operationen
# 
# usage: make <command>
# 
# Beispiel: make start

.PHONY: help start stop restart down ps logs shell db-shell db-reset db-dump db-restore clean

# Farbcodes fuer Ausgaben
GREEN := \033[0;32m
YELLOW := \033[1;33m
RED := \033[0;31m
NC := \033[0m # No Color

# Standard Docker Compose Befehl
DOCKER_COMPOSE := docker compose -f docker-compose.yml

help: ## Zeige diese Hilfe
	@echo "HomeTrack Docker Management"
	@echo "=========================="
	@echo ""
	@echo "Verfuegbare Befehle:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-20s$(NC) %s\n", $$1, $$2}'
	@echo ""

# ============================================================
# Docker Container Management
# ============================================================

start: ## Starte alle Container im Hintergrund
	@echo "$(YELLOW)▶️  Starte Docker Container...$(NC)"
	$(DOCKER_COMPOSE) up -d
	@echo "$(GREEN)✓ Container gestartet$(NC)"
	@make ps

stop: ## Stoppe alle Container
	@echo "$(YELLOW)⏹️  Stoppe Docker Container...$(NC)"
	$(DOCKER_COMPOSE) stop
	@echo "$(GREEN)✓ Container gestoppt$(NC)"

restart: ## Starte Container neu
	@echo "$(YELLOW)🔄  Restarte Docker Container...$(NC)"
	$(DOCKER_COMPOSE) restart
	@echo "$(GREEN)✓ Container neugestartet$(NC)"
	docker-compose -f docker-compose.yml ps

down: ## Stoppe und entferne Container
	@echo "$(YELLOW)⏹️  Stoppe und entferne Container...$(NC)"
	$(DOCKER_COMPOSE) down
	@echo "$(GREEN)✓ Container entfernt$(NC)"

ps: ## Zeige Status aller Container
	@echo "$(YELLOW)📊 Container Status:$(NC)"
	@$(DOCKER_COMPOSE) ps

logs: ## Zeige Logs aller Container
	@echo "$(YELLOW)📝 Container Logs (follow):$(NC)"
	$(DOCKER_COMPOSE) logs -f

logs-postgres: ## Zeige Logs von PostgreSQL
	@echo "$(YELLOW)📝 PostgreSQL Logs:$(NC)"
	$(DOCKER_COMPOSE) logs -f postgres

logs-postgraphile: ## Zeige Logs von PostGraphile
	@echo "$(YELLOW)📝 PostGraphile Logs:$(NC)"
	$(DOCKER_COMPOSE) logs -f postgraphile

# ============================================================
# Datenbank Operationen
# ============================================================

shell: ## Oeffne Shell im PostgreSQL Container
	@echo "$(YELLOW)🐳 Oeffne Shell im PostgreSQL Container$(NC)"
	docker exec -it hometrack-postgres sh

db-shell: ## Oeffne psql im PostgreSQL Container
	@echo "$(YELLOW)🐬 Oeffne PostgreSQL Shell$(NC)"
	docker exec -it hometrack-postgres psql -U hometrack_user -d hometrack_db

db-reset: ## Setze Datenbank zurueck (ACHTUNG: Alle Daten gehen verloren!)
	@echo "$(RED)⚠️  ACHTUNG: Alle Daten werden geloescht!$(NC)"
	@read -p "Möchtest du wirklich die Datenbank zurücksetzen? (y/n) " -n 1 -r
	@echo ""
	@if [ "$$REPLY" = "y" ]; then \
		$(DOCKER_COMPOSE) down -v; \
		$(DOCKER_COMPOSE) up -d; \
		@echo "$(GREEN)✓ Datenbank zurueckgesetzt$(NC)"; \
	else \
		@echo "$(YELLOW)✗ Abgebrochen$(NC)"; \
	fi

db-dump: ## Erstelle Backup der Datenbank
	@echo "$(YELLOW)💾 Erstelle Datenbank-Backup...$(NC)"
	@mkdir -p backups
	@docker exec hometrack-postgres pg_dump -U hometrack_user -d hometrack_db > backups/backup_$$(date +%Y-%m-%d_%H-%M-%S).sql
	@echo "$(GREEN)✓ Backup erstellt: backups/backup_$$(date +%Y-%m-%d_%H-%M-%S).sql$(NC)"

db-restore: ## Stelle Backup wieder her
	@echo "$(YELLOW)🔙 Stelle Datenbank aus Backup wieder her...$(NC)"
	@ls -1 backups/*.sql | tail -1 | xargs -I {} sh -c 'echo "$(YELLOW)Wiederherstellen von: {}$(NC)"; docker exec -i hometrack-postgres psql -U hometrack_user -d hometrack_db < {}'
	@echo "$(GREEN)✓ Backup wiederhergestellt$(NC)"

# ============================================================
# Bereinigung
# ============================================================

clean: down ## Stoppe Container und entferne Volumes
	@echo "$(YELLOW)🧹 Bereinige Docker-Umgebung...$(NC)"
	$(DOCKER_COMPOSE) down -v --rmi local
	@echo "$(GREEN)✓ Bereinigt$(NC)"

# ============================================================
# Dienst-spezifische Befehle
# ============================================================

pgadmin: ## Oeffne pgAdmin im Browser
	@echo "$(YELLOW)🌐 pgAdmin ist verfügbar unter:$(NC)"
	@echo "$(GREEN)  http://localhost:5050$(NC)"
	@echo "$(YELLOW)  Login: admin@hometrack.local / admin123$(NC)"

postgraphile: ## Oeffne PostGraphile GraphiQL im Browser
	@echo "$(YELLOW)🌐 PostGraphile GraphiQL ist verfügbar unter:$(NC)"
	@echo "$(GREEN)  http://localhost:5000/graphiql$(NC)"

# ============================================================
# Test-Verbindungen
# ============================================================

test-db: ## Teste Datenbankverbindung
	@echo "$(YELLOW)🔍 Teste PostgreSQL Verbindung...$(NC)"
	@docker exec -it hometrack-postgres psql -U hometrack_user -d hometrack_db -c "SELECT '✓ Datenbankverbindung OK' as status;"

test-api: ## Teste PostGraphile API
	@echo "$(YELLOW)🔍 Teste PostGraphile API...$(NC)"
	@curl -s -X POST http://localhost:5000/graphql \
		-H "Content-Type: application/json" \
		-d '{"query": "{ allVerbrauchstyps { nodes { id name } } }"}' | jq .

# ============================================================
# Info
# ============================================================

info: ## Zeige Verbindunginformationen
	@echo "$(YELLOW)📋 HomeTrack Docker Verbindunginformationen$(NC)"
	@echo ""
	@echo "$(GREEN)PostgreSQL:$(NC)"
	@echo "  Host: localhost"
	@echo "  Port: 5432"
	@echo "  Datenbank: hometrack_db"
	@echo "  Nutzer: hometrack_user"
	@echo "  Passwort: hometrack_pass"
	@echo ""
	@echo "$(GREEN)PostGraphile (GraphQL):$(NC)"
	@echo "  URL: http://localhost:5000/graphql"
	@echo "  GraphiQL: http://localhost:5000/graphiql"
	@echo ""
	@echo "$(GREEN)pgAdmin (Web-UI):$(NC)"
	@echo "  URL: http://localhost:5050"
	@echo "  Login: admin@hometrack.local / admin123"
	@echo ""
	@echo "$(GREEN)Verbindungsstring:$(NC)"
	@echo "  postgres://hometrack_user:hometrack_pass@localhost:5432/hometrack_db"
