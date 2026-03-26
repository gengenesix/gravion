#!/usr/bin/env bash
# Build a .deb package for GRAVION
# Usage: ./scripts/build-deb.sh [version]
set -euo pipefail

VERSION="${1:-1.0.0}"
ARCH="amd64"
PKG_NAME="gravion"
REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BUILD_DIR="$(mktemp -d)"
PKG_DIR="${BUILD_DIR}/${PKG_NAME}_${VERSION}_${ARCH}"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " GRAVION .deb Package Builder v${VERSION}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Verify dpkg-deb is available
command -v dpkg-deb >/dev/null || { echo "ERROR: dpkg-deb not found. Install with: sudo apt install dpkg-dev"; exit 1; }

# Create directory structure
mkdir -p "${PKG_DIR}/DEBIAN"
mkdir -p "${PKG_DIR}/opt/gravion"
mkdir -p "${PKG_DIR}/usr/local/bin"
mkdir -p "${PKG_DIR}/etc/systemd/system"
mkdir -p "${PKG_DIR}/usr/share/doc/gravion"

echo "[1/6] Creating DEBIAN control files..."

cat > "${PKG_DIR}/DEBIAN/control" <<EOF
Package: gravion
Version: ${VERSION}
Section: misc
Priority: optional
Architecture: ${ARCH}
Depends: docker.io | docker-ce, nginx, curl, git, openssl, python3
Maintainer: GRAVION Project <gravion@gengenesix.dev>
Homepage: https://github.com/gengenesix/gravion
Description: Military Intelligence Fusion Platform
 GRAVION is an open-source Palantir Gotham equivalent providing
 real-time intelligence fusion for ADS-B aircraft, AIS ships,
 GPS/Traccar device tracking, satellite imagery (NASA GIBS,
 Sentinel-2, FIRMS), AI-powered SITREP generation via Ollama,
 Neo4j graph analytics, and military-grade UI.
 .
 Install and run with a single command. Includes systemd services,
 Nginx reverse proxy, and the gravion CLI tool.
EOF

cat > "${PKG_DIR}/DEBIAN/postinst" <<'POSTINST'
#!/bin/bash
set -e
echo "Configuring GRAVION..."
systemctl daemon-reload
systemctl enable gravion.service 2>/dev/null || true
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " GRAVION installed successfully!"
echo " Run: gravion start"
echo " Open: http://gravion.local"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
POSTINST
chmod 755 "${PKG_DIR}/DEBIAN/postinst"

cat > "${PKG_DIR}/DEBIAN/prerm" <<'PRERM'
#!/bin/bash
systemctl stop gravion.service 2>/dev/null || true
systemctl disable gravion.service 2>/dev/null || true
PRERM
chmod 755 "${PKG_DIR}/DEBIAN/prerm"

cat > "${PKG_DIR}/DEBIAN/conffiles" <<'CONFFILES'
/opt/gravion/server/.env
/opt/gravion/client/.env
CONFFILES

echo "[2/6] Copying application files..."
# Copy repo (exclude git, node_modules, build artifacts)
rsync -a --exclude='.git' --exclude='node_modules' --exclude='dist' \
  --exclude='*.log' --exclude='.env' \
  "${REPO_DIR}/" "${PKG_DIR}/opt/gravion/"

# Copy env examples as defaults (won't overwrite real .env in postinst)
cp "${REPO_DIR}/server/.env.example" "${PKG_DIR}/opt/gravion/server/.env.example" 2>/dev/null || true
cp "${REPO_DIR}/client/.env.example" "${PKG_DIR}/opt/gravion/client/.env.example" 2>/dev/null || true

echo "[3/6] Installing CLI and systemd service..."
cp "${REPO_DIR}/bin/gravion" "${PKG_DIR}/usr/local/bin/gravion"
chmod +x "${PKG_DIR}/usr/local/bin/gravion"
cp "${REPO_DIR}/deploy/gravion.service" "${PKG_DIR}/etc/systemd/system/"

echo "[4/6] Installing documentation..."
cp "${REPO_DIR}/README_GRAVION.md" "${PKG_DIR}/usr/share/doc/gravion/README.md" 2>/dev/null || true
cp "${REPO_DIR}/LICENSE" "${PKG_DIR}/usr/share/doc/gravion/copyright" 2>/dev/null || true

echo "[5/6] Building .deb package..."
dpkg-deb --build "${PKG_DIR}" "${REPO_DIR}/${PKG_NAME}_${VERSION}_${ARCH}.deb"

echo "[6/6] Cleaning up..."
rm -rf "${BUILD_DIR}"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " Built: ${PKG_NAME}_${VERSION}_${ARCH}.deb"
echo ""
echo " Install:  sudo dpkg -i ${PKG_NAME}_${VERSION}_${ARCH}.deb"
echo " Start:    gravion start"
echo " Access:   http://gravion.local"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
