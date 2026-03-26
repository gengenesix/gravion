#!/usr/bin/env bash
# GRAVION Enterprise Installer
# Installs GRAVION military intelligence fusion platform
# Idempotent — safe to re-run
set -euo pipefail

GRAVION_DIR="/opt/gravion"
GRAVION_REPO="https://github.com/gengenesix/gravion"
GRAVION_USER="gravion"
LOG_FILE="/var/log/gravion-install.log"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
log()  { echo -e "${GREEN}[GRAVION]${NC} $*" | tee -a "$LOG_FILE"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $*" | tee -a "$LOG_FILE"; }
err()  { echo -e "${RED}[ERROR]${NC} $*" | tee -a "$LOG_FILE"; exit 1; }
step() { echo -e "${BLUE}━━━ $* ━━━${NC}" | tee -a "$LOG_FILE"; }

# ─── Root check ───────────────────────────────────────────────────────────────
[[ $EUID -ne 0 ]] && err "Run as root: sudo bash install.sh"

# ─── OS Detection ─────────────────────────────────────────────────────────────
detect_os() {
  if [[ -f /etc/os-release ]]; then
    . /etc/os-release
    OS_ID="${ID:-unknown}"
    OS_LIKE="${ID_LIKE:-}"
  else
    err "Cannot detect OS — /etc/os-release not found"
  fi

  if echo "$OS_ID $OS_LIKE" | grep -qiE "ubuntu|debian"; then
    DISTRO="debian"
  elif echo "$OS_ID $OS_LIKE" | grep -qiE "rhel|centos|fedora|rocky|alma"; then
    DISTRO="rhel"
  elif echo "$OS_ID" | grep -qi "arch"; then
    DISTRO="arch"
  else
    err "Unsupported OS: $OS_ID"
  fi
  log "Detected OS: $OS_ID ($DISTRO family)"
}

# ─── Package Manager Wrappers ────────────────────────────────────────────────
pkg_update() {
  case "$DISTRO" in
    debian) apt-get update -qq ;;
    rhel)   dnf check-update -q || true ;;
    arch)   pacman -Sy --noconfirm ;;
  esac
}

pkg_install() {
  case "$DISTRO" in
    debian) apt-get install -y -qq "$@" ;;
    rhel)   dnf install -y -q "$@" ;;
    arch)   pacman -S --noconfirm --needed "$@" ;;
  esac
}

pkg_installed() { command -v "$1" &>/dev/null; }

# ─── Install Docker ───────────────────────────────────────────────────────────
install_docker() {
  step "Installing Docker"
  if pkg_installed docker; then
    log "Docker already installed: $(docker --version)"
    return
  fi

  case "$DISTRO" in
    debian)
      pkg_install ca-certificates curl gnupg lsb-release
      install -m 0755 -d /etc/apt/keyrings
      curl -fsSL https://download.docker.com/linux/${OS_ID}/gpg \
        | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
      chmod a+r /etc/apt/keyrings/docker.gpg
      echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
        https://download.docker.com/linux/${OS_ID} $(lsb_release -cs) stable" \
        > /etc/apt/sources.list.d/docker.list
      pkg_update
      pkg_install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
      ;;
    rhel)
      dnf config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
      pkg_install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
      ;;
    arch)
      pkg_install docker docker-compose
      ;;
  esac

  systemctl enable --now docker
  log "Docker installed: $(docker --version)"
}

# ─── Install Nginx ────────────────────────────────────────────────────────────
install_nginx() {
  step "Installing Nginx"
  if pkg_installed nginx; then
    log "Nginx already installed: $(nginx -v 2>&1)"
    return
  fi
  pkg_install nginx
  systemctl enable nginx
  log "Nginx installed"
}

# ─── Install Node.js 20+ ─────────────────────────────────────────────────────
install_nodejs() {
  step "Installing Node.js 20+"
  if pkg_installed node && [[ $(node -e 'process.exit(Number(process.version.slice(1).split(".")[0]) < 20)' 2>/dev/null; echo $?) -eq 0 ]]; then
    log "Node.js already installed: $(node --version)"
    return
  fi

  case "$DISTRO" in
    debian)
      curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
      pkg_install nodejs
      ;;
    rhel)
      curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
      pkg_install nodejs
      ;;
    arch)
      pkg_install nodejs npm
      ;;
  esac
  log "Node.js installed: $(node --version)"
}

