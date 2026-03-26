#!/usr/bin/env bash
# GRAVION Enterprise Installer — idempotent, safe to re-run
# Usage: curl -sSL https://raw.githubusercontent.com/gengenesix/gravion/main/install.sh | sudo bash

# No set -e, no set -o pipefail — broken PPAs and pipe issues must not kill the installer
set +e
set +o pipefail

GRAVION_DIR="/opt/gravion"
GRAVION_REPO="https://github.com/gengenesix/gravion"

G='\033[0;32m'; Y='\033[1;33m'; R='\033[0;31m'; B='\033[0;34m'; W='\033[1m'; N='\033[0m'

log()  { echo -e "${G}[GRAVION]${N} $*"; }
warn() { echo -e "${Y}[WARN]${N} $*"; }
err()  { echo -e "${R}[ERROR]${N} $*"; exit 1; }
step() { echo -e "\n${B}${W}━━━ $* ━━━${N}"; }
ok()   { echo -e "  ${G}✓${N} $*"; }

echo ""
echo -e "${B}${W}╔══════════════════════════════════════════════════╗${N}"
echo -e "${B}${W}║   GRAVION — Military Intelligence Platform       ║${N}"
echo -e "${B}${W}║   Enterprise Installer                           ║${N}"
echo -e "${B}${W}╚══════════════════════════════════════════════════╝${N}"
echo ""

# Root check
if [ "$EUID" -ne 0 ]; then
  err "Run as root: curl -sSL ... | sudo bash"
fi

# OS detection
step "Detecting OS"
if [ -f /etc/os-release ]; then
  . /etc/os-release
  OS_ID="${ID:-unknown}"
  OS_LIKE="${ID_LIKE:-}"
else
  err "Cannot detect OS — /etc/os-release missing"
fi

DISTRO=""
case "$OS_ID $OS_LIKE" in
  *ubuntu*|*debian*) DISTRO="debian" ;;
  *rhel*|*centos*|*fedora*|*rocky*|*alma*) DISTRO="rhel" ;;
  *arch*) DISTRO="arch" ;;
  *) err "Unsupported OS: $OS_ID. Ubuntu/Debian is recommended." ;;
esac
log "OS: $OS_ID ($DISTRO family)"

# apt update — completely silenced, never fatal
step "Updating package index"
if [ "$DISTRO" = "debian" ]; then
  apt-get update -qq > /dev/null 2>&1
  log "Package index updated (PPA errors suppressed)"
fi

# Helper: check if command exists
has() { command -v "$1" > /dev/null 2>&1; }

# Helper: apt install, never fatal
apt_install() {
  apt-get install -y -qq --no-install-recommends "$@" > /dev/null 2>&1
}

# ─── Git ──────────────────────────────────────────────────────────────────────
step "Git"
if ! has git; then
  log "Installing git..."
  apt_install git
fi
has git && ok "git: $(git --version)" || err "git install failed"

# ─── Docker ───────────────────────────────────────────────────────────────────
step "Docker"
if has docker; then
  ok "Docker already installed: $(docker --version)"
else
  log "Installing Docker..."
  apt_install ca-certificates curl gnupg

  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL "https://download.docker.com/linux/${OS_ID}/gpg" 2>/dev/null \
    | gpg --dearmor -o /etc/apt/keyrings/docker.gpg 2>/dev/null
  chmod a+r /etc/apt/keyrings/docker.gpg

  CODENAME=$(. /etc/os-release 2>/dev/null && echo "${VERSION_CODENAME:-}")
  if [ -z "$CODENAME" ]; then
    # Ubuntu Noble / Oracular fallback
    CODENAME=$(lsb_release -cs 2>/dev/null || echo "noble")
  fi

  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
https://download.docker.com/linux/${OS_ID} ${CODENAME} stable" \
    > /etc/apt/sources.list.d/docker.list

  apt-get update -qq > /dev/null 2>&1
  apt_install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

  if ! has docker; then
    log "Official Docker failed, trying docker.io..."
    apt_install docker.io
  fi
fi

# Ensure docker is running
systemctl enable docker > /dev/null 2>&1
systemctl start docker > /dev/null 2>&1

