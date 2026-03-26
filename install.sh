#!/usr/bin/env bash
# GRAVION Enterprise Installer — idempotent, safe to re-run
# Usage: curl -sSL https://raw.githubusercontent.com/gengenesix/gravion/main/install.sh | sudo bash

# Do NOT use set -e — broken 3rd-party PPAs on the host must not abort install.
set -uo pipefail

GRAVION_DIR="/opt/gravion"
GRAVION_REPO="https://github.com/gengenesix/gravion"
LOG_FILE="/var/log/gravion-install.log"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; BOLD='\033[1m'; NC='\033[0m'

log()  { echo -e "${GREEN}[GRAVION]${NC} $*" | tee -a "$LOG_FILE"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $*" | tee -a "$LOG_FILE"; }
err()  { echo -e "${RED}[ERROR]${NC} $*" | tee -a "$LOG_FILE"; exit 1; }
step() { echo -e "\n${BLUE}${BOLD}━━━ $* ━━━${NC}" | tee -a "$LOG_FILE"; }
ok()   { echo -e "${GREEN}✓${NC} $*"; }

# ─── Root check ───────────────────────────────────────────────────────────────
[[ $EUID -ne 0 ]] && err "Run as root: curl -sSL ... | sudo bash"

mkdir -p "$(dirname "$LOG_FILE")" && touch "$LOG_FILE"

echo ""
echo -e "${BLUE}${BOLD}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}${BOLD}║   GRAVION — Military Intelligence Platform       ║${NC}"
echo -e "${BLUE}${BOLD}║   Enterprise Installer                           ║${NC}"
echo -e "${BLUE}${BOLD}╚══════════════════════════════════════════════════╝${NC}"
echo ""

# ─── OS Detection ─────────────────────────────────────────────────────────────
step "Detecting OS"
if [[ -f /etc/os-release ]]; then
  . /etc/os-release
  OS_ID="${ID:-unknown}"
else
  err "Cannot detect OS"
fi

if [[ "${ID_LIKE:-} ${ID:-}" =~ ubuntu|debian ]]; then
  DISTRO="debian"
elif [[ "${ID_LIKE:-} ${ID:-}" =~ rhel|centos|fedora|rocky|alma ]]; then
  DISTRO="rhel"
elif [[ "${ID:-}" == "arch" ]]; then
  DISTRO="arch"
else
  err "Unsupported OS: $OS_ID. Ubuntu/Debian recommended."
fi
log "Detected OS: $OS_ID ($DISTRO family)"

# ─── apt update — ignore broken 3rd-party repos ───────────────────────────────
step "Updating package index"
if [[ "$DISTRO" == "debian" ]]; then
  # Run apt update, allow it to fail on bad PPAs, check only that core repos worked
  APT_OUTPUT=$(apt-get update 2>&1 || true)
  FAILED_CORE=$(echo "$APT_OUTPUT" | grep "^E: Failed to fetch" | grep -v "sury\|launchpad\|yarn\|ondrej\|webmin\|nodesource" | head -5 || true)
  if [[ -n "$FAILED_CORE" ]]; then
    warn "Some package repos failed — continuing anyway:"
    warn "$FAILED_CORE"
  fi
  PPA_ERRORS=$(echo "$APT_OUTPUT" | grep -c "^E: " || true)
  [[ $PPA_ERRORS -gt 0 ]] && warn "Ignored $PPA_ERRORS broken PPA errors (3rd-party repos on your system)"
  ok "Package index updated"
fi

# ─── Install helpers ──────────────────────────────────────────────────────────
pkg_install() {
  case "$DISTRO" in
    debian) apt-get install -y -qq --no-install-recommends "$@" 2>&1 | grep -v "^debconf\|^(Reading\|Preparing\|Unpacking\|Setting\|Processing)" || true ;;
    rhel)   dnf install -y -q "$@" ;;
    arch)   pacman -S --noconfirm --needed "$@" ;;
  esac
}
cmd_exists() { command -v "$1" &>/dev/null; }

# ─── Git ──────────────────────────────────────────────────────────────────────
step "Checking Git"
if ! cmd_exists git; then
  pkg_install git || err "Failed to install git"
fi
ok "Git: $(git --version)"

# ─── Docker ───────────────────────────────────────────────────────────────────
step "Checking Docker"
if ! cmd_exists docker; then
  log "Installing Docker..."
  pkg_install ca-certificates curl gnupg
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL "https://download.docker.com/linux/${OS_ID}/gpg" \
    | gpg --dearmor -o /etc/apt/keyrings/docker.gpg 2>/dev/null
  chmod a+r /etc/apt/keyrings/docker.gpg
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
https://download.docker.com/linux/${OS_ID} $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
    > /etc/apt/sources.list.d/docker.list
  apt-get update -qq 2>/dev/null || true
  pkg_install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin \
    || pkg_install docker.io docker-compose-plugin \
    || err "Failed to install Docker"