# ─── Install Git ─────────────────────────────────────────────────────────────
install_git() {
  if pkg_installed git; then
    log "Git already installed: $(git --version)"
    return
  fi
  pkg_install git
}

# ─── System User ─────────────────────────────────────────────────────────────
create_user() {
  step "Creating gravion system user"
  if id "$GRAVION_USER" &>/dev/null; then
    log "User $GRAVION_USER already exists"
  else
    useradd --system --no-create-home --shell /sbin/nologin "$GRAVION_USER"
    usermod -aG docker "$GRAVION_USER"
    log "Created system user: $GRAVION_USER"
  fi
}

# ─── Clone / Update Repo ─────────────────────────────────────────────────────
setup_repo() {
  step "Setting up GRAVION repository at $GRAVION_DIR"
  if [[ -d "$GRAVION_DIR/.git" ]]; then
    log "Repo exists — pulling latest"
    git -C "$GRAVION_DIR" pull --ff-only
    git -C "$GRAVION_DIR" submodule update --init --recursive
  else
    git clone --recurse-submodules "$GRAVION_REPO" "$GRAVION_DIR"
  fi
  chown -R "$GRAVION_USER:$GRAVION_USER" "$GRAVION_DIR"
  log "Repository ready at $GRAVION_DIR"
}

# ─── Environment File ─────────────────────────────────────────────────────────
setup_env() {
  step "Configuring environment"
  local env_file="$GRAVION_DIR/server/.env"
  local example="$GRAVION_DIR/server/.env.example"

  if [[ -f "$env_file" ]]; then
    warn ".env already exists — skipping (edit manually at $env_file)"
    return
  fi

  if [[ ! -f "$example" ]]; then
    err ".env.example not found at $example"
  fi

  cp "$example" "$env_file"

  # Generate random secrets
  JWT_SECRET=$(openssl rand -hex 32)
  SESSION_SECRET=$(openssl rand -hex 32)
  sed -i "s|JWT_SECRET=.*|JWT_SECRET=${JWT_SECRET}|" "$env_file"
  sed -i "s|SESSION_SECRET=.*|SESSION_SECRET=${SESSION_SECRET}|" "$env_file"

  chown "$GRAVION_USER:$GRAVION_USER" "$env_file"
  chmod 600 "$env_file"
  log "Created $env_file (edit to add real API keys)"

  # Client env
  local client_env="$GRAVION_DIR/client/.env"
  local client_example="$GRAVION_DIR/client/.env.example"
  if [[ ! -f "$client_env" && -f "$client_example" ]]; then
    cp "$client_example" "$client_env"
    log "Created $client_env"
  fi
}

# ─── SSL Certificate ──────────────────────────────────────────────────────────
generate_ssl() {
  step "Generating SSL certificate"
  local ssl_dir="$GRAVION_DIR/ssl"
  mkdir -p "$ssl_dir"

  if [[ ! -f "$ssl_dir/origin.pem" ]]; then
    openssl req -x509 -nodes -days 3650 -newkey rsa:4096 \
      -keyout "$ssl_dir/origin.key" \
      -out "$ssl_dir/origin.pem" \
      -subj "/C=US/ST=State/L=City/O=GRAVION/OU=Intelligence/CN=gravion.local" \
      -addext "subjectAltName=DNS:gravion.local,DNS:localhost,IP:127.0.0.1" \
      2>/dev/null
    chmod 600 "$ssl_dir/origin.key"
    log "SSL certificate generated at $ssl_dir/"
  else
    log "SSL certificate already exists — skipping"
  fi
}

# ─── Hosts Entry ──────────────────────────────────────────────────────────────
add_hosts_entry() {
  step "Adding gravion.local to /etc/hosts"
  if ! grep -q "gravion.local" /etc/hosts; then
    echo "127.0.0.1  gravion.local" >> /etc/hosts
    log "Added gravion.local to /etc/hosts"
  else
    log "gravion.local already in /etc/hosts — skipping"
  fi
}

# ─── Install CLI ──────────────────────────────────────────────────────────────
install_cli() {
  step "Installing gravion CLI"
  local cli_src="$GRAVION_DIR/bin/gravion"
  if [[ -f "$cli_src" ]]; then
    cp "$cli_src" /usr/local/bin/gravion
    chmod +x /usr/local/bin/gravion
    log "gravion CLI installed at /usr/local/bin/gravion"
  else
    warn "bin/gravion not found — skipping CLI install"
  fi
}