# Verify compose v2
if ! docker compose version > /dev/null 2>&1; then
  log "Installing Docker Compose plugin manually..."
  mkdir -p /usr/local/lib/docker/cli-plugins
  curl -fsSL "https://github.com/docker/compose/releases/download/v2.24.6/docker-compose-linux-x86_64" \
    -o /usr/local/lib/docker/cli-plugins/docker-compose 2>/dev/null
  chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
fi

docker compose version > /dev/null 2>&1 && ok "Docker Compose: $(docker compose version)" \
  || err "Docker Compose not available"

# ─── Nginx ────────────────────────────────────────────────────────────────────
step "Nginx"
if ! has nginx; then
  log "Installing nginx..."
  apt_install nginx
fi
has nginx || err "nginx install failed"
systemctl enable nginx > /dev/null 2>&1
systemctl start nginx > /dev/null 2>&1
ok "nginx: $(nginx -v 2>&1)"

# ─── openssl ──────────────────────────────────────────────────────────────────
has openssl || apt_install openssl

# ─── Clone / Update Repo ─────────────────────────────────────────────────────
step "Setting up GRAVION at $GRAVION_DIR"
if [ -d "$GRAVION_DIR/.git" ]; then
  log "Repo exists — updating..."
  git -C "$GRAVION_DIR" pull --ff-only > /dev/null 2>&1 || warn "git pull failed — using existing code"
else
  log "Cloning repository (this may take a minute)..."
  git clone --depth=1 "$GRAVION_REPO" "$GRAVION_DIR" > /dev/null 2>&1
  [ -d "$GRAVION_DIR/.git" ] || err "Clone failed — check network and try again"
fi
ok "Repository at $GRAVION_DIR"

# ─── Environment Files ────────────────────────────────────────────────────────
step "Environment configuration"

SERVER_ENV="$GRAVION_DIR/server/.env"
if [ ! -f "$SERVER_ENV" ]; then
  if [ -f "$GRAVION_DIR/server/.env.example" ]; then
    cp "$GRAVION_DIR/server/.env.example" "$SERVER_ENV"
  else
    cat > "$SERVER_ENV" << 'ENVEOF'
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
JWT_SECRET=CHANGEME
SESSION_SECRET=CHANGEME
ENVEOF
  fi
  # Inject random secrets if openssl available
  if has openssl; then
    JWT=$(openssl rand -hex 32 2>/dev/null || echo "change_me_$(date +%s)")
    SES=$(openssl rand -hex 32 2>/dev/null || echo "change_me_$(date +%s)x")
    sed -i "s|^JWT_SECRET=.*|JWT_SECRET=${JWT}|" "$SERVER_ENV"
    sed -i "s|^SESSION_SECRET=.*|SESSION_SECRET=${SES}|" "$SERVER_ENV"
  fi
  chmod 600 "$SERVER_ENV"
  ok "Created server/.env"
else
  ok "server/.env exists — keeping"
fi

CLIENT_ENV="$GRAVION_DIR/client/.env"
if [ ! -f "$CLIENT_ENV" ]; then
  if [ -f "$GRAVION_DIR/client/.env.example" ]; then
    cp "$GRAVION_DIR/client/.env.example" "$CLIENT_ENV"
  else
    cat > "$CLIENT_ENV" << 'CENVEOF'
VITE_CESIUM_ION_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJlYTM5YTUzZC0yNTkwLTQ5ZmEtOTRhMi01MTdiYjllOTFmNjQiLCJpZCI6NDA5MjE0LCJpYXQiOjE3NzQ0ODgzODN9.wp16tuCV8iKfcVyFD3jzJ52kgCB7uwbnWaCxlmAzeaQ
VITE_API_URL=http://localhost:3001
CENVEOF
  fi
  ok "Created client/.env"
else
  ok "client/.env exists — keeping"
fi

