#!/bin/bash
# ========================================
# Doctor Auto AI — Deploy Script (VPS)
# ========================================
# Usage: ./scripts/deploy.sh [first-run|update|restart|status|logs]

set -euo pipefail

PROJECT_DIR="/opt/doctor-auto-ai"
COMPOSE_FILE="docker-compose.prod.yml"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log() { echo -e "${GREEN}[deploy]${NC} $1"; }
warn() { echo -e "${YELLOW}[deploy]${NC} $1"; }
err() { echo -e "${RED}[deploy]${NC} $1"; }

# --- Commands ---

first_run() {
  log "First-time setup..."

  # Check prerequisites
  if ! command -v docker &>/dev/null; then
    err "Docker not found. Install: curl -fsSL https://get.docker.com | sh"
    exit 1
  fi

  if ! command -v docker compose &>/dev/null; then
    err "Docker Compose not found."
    exit 1
  fi

  # Check .env.production
  if [ ! -f "$PROJECT_DIR/.env.production" ]; then
    err ".env.production not found. Copy from .env.production template and fill in values."
    exit 1
  fi

  # Build dashboard
  log "Building dashboard..."
  cd "$PROJECT_DIR/dashboard"
  npm ci
  npm run build
  cd "$PROJECT_DIR"

  # Start all services
  log "Starting services..."
  docker compose -f "$COMPOSE_FILE" up -d --build

  log "Waiting for services to be healthy..."
  sleep 10

  # Check health
  status

  log "Deploy complete!"
}

update() {
  log "Updating Doctor Auto AI..."
  cd "$PROJECT_DIR"

  # Pull latest code
  git pull origin master

  # Rebuild dashboard
  log "Building dashboard..."
  cd "$PROJECT_DIR/dashboard"
  npm ci
  npm run build
  cd "$PROJECT_DIR"

  # Rebuild and restart containers
  log "Rebuilding containers..."
  docker compose -f "$COMPOSE_FILE" up -d --build

  log "Waiting for services..."
  sleep 10

  status
  log "Update complete!"
}

restart() {
  log "Restarting services..."
  cd "$PROJECT_DIR"
  docker compose -f "$COMPOSE_FILE" restart
  sleep 5
  status
}

status() {
  log "Service status:"
  cd "$PROJECT_DIR"
  docker compose -f "$COMPOSE_FILE" ps

  echo ""
  log "Health check:"
  curl -s http://localhost:3001/api/health | python3 -m json.tool 2>/dev/null || warn "Gateway not responding"
}

show_logs() {
  local service="${1:-}"
  cd "$PROJECT_DIR"
  if [ -n "$service" ]; then
    docker compose -f "$COMPOSE_FILE" logs -f --tail=100 "$service"
  else
    docker compose -f "$COMPOSE_FILE" logs -f --tail=50
  fi
}

stop() {
  warn "Stopping all services..."
  cd "$PROJECT_DIR"
  docker compose -f "$COMPOSE_FILE" down
  log "Services stopped."
}

# --- Main ---

case "${1:-help}" in
  first-run)  first_run ;;
  update)     update ;;
  restart)    restart ;;
  status)     status ;;
  logs)       show_logs "${2:-}" ;;
  stop)       stop ;;
  *)
    echo "Usage: $0 {first-run|update|restart|status|logs [service]|stop}"
    echo ""
    echo "Commands:"
    echo "  first-run  - Initial setup (build + start)"
    echo "  update     - Pull latest code, rebuild, restart"
    echo "  restart    - Restart all containers"
    echo "  status     - Show container status + health"
    echo "  logs       - Show logs (optional: service name)"
    echo "  stop       - Stop all services"
    ;;
esac