# ─── Nginx Config ─────────────────────────────────────────────────────────────
configure_nginx() {
  step "Configuring Nginx"
  local nginx_src="$GRAVION_DIR/nginx.conf"
  local nginx_dest="/etc/nginx/sites-available/gravion"
  local nginx_link="/etc/nginx/sites-enabled/gravion"

  # Disable default if exists
  [[ -f /etc/nginx/sites-enabled/default ]] && rm -f /etc/nginx/sites-enabled/default

  cp "$nginx_src" "$nginx_dest"
  ln -sf "$nginx_dest" "$nginx_link"
  nginx -t && systemctl reload nginx
  log "Nginx configured"
}

# ─── Systemd Services ─────────────────────────────────────────────────────────
setup_systemd() {
  step "Installing systemd services"
  for svc in gravion-server gravion-client; do
    local src="$GRAVION_DIR/deploy/${svc}.service"
    local dest="/etc/systemd/system/${svc}.service"
    if [[ -f "$src" ]]; then
      cp "$src" "$dest"
      # Patch working directory and user
      sed -i "s|WorkingDirectory=.*|WorkingDirectory=$GRAVION_DIR|g" "$dest"
      sed -i "s|User=.*|User=$GRAVION_USER|g" "$dest"
      systemctl daemon-reload
      systemctl enable "$svc"
      log "Installed $svc"
    else
      warn "Service file not found: $src"
    fi
  done
}

# ─── Docker Compose ───────────────────────────────────────────────────────────
start_docker() {
  step "Starting Docker services"
  cd "$GRAVION_DIR"
  docker compose pull --quiet 2>/dev/null || true
  docker compose up -d --build
  log "Docker services started"
}

# ─── SSL / Firewall Hints ─────────────────────────────────────────────────────
post_install_hints() {
  step "Post-install notes"

  # UFW
  if pkg_installed ufw; then
    ufw allow 80/tcp
    ufw allow 443/tcp
    log "Firewall rules added for ports 80 and 443"
  fi

  # firewall-cmd (RHEL)
  if pkg_installed firewall-cmd; then
    firewall-cmd --permanent --add-service=http
    firewall-cmd --permanent --add-service=https
    firewall-cmd --reload
    log "firewalld rules added"
  fi
}

# ─── Main ─────────────────────────────────────────────────────────────────────
main() {
  mkdir -p "$(dirname "$LOG_FILE")"
  touch "$LOG_FILE"

  echo ""
  echo -e "${BLUE}╔══════════════════════════════════════════════════╗${NC}"
  echo -e "${BLUE}║   GRAVION — Military Intelligence Platform       ║${NC}"
  echo -e "${BLUE}║   Enterprise Installer                           ║${NC}"
  echo -e "${BLUE}╚══════════════════════════════════════════════════╝${NC}"
  echo ""

  detect_os
  pkg_update
  install_git
  install_docker
  install_nginx
  install_nodejs
  create_user
  setup_repo
  setup_env
  generate_ssl
  configure_nginx
  setup_systemd
  start_docker
  install_cli
  add_hosts_entry
  post_install_hints

  # Get server IP
  SERVER_IP=$(hostname -I | awk '{print $1}')

  echo ""
  echo -e "${GREEN}╔══════════════════════════════════════════════════╗${NC}"
  echo -e "${GREEN}║   GRAVION INSTALLATION COMPLETE                  ║${NC}"
  echo -e "${GREEN}╠══════════════════════════════════════════════════╣${NC}"
  echo -e "${GREEN}║   Access URL:  http://${SERVER_IP}               ${NC}"
  echo -e "${GREEN}║   HTTPS:       https://your-domain.com           ${NC}"
  echo -e "${GREEN}║   Neo4j UI:    http://${SERVER_IP}:7474           ${NC}"
  echo -e "${GREEN}║   Traccar:     http://${SERVER_IP}:8082           ${NC}"
  echo -e "${GREEN}║   Ollama:      http://${SERVER_IP}:11434          ${NC}"
  echo -e "${GREEN}╠══════════════════════════════════════════════════╣${NC}"
  echo -e "${GREEN}║   Edit secrets: $GRAVION_DIR/server/.env         ${NC}"
  echo -e "${GREEN}║   CLI tool:     gravion help                     ${NC}"
  echo -e "${GREEN}║   Logs:         $LOG_FILE                        ${NC}"
  echo -e "${GREEN}╚══════════════════════════════════════════════════╝${NC}"
  echo ""
}

main "$@"