fi

# Ensure docker compose v2 plugin works
if ! docker compose version &>/dev/null; then
  # Fallback: install compose plugin manually
  COMPOSE_VERSION="v2.24.6"
  mkdir -p /usr/local/lib/docker/cli-plugins
  curl -SL "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-linux-x86_64" \
    -o /usr/local/lib/docker/cli-plugins/docker-compose
  chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
fi

systemctl enable docker 2>/dev/null || true
systemctl start docker 2>/dev/null || true
ok "Docker: $(docker --version)"
ok "Docker Compose: $(docker compose version)"

# ─── Nginx ────────────────────────────────────────────────────────────────────
step "Checking Nginx"
if ! cmd_exists nginx; then
  pkg_install nginx || err "Failed to install nginx"
fi
systemctl enable nginx 2>/dev/null || true
ok "Nginx: $(nginx -v 2>&1)"

# ─── openssl ──────────────────────────────────────────────────────────────────
if ! cmd_exists openssl; then
  pkg_install openssl
fi

# ─── Clone / Update Repo ─────────────────────────────────────────────────────
step "Setting up GRAVION at $GRAVION_DIR"
if [[ -d "$GRAVION_DIR/.git" ]]; then
  log "Repo exists — pulling latest..."
  git -C "$GRAVION_DIR" pull --ff-only || warn "git pull failed — continuing with existing version"
else
  log "Cloning GRAVION repository..."
  git clone --depth=1 "$GRAVION_REPO" "$GRAVION_DIR" || err "Failed to clone repo"
  # Add submodules (shallow, non-blocking)
  git -C "$GRAVION_DIR" submodule update --init --depth=1 2>/dev/null || warn "Submodule init failed — continuing"
fi
ok "Repository ready at $GRAVION_DIR"

# ─── Environment Files ────────────────────────────────────────────────────────
step "Configuring environment"
SERVER_ENV="$GRAVION_DIR/server/.env"
CLIENT_ENV="$GRAVION_DIR/client/.env"

if [[ ! -f "$SERVER_ENV" ]]; then
  if [[ -f "$GRAVION_DIR/server/.env.example" ]]; then
    cp "$GRAVION_DIR/server/.env.example" "$SERVER_ENV"
  else
    # Create minimal env
    cat > "$SERVER_ENV" <<'ENVEOF'
FLIGHT_DATA_SOURCE=adsblol
ADSB_LOL_LAT=0
ADSB_LOL_LON=0
ADSB_LOL_RADIUS=25000
AISSTREAM_API_KEY=9b03450186de3b3eeb0d28bdb684f3ad0bb1247f
OPENROUTER_API_KEY=
CLOUDFLARE_RADAR_TOKEN=
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=gravion_neo4j_2024
TRACCAR_URL=http://localhost:8082
TRACCAR_USER=admin
TRACCAR_PASSWORD=gravion_traccar_2024
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3
PORT=3001
NODE_ENV=production
ENVEOF
  fi
  # Inject random secrets
  JWT=$(openssl rand -hex 32)
  SES=$(openssl rand -hex 32)
  sed -i "s|^JWT_SECRET=.*|JWT_SECRET=${JWT}|; s|^SESSION_SECRET=.*|SESSION_SECRET=${SES}|" "$SERVER_ENV"
  chmod 600 "$SERVER_ENV"
  ok "Created server/.env"
else
  ok "server/.env already exists — skipping"
fi

if [[ ! -f "$CLIENT_ENV" ]]; then
  if [[ -f "$GRAVION_DIR/client/.env.example" ]]; then
    cp "$GRAVION_DIR/client/.env.example" "$CLIENT_ENV"
  else
    cat > "$CLIENT_ENV" <<'CENVEOF'
VITE_CESIUM_ION_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJlYTM5YTUzZC0yNTkwLTQ5ZmEtOTRhMi01MTdiYjllOTFmNjQiLCJpZCI6NDA5MjE0LCJpYXQiOjE3NzQ0ODgzODN9.wp16tuCV8iKfcVyFD3jzJ52kgCB7uwbnWaCxlmAzeaQ
VITE_API_URL=http://localhost:3001
CENVEOF
  fi
  ok "Created client/.env"
else
  ok "client/.env already exists — skipping"
fi

# ─── SSL Certificate ──────────────────────────────────────────────────────────
step "Generating SSL certificate"
mkdir -p "$GRAVION_DIR/ssl"
if [[ ! -f "$GRAVION_DIR/ssl/origin.pem" ]]; then
  openssl req -x509 -nodes -days 3650 -newkey rsa:4096 \
    -keyout "$GRAVION_DIR/ssl/origin.key" \
    -out "$GRAVION_DIR/ssl/origin.pem" \
    -subj "/C=US/O=GRAVION/CN=gravion.local" \
    -addext "subjectAltName=DNS:gravion.local,DNS:localhost,IP:127.0.0.1" \
    2>/dev/null
  chmod 600 "$GRAVION_DIR/ssl/origin.key"
  ok "Self-signed SSL cert generated"