# ─── SSL Certificate ──────────────────────────────────────────────────────────
step "SSL certificate"
mkdir -p "$GRAVION_DIR/ssl"
if [ ! -f "$GRAVION_DIR/ssl/origin.pem" ]; then
  openssl req -x509 -nodes -days 3650 -newkey rsa:4096 \
    -keyout "$GRAVION_DIR/ssl/origin.key" \
    -out "$GRAVION_DIR/ssl/origin.pem" \
    -subj "/C=US/O=GRAVION/CN=gravion.local" \
    -addext "subjectAltName=DNS:gravion.local,DNS:localhost,IP:127.0.0.1" \
    > /dev/null 2>&1
  chmod 600 "$GRAVION_DIR/ssl/origin.key"
  ok "Self-signed SSL cert created"
else
  ok "SSL cert exists — keeping"
fi

# ─── Nginx ────────────────────────────────────────────────────────────────────
step "Nginx configuration"
cp "$GRAVION_DIR/nginx.conf" /etc/nginx/conf.d/gravion.conf
rm -f /etc/nginx/sites-enabled/default > /dev/null 2>&1
nginx -t > /dev/null 2>&1 && systemctl reload nginx > /dev/null 2>&1 && ok "Nginx configured" \
  || warn "Nginx test failed — check /etc/nginx/conf.d/gravion.conf"

# ─── gravion CLI ──────────────────────────────────────────────────────────────
step "CLI tool"
if [ -f "$GRAVION_DIR/bin/gravion" ]; then
  cp "$GRAVION_DIR/bin/gravion" /usr/local/bin/gravion
  chmod +x /usr/local/bin/gravion
  ok "gravion CLI installed"
else
  warn "bin/gravion not found"
fi

# ─── systemd ──────────────────────────────────────────────────────────────────
step "Systemd service"
if [ -f "$GRAVION_DIR/deploy/gravion.service" ]; then
  cp "$GRAVION_DIR/deploy/gravion.service" /etc/systemd/system/gravion.service
  sed -i "s|WorkingDirectory=.*|WorkingDirectory=$GRAVION_DIR|g" /etc/systemd/system/gravion.service
  systemctl daemon-reload > /dev/null 2>&1
  systemctl enable gravion.service > /dev/null 2>&1
  ok "gravion.service enabled"
fi

# ─── /etc/hosts ───────────────────────────────────────────────────────────────
grep -q "gravion.local" /etc/hosts 2>/dev/null || echo "127.0.0.1  gravion.local" >> /etc/hosts
ok "gravion.local → /etc/hosts"

# ─── Firewall ─────────────────────────────────────────────────────────────────
has ufw && ufw allow 80/tcp > /dev/null 2>&1 && ufw allow 443/tcp > /dev/null 2>&1 || true

# ─── Docker Compose Up ────────────────────────────────────────────────────────
step "Starting GRAVION services"
log "Pulling Docker images — first run may take several minutes..."
cd "$GRAVION_DIR"
docker compose pull > /dev/null 2>&1 || true
docker compose up -d --build
ok "Services started"

# ─── Done ─────────────────────────────────────────────────────────────────────
SERVER_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || echo "localhost")

echo ""
echo -e "${G}${W}╔══════════════════════════════════════════════════════╗${N}"
echo -e "${G}${W}║   GRAVION INSTALLATION COMPLETE ✓                    ║${N}"
echo -e "${G}${W}╠══════════════════════════════════════════════════════╣${N}"
echo -e "${G}${W}║${N}  Platform:    ${W}http://${SERVER_IP}${N}"
echo -e "${G}${W}║${N}  Local:       ${W}http://gravion.local${N}"
echo -e "${G}${W}║${N}  Neo4j:       http://${SERVER_IP}:7474"
echo -e "${G}${W}║${N}  Traccar:     http://${SERVER_IP}:8082"
echo -e "${G}${W}║${N}  Ollama:      http://${SERVER_IP}:11434"
echo -e "${G}${W}╠══════════════════════════════════════════════════════╣${N}"
echo -e "${G}${W}║${N}  Pull AI:     docker exec gravion-ollama ollama pull llama3"
echo -e "${G}${W}║${N}  CLI:         gravion help"
echo -e "${G}${W}║${N}  Status:      gravion status"
echo -e "${G}${W}║${N}  SITREP:      gravion intel-brief"
echo -e "${G}${W}╚══════════════════════════════════════════════════════╝${N}"
echo ""