else
  ok "SSL cert already exists"
fi

# ─── Nginx Config ─────────────────────────────────────────────────────────────
step "Configuring Nginx"
NGINX_CONF="$GRAVION_DIR/nginx.conf"
NGINX_SITE="/etc/nginx/conf.d/gravion.conf"

# Use conf.d (works on all distros, no sites-available needed)
cp "$NGINX_CONF" "$NGINX_SITE"

# Remove default site if it exists (nginx.conf include might conflict)
[[ -f /etc/nginx/sites-enabled/default ]] && rm -f /etc/nginx/sites-enabled/default || true

# Test and reload
nginx -t 2>/dev/null && systemctl reload nginx 2>/dev/null && ok "Nginx configured" \
  || warn "Nginx config test failed — check $NGINX_SITE"

# ─── Install gravion CLI ──────────────────────────────────────────────────────
step "Installing gravion CLI"
if [[ -f "$GRAVION_DIR/bin/gravion" ]]; then
  cp "$GRAVION_DIR/bin/gravion" /usr/local/bin/gravion
  chmod +x /usr/local/bin/gravion
  ok "gravion CLI installed at /usr/local/bin/gravion"
else
  warn "bin/gravion not found — skipping CLI install"
fi

# ─── Systemd Service ─────────────────────────────────────────────────────────
step "Installing systemd service"
SVC_SRC="$GRAVION_DIR/deploy/gravion.service"
if [[ -f "$SVC_SRC" ]]; then
  cp "$SVC_SRC" /etc/systemd/system/gravion.service
  # Patch working directory to actual install path
  sed -i "s|WorkingDirectory=.*|WorkingDirectory=$GRAVION_DIR|g" /etc/systemd/system/gravion.service
  systemctl daemon-reload
  systemctl enable gravion.service
  ok "gravion.service installed and enabled"
else
  warn "deploy/gravion.service not found — skipping"
fi

# ─── /etc/hosts entry ────────────────────────────────────────────────────────
if ! grep -q "gravion.local" /etc/hosts 2>/dev/null; then
  echo "127.0.0.1  gravion.local" >> /etc/hosts
  ok "Added gravion.local to /etc/hosts"
fi

# ─── Firewall ─────────────────────────────────────────────────────────────────
if cmd_exists ufw; then
  ufw allow 80/tcp 2>/dev/null || true
  ufw allow 443/tcp 2>/dev/null || true
fi

# ─── Start Services ───────────────────────────────────────────────────────────
step "Starting GRAVION services"
cd "$GRAVION_DIR"
log "Pulling images (this may take a few minutes on first run)..."
docker compose pull --quiet 2>/dev/null || true
docker compose up -d --build
ok "Docker services started"

# ─── Done ─────────────────────────────────────────────────────────────────────
SERVER_IP=$(hostname -I | awk '{print $1}' 2>/dev/null || echo "localhost")

echo ""
echo -e "${GREEN}${BOLD}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}${BOLD}║   GRAVION INSTALLATION COMPLETE ✓                    ║${NC}"
echo -e "${GREEN}${BOLD}╠══════════════════════════════════════════════════════╣${NC}"
echo -e "${GREEN}${BOLD}║${NC}   Platform:   ${BOLD}http://${SERVER_IP}${NC}"
echo -e "${GREEN}${BOLD}║${NC}   Alt:        ${BOLD}http://gravion.local${NC}"
echo -e "${GREEN}${BOLD}║${NC}   Neo4j UI:   http://${SERVER_IP}:7474"
echo -e "${GREEN}${BOLD}║${NC}   Traccar:    http://${SERVER_IP}:8082"
echo -e "${GREEN}${BOLD}║${NC}   Ollama:     http://${SERVER_IP}:11434"
echo -e "${GREEN}${BOLD}╠══════════════════════════════════════════════════════╣${NC}"
echo -e "${GREEN}${BOLD}║${NC}   Pull AI model:  docker exec gravion-ollama ollama pull llama3"
echo -e "${GREEN}${BOLD}║${NC}   CLI tool:       gravion help"
echo -e "${GREEN}${BOLD}║${NC}   Check status:   gravion status"
echo -e "${GREEN}${BOLD}║${NC}   SITREP:         gravion intel-brief"
echo -e "${GREEN}${BOLD}╚══════════════════════════════════════════════════════╝${NC}"
echo ""
echo "Install log: $LOG_FILE"
